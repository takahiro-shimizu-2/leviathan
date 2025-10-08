from __future__ import annotations

import os
from typing import Dict, Any, List, Tuple

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


def _walk_agents(root: str) -> List[str]:
    out = []
    for name in os.listdir(root):
        p = os.path.join(root, name, "agent.yml")
        if os.path.exists(p):
            out.append(p)
    return out


def list_candidates(required_caps: List[str]) -> List[Tuple[str, Dict[str, Any], float]]:
    """List existing agents with a simple score for routing.

    Heuristic score:
    - +1 per matching capability in required_caps
    - +2 if a special sentinel "__intent_id__:<id>" is present in required_caps and appears in agent_id
    """
    root = _project_root()
    agents_root = os.path.join(root, "agents")
    results: List[Tuple[str, Dict[str, Any], float]] = []
    if not os.path.exists(agents_root):
        return results

    # extract optional intent_id sentinel
    intent_id = None
    eff_reqs: List[str] = []
    for r in required_caps or []:
        if isinstance(r, str) and r.startswith("__intent_id__:"):
            intent_id = r.split(":", 1)[1]
        else:
            eff_reqs.append(r)

    for p in _walk_agents(agents_root):
        try:
            spec = _load_yaml(p)
        except Exception:
            continue
        caps = spec.get("capabilities") or []
        score = 0.0
        for req in (eff_reqs or []):
            if req in caps:
                score += 1.0
        if intent_id:
            aid = spec.get("agent_id") or ""
            if intent_id in aid:
                score += 2.0
        results.append((p, spec, score))
    results.sort(key=lambda t: t[2], reverse=True)
    return results


def select_or_generate(required_caps: List[str], intent_id: str) -> Tuple[str, Dict[str, Any]]:
    """Select an agent that satisfies required capabilities, else generate.

    Returns (path, spec)
    """
    root = _project_root()
    agents_root = os.path.join(root, "agents")
    if os.path.exists(agents_root):
        # prefer best candidates first
        for p, spec, _sc in list_candidates([*(required_caps or []), f"__intent_id__:{intent_id}"]):
            caps = spec.get("capabilities") or []
            if all(req in caps for req in (required_caps or [])):
                return p, spec

    # Generate from basic template
    tpl_path = os.path.join(root, "templates", "agents", "basic.yml")
    if os.path.exists(tpl_path):
        template = _load_yaml(tpl_path)
    else:
        template = {
            "version": "v0",
            "agent_id": f"auto_{intent_id}",
            "model": "gpt-4o-mini",
            "temperature": 0.2,
            "capabilities": ["plan", "tools"],
            "tools_scopes": [],
            "allow_network": False,
            "allow_write": False,
        }
    template["agent_id"] = f"auto_{intent_id}"

    out_dir = os.path.join(agents_root, f"auto_{intent_id}")
    _ensure_dir(out_dir)
    out_path = os.path.join(out_dir, "agent.yml")
    _dump_yaml(template, out_path)
    return out_path, template
