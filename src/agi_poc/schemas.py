from __future__ import annotations

from typing import Dict, Any, Tuple, List


def _missing_keys(d: Dict[str, Any], keys: List[str]) -> List[str]:
    return [k for k in keys if k not in d]


def validate_task_yaml(spec: Dict[str, Any]) -> Tuple[bool, str]:
    """Very lightweight schema check for intent YAML.

    Required keys (v0): intent_id, inputs, outputs, timeout_s, safety
    """
    if not isinstance(spec, dict):
        return False, "spec is not a dict"
    required = ["intent_id", "inputs", "outputs", "timeout_s", "safety"]
    missing = _missing_keys(spec, required)
    if missing:
        return False, f"missing keys: {', '.join(missing)}"
    if not isinstance(spec.get("inputs"), list):
        return False, "inputs must be a list"
    if not isinstance(spec.get("outputs"), list):
        return False, "outputs must be a list"
    if not isinstance(spec.get("timeout_s"), int):
        return False, "timeout_s must be int"
    if not isinstance(spec.get("safety"), dict):
        return False, "safety must be dict"
    return True, "ok"


def validate_agent_yaml(spec: Dict[str, Any]) -> Tuple[bool, str]:
    """Very lightweight schema check for agent YAML.

    Required keys (v0): agent_id, model, temperature, capabilities,
    allow_network, allow_write
    """
    if not isinstance(spec, dict):
        return False, "spec is not a dict"
    required = [
        "agent_id",
        "model",
        "temperature",
        "capabilities",
        "allow_network",
        "allow_write",
    ]
    missing = _missing_keys(spec, required)
    if missing:
        return False, f"missing keys: {', '.join(missing)}"
    if not isinstance(spec.get("capabilities"), list):
        return False, "capabilities must be list"
    return True, "ok"


def normalize_task_yaml(spec: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize various intent formats to minimal v0 keys used by PoC.

    - Map constraints.max_time_sec -> timeout_s if missing
    - Ensure safety.allowed_ops exists
    - Ensure outputs exists
    """
    out = dict(spec)
    if "timeout_s" not in out:
        c = out.get("constraints") or {}
        mt = c.get("max_time_sec")
        if isinstance(mt, int):
            out["timeout_s"] = mt
        else:
            out["timeout_s"] = 60
    if "safety" not in out or not isinstance(out.get("safety"), dict):
        out["safety"] = {"allowed_ops": []}
    if "outputs" not in out or not isinstance(out.get("outputs"), list) or not out["outputs"]:
        out["outputs"] = [{"path": "runs/{run_id}/output.txt"}]
    if "intent_id" not in out and "id" in out:
        out["intent_id"] = out["id"]
    return out


def normalize_agent_yaml(spec: Dict[str, Any]) -> Dict[str, Any]:
    out = dict(spec)
    if "model" not in out:
        out["model"] = "gpt-4o-mini"
    if "temperature" not in out:
        out["temperature"] = 0.2
    if "allow_network" not in out:
        out["allow_network"] = False
    if "allow_write" not in out:
        out["allow_write"] = False
    if "capabilities" not in out:
        caps = out.get("capabilities") or out.get("supported_tools") or []
        out["capabilities"] = caps if isinstance(caps, list) else []
    if "agent_id" not in out and "id" in out:
        out["agent_id"] = out["id"]
    return out
