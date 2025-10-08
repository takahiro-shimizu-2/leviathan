from __future__ import annotations

import os
from typing import Optional


def project_root(start: Optional[str] = None) -> str:
    """Locate repo root by walking up until we find known markers.

    Markers: 'bin/agi' and 'intents' directory.
    Fallback: two levels up from this file.
    """
    here = start or os.path.dirname(__file__)
    cur = os.path.abspath(here)
    for _ in range(6):
        bin_agi = os.path.join(cur, "bin", "agi")
        intents = os.path.join(cur, "intents")
        if os.path.exists(bin_agi) and os.path.isdir(intents):
            return cur
        nxt = os.path.abspath(os.path.join(cur, os.pardir))
        if nxt == cur:
            break
        cur = nxt
    # Fallback
    return os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir, os.pardir))

