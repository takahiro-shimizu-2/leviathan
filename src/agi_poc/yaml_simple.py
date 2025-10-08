from __future__ import annotations

from typing import Any


def dump(obj: Any, indent: int = 0) -> str:
    """Very small YAML dumper for a limited subset used in templates.

    Supports dict, list, str, int, float, bool.
    Strings are emitted as plain scalars; if they contain spaces or
    non-ASCII characters, we still emit as plain for our repo usage.
    """
    sp = " " * indent
    if isinstance(obj, dict):
        lines = []
        for k, v in obj.items():
            if isinstance(v, (dict, list)):
                lines.append(f"{sp}{k}:")
                lines.append(dump(v, indent + 2))
            else:
                lines.append(f"{sp}{k}: {scalar(v)}")
        return "\n".join(lines)
    elif isinstance(obj, list):
        lines = []
        for it in obj:
            if isinstance(it, (dict, list)):
                lines.append(f"{sp}-")
                # For dict under list, indent under the dash
                lines.append(dump(it, indent + 2))
            else:
                lines.append(f"{sp}- {scalar(it)}")
        return "\n".join(lines)
    else:
        return f"{sp}{scalar(obj)}"


def scalar(v: Any) -> str:
    if isinstance(v, bool):
        return "true" if v else "false"
    if v is None:
        return "null"
    return str(v)

