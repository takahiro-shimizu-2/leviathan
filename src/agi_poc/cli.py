#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import sys

from .intent import detect_intent
from .registry import yaml_registry, agent_registry
from .schemas import (
    validate_task_yaml,
    validate_agent_yaml,
    normalize_task_yaml,
    normalize_agent_yaml,
)
from .approval import needs_approval, ask_approval
from .runner import prepare_run_dir, persist_specs, run_agent, summarize_plan


from .util import project_root


def _project_root() -> str:
    return project_root(os.path.dirname(__file__))


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="agi-poc", description="AGI PoC CLI")
    sub = ap.add_subparsers(dest="cmd")
    runp = sub.add_parser("run", help="Run with a user request")
    runp.add_argument("request", help="User request text")
    runp.add_argument("--dry-run", action="store_true")
    runp.add_argument("--timeout", type=int, default=60)
    runp.add_argument("--budget", type=int, default=2000)
    runp.add_argument("--yes", action="store_true", help="Skip approval gate")
    runp.add_argument("--strategy", choices=["simple", "ranked", "cascade"], default="simple", help="Agent routing strategy")

    args = ap.parse_args(argv)
    if args.cmd != "run":
        ap.print_help()
        return 1

    # 1) Intent detection
    intent_id = detect_intent(args.request)

    # 2) YAML registry: find or generate
    intent_path, intent_spec = yaml_registry.find_or_generate(intent_id)
    intent_spec = normalize_task_yaml(intent_spec)
    ok, msg = validate_task_yaml(intent_spec)
    if not ok:
        print(f"Invalid intent YAML: {msg}", file=sys.stderr)
        return 2

    # 3) Agent registry: candidates and selection
    reqs = intent_spec.get("agent_requirements") or []
    candidates = agent_registry.list_candidates([*reqs, f"__intent_id__:{intent_id}"])
    agent_path = None
    agent_spec = None
    if args.strategy == "simple":
        agent_path, agent_spec = agent_registry.select_or_generate(reqs, intent_id)
        agent_spec = normalize_agent_yaml(agent_spec)
        ok, msg = validate_agent_yaml(agent_spec)
        if not ok:
            print(f"Invalid agent YAML: {msg}", file=sys.stderr)
            return 3
    else:
        if candidates:
            agent_path, agent_spec, _score = candidates[0]
        else:
            # ensure one fallback exists
            agent_path, agent_spec = agent_registry.select_or_generate(reqs, intent_id)
        agent_spec = normalize_agent_yaml(agent_spec)
        ok, msg = validate_agent_yaml(agent_spec)
        if not ok:
            print(f"Invalid agent YAML: {msg}", file=sys.stderr)
            return 3

    # 4) Approval gate
    if needs_approval(intent_spec, agent_spec, args.dry_run):
        if not ask_approval(args.yes):
            print("Canceled by user.")
            return 4

    # 5) Runner
    run_id, run_dir = prepare_run_dir()
    persist_specs(run_dir, intent_spec, agent_spec)

    if args.dry_run:
        print(summarize_plan(intent_spec, agent_spec))
        print(f"Run ID: {run_id}")
        return 0

    # Effective timeout: min(CLI, intent.yaml)
    timeout_s = intent_spec.get("timeout_s")
    if isinstance(timeout_s, int) and timeout_s > 0:
        eff_timeout = min(args.timeout, timeout_s)
    else:
        eff_timeout = args.timeout

    # BudgetはPoC段階では記録のみ
    with open(os.path.join(run_dir, "budget.txt"), "w", encoding="utf-8") as f:
        f.write(str(args.budget))

    # Execute according to strategy
    from .runner import execute_with_retry, evaluate_success, write_log

    def attempt(agent_path_local: str | None, agent_spec_local: dict) -> int:
        # persist the chosen agent for traceability
        persist_specs(run_dir, intent_spec, agent_spec_local)
        rc_local = execute_with_retry(
            intent_yaml_path=intent_path,
            user_request=args.request,
            run_id=run_id,
            run_dir=run_dir,
            timeout_s=eff_timeout,
            retries=1,
            agent_spec=agent_spec_local,
        )
        if rc_local == 0:
            ok_eval = evaluate_success(intent_spec, run_id)
            write_log(run_dir, f"evaluator_success={ok_eval}")
            return 0 if ok_eval else 6
        return rc_local

    if args.strategy == "simple":
        rc = attempt(agent_path, agent_spec)
        if rc != 0:
            print("Agent execution failed", file=sys.stderr)
            return rc
    elif args.strategy == "ranked":
        # use the best candidate once
        rc = attempt(agent_path, agent_spec)
        if rc != 0:
            print("Agent execution failed (ranked)", file=sys.stderr)
            return rc
    else:  # cascade
        tried = 0
        last_rc = 1
        tried_specs = []
        # Build ordered specs: candidates then fallback auto agent if not included
        ordered: list[dict] = []
        if candidates:
            for pth, spec, _sc in candidates:
                ordered.append(normalize_agent_yaml(spec))
        else:
            ordered.append(agent_spec)
        for spec in ordered:
            tried += 1
            last_rc = attempt(None, spec)
            if last_rc == 0:
                break
        if last_rc != 0:
            print("Agent execution failed (cascade)", file=sys.stderr)
            return last_rc

    print(f"Run ID: {run_id}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
