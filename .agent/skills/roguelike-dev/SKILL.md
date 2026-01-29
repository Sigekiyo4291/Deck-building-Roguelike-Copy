---
name: Roguelike Development Skill
description: カードゲームやローグライク特有の要素（カード、レリック、イベント、状態異常）の実装を円滑にするためのガイド。
---

# Roguelike Development Skill

このスキルは、ゲームコンテンツの追加や既存メカニクスの拡張を行う際の手順を定めたものです。

## 1. 新規カードの追加
`src/core/card.js` の `CardLibrary` に新しいエントリを追加します。

```javascript
MY_CARD: new Card(
    'my_card',          // ID
    'カード名',          // 名前
    1,                  // コスト
    'attack',           // 種類 (attack, skill, power)
    'common',           // レアリティ (basic, common, uncommon, rare)
    '10ダメージを与える', // 説明
    (s, t) => {         // 効果
        t.takeDamage(s.calculateDamage(10), s);
    },
    'single',           // 対象 (single, all, self, random)
    false,              // 初期強化フラグ
    {                   // upgradeData (強化後の性能)
        description: '15ダメージを与える',
        effect: (s, t) => { t.takeDamage(s.calculateDamage(15), s); }
    }
)
```

## 2. 新規ステータス（バフ・デバフ）の実装
1.  `src/core/entity.js` の `takeDamage` や `calculateDamage` で効果を判定するロジックを追加。
2.  `src/core/engine.js` の `startPlayerTurn` や `endTurn` で毎ターンの処理（毒ダメージ、筋力アップ等）を追加。

## 3. ショップ・報酬の制御
- アイテム（カードやレリック）を購入した際は、`sold-out` クラスをラッパー要素に付与し、その買い物中のみ再購入不可にする。
- ゴールドが足りない場合のバリデーションを忘れない。

## 4. 特殊ノード（イベント）の実装
1.  `index.html` にシーン用のコンテナを追加。
2.  `SceneManager` に表示メソッドを追加。
3.  `main.js` でイベントの選択肢と結果のロジックを作成。
    - 選択肢は `buttons` を動的に生成して制御する。

## 5. 調査と検証
- カード性能などのデータは、ブラウザサブエージェントを使用して Wiki 等の信頼できるソースから取得することを推奨する。
- UIの変更後は、必ずブラウザで実際の画面遷移（特に「戻る」際の影響）を確認する。
