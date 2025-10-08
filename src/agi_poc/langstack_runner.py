#!/usr/bin/env python3
from __future__ import annotations

"""
LangStack adapter (PoC):

Reads registry/manifest_langstack.yaml and simulates a minimal
workflow using the existing PoC primitives (intent/agent registries
and agent_cli runner). This does NOT depend on external LangGraph or
CrewAI packages; it provides a pragmatic bridge so we can exercise the
designed orchestration with current local capabilities.

Flow (simplified):
- supreme_orchestrator -> (ready_for_execution) -> execution_orchestrator
- execution_orchestrator runs a representative intent (create_spec_document)
  via the existing agent runner
- integration -> review(approved) -> deploy_demo -> end

This runner writes a summary log into runs/{run_id}/langstack.txt.
"""

import argparse
import os
import sys
from typing import Any, Dict, Tuple, List

# Local minimal YAML loader
from yaml_min import load as yaml_load

# Reuse PoC utilities
from .util import project_root
from agi_poc.registry import yaml_registry, agent_registry
from agi_poc.intent import detect_intent
from agi_poc.schemas import (
    validate_task_yaml,
    validate_agent_yaml,
    normalize_task_yaml,
    normalize_agent_yaml,
)
from agi_poc.runner import (
    prepare_run_dir,
    persist_specs,
    execute_with_retry,
    evaluate_success,
    write_log,
)
from agi_poc.approval import needs_approval, ask_approval


def _project_root() -> str:
    return project_root(os.path.dirname(__file__))


def _write(path: str, content: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "a", encoding="utf-8") as f:
        f.write(content)
        if not content.endswith("\n"):
            f.write("\n")


def _load_manifest(path: str) -> Dict[str, Any]:
    try:
        return yaml_load(path)
    except Exception:
        # Fallback to a minimal synthetic manifest compatible with this runner
        return {
            "workflow": {
                "nodes": [
                    {"id": "supreme_orchestrator", "type": "supervisor"},
                    {"id": "intent_orchestrator", "type": "agent"},
                    {"id": "planning_orchestrator", "type": "agent"},
                    {"id": "yaml_autogen", "type": "agent"},
                    {
                        "id": "execution_orchestrator",
                        "type": "parallel_crew",
                        "agents": [
                            "architect",
                            "tech_lead",
                            "coder_frontend",
                            "coder_backend",
                            "tester",
                            "devops",
                        ],
                        "merge_strategy": "wait_all",
                    },
                    {"id": "validation_orchestrator", "type": "agent"},
                    {"id": "review", "type": "agent"},
                    {"id": "deploy_demo", "type": "agent"},
                    {"id": "end", "type": "terminal"},
                ]
            }
        }


def _pick_route_from_supreme(_state: Dict[str, Any]) -> str:
    # Minimal heuristic for conditions defined in manifest:
    # - If no input → needs_clarification
    # - If input present but no intent yet → ready_for_intent
    # - Else if we have intent but not planned → ready_for_execution (planning)
    if not _state.get("user_request"):
        return "user_clarify"
    if not _state.get("intent_id"):
        return "intent_orchestrator"
    if not _state.get("execution_plan"):
        return "planning_orchestrator"
    return "execution_orchestrator"


def _run_create_spec_document(user_request: str, yes: bool) -> Tuple[int, str]:
    """Run the existing create_spec_document flow using PoC runner.

    Returns (rc, run_id)
    """
    # 1) Resolve intent
    intent_id = "create_spec_document"
    intent_path, intent_spec = yaml_registry.find_or_generate(intent_id)
    intent_spec = normalize_task_yaml(intent_spec)
    ok_i, msg_i = validate_task_yaml(intent_spec)
    if not ok_i:
        raise RuntimeError(f"Invalid intent YAML: {msg_i}")

    # 2) Resolve/select agent
    reqs = intent_spec.get("agent_requirements") or []
    agent_path, agent_spec = agent_registry.select_or_generate(reqs, intent_id)
    agent_spec = normalize_agent_yaml(agent_spec)
    ok_a, msg_a = validate_agent_yaml(agent_spec)
    if not ok_a:
        raise RuntimeError(f"Invalid agent YAML: {msg_a}")

    # 3) Approval
    if needs_approval(intent_spec, agent_spec, dry_run=False):
        if not ask_approval(yes):
            return 4, ""

    # 4) Prepare run and execute
    run_id, run_dir = prepare_run_dir()
    persist_specs(run_dir, intent_spec, agent_spec)

    # Effective timeout: use intent or default 60
    timeout_s = intent_spec.get("timeout_s")
    eff_timeout = timeout_s if isinstance(timeout_s, int) and timeout_s > 0 else 60

    rc = execute_with_retry(
        intent_yaml_path=intent_path,
        user_request=user_request,
        run_id=run_id,
        run_dir=run_dir,
        timeout_s=eff_timeout,
        retries=1,
        agent_spec=agent_spec,
    )
    if rc == 0:
        ok_eval = evaluate_success(intent_spec, run_id)
        write_log(run_dir, f"evaluator_success={ok_eval}")
        rc = 0 if ok_eval else 6
    return rc, run_id


def _intent_phase(user_request: str) -> Tuple[str, Dict[str, Any], bool]:
    """Detect intent_id and load or generate intent spec.

    Returns (intent_id, intent_spec)
    """
    intent_id = detect_intent(user_request)
    # Pre-check existence to detect autogen
    root = _project_root()
    intents_dir = os.path.join(root, "intents")
    cand_yml = os.path.join(intents_dir, f"{intent_id}.yml")
    cand_yaml = os.path.join(intents_dir, f"{intent_id}.yaml")
    existed = os.path.exists(cand_yml) or os.path.exists(cand_yaml)

    _p, spec = yaml_registry.find_or_generate(intent_id)
    spec = normalize_task_yaml(spec)
    ok, msg = validate_task_yaml(spec)
    if not ok:
        raise RuntimeError(f"Invalid intent YAML: {msg}")
    return intent_id, spec, (not existed)


def _planning_phase(intent_id: str, intent_spec: Dict[str, Any]) -> Dict[str, Any]:
    """Select or generate agent and form a simple execution plan."""
    reqs = intent_spec.get("agent_requirements") or []
    agent_path, agent_spec = agent_registry.select_or_generate(reqs, intent_id)
    agent_spec = normalize_agent_yaml(agent_spec)
    ok_a, msg_a = validate_agent_yaml(agent_spec)
    if not ok_a:
        raise RuntimeError(f"Invalid agent YAML: {msg_a}")
    plan = {
        "strategy": "simple",
        "agent_spec": agent_spec,
        "timeout": intent_spec.get("timeout_s", 60),
    }
    return plan


def _execute_once(
    intent_spec: Dict[str, Any],
    agent_spec: Dict[str, Any],
    user_request: str,
    run_id: str,
    run_dir: str,
    timeout_s: int,
) -> Tuple[int, bool]:
    """Persist specs, execute and evaluate. Returns (rc, ok_eval)."""
    persist_specs(run_dir, intent_spec, agent_spec)
    rc = execute_with_retry(
        intent_yaml_path=os.path.join(_project_root(), "intents", f"{intent_spec.get('intent_id')}.yml"),
        user_request=user_request,
        run_id=run_id,
        run_dir=run_dir,
        timeout_s=timeout_s,
        retries=1,
        agent_spec=agent_spec,
    )
    ok_eval = False
    if rc == 0:
        ok_eval = evaluate_success(intent_spec, run_id)
        write_log(run_dir, f"evaluator_success={ok_eval}")
    return rc, ok_eval


def run_manifest(manifest_path: str, user_request: str, yes: bool, simulate: bool) -> int:
    root = _project_root()
    mani = _load_manifest(os.path.join(root, manifest_path))

    # Minimal node index for traversal
    nodes = {n.get("id"): n for n in (mani.get("workflow", {}).get("nodes") or [])}

    state: Dict[str, Any] = {"user_request": user_request}

    # 1) Supreme orchestrator
    supreme_id = "supreme_orchestrator"
    if supreme_id not in nodes:
        print("manifest missing supreme_orchestrator", file=sys.stderr)
        return 2
    # 0) Supreme routing
    route = _pick_route_from_supreme(state)

    # 1) Clarification if needed
    if route == "user_clarify" and "user_clarify" in nodes:
        # For PoC: mark clarified and continue
        state["clarified"] = True
        route = "intent_orchestrator"

    # 2) Intent orchestrator
    if route == "intent_orchestrator" and "intent_orchestrator" in nodes:
        intent_id, intent_spec, was_generated = _intent_phase(user_request)
        state.update({"intent_id": intent_id, "intent_spec": intent_spec, "intent_generated": was_generated})
        route = "planning_orchestrator"

    # 3) YAML autogen (not used in PoC unless intent missing)
    if route == "yaml_autogen" and "yaml_autogen" in nodes:
        # Stub: immediately return to intent orchestrator
        route = "intent_orchestrator"

    # 4) Planning orchestrator
    if route == "planning_orchestrator" and "planning_orchestrator" in nodes:
        plan = _planning_phase(state["intent_id"], state["intent_spec"])
        state["execution_plan"] = plan
        route = "execution_orchestrator"

    # 5) Execution orchestrator
    if route != "execution_orchestrator" or "execution_orchestrator" not in nodes:
        print("No execution_orchestrator path available", file=sys.stderr)
        return 3

    # Simulate vs Run
    if simulate:
        run_id, run_dir = prepare_run_dir()
        _write(os.path.join(run_dir, "langstack.txt"), "supreme -> intent -> planning -> execution (simulated)\n")
        if state.get("intent_generated"):
            _write(os.path.join(run_dir, "langstack.txt"), "yaml_autogen: generated from template (simulated)\n")
        for a in nodes["execution_orchestrator"].get("agents", []):
            _write(os.path.join(run_dir, "langstack.txt"), f"agent[{a}]: simulated\n")
        # Validation/Review/Deploy simulated
        _write(os.path.join(run_dir, "langstack.txt"), "validation: approved (simulated)\nreview: approved (simulated)\ndeploy_demo: done (simulated)\n")
        print(f"Run ID: {run_id}")
        return 0

    # Real run with backtrack-on-fail and candidate cascade
    run_id, run_dir = prepare_run_dir()
    timeout_s = state["intent_spec"].get("timeout_s")
    eff_timeout = timeout_s if isinstance(timeout_s, int) and timeout_s > 0 else 60

    # Build candidate list: plan agent first, then other candidates
    plan = _planning_phase(state["intent_id"], state["intent_spec"])
    state["execution_plan"] = plan
    initial_agent = plan["agent_spec"]

    # Collect candidates from registry (ranked)
    reqs = state["intent_spec"].get("agent_requirements") or []
    candidates: List[Dict[str, Any]] = []
    for pth, spec, _sc in agent_registry.list_candidates([*reqs, f"__intent_id__:{state['intent_id']}"]):
        try:
            candidates.append(normalize_agent_yaml(spec))
        except Exception:
            continue

    # Ordered unique by agent_id
    ordered: List[Dict[str, Any]] = []
    seen: set = set()
    for spec in [initial_agent, *candidates]:
        aid = (spec or {}).get("agent_id")
        if not aid or aid in seen:
            continue
        seen.add(aid)
        ordered.append(spec)

    # Attempt cascade with backtrack on fail
    ok = False
    rc_final = 1
    for idx, spec in enumerate(ordered, start=1):
        _write(os.path.join(run_dir, "langstack.txt"), (
            "supreme -> intent -> planning -> execution\n" if idx == 1 else "execution (re-run with alternate agent)\n"
        ))
        # Execute once
        rc, ok_eval = _execute_once(
            state["intent_spec"], spec, user_request, run_id, run_dir, eff_timeout
        )
        rc_final = rc
        # Log which agent was used
        _write(os.path.join(run_dir, "langstack.txt"), f"agent[{spec.get('agent_id')}]: rc={rc} eval={'ok' if ok_eval else 'ng'}\n")
        if rc == 0 and ok_eval:
            ok = True
            break
        else:
            _write(os.path.join(run_dir, "langstack.txt"), "validation: changes_requested\n")
            # backtrack_on_fail: continue to next candidate

    if not ok:
        print("Validation failed after cascade", file=sys.stderr)
        return 6 if rc_final == 0 else rc_final

    # Approved path
    _write(os.path.join(run_dir, "langstack.txt"), "validation: approved\n")
    _write(os.path.join(run_dir, "langstack.txt"), "review: approved\n")
    _write(os.path.join(run_dir, "langstack.txt"), "deploy_demo: done\n")
    print(f"Run ID: {run_id}")
    return 0


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="langstack", description="LangStack Orchestration Adapter (PoC)")
    sub = ap.add_subparsers(dest="cmd")
    runp = sub.add_parser("run", help="Run orchestration using manifest_langstack.yaml")
    runp.add_argument("--input", required=True, help="User request text")
    runp.add_argument("--manifest", default="registry/manifest_langstack.yaml")
    runp.add_argument("--yes", action="store_true", help="Skip approval prompts where applicable")
    runp.add_argument("--simulate", action="store_true", help="Do not invoke agents, only simulate")
    runp.add_argument(
        "--experimental-langgraph",
        action="store_true",
        help="Use experimental LangGraph-based workflow instead of PoC adapter",
    )
    runp.add_argument(
        "--run_id",
        help="Specify run_id for this execution (LangGraph mode)",
    )
    runp.add_argument(
        "--checkpoint",
        action="store_true",
        help="Enable SQLite checkpointing (LangGraph mode only)",
    )
    runp.add_argument(
        "--resume",
        metavar="RUN_ID",
        help="Resume a previous run by run_id (requires --experimental-langgraph and --checkpoint)",
    )

    args = ap.parse_args(argv)
    if args.cmd != "run":
        ap.print_help()
        return 1

    # Optional: route to experimental LangGraph runner
    if getattr(args, "experimental_langgraph", False):
        try:
            from . import langgraph_runner
        except Exception as e:  # pragma: no cover
            print("LangGraph runner not available:", e, file=sys.stderr)
            return 2
        result = langgraph_runner.run_mvp_generation(
            user_prompt=args.input,
            run_id=args.resume or args.run_id,
            strategy="ranked",
            simulate=args.simulate,
            use_checkpoint=bool(args.checkpoint),
            resume=bool(args.resume),
        )
        print("\n=== Execution Complete (LangGraph) ===")
        print(f"Run ID: {result.get('run_id')}")
        print(f"Phase: {result.get('current_phase')}")
        print(f"Validation: {result.get('validation_result')}")
        print(f"Log: runs/{result.get('run_id')}/langstack.txt")
        return 0

    return run_manifest(args.manifest, args.input, yes=args.yes, simulate=args.simulate)


if __name__ == "__main__":
    raise SystemExit(main())
