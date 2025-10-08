from __future__ import annotations

from typing import Dict, Any


def needs_approval(task_yaml: Dict[str, Any], agent_yaml: Dict[str, Any], dry_run: bool) -> bool:
    if dry_run:
        return False
    safety = (task_yaml or {}).get("safety") or {}
    allowed_ops = safety.get("allowed_ops") or []
    if any(op in allowed_ops for op in ("write", "network")):
        return True
    if (agent_yaml or {}).get("allow_network") or (agent_yaml or {}).get("allow_write"):
        return True
    return False


def ask_approval(skip: bool) -> bool:
    if skip:
        return True
    try:
        ans = input("Potentially risky operation. Proceed? [y/N]: ").strip().lower()
        return ans in ("y", "yes")
    except EOFError:
        return False

