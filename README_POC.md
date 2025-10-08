# AGI PoC Helper

このディレクトリ構成は PoC 用の最小フローを提供します。既存の `bin/agi` / `bin/agent_cli` と共存し、必要に応じてこちらの CLI も試せます。

- 入力 → インテント検出
- YAML 検索/生成（`intents/` を利用、無ければ `templates/yaml/basic.yml` から生成）
- Agent 選定/生成（`agents/` を利用、無ければ `templates/agents/basic.yml` から生成）
- 危険操作の簡易承認ゲート
- 実行（既存の `bin/agent_cli` を呼び出し）
- 成果物と定義を `runs/{run_id}/` に保存

## 使い方

- 実行: `python -m agi_poc.cli run "こうしてほしい" [--dry-run] [--timeout 60] [--budget 2000] [--yes] [--strategy simple|ranked|cascade]`
- Dry-run: 実行計画のみ表示

### LangStackオーケストレーション（PoCアダプタ）
- 実行(シミュレート): `python bin/langstack run --input "仕様書を作って" --simulate`
- 実行(実際にSPEC.md生成): `python bin/langstack run --input "仕様書を作って" --yes`
  - `registry/manifest_langstack.yaml` の `execution_orchestrator` を代表して `create_spec_document` を実行します。
  - 成果: `runs/{run_id}/SPEC.md` と `runs/{run_id}/langstack.txt` に各ステップのログを保存。

## 生成/参照先
- インテント: `intents/{intent_id}.yml`（未存在ならテンプレから生成）
- エージェント: `agents/auto_{intent_id}/agent.yml`（適合が無ければ生成）
- Run成果: `runs/{timestamp-id}/`

## ルーティング（PoC）
- `--strategy simple`（既定）: 最初に条件を満たすエージェントを選択
- `--strategy ranked`: 候補をスコア（capabilities一致＋intent_id近接）で順位付けし、最良を実行
- `--strategy cascade`: スコア順に順次実行し、成功判定で停止（簡易評価器を内蔵）

候補例:
- `agents/spec_writer/agent.yml`（通常スタイル）
- `agents/spec_writer_alt/agent.yml`（簡潔スタイル; `bin/agent_cli --style alt`）

## 注意
- テンプレは YAML 1.2 互換の JSON 表記です。外部依存無しで読み書きできるようにしています。
- スキーマ検証は `src/agi_poc/schemas.py` の軽量チェックです。
- インテント検出は極めて単純です（`src/agi_poc/intent.py`）。
