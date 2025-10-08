from __future__ import annotations

import json
import os
import re
from typing import Any, Dict, List, Tuple

from yaml_min import load as yaml_load
from .util import project_root


def _root() -> str:
    return project_root(os.path.dirname(__file__))


def _read(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def _resolve_output_path(intent_yaml_path: str | None, run_id: str) -> str:
    # Prefer reading from intent YAML outputs[0].path; fallback to runs/{run_id}/SPEC.md
    root = _root()
    if intent_yaml_path:
        try:
            spec = yaml_load(os.path.join(root, intent_yaml_path))
            outs = (spec or {}).get("outputs") or []
            if outs and isinstance(outs[0], dict):
                rel = outs[0].get("path")
                if isinstance(rel, str) and rel:
                    return os.path.join(root, rel.replace("{run_id}", run_id))
        except Exception:
            pass
    return os.path.join(root, "runs", run_id, "SPEC.md")


def _md_has_section(md: str, title: str) -> bool:
    return (f"## {title}" in md) or (f"### {title}" in md)


def _extract_section(md: str, header: str) -> str:
    idx = md.find(header)
    if idx == -1:
        return ""
    return md[idx:]


def _count_uc_sections(md: str) -> int:
    # Count headings like "### UC-..." as unit of usecases
    return len(re.findall(r"^###\s+UC-", md, flags=re.MULTILINE))


def evaluate_spec_against_criteria(md: str) -> Tuple[bool, List[Dict[str, Any]]]:
    """Evaluate SPEC.md content against hard rules aligned to intents/create_spec_document.yml.

    Returns: (all_passed, details)
    """
    results: List[Dict[str, Any]] = []

    # 1) Section presence
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
    sec_ok = all(_md_has_section(md, s) for s in required_sections)
    results.append({
        "id": "sections",
        "desc": "必須セクションの存在",
        "required": required_sections,
        "passed": bool(sec_ok),
    })

    # 2) API table columns
    api_ok = True
    api_sec = _extract_section(md, "## API 仕様")
    if api_sec:
        api_ok = ("| Method |" in api_sec) and ("| Path |" in api_sec)
    results.append({
        "id": "api_table",
        "desc": "API仕様表にMethod/Path列",
        "passed": bool(api_ok),
    })

    # 3) Data model: >=3 entities and each has >=3 attributes
    dm_ok = True
    dm_sec = _extract_section(md, "## データモデル")
    entity_names: List[str] = []
    entity_blocks: List[str] = []
    if dm_sec:
        # Assume entities as sub-headings or first column values in top table
        # Try sub-headings first: "### <Entity>"
        for m in re.finditer(r"^###\s+(.+)$", dm_sec, flags=re.MULTILINE):
            name = m.group(1).strip()
            # Ignore list/attribute section headers
            if "一覧" in name or "属性" in name:
                continue
            entity_names.append(name)
        if entity_names:
            # Split by these headings to evaluate attribute tables under each
            parts = re.split(r"^###\s+.+$", dm_sec, flags=re.MULTILINE)
            # The first part is before the first heading; drop it
            entity_blocks = parts[1:]
        else:
            # Fallback: treat the whole section as one block; we'll infer entities from the entity list table
            entity_blocks = [dm_sec]

        # Entity count inference: from headings or table rows that look like entity entries
        if not entity_names:
            # Count only rows belonging to the entity list table (header contains 'エンティティ')
            lines = dm_sec.splitlines()
            start_idx = -1
            for i, ln in enumerate(lines):
                if re.search(r"^\s*\|\s*エンティティ\s*\|", ln):
                    start_idx = i
                    break
            count_rows = 0
            if start_idx != -1:
                for ln in lines[start_idx + 1:]:
                    if not ln.strip():
                        break
                    if not ln.lstrip().startswith("|"):
                        break
                    if ("エンティティ" in ln) or ("---" in ln):
                        continue
                    count_rows += 1
            if count_rows >= 3:
                entity_names = [f"Entity{i+1}" for i in range(count_rows)]

        # Attribute table check: for each block, require >=3 data rows under a table with header containing "| 属性 |"
        attr_ok_count = 0
        for blk in entity_blocks:
            if "| 属性 |" in blk:
                rows = [
                    ln for ln in blk.splitlines()
                    if ln.strip().startswith("| ") and ("| 属性 |" not in ln) and ("---" not in ln)
                ]
                if len(rows) >= 3:
                    attr_ok_count += 1
        if not entity_names:
            dm_ok = False
        else:
            # If we detected N entities, require at least min(3, N) attribute tables passing
            required_attr = min(3, len(entity_names))
            dm_ok = (len(entity_names) >= 3) and (attr_ok_count >= required_attr)

    results.append({
        "id": "data_model",
        "desc": "データモデル: 3エンティティ以上かつ各に属性>=3",
        "entities_detected": len(entity_names),
        "passed": bool(dm_ok),
    })

    # 4) Use cases >=3 and contain key flows
    uc_ok = True
    uc_cnt = _count_uc_sections(md)
    flow_ok = ("基本フロー" in md) and ("代替フロー" in md) and ("例外" in md)
    uc_ok = (uc_cnt >= 3) and flow_ok
    results.append({
        "id": "use_cases",
        "desc": "ユースケース>=3 かつ 基本/代替/例外",
        "count": uc_cnt,
        "passed": bool(uc_ok),
    })

    # 5) Acceptance criteria bullets >=3
    ac_ok = True
    ac_sec = _extract_section(md, "## 受入条件")
    bullets = [ln for ln in ac_sec.splitlines() if ln.strip().startswith("-")]
    ac_ok = len(bullets) >= 3
    results.append({
        "id": "acceptance",
        "desc": "受入条件の箇条>=3",
        "count": len(bullets),
        "passed": bool(ac_ok),
    })

    all_passed = all(item.get("passed") for item in results)
    return all_passed, results


def evaluate(intent_yaml_path: str | None, run_id: str) -> Tuple[bool, Dict[str, Any]]:
    root = _root()
    spec_path = _resolve_output_path(intent_yaml_path, run_id)
    exists = os.path.exists(spec_path)
    md = _read(spec_path) if exists else ""

    details: Dict[str, Any] = {
        "intent_yaml": intent_yaml_path,
        "run_id": run_id,
        "spec_path": os.path.relpath(spec_path, root),
        "spec_exists": bool(exists),
        "checks": [],
    }

    if not exists:
        return False, details

    passed, checks = evaluate_spec_against_criteria(md)
    details["checks"] = checks
    details["passed"] = passed
    return passed, details


def write_reports(run_id: str, report: Dict[str, Any]) -> Tuple[str, str]:
    root = _root()
    run_dir = os.path.join(root, "runs", run_id)
    os.makedirs(run_dir, exist_ok=True)
    jpath = os.path.join(run_dir, "acceptance_report.json")
    mpath = os.path.join(run_dir, "acceptance_report.md")

    with open(jpath, "w", encoding="utf-8") as jf:
        json.dump(report, jf, ensure_ascii=False, indent=2)

    # Markdown summary
    lines: List[str] = []
    lines.append(f"# Acceptance Report ({run_id})")
    lines.append("")
    lines.append(f"- spec_path: {report.get('spec_path')}")
    lines.append(f"- spec_exists: {report.get('spec_exists')}")
    lines.append("")
    for chk in report.get("checks", []):
        status = "PASS" if chk.get("passed") else "FAIL"
        desc = chk.get("desc")
        extra = {k: v for k, v in chk.items() if k not in ("id", "desc", "passed")}
        lines.append(f"- [{status}] {desc} {json.dumps(extra, ensure_ascii=False)}")
    with open(mpath, "w", encoding="utf-8") as mf:
        mf.write("\n".join(lines) + "\n")

    return jpath, mpath
