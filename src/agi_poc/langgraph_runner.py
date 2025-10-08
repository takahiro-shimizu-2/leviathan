#!/usr/bin/env python3
from __future__ import annotations

"""
LangGraph-based orchestration runner (experimental):

Implements the workflow described in registry/manifest_langstack.yaml
using LangGraph's StateGraph. Nodes reuse existing PoC primitives
for intent detection, YAML registry access, agent selection, and
execution/validation. CrewAI integration is deferred; execution is
performed via the existing runner for now.

Notes:
- Requires `langgraph` to be installed for full functionality.
- Falls back to a clear error message if `langgraph` is missing.
"""

import argparse
import os
from datetime import datetime
from typing import Any, Dict, Literal, TypedDict

from .util import project_root
from .intent import detect_intent
from .registry import yaml_registry, agent_registry
from .schemas import (
    validate_task_yaml,
    validate_agent_yaml,
    normalize_task_yaml,
    normalize_agent_yaml,
)
from .runner import (
    prepare_run_dir,
    persist_specs,
    execute_with_retry,
    evaluate_success,
)


def _project_root() -> str:
    return project_root(os.path.dirname(__file__))


def _write_run_log(run_id: str, lines: list[str]) -> None:
    """Append workflow log lines to runs/{run_id}/langstack.txt."""
    root = _project_root()
    path = os.path.join(root, "runs", run_id, "langstack.txt")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "a", encoding="utf-8") as f:
        for ln in lines:
            if ln is None:
                continue
            f.write(ln)
            if not str(ln).endswith("\n"):
                f.write("\n")


def _artifact_dir(run_id: str) -> str:
    root = _project_root()
    path = os.path.join(root, "runs", run_id, "artifacts")
    os.makedirs(path, exist_ok=True)
    return path


def _write_text(path: str, content: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content or "")


def _write_json(path: str, obj: dict) -> None:
    import json
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)


class MVPSystemState(TypedDict, total=False):
    # Inputs
    user_input: str
    attachments: list

    # Intent stage
    intent_id: str
    intent_spec: dict
    agent_requirements: list
    missing_info: list

    # Planning
    selected_agents: list
    execution_plan: dict
    strategy: str

    # Execution
    retry_count: int
    current_agent_index: int
    spec_content: str

    # Validation
    validation_result: Literal["approved", "changes_requested", "pending"]
    validation_details: dict

    # Review / Deploy
    approval_status: Literal["approved", "rejected", "pending"]
    reviewer_comments: str
    demo_url: str
    deploy_status: str

    # Meta
    run_id: str
    current_phase: str
    langstack_log: list


def _safe_import_langgraph():
    try:
        from langgraph.graph import StateGraph, END  # type: ignore
        try:
            from langgraph.checkpoint.sqlite import SqliteSaver  # type: ignore
        except Exception:
            SqliteSaver = None  # type: ignore
        return StateGraph, END, SqliteSaver
    except Exception as e:  # pragma: no cover
        raise RuntimeError(
            "LangGraph is not available. Please install `langgraph` to use the experimental runner."
        ) from e


# =========================
# Node implementations
# =========================
def intent_orchestrator_node(state: MVPSystemState) -> MVPSystemState:
    user_input = state.get("user_input") or ""

    intent_id = detect_intent(user_input)
    _path, intent_spec = yaml_registry.find_or_generate(intent_id)
    intent_spec = normalize_task_yaml(intent_spec)
    ok, msg = validate_task_yaml(intent_spec)
    if not ok:
        raise RuntimeError(f"Invalid intent YAML: {msg}")

    missing_info: list[str] = []
    if not intent_spec.get("outputs"):
        missing_info.append("outputs")

    state["intent_id"] = intent_id
    state["intent_spec"] = intent_spec
    state["agent_requirements"] = intent_spec.get("agent_requirements", [])
    state["missing_info"] = missing_info
    state["current_phase"] = "intent_detected"
    state["langstack_log"].append(f"[Intent] {intent_id}")
    return state


def user_clarify_node(state: MVPSystemState) -> MVPSystemState:
    # PoC: auto-clear
    if state.get("missing_info"):
        state["langstack_log"].append(f"[Clarify] auto-cleared: {state['missing_info']}")
        state["missing_info"] = []
    state["current_phase"] = "clarified"
    return state


def yaml_autogen_node(state: MVPSystemState) -> MVPSystemState:
    # PoC: log only
    state["langstack_log"].append("[YAMLAutogen] template=templates/yaml/basic.yml")
    state["current_phase"] = "yaml_ready"
    return state


def planning_orchestrator_node(state: MVPSystemState) -> MVPSystemState:
    intent_spec = state["intent_spec"]
    reqs = intent_spec.get("agent_requirements") or []
    _agent_path, agent_spec = agent_registry.select_or_generate(reqs, state["intent_id"])
    agent_spec = normalize_agent_yaml(agent_spec)
    ok, msg = validate_agent_yaml(agent_spec)
    if not ok:
        raise RuntimeError(f"Invalid agent YAML: {msg}")

    state["selected_agents"] = [agent_spec]
    state["execution_plan"] = {
        "agents": [agent_spec],
        "timeout_s": intent_spec.get("timeout_s", 60),
        "max_retries": 1,
    }
    state["strategy"] = state.get("strategy") or "simple"
    state["current_phase"] = "planned"
    state["langstack_log"].append("[Planning] selected 1 agent")
    return state


def execution_orchestrator_node(state: MVPSystemState) -> MVPSystemState:
    simulate = state.get("_simulate") is True
    run_id = state.get("run_id") or datetime.now().strftime("%Y%m%d_%H%M%S")
    state["run_id"] = run_id

    if simulate:
        # Simulate SPEC generation
        state["spec_content"] = "# SPEC (simulated)\n"
        state["current_phase"] = "executed"
        state["langstack_log"].append("[Execution] simulated")
        return state

    # Attempt CrewAI-based execution per manifest; fallback to PoC runner
    try:
        # Late imports to keep optional deps
        from crewai import Agent as CrewAgent, Task as CrewTask, Crew, Process
        # Load manifest for agent definitions
        mani = _load_manifest_yaml()
        exec_node = None
        for n in (mani.get("workflow", {}).get("nodes") or []):
            if n.get("id") == "execution_orchestrator":
                exec_node = n
                break
        agent_names = (exec_node or {}).get("agents") or []
        merge_strategy = (exec_node or {}).get("merge_strategy") or "first_success"
        process_type = (exec_node or {}).get("type") or "parallel_crew"

        # Build CrewAI agents
        crew_agents = []
        for name in agent_names:
            cfg = _find_agent_cfg(mani, name)
            if not cfg:
                continue
            llm = _maybe_build_llm(cfg.get("llm_config") or {})
            crew_agents.append(
                CrewAgent(
                    role=cfg.get("role") or name,
                    goal=cfg.get("goal") or "Generate SPEC.md",
                    backstory=cfg.get("backstory") or "",
                    llm=llm,
                    verbose=True,
                )
            )

        if not crew_agents:
            raise RuntimeError("No CrewAI agents resolved from manifest")

        # Define task description template
        user_prompt = state.get("user_input") or ""
        # Optionally include reviewer comments as revision guidance
        reviewer = (state.get("reviewer_comments") or "").strip()
        description = (
            "ユーザー要求に基づき、以下の各セクションを含むSPEC.mdを作成:\n"
            "- 目的\n- 非目標\n- 機能一覧\n- ユースケース\n- 画面要件\n- API 仕様\n- データモデル\n- 受入条件\n\n"
            f"要求: {user_prompt}\n\n" + (f"修正指示:\n{reviewer}\n" if reviewer else "")
        )

        # Prepare run directory
        run_root = os.path.join(_project_root(), "runs", run_id)
        os.makedirs(run_root, exist_ok=True)

        # Helpers
        def _quick_validate_spec_markdown(text: str) -> bool:
            try:
                if not isinstance(text, str) or len(text) < 200:
                    return False
                required_sections = [
                    "目的",
                    "非目標",
                    "機能一覧",
                    "ユースケース",
                    "画面要件",
                    "API 仕様",
                    "データモデル",
                    "受入条件",
                ]
                for s in required_sections:
                    if (f"## {s}" not in text) and (f"### {s}" not in text):
                        return False
                if "## API 仕様" in text and ("| Method |" not in text or "| Path |" not in text):
                    return False
                # Rough minimum for use cases
                if text.count("### UC-") < 3:
                    return False
                return True
            except Exception:
                return False

        candidates: list[tuple[str, str, bool]] = []  # (agent_name, content, is_valid)

        # Strategy: first_success or wait_all
        if str(merge_strategy).lower() in ("first_success", "first" ):
            for ag in crew_agents:
                task = CrewTask(description=description, agent=ag, expected_output="SPEC.md 本文")
                crew = Crew(agents=[ag], tasks=[task], process=Process.sequential, verbose=True)
                result = str(crew.kickoff())
                name = getattr(ag, "role", "agent")
                # Save candidate
                cand_path = os.path.join(run_root, f"SPEC_{name}.md")
                with open(cand_path, "w", encoding="utf-8") as f:
                    f.write(result)
                ok = _quick_validate_spec_markdown(result)
                candidates.append((name, result, ok))
                state["langstack_log"].append(f"[Execution] CrewAI {name} ok={ok}")
                if ok:
                    break
        else:  # wait_all or others
            for ag in crew_agents:
                task = CrewTask(description=description, agent=ag, expected_output="SPEC.md 本文")
                crew = Crew(agents=[ag], tasks=[task], process=Process.sequential, verbose=True)
                result = str(crew.kickoff())
                name = getattr(ag, "role", "agent")
                cand_path = os.path.join(run_root, f"SPEC_{name}.md")
                with open(cand_path, "w", encoding="utf-8") as f:
                    f.write(result)
                ok = _quick_validate_spec_markdown(result)
                candidates.append((name, result, ok))
                state["langstack_log"].append(f"[Execution] CrewAI {name} ok={ok}")

        # Choose final
        chosen = None
        valid = [c for c in candidates if c[2]]
        if valid:
            chosen = valid[0]
        elif candidates:
            # fallback to the longest content
            chosen = max(candidates, key=lambda c: len(c[1]))

        # Persist SPEC.md to the output path
        intent_spec = state.get("intent_spec") or {}
        outputs = intent_spec.get("outputs") or []
        out_rel = None
        if outputs:
            first = outputs[0]
            if isinstance(first, dict) and first.get("path"):
                out_rel = first["path"].replace("{run_id}", run_id)
        if not out_rel:
            out_rel = os.path.join("runs", run_id, "SPEC.md")
        out_abs = os.path.join(_project_root(), out_rel)
        os.makedirs(os.path.dirname(out_abs), exist_ok=True)
        with open(out_abs, "w", encoding="utf-8") as f:
            f.write(chosen[1] if chosen else "")

        state["spec_content"] = chosen[1] if chosen else ""
        # Produce downstream artifacts per role (sequential, simple handoff)
        try:
            spec_text = state["spec_content"] or ""
            art_dir = _artifact_dir(run_id)

            def mk_task(agent, desc: str) -> str:
                if reviewer:
                    desc = desc + f"\n\n修正指示:\n{reviewer}\n"
                t = CrewTask(description=desc, agent=agent, expected_output="Markdown or JSON")
                cr = Crew(agents=[agent], tasks=[t], process=Process.sequential, verbose=True)
                return str(cr.kickoff())

            for ag in crew_agents:
                role = getattr(ag, "role", "agent").lower()
                if "architect" in role:
                    out = mk_task(ag, f"SPECを要約し設計判断・トレードオフ・簡易ダイアグラムを提示。\n入力SPEC:\n{spec_text[:8000]}")
                    _write_text(os.path.join(art_dir, "design_doc.md"), out)
                elif "backend" in role:
                    out = mk_task(ag, f"SPECからAPI仕様を抽出しエンドポイント表を作成。\n入力SPEC:\n{spec_text[:8000]}")
                    _write_text(os.path.join(art_dir, "api_spec.md"), out)
                elif "frontend" in role:
                    out = mk_task(ag, f"SPECの画面要件からUI骨子と主要コンポーネント案をMarkdownで。\n入力SPEC:\n{spec_text[:8000]}")
                    _write_text(os.path.join(art_dir, "ui_design.md"), out)
                elif "tester" in role:
                    out = mk_task(ag, f"SPECの受入条件から自動テスト観点リストと優先度をJSONで。キー: passed, failed, coverage, notes。\n入力SPEC:\n{spec_text[:8000]}")
                    # best effort JSON parse
                    try:
                        import json
                        data = json.loads(out)
                    except Exception:
                        data = {"passed": 0, "failed": 0, "coverage": 0.0, "notes": [out]}
                    _write_json(os.path.join(art_dir, "test_reports.json"), data)
                elif "devops" in role:
                    out = mk_task(ag, f"最小デモ環境のデプロイ手順（Docker/Localのどちらか）と想定URLをJSONで出力（env, notes）。")
                    try:
                        import json
                        data = json.loads(out)
                    except Exception:
                        data = {"env": "local", "notes": out}
                    _write_json(os.path.join(art_dir, "deploy_info.json"), data)
                else:
                    # other roles contribute notes
                    out = mk_task(ag, f"SPEC改善のためのレビューコメントを箇条書きで。\n入力SPEC:\n{spec_text[:8000]}")
                    _write_text(os.path.join(art_dir, f"notes_{role}.md"), out)
            state["langstack_log"].append("[Execution] Artifacts produced from CrewAI tasks")
        except Exception:
            # Non-fatal: continue with SPEC only
            state["langstack_log"].append("[Execution] Artifact production skipped (CrewAI tasks) due to error")

        state["current_phase"] = "executed"
        state["langstack_log"].append(
            f"[Execution] CrewAI completed strategy={merge_strategy} chosen={(chosen[0] if chosen else 'none')}"
        )
        return state
    except Exception as e:
        # Fallback to existing PoC runner
        agent_spec = (state.get("selected_agents") or [{}])[0]
        intent_spec = state["intent_spec"]
        timeout_s = intent_spec.get("timeout_s")
        eff_timeout = timeout_s if isinstance(timeout_s, int) and timeout_s > 0 else 60

        _run_id, run_dir = prepare_run_dir()
        state["run_id"] = _run_id
        persist_specs(run_dir, intent_spec, agent_spec)

        intent_yaml_path = os.path.join(_project_root(), "intents", f"{intent_spec.get('intent_id')}.yml")
        rc = execute_with_retry(
            intent_yaml_path=intent_yaml_path,
            user_request=state.get("user_input") or "",
            run_id=_run_id,
            run_dir=run_dir,
            timeout_s=eff_timeout,
            retries=0,
            agent_spec=agent_spec,
        )
        # Best-effort artifact synthesis without LLM
        try:
            spec_path = os.path.join(_project_root(), "runs", _run_id, "SPEC.md")
            spec_text = ""
            if os.path.exists(spec_path):
                with open(spec_path, "r", encoding="utf-8") as f:
                    spec_text = f.read()
            art_dir = _artifact_dir(_run_id)
            _write_text(os.path.join(art_dir, "design_doc.md"), "# Design Doc\n\n(placeholder synthesized)\n")
            _write_text(os.path.join(art_dir, "api_spec.md"), "# API Spec\n\n(placeholder synthesized)\n")
            _write_json(os.path.join(art_dir, "test_reports.json"), {"passed": 0, "failed": 0, "coverage": 0.0, "notes": ["placeholder"]})
        except Exception:
            pass

        state["current_phase"] = "executed"
        state["langstack_log"].append(f"[Execution] fallback rc={rc} ({e})")
        return state


def validation_orchestrator_node(state: MVPSystemState) -> MVPSystemState:
    simulate = state.get("_simulate") is True
    if simulate:
        state["validation_result"] = "approved"
        state["validation_details"] = {"simulated": True}
        state["current_phase"] = "validated"
        state["langstack_log"].append("[Validation] approved (simulated)")
        return state

    intent_spec = state.get("intent_spec", {})
    run_id = state.get("run_id") or ""

    # SPEC validation (existing)
    spec_ok = evaluate_success(intent_spec, run_id) if run_id else False

    # Schema-driven artifact validation
    mani = _load_manifest_yaml()
    artifact_schemas = mani.get("artifacts") or []

    # Map known artifact IDs to file paths produced in execution
    path_map = {
        "design_doc": os.path.join(_artifact_dir(run_id), "design_doc.md"),
        "api_spec": os.path.join(_artifact_dir(run_id), "api_spec.md"),
        "test_reports": os.path.join(_artifact_dir(run_id), "test_reports.json"),
        "deploy_info": os.path.join(_artifact_dir(run_id), "deploy_info.json"),
        # others (db_schema, code_changes, pr_link) are optional at this phase
    }

    # Determine required artifacts from policies (simple heuristic)
    required_ids: set[str] = set(["design_doc", "api_spec"])  # default required
    try:
        policies = (mani.get("human_in_the_loop", {}) or {}).get("policies", []) or []
        for pol in policies:
            rule = (pol or {}).get("rule") or ""
            if any(tok in rule for tok in ["tests.", "coverage", "gate", "fail==0"]):
                required_ids.add("test_reports")
    except Exception:
        pass

    checks: list[dict] = [{"name": "spec_quality", "ok": spec_ok, "detail": "SPEC.md structure and sections"}]

    def _validate_against_schema(art_id: str, schema: dict, path: str) -> tuple[bool, dict]:
        detail: dict[str, object] = {}
        if not os.path.exists(path):
            return False, {"missing": True}
        try:
            # JSON-like schema
            if path.endswith(".json"):
                import json
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                # minimal: ensure keys exist and types match for known artifacts
                if art_id == "test_reports":
                    ok = isinstance(data.get("passed"), (int, float)) and isinstance(data.get("failed"), (int, float)) and isinstance(data.get("coverage"), (int, float))
                    if ok:
                        ok = data.get("failed") == 0 and float(data.get("coverage")) >= 0.7
                    detail = {"passed": data.get("passed"), "failed": data.get("failed"), "coverage": data.get("coverage")}
                    return bool(ok), detail
                if art_id == "deploy_info":
                    ok = isinstance(data.get("env"), str)
                    detail = {"env": data.get("env")}
                    return bool(ok), detail
                # default JSON check
                return True, {"parsed": True}
            # Markdown/text schema
            else:
                with open(path, "r", encoding="utf-8") as f:
                    text = f.read()
                if art_id == "api_spec":
                    ok = ("| Method |" in text and "| Path |" in text) or ("GET" in text or "POST" in text)
                    return bool(ok), {"header": "table or http verbs"}
                # design_doc and others: non-trivial length
                ok = len((text or "").strip()) >= 50
                return ok, {"length": len((text or "").strip())}
        except Exception as e:
            return False, {"error": str(e)}

    # Iterate schemas and validate present artifacts
    for item in artifact_schemas:
        art_id = item.get("id") if isinstance(item, dict) else None
        if not art_id:
            continue
        path = path_map.get(art_id)
        # Only validate those we know how to locate
        if not path:
            checks.append({"name": art_id, "ok": True, "optional": True, "detail": {"skipped": "no mapper"}})
            continue
        ok, detail = _validate_against_schema(art_id, item.get("schema") or {}, path)
        check = {"name": art_id, "ok": ok, "detail": detail}
        if art_id not in required_ids:
            check["optional"] = True
        checks.append(check)

    all_required_ok = all(ch.get("ok") for ch in checks if not ch.get("optional"))

    state["validation_result"] = "approved" if all_required_ok else "changes_requested"
    state["validation_details"] = {"checks": checks, "required": sorted(list(required_ids))}
    state["current_phase"] = "validated"
    state["langstack_log"].append(
        f"[Validation] {'approved' if all_required_ok else 'changes_requested'} (spec={spec_ok}, artifacts={[ch['name'] for ch in checks if ch.get('ok')]})"
    )
    # Persist validation details alongside logs for UI consumption
    try:
        import json
        rid = state.get("run_id") or run_id
        path = os.path.join(_project_root(), "runs", rid, "validation.json")
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(state["validation_details"], f, ensure_ascii=False, indent=2)
    except Exception:
        pass
    # increment retry_count for routing guards
    state["retry_count"] = int(state.get("retry_count") or 0) + (0 if all_required_ok else 1)
    return state


def review_node(state: MVPSystemState) -> MVPSystemState:
    run_id = state.get("run_id") or ""
    validation_result = state.get("validation_result")

    # If validation passed, auto-approve
    if validation_result == "approved":
        state["approval_status"] = "approved"
        state["reviewer_comments"] = "All checks passed. Proceed to deploy."
        state["current_phase"] = "reviewed"
        state["langstack_log"].append("[Review] auto-approved (validation ok)")
        # Persist review note
        try:
            _write_text(os.path.join(_project_root(), "runs", run_id, "review_comments.md"), state["reviewer_comments"])  # type: ignore[arg-type]
        except Exception:
            pass
        return state

    # Otherwise, assemble change requests from validation details
    details = (state.get("validation_details") or {}).copy()
    checks = details.get("checks") or []
    failed = [c for c in checks if not c.get("ok") and not c.get("optional")]

    # Deterministic baseline comments
    suggestions: list[str] = []
    for c in failed:
        name = c.get("name")
        if name == "spec_quality":
            suggestions.append("SPEC.mdに必須セクション（目的/非目標/機能一覧/ユースケース/画面要件/API仕様/データモデル/受入条件）を網羅し、各節に最低限の内容を追加してください。")
        elif name == "design_doc":
            suggestions.append("design_doc.mdに設計判断・トレードオフ・簡易ダイアグラムの説明を追記（50文字以上）。")
        elif name == "api_spec":
            suggestions.append("api_spec.mdにAPI表（| Method | Path | ...）またはHTTPメソッドとパスの一覧を含めてください。")
        elif name == "test_reports":
            suggestions.append("test_reports.jsonでfailed==0かつcoverage>=0.7を満たすようテストを補完・修正してください。")
        else:
            suggestions.append(f"{name} を見直し、スキーマ要件を満たすよう修正してください。")

    baseline_comment = "\n".join(["# Review: Changes Requested", "", *[f"- {s}" for s in suggestions]])

    # Try CrewAI to generate refined review comments
    final_comment = baseline_comment
    try:
        mani = _load_manifest_yaml()
        reviewer_cfg = _find_agent_cfg(mani, "tech_lead") or _find_agent_cfg(mani, "supreme_manager")
        if reviewer_cfg:
            from crewai import Agent as CrewAgent, Task as CrewTask, Crew, Process
            llm = _maybe_build_llm(reviewer_cfg.get("llm_config") or {})
            reviewer = CrewAgent(
                role=reviewer_cfg.get("role") or "Reviewer",
                goal="生成物の品質向上のための具体的な修正指示を作成",
                backstory=reviewer_cfg.get("backstory") or "",
                llm=llm,
                verbose=True,
            )
            # Read short context snippets
            spec_path = os.path.join(_project_root(), "runs", run_id, "SPEC.md")
            spec_snip = ""
            if os.path.exists(spec_path):
                with open(spec_path, "r", encoding="utf-8") as f:
                    spec_snip = f.read()[:4000]
            desc = (
                "以下の不合格チェックに基づき、開発者向けの具体的な修正指示を日本語で箇条書きで作成してください。\n"
                f"不合格チェック: {failed}\n\n"
                f"SPEC抜粋:\n{spec_snip}\n\n"
                "出力はそのままレビューコメントとして使えるMarkdown。"
            )
            task = CrewTask(description=desc, agent=reviewer, expected_output="Markdownのレビューコメント")
            crew = Crew(agents=[reviewer], tasks=[task], process=Process.sequential, verbose=True)
            final_comment = str(crew.kickoff()) or baseline_comment
    except Exception:
        pass

    state["approval_status"] = "pending"  # not approved yet, will route back to execution
    state["reviewer_comments"] = final_comment
    state["current_phase"] = "reviewed"
    state["langstack_log"].append("[Review] changes requested with comments")
    # Persist review note
    try:
        _write_text(os.path.join(_project_root(), "runs", run_id, "review_comments.md"), final_comment)
    except Exception:
        pass
    return state


def deploy_demo_node(state: MVPSystemState) -> MVPSystemState:
    run_id = state.get("run_id") or ""
    state["deploy_status"] = "simulated"
    state["demo_url"] = f"http://localhost:3000/{run_id}" if run_id else ""
    state["current_phase"] = "deployed"
    state["langstack_log"].append(f"[Deploy] demo={state['demo_url']}")
    return state


# =========================
# Manifest helpers
# =========================
def _load_manifest_yaml() -> dict:
    path = os.path.join(_project_root(), "registry", "manifest_langstack.yaml")
    try:
        import yaml  # type: ignore
        with open(path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f) or {}
    except Exception:
        # Fallback to minimal loader if available
        try:
            from yaml_min import load as yaml_load  # type: ignore
            return yaml_load(path) or {}
        except Exception:
            return {}


def _find_agent_cfg(manifest: dict, name: str) -> dict | None:
    for a in (manifest.get("agents") or []):
        if a.get("name") == name:
            return a
    return None


def _maybe_build_llm(llm_cfg: dict | None):
    if not llm_cfg:
        return None
    provider = (llm_cfg.get("provider") or "").lower()
    model = llm_cfg.get("model") or None
    temperature = llm_cfg.get("temperature")
    try:
        if provider == "anthropic" and model:
            from langchain_anthropic import ChatAnthropic  # type: ignore
            return ChatAnthropic(model=model, temperature=temperature or 0.3)
        if provider == "openai" and model:
            from langchain_openai import ChatOpenAI  # type: ignore
            return ChatOpenAI(model=model, temperature=temperature or 0.3)
        # Google Gemini (Generative Language API)
        # Requires: pip install langchain-google-genai and GOOGLE_API_KEY env var
        if provider in ("google", "gemini") and model:
            try:
                from langchain_google_genai import ChatGoogleGenerativeAI  # type: ignore
            except Exception:
                # If the optional dependency is missing, return None to allow graceful fallback
                return None
            return ChatGoogleGenerativeAI(model=model, temperature=temperature or 0.3)
    except Exception:
        return None
    return None


# =========================
# Routing functions
# =========================
def route_after_intent(state: MVPSystemState) -> Literal["clarify", "yaml_autogen"]:
    if state.get("missing_info"):
        return "clarify"
    return "yaml_autogen"


def route_after_validation(state: MVPSystemState) -> Literal["review", "execution"]:
    if state.get("validation_result") == "approved":
        return "review"
    # Avoid infinite loops: after 3 attempts, escalate to review (HITL)
    if int(state.get("retry_count") or 0) >= 3:
        return "review"
    return "execution"


def route_after_review(state: MVPSystemState) -> Literal["deploy", "execution"]:
    if state.get("approval_status") == "approved":
        return "deploy"
    # Any non-approved state goes back to execution with reviewer comments as guidance
    return "execution"


# =========================
# Build and run
# =========================
def build_mvp_workflow():
    StateGraph, END, _SqliteSaver = _safe_import_langgraph()

    workflow = StateGraph(MVPSystemState)
    # Nodes
    workflow.add_node("intent", intent_orchestrator_node)
    workflow.add_node("clarify", user_clarify_node)
    workflow.add_node("yaml_autogen", yaml_autogen_node)
    workflow.add_node("planning", planning_orchestrator_node)
    workflow.add_node("execution", execution_orchestrator_node)
    workflow.add_node("validation", validation_orchestrator_node)
    workflow.add_node("review", review_node)
    workflow.add_node("deploy", deploy_demo_node)

    # Entry
    workflow.set_entry_point("intent")

    # Edges
    workflow.add_conditional_edges(
        "intent", route_after_intent, {"clarify": "clarify", "yaml_autogen": "yaml_autogen"}
    )
    workflow.add_edge("clarify", "yaml_autogen")
    workflow.add_edge("yaml_autogen", "planning")
    workflow.add_edge("planning", "execution")
    workflow.add_edge("execution", "validation")
    workflow.add_conditional_edges(
        "validation", route_after_validation, {"review": "review", "execution": "execution"}
    )
    workflow.add_conditional_edges("review", route_after_review, {"deploy": "deploy", "execution": "execution"})
    workflow.add_edge("deploy", END)

    return workflow


def run_mvp_generation(
    user_prompt: str,
    run_id: str | None = None,
    strategy: str = "ranked",
    simulate: bool = False,
    use_checkpoint: bool = False,
    resume: bool = False,
) -> MVPSystemState:
    StateGraph, _END, SqliteSaver = _safe_import_langgraph()
    workflow = build_mvp_workflow()

    # Optional checkpointer
    checkpointer = None
    thread_cfg: Dict[str, Any] = {}
    if use_checkpoint and SqliteSaver is not None:
        rid = run_id or datetime.now().strftime("%Y%m%d_%H%M%S")
        db_path = os.path.join(_project_root(), "runs", rid, "checkpoint.db")
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        checkpointer = SqliteSaver.from_conn_string(db_path)
        thread_cfg = {"configurable": {"thread_id": rid}}

    app = workflow.compile(checkpointer=checkpointer) if checkpointer else workflow.compile()

    rid = run_id or datetime.now().strftime("%Y%m%d_%H%M%S")

    if use_checkpoint and resume:
        # Resume from checkpoint; require a thread id
        if not run_id:
            raise RuntimeError("resume=True requires a run_id to be provided")
        result: MVPSystemState = app.invoke(None, config=thread_cfg)
    else:
        # Fresh start with initial state
        init_state: MVPSystemState = {
            "user_input": user_prompt,
            "attachments": [],
            "retry_count": 0,
            "current_agent_index": 0,
            "validation_result": "pending",
            "approval_status": "pending",
            "run_id": rid,
            "current_phase": "start",
            "langstack_log": [],
            "_simulate": simulate,
            "strategy": strategy,
        }
        result = app.invoke(init_state, config=thread_cfg) if thread_cfg else app.invoke(init_state)

    # Persist workflow log to file for observability
    try:
        rid_final = result.get("run_id") or rid
        _write_run_log(rid_final, result.get("langstack_log") or [])
    except Exception:
        pass
    return result


def cli_main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="langgraph-runner", description="LangGraph MVP runner (experimental)")
    ap.add_argument("user_prompt", help="User request to process")
    ap.add_argument("--simulate", action="store_true", help="Simulate without executing agents")
    ap.add_argument("--checkpoint", action="store_true", help="Enable SQLite checkpointing")
    ap.add_argument("--resume", metavar="RUN_ID", help="Resume from a previous run_id (requires --checkpoint)")
    ap.add_argument("--run_id", metavar="RUN_ID", help="Specify run_id for a new execution")
    args = ap.parse_args(argv)

    res = run_mvp_generation(
        user_prompt=args.user_prompt,
        run_id=args.resume or args.run_id,
        strategy="ranked",
        simulate=args.simulate,
        use_checkpoint=args.checkpoint,
        resume=bool(args.resume),
    )

    print("=== Execution Complete ===")
    print(f"Phase: {res.get('current_phase')}")
    print(f"Validation: {res.get('validation_result')}")
    print(f"Run ID: {res.get('run_id')}")
    print(f"Log: runs/{res.get('run_id')}/langstack.txt")
    return 0


if __name__ == "__main__":
    raise SystemExit(cli_main())
