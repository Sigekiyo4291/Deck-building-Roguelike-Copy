---
name: Card Implementation Skill
description: カードの実装に特化した詳細な実装パターンとベストプラクティス集。
---

# Card Implementation Skill

このスキルは、新しいカードを実装する際のデザインパターン、コードスニペット、および注意点をまとめたものです。現在はTypeScriptへの移行が完了しており、各カードは `src/core/cards/` 配下のカテゴリ別ファイルに定義されます。

## 1. 基本的なカード定義

ファイル例: `src/core/cards/ironclad/attack.ts` などのエクスポートオブジェクトに追加します。
TypeScriptの `CardInitParams` シグネチャを使用し、1つの引数オブジェクトとして渡します。

```typescript
import { Card } from '../../card-class';

export const myNewCards = {
    MY_CARD: new Card({
        id: 'my_card',          // ID (スネークケース、ファイル内でユニーク)
        name: 'カード名',        // 表示名
        cost: 1,                // コスト (数値 または 'X')
        type: 'attack',         // type: attack, skill, power, curse, status
        rarity: 'common',       // rarity: basic, common, uncommon, rare, curse
        description: '説明文。',  // 説明
        effect: (s, t, e) => {  // effect: (source, target, engine) => { ... }
            // 効果の実装
            t.takeDamage(s.calculateDamage(6), s);
        },
        targetType: 'single',   // targetType: single, all, self, random
        baseDamage: 6,          // ダメージ計算等に使うベース値（オプショナル）
        // 強化(Upgrade)後のデータ
        upgradeData: {
            description: '強化後の説明文。',
            baseDamage: 9,
            effect: (s, t, e) => { t.takeDamage(s.calculateDamage(9), s); }
        }
    })
};
```

## 2. 実装パターン集

### 2.1 動的コスト (Dynamic Cost)
「血には血を」のように、特定の条件でコストが変化する場合。引数オブジェクト内に定義します。

```typescript
// 戦闘中にHPを失った回数分コスト減少（最小0）
costCalculator: (s) => Math.max(0, 3 - (s.hpLossCount || 0))
```

### 2.2 自傷ダメージ (Self Damage)
ブロック（Block）を無視して直接HPを減らす場合（例：ヘモキネシス）。`Entity.loseHP(amount)` を使用します。

```typescript
effect: (s, t) => {
    s.loseHP(2); // ブロック無視ダメージ & hpLossCount加算
    t.takeDamage(s.calculateDamage(15), s);
}
```

### 2.3 手札の廃棄 (Exhaust Hand)
「鬼火」や「霊魂切断」のように、手札にあるカードを廃棄する場合。
**重要**: 現在のエンジンでは、プレイされたカード自体は手札から取り除かれた上で `effect` が呼ばれます。残りの手札を操作する際は、自身が含まれていないことを前提とします。

```typescript
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

```typescript
effect: (s, t) => {
    t.takeDamage(s.calculateDamage(10), s);
    if (t.isDead()) {
        s.increaseMaxHp(3); // 最大HP増加
    }
}
```

### 2.5 状態異常・呪いの生成
「焼身」や「無謀なる突進」のように、状態異常カードを生成してデッキ/捨て札に混ぜる場合。
`CardLibrary` から元となるカードを取得し `clone()` して追加します。

```typescript
import { CardLibrary } from '../../card'; // Libraryから取得

// ...
effect: (s, t, e) => {
    // 捨て札(discard)に「火傷」を追加
    e.player.discard.push(CardLibrary.BURN.clone());
    
    // UIを更新（デッキ枚数など）
    if (e.uiUpdateCallback) e.uiUpdateCallback();
}
```

### 2.6 全体攻撃と回復 (Reaper)
「死神」のように、与えた実ダメージ量に応じて回復する場合。
`targetType: 'all'` を指定すると、エンジン側で生存している各敵に対して `effect` を個別に呼び出すため（`card-class.ts`の仕様）、個別の実ダメージ量をローカル変数などで累積することはできません。特殊な実装（`engine.enemies` を直接ループするなど）が必要です。

```typescript
targetType: 'self', // エンジンの自動ループを避ける
effect: (s, t, e) => {
    let totalHeal = 0;
    // 生存している敵全てに対して処理
    e.enemies.forEach(enemy => {
        if (!enemy.isDead()) {
            const damage = enemy.takeDamage(s.calculateDamage(4), s);
            totalHeal += damage; // 実際に与えたHPダメージを合算
        }
    });
    s.heal(totalHeal);
}
```

## 3. エンジンの仕様と注意点

### 3.1 カードプレイのサイクル
1. **コスト支払い**: `engine.player.energy` が減少。
2. **手札から削除**: `engine.player.hand` から該当カードが削除される。
3. **効果発動**: `card.play()` が実行され、`effect` が実行される。
4. **移動**: 
   - `isExhaust: true` や状態異常カードの破棄等 → `player.exhaust` へ
   - プレイ後の通常の使用済みカード → `player.discard` へ

### 3.2 ターン終了処理
`BattleEngine.endTurn` にて、手札に残ったカード（火傷、虚無など）の自動処理や、エセリアル（Ethereal）の廃棄処理が行われます。
カード自体に `onEndTurnInHand` ハンドラを実装して処理させることも可能です。

## 4. UI/UX
- **UI更新**: 非同期処理やデッキ操作を行った後は、`e.uiUpdateCallback()` を呼び出して画面を更新してください。
- **ステータス**: 新しいバフ/デバフを追加したら、`src/core/entity.ts` の `BUFF_TYPES` 等の定数に追加し、`src/main.ts` の `STATUS_INFO` にアイコンと説明を登録してください。
