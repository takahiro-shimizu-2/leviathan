#!/usr/bin/env python3
# Minimal YAML parser for a constrained subset used in this repo.
# Supports:
# - key: value (scalars: strings, ints, booleans)
# - key: (start of nested mapping)
# - key: [list of scalars] (inline not needed; we use block)
# - key: (newline) then indented list items '- value' or '- key: value' blocks
# - Nested dicts under list items with consistent indentation (2 spaces)

import re

def _parse_scalar(val):
    val = val.strip()
    if len(val) == 0:
        return ""
    if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
        return val[1:-1]
    # int
    if re.fullmatch(r"-?\d+", val):
        try:
            return int(val)
        except Exception:
            pass
    # bool
    if val.lower() in ("true", "false"):
        return val.lower() == "true"
    return val

def load(path):
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.read().splitlines()

    root = {}
    stack = [(0, root)]  # (indent, container)
    idx = 0

    def current_container():
        return stack[-1][1]

    def _peek_next_nonempty(start_idx):
        j = start_idx
        while j < len(lines):
            l = lines[j]
            if not l.strip() or l.lstrip().startswith('#'):
                j += 1
                continue
            n_indent = len(l) - len(l.lstrip(' '))
            n_stripped = l.strip()
            return j, n_indent, n_stripped
        return None, None, None

    while idx < len(lines):
        line = lines[idx]
        idx += 1
        # remove comments and skip blanks
        if not line.strip() or line.lstrip().startswith('#'):
            continue
        indent = len(line) - len(line.lstrip(' '))
        # normalize indent to multiples of 2
        if indent % 2 != 0:
            raise ValueError(f"Invalid indentation (not multiple of 2): {line}")
        while stack and indent < stack[-1][0]:
            stack.pop()
        container = current_container()
        stripped = line.strip()

        # list item: support both '- ' and bare '-'
        if stripped.startswith('-'):
            # list item
            if not isinstance(container, list):
                # Start a new list in the parent; find parent mapping awaiting a list
                raise ValueError(f"List item at unexpected position: {line}")
            # accept '- ' or bare '-'
            rest = stripped[1:]
            if rest.startswith(' '):
                rest = rest[1:]
            if rest == '':
                # empty placeholder, push empty dict
                item = {}
                container.append(item)
                stack.append((indent + 2, item))
                continue
            if ':' in rest:
                # dict inline start: key: value or key:
                key, _, val = rest.partition(':')
                key = key.strip()
                if val.strip() == '':
                    item = {key: {}}
                    container.append(item)
                    stack.append((indent + 2, item[key]))
                else:
                    # Start a dict item; even with an inline key: value, we may have more keys following
                    item = {key: _parse_scalar(val)}
                    container.append(item)
                    # Lookahead: if next non-empty line is further-indented mapping, treat it as continuation of this dict item
                    next_i, n_indent, n_stripped = _peek_next_nonempty(idx)
                    if next_i is not None and n_indent is not None:
                        if n_indent >= indent + 2 and (':' in n_stripped) and (not n_stripped.startswith('- ')):
                            # push the dict container so subsequent key: value lines attach to this item
                            stack.append((indent + 2, item))
                continue
            else:
                container.append(_parse_scalar(rest))
                continue

        # mapping line: key: value or key:
        if ':' in stripped:
            key, _, val = stripped.partition(':')
            key = key.strip()
            val = val  # keep spaces
            if val.strip() == '':
                # start nested structure; decide if next is list or dict based on lookahead
                # default to dict but upgrade to list if next non-empty is a list item
                next_i, n_indent, n_stripped = _peek_next_nonempty(idx)
                if next_i is not None and n_indent is not None and n_indent >= indent + 2 and n_stripped.startswith('-'):
                    new_container = []
                else:
                    new_container = {}
                container[key] = new_container
                stack.append((indent + 2, new_container))
            else:
                # value
                sval = _parse_scalar(val)
                # Special case: if current container is a list and last item is a dict, and we're at list-item indentation,
                # assign into that dict instead of treating list as mapping (which would error).
                if isinstance(container, list) and container and isinstance(container[-1], dict):
                    container[-1][key] = sval
                else:
                    container[key] = sval
            continue

        # if we reach here, it's invalid in our subset
        raise ValueError(f"Unsupported YAML line: {line}")

    # Post-process: convert patterns where lists are represented as list of one-key dicts into list of dicts
    # Our representation already handles that adequately.
    return root
