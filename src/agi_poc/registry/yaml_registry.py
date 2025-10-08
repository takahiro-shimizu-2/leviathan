from __future__ import annotations

import os
from typing import Dict, Any, Tuple

# Reuse existing minimal YAML loader if available
try:
    from yaml_min import load as yaml_load
except Exception:  # pragma: no cover
    yaml_load = None

from ..yaml_simple import dump as yaml_dump_simple
from ..util import project_root


def _project_root() -> str:
    return project_root(os.path.dirname(__file__))


def _ensure_dir(p: str) -> None:
    os.makedirs(p, exist_ok=True)


def _load_yaml(path: str) -> Dict[str, Any]:
    if not yaml_load:
        raise RuntimeError("yaml_min loader not available")
    return yaml_load(path)


def _dump_yaml(d: Dict[str, Any], path: str) -> None:
    with open(path, "w", encoding="utf-8") as f:
        f.write(yaml_dump_simple(d) + "\n")


def find_or_generate(intent_id: str) -> Tuple[str, Dict[str, Any]]:
    """Find intent YAML under intents/, else generate from template.

    Returns (path, spec)
    """
    root = _project_root()
    intents_dir = os.path.join(root, "intents")
    # Try .yml then .yaml
    candidates = [
        os.path.join(intents_dir, f"{intent_id}.yml"),
        os.path.join(intents_dir, f"{intent_id}.yaml"),
    ]
    for p in candidates:
        if os.path.exists(p):
            return p, _load_yaml(p)

    # Generate from basic template
    tpl_path = os.path.join(root, "templates", "yaml", "basic.yml")
    if os.path.exists(tpl_path):
        template = _load_yaml(tpl_path)
    else:
        # Last-resort inline template
        template = {
            "version": "v0",
            "intent_id": "generic_task",
            "description": "自動生成テンプレ",
            "agent_requirements": [],
            "inputs": [{"name": "query", "type": "string"}],
            "steps": [],
            "outputs": [{"path": "runs/{run_id}/output.txt"}],
            "success_criteria": ["出力が生成される"],
            "timeout_s": 60,
            "safety": {"allowed_ops": []},
        }
    template["intent_id"] = intent_id

    out_path = os.path.join(intents_dir, f"{intent_id}.yml")
    _ensure_dir(intents_dir)
    _dump_yaml(template, out_path)
    return out_path, template
