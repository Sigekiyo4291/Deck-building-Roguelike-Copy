# AGENTS.md - エージェント向けプロジェクトガイド

このプロジェクトは、ブラウザで動作する Slay the Spire ライクなローグライクカードゲームの開発プロジェクトです。

## プロジェクト構造
- **`src/main.js`**: エントリポイント。`Game` クラスが全体の進行（マップ選択、戦闘開始、シーン遷移）を統括します。
- **`src/core/engine.js`**: `BattleEngine` クラス。カードのプレイ、ターン進行、ダメージ計算などの戦闘ロジックを扱います。
- **`src/core/entity.js`**: `Player` と `Enemy` の基底クラス。HP、ブロック、ステータス効果を管理します。
- **`src/core/card.js`**: `Card` クラスと `CardLibrary`。カードの効果と強化（Upgrade）データを定義します。
- **`src/core/relic.js`**: `Relic` クラスと `RelicLibrary`。パッシブ効果を持つ遺物の管理。
- **`src/core/map-generator.js`**: マップの自動生成ロジック。
- **`src/core/scene-manager.js`**: シーン遷移（戦闘、マップ、休憩所、ショップ等）とDOMの描画制御。

## 開発のガイドライン

### 1. デザインとUI (Vanilla CSS & JS)
- **Wow要素**: ユーザーが驚くような美麗なデザイン（グラデーション、アニメーション、ガラスモーフィズム）を優先してください。
- **SceneManager**: 新しいシーンを表示する際は、必ず `hideAllScenes()` を呼び出して、不要なUIが残らないようにしてください。
- **相対座標**: マップのパス描画などは、スクロールの影響を受けないよう `mapWrapper` などの親要素を基点とした相対座標で計算してください。

### 2. カード・メカニクス
- **データ駆動**: カードやレリックのデータは `CardLibrary` や `RelicLibrary` に集約し、ロジック本体（Engine）をシンプルに保ってください。
- **強化 (Upgrade)**: 各カードには Wiki 等に基づいた正確な強化データ（`upgradeData`）を定義してください。

### 3. ステータス管理
- **戦闘リセット**: 戦闘開始時（`BattleEngine.start()`）には、プレイヤーのステータス効果（筋力、悪魔化など）を必ずリセットしてください。

## 推奨スタック
- フロントエンド: Vanilla JS / CSS / HTML
- デザイン支援: Google Fonts (Crimson Text), Font Awesome 等のアイコン
- ツール: `browser_subagent` を使用した Wiki 調査、動作テストの自動化

## 返答時の注意
- 日本語で返答すること。
- コード内のコメントも日本語で記述すること。
- タスク管理は `task.md` を通じて行い、常に進捗を可視化すること。
