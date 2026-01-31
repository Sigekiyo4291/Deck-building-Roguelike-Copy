---
description: 状態異常（バフ・デバフ）の新規実装手順
---

新しいステータス（バフ・デバフ）を実装する際の標準的な手順です。

## 1. ステータスIDと表示名の定義
内部で使用するID（例: `poison`）と、UIで表示するアイコン（絵文字等）を決定します。

## 2. UI表示への反映
## 2. UI表示への反映
`src/main.js` の `updateStatusUI(entity, containerId)` メソッドに、新しいIDに対応するアイコンを追加します。

また、**`src/main.js` ファイル上部にある `STATUS_INFO` 定数にも、そのステータスの日本語名と説明文を必ず追加してください。** これを追加しないと、戦闘画面でツールチップ（説明文）が表示されず、ユーザーが効果を理解できません。

```javascript
// src/main.js

const STATUS_INFO = {
    // ...
    new_status: { name: '新ステータス', desc: 'このステータスの効果説明文。' },
};

// ...

updateStatusUI(entity, containerId) {
    // ...
    if (status.type === 'new_status') iconChar = '✨';
    // ...
}
```

## 3. ロジックの実装
ステータスの効果に応じて、以下のいずれか（または複数）のファイルを修正します。

### A. ダメージ・ブロック計算に関わる場合
`src/core/entity.js` を修正します。

- **与ダメージ増減**: `calculateDamage(baseDamage)`
- **被ダメージ増減**: `takeDamage(amount, source)`
- **ブロック獲得量増減**: `addBlock(amount)`

### B. ターン開始・終了時に効果がある場合
`src/core/engine.js` を修正します。

- **プレイヤーのターン開始時**: `BattleEngine.startPlayerTurn()`
- **プレイヤーのターン終了時**: `BattleEngine.endTurn()`
- **敵のターン時**: `BattleEngine.enemyTurn()`

## 4. 持続時間の更新ロジック
毎ターン効果が減少するデバフなどの場合、`src/core/entity.js` の `updateStatus()` メソッドにIDを追加します。

```javascript
// src/core/entity.js
updateStatus() {
    if (['vulnerable', 'weak', 'frail', 'poison'].includes(s.type)) {
        if (s.value > 0) s.value--;
    }
}
```

## 5. カードまたは敵への実装
作成したステータスを付与するカードを `src/core/card.js` の `CardLibrary` に追加するか、`src/core/entity.js` の敵クラスの行動に追加します。

```javascript
// 付与の例
target.addStatus('poison', 3);
```
