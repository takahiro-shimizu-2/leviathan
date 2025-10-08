from __future__ import annotations

import json
import os
import subprocess
import time
import uuid
from typing import Dict, Any, Tuple, Optional


from .util import project_root


def _project_root() -> str:
    return project_root(os.path.dirname(__file__))


def _ensure_dir(p: str) -> None:
    os.makedirs(p, exist_ok=True)


def prepare_run_dir() -> Tuple[str, str]:
    root = _project_root()
    runs_root = os.path.join(root, "runs")
    _ensure_dir(runs_root)
    run_id = time.strftime("%Y%m%dT%H%M%S") + "_" + str(uuid.uuid4())[:8]
    run_dir = os.path.join(runs_root, run_id)
    _ensure_dir(run_dir)
    return run_id, run_dir


def persist_specs(run_dir: str, intent_spec: Dict[str, Any], agent_spec: Dict[str, Any]) -> None:
    with open(os.path.join(run_dir, "intent.yml"), "w", encoding="utf-8") as f:
        json.dump(intent_spec, f, ensure_ascii=False, indent=2)
    with open(os.path.join(run_dir, "agent.yml"), "w", encoding="utf-8") as f:
        json.dump(agent_spec, f, ensure_ascii=False, indent=2)


def _build_cmd_from_agent(agent_spec: Dict[str, Any] | None, intent_yaml_path: str, user_request: str, run_id: str) -> list[str]:
    root = _project_root()
    py = os.environ.get("PYTHON", "python3")
    if agent_spec and isinstance(agent_spec, dict):
        entry = agent_spec.get("entry") or {}
        if isinstance(entry, dict) and entry.get("type") == "cli":
            cmd_name = entry.get("command") or "agent_cli"
            # resolve to bin/<cmd_name>
            cmd_path = os.path.join(root, "bin", cmd_name)
            args = entry.get("args") or []
            rendered = []
            for a in args:
                if not isinstance(a, str):
                    continue
                a = a.replace("{yaml}", intent_yaml_path).replace("{input}", user_request).replace("{run_id}", run_id)
                rendered.append(a)
            return [py, cmd_path, *rendered]
    # fallback to default agent_cli
    agent_cli = os.path.join(root, "bin", "agent_cli")
    return [
        py,
        agent_cli,
        "--yaml",
        intent_yaml_path,
        "--input",
        user_request,
        "--run_id",
        run_id,
    ]


def run_agent(intent_yaml_path: str, user_request: str, run_id: str, timeout_s: Optional[int] = None, agent_spec: Dict[str, Any] | None = None) -> Tuple[int, str, str, bool]:
    root = _project_root()
    cmd = _build_cmd_from_agent(agent_spec, intent_yaml_path, user_request, run_id)
    try:
        r = subprocess.run(
            cmd,
            cwd=root,
            capture_output=True,
            text=True,
            timeout=timeout_s if timeout_s and timeout_s > 0 else None,
        )
        return r.returncode, r.stdout or "", r.stderr or "", False
    except subprocess.TimeoutExpired as e:
        return 124, e.stdout or "", e.stderr or "", True


def summarize_plan(intent_spec: Dict[str, Any], agent_spec: Dict[str, Any]) -> str:
    lines = []
    lines.append("Plan Summary")
    lines.append(f"- intent: {intent_spec.get('intent_id')}")
    lines.append(f"- agent:  {agent_spec.get('agent_id')}")
    lines.append(f"- timeout: {intent_spec.get('timeout_s')}s")
    lines.append("- outputs:")
    for o in (intent_spec.get("outputs") or []):
        p = o.get("path") if isinstance(o, dict) else str(o)
        lines.append(f"  - {p}")
    return "\n".join(lines)


def write_log(run_dir: str, content: str) -> None:
    path = os.path.join(run_dir, "logs.txt")
    with open(path, "a", encoding="utf-8") as f:
        f.write(content)
        if not content.endswith("\n"):
            f.write("\n")


def evaluate_success(intent_spec: Dict[str, Any], run_id: str) -> bool:
    """Simple success evaluator based on outputs and optional token hints.

    - Check outputs[0].path existence (with {run_id} substitution)
    - If success_criteria mentions tokens like 目的/非目標/データモデル/フロー, ensure those tokens appear in content
    """
    root = _project_root()
    outputs = intent_spec.get("outputs") or []
    out_path = None
    if outputs:
        first = outputs[0]
        if isinstance(first, dict) and "path" in first:
            out_path = first["path"].replace("{run_id}", run_id)
    if not out_path:
        return False
    out_abs = os.path.join(root, out_path)
    if not os.path.exists(out_abs):
        return False

    # Demo output (HTML under demo/)
    try:
        if out_path.endswith(".html") and ("/demo/" in out_path or out_path.endswith("/demo/index.html") or "/demo/index.html" in out_path):
            # Check companion files
            base_dir = os.path.dirname(out_abs)
            css_ok = os.path.exists(os.path.join(base_dir, "style.css"))
            js_ok = os.path.exists(os.path.join(base_dir, "app.js"))
            with open(out_abs, "r", encoding="utf-8") as f:
                html = f.read()
            has_app = ("id=\"app\"" in html) or ("id='app'" in html)
            return bool(css_ok and js_ok and has_app)
    except Exception:
        return False
    # SPEC quality checks: presence of key sections and minimal structure
    try:
        with open(out_abs, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception:
        return False

    def has_section(name: str) -> bool:
        return (f"## {name}" in content) or (f"### {name}" in content)

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
    if not all(has_section(s) for s in required_sections):
        return False

    # API table must include Method and Path columns
    if "## API 仕様" in content:
        api_header_ok = ("| Method |" in content) and ("| Path |" in content)
        if not api_header_ok:
            return False

    # Data model requires at least 3 entities and attributes table present
    dm_idx = content.find("## データモデル")
    if dm_idx != -1:
        dm_section = content[dm_idx:]
        entity_rows = [ln for ln in dm_section.splitlines() if ln.strip().startswith("| ") and "エンティティ" not in ln and "--------------" not in ln]
        if len(entity_rows) < 3:
            return False
        # attribute tables: count lines under "属性" headers
        attr_tables = [ln for ln in dm_section.splitlines() if "| 属性 |" in ln]
        if not attr_tables:
            return False

    # Use cases >= 3 with flow keywords
    uc_count = content.count("### UC-")
    if uc_count < 3:
        return False
    if ("基本フロー" not in content) or ("代替フロー" not in content) or ("例外" not in content):
        return False

    # Acceptance criteria >= 3 bullets
    ac_idx = content.find("## 受入条件")
    if ac_idx != -1:
        ac_section = content[ac_idx:]
        bullets = [ln for ln in ac_section.splitlines() if ln.strip().startswith("-")]
        if len(bullets) < 3:
            return False

    return True


def execute_with_retry(
    intent_yaml_path: str,
    user_request: str,
    run_id: str,
    run_dir: str,
    timeout_s: Optional[int] = None,
    retries: int = 1,
    agent_spec: Dict[str, Any] | None = None,
) -> int:
    """Execute agent with one retry on failure or timeout.

    Returns final return code.
    """
    attempt = 0
    last_rc = 1
    while attempt <= max(0, retries):
        attempt += 1
        rc, out, err, to = run_agent(intent_yaml_path, user_request, run_id, timeout_s, agent_spec)
        write_log(
            run_dir,
            f"attempt={attempt} rc={rc} timeout={to}\nSTDOUT:\n{out}\nSTDERR:\n{err}\n",
        )
        last_rc = rc
        if rc == 0:
            break
        if attempt > retries + 1:
            break
    return last_rc
