"""AGI PoC helper package.

This package provides a minimal, self-contained flow for:
- intent detection
- YAML/Agent registry (find or generate)
- simple approval gate
- execution runner (bridged to existing bin/agent_cli)

It is designed to coexist with the current repo layout
(`intents/`, `agents/`, `blueprints/`, `bin/`).
"""

from .util import project_root  # re-export for convenience

