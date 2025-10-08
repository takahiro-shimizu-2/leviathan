from __future__ import annotations


def detect_intent(user_text: str) -> str:
    """Very simple intent detection.

    - If text hints at spec creation, return "create_spec_document" to match existing intent.
    - Else return a generic intent id.
    """
    text = (user_text or "").lower()
    # Demo-oriented cues
    demo_cues = ["デモ", "プロトタイプ", "モック", "mock", "prototype", "ui", "画面", "試作"]
    if any(c in user_text for c in demo_cues):
        return "create_demo_app"
    cues = ["仕様", "spec", "要件", "要約のための仕様", "設計"]
    if any(c in user_text for c in cues) or "create spec" in text:
        return "create_spec_document"
    return "generic_task"
