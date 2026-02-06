---
description: 新しいカードを実装するための詳細なステップバイステップガイド。
---

# 新規カード実装ワークフロー

新しいカードをゲームに追加する際は、このワークフローに従ってください。

## 1. カードの仕様調査
// turbo
`browser_subagent` を使用して、実装するカードの正確な数値をWikiで確認します。
- コスト、タイプ、レアリティ
- 基本ダメージ/ブロック値
- 特殊効果の詳細
- **強化後（Upgrade）の変化**（コスト減少、数値上昇など）

## 2. 実装パターンの確認
実装するカードが特殊な効果（廃棄、自傷、状態異常生成など）を持つ場合、`Card Implementation Skill` を参照して適切なパターンを確認します。

```bash
view_file c:\Users\somey\Programs\Web\slay-the-spire-like\.agent\skills\card-implementation\SKILL.md
```

## 3. カード定義の追加
`src/core/card.js` の `CardLibrary` オブジェクトに新しいカードを追加します。
- IDは全大文字のスネークケース（例: `SEVER_SOUL`）を推奨。
- `upgradeData` を必ず定義し、強化後の挙動を含めます。

## 4. 必要なエンジン/エンティティ修正
カードの効果が既存のメソッドで表現できない場合（例：最大HP増加、特殊なターン終了処理）、以下を修正します。
- `src/core/entity.js`: `Entity` または `Player` クラスへのメソッド追加
- `src/core/engine.js`: `BattleEngine` のターン処理やカードプレイ処理の変更

## 5. UI/リソースの更新（必要な場合）
- 新しいステータス効果がある場合: `src/main.js` の `STATUS_INFO` に追加
- 特殊なアセットが必要な場合: 適宜追加

## 6. 動作確認
実装したカードが意図通りに動作するか確認します。
- 通常使用時の動作
- 強化後の動作
- エッジケース（対象がいない、手札が満杯など）での挙動
