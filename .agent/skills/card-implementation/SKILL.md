---
name: Card Implementation Skill
description: カードの実装に特化した詳細な実装パターンとベストプラクティス集。
---

# Card Implementation Skill

このスキルは、新しいカードを実装する際のデザインパターン、コードスニペット、および注意点をまとめたものです。

## 1. 基本的なカード定義

`src/core/card.js` の `CardLibrary` に追加します。

```javascript
MY_CARD: new Card(
    'my_card',          // ID (ユニーク)
    'カード名',          // 表示名
    1,                  // コスト (数値 または 'X')
    'attack',           // type: attack, skill, power, curse, status
    'common',           // rarity: basic, common, uncommon, rare, curse
    '説明文。',          // 説明
    (s, t, e) => {      // effect: (source, target, engine) => { ... }
        // 効果の実装
    },
    'single',           // targetType: single, all, self, random
    false,              // 初期強化フラグ (基本false)
    {                   // upgradeData
        description: '強化後の説明文。',
        effect: (s, t, e) => { /* 強化後の効果 */ }
    }
)
```

## 2. 実装パターン集

### 2.1 動的コスト (Dynamic Cost)
「血には血を」のように、特定の条件でコストが変化する場合。

```javascript
// 戦闘中にHPを失った回数分コスト減少（最小0）
costCalculator: (s) => Math.max(0, 3 - (s.hpLossCount || 0))
```

### 2.2 自傷ダメージ (Self Damage)
ブロック（Block）を無視して直接HPを減らす場合（例：ヘモキネシス）。`Entity.loseHP(amount)` を使用します。

```javascript
effect: (s, t) => {
    s.loseHP(2); // ブロック無視ダメージ & hpLossCount加算
    t.takeDamage(s.calculateDamage(15), s);
}
```

### 2.3 手札の廃棄 (Exhaust Hand)
「鬼火」や「霊魂切断」のように、手札にあるカードを廃棄する場合。
**重要**: `BattleEngine.playCard` は、カードの `effect` 実行前に、そのプレイされたカードを手札から削除します。
したがって、`effect` 内で `s.hand` を操作する際は、自身が含まれていないことを前提にロジックを組みます。

```javascript
effect: (s, t, e) => {
    // 自身は既に手札にない。残りの手札を全て廃棄する。
    const count = s.hand.length;
    s.hand.forEach(c => s.exhaust.push(c));
    s.hand.length = 0; // 配列を空にする

    // 廃棄数に応じた処理
    if (t) {
        for (let i = 0; i < count; i++) {
            t.takeDamage(s.calculateDamage(7), s);
        }
    }
}
```

### 2.4 撃破時効果 (On Kill Effect)
「捕食」のように、敵を倒したトリガーが必要な場合。
`t.takeDamage` の直後に `t.isDead()` を確認します。

```javascript
effect: (s, t) => {
    t.takeDamage(s.calculateDamage(10), s);
    if (t.isDead()) {
        s.increaseMaxHp(3); // 最大HP増加
    }
}
```

### 2.5 状態異常・呪いの生成
「焼身」や「無謀なる突進」のように、カードを生成してデッキ/捨て札に混ぜる場合。
`CardLibrary` から元となるカードを `clone()` して追加します。

```javascript
effect: (s, t, e) => {
    // 捨て札(discard)に「火傷」を追加
    e.player.discard.push(CardLibrary.BURN.clone());
    
    // UIを更新（デッキ枚数など）
    if (e.uiUpdateCallback) e.uiUpdateCallback();
}
```

### 2.6 全体攻撃と回復 (Reaper)
「死神」のように、与えた実ダメージ量に応じて回復する場合。
`takeDamage` は「実際に与えたダメージ量（ブロック減算後、HP減少分）」を返します。

```javascript
// targetType: 'all' の場合、個別に処理が必要ならループで回すか、engine側で処理される仕様を確認
// 現状のエンジン仕様では targetType: 'all' でも effect は1回しか呼ばれない（ターゲットはnullになる可能性が高い）
// そのため、engine.enemies を参照してループ処理を行うのが確実
effect: (s, t, e) => {
    let totalHeal = 0;
    // 生存している敵全てに対して処理
    e.enemies.forEach(enemy => {
        if (!enemy.isDead()) {
            const damage = enemy.takeDamage(s.calculateDamage(4), s);
            totalHeal += damage;
        }
    });
    s.heal(totalHeal);
}
```

## 3. エンジンの仕様と注意点

### 3.1 カードプレイのサイクル
1. **コスト支払い**: `engine.player.energy` が減少。
2. **手札から削除**: `engine.player.hand` から該当カードが削除される（indexずれに注意）。
3. **効果発動**: `card.play()` が実行される。
4. **移動**: 
   - `isExhaust: true` → `player.exhaust` へ
   - それ以外 → `player.discard` へ

### 3.2 ターン終了処理
`BattleEngine.endTurn` にて、手札に残ったカード（火傷、虚無など）の自動処理や、エセリアル（Ethereal）の廃棄処理が行われます。
新しい「ターン終了時効果」を持つカード/状態異常を追加する場合は、ここを修正する必要があります。

## 4. UI/UX
- **UI更新**: 非同期処理やデッキ操作を行った後は、`e.uiUpdateCallback()` を呼び出して画面を更新してください。
- **ステータス**: 新しいバフ/デバフを追加したら、`src/main.js` の `STATUS_INFO` にアイコンと説明を登録してください。
