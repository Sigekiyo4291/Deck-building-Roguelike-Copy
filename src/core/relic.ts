export class Relic {
    id: string;
    name: string;
    description: string;
    rarity: string;

    constructor(id, name, description, rarity) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.rarity = rarity; // 'starter', 'common', 'uncommon', 'rare', 'boss'
    }

    // フックメソッド（デフォルトは何もしない）
    onObtain(owner) { }
    onBattleStart(owner, engine) { }
    onTurnStart(owner, engine) { }
    onPlayerTurnStart(owner, engine) { }
    onTurnEnd(owner, engine) { }
    onVictory(owner, engine) { }
    onCardPlay(owner, engine, card) { }
    onTakeDamage(owner, engine, amount) { }
    onHPRecovery(owner, engine, amount) { }
    onShuffle(owner, engine) { }
    onCardDraw(owner, engine, card) { }
    onCardExhaust(owner, engine, card) { }
}

export const RelicLibrary = {
    // Starter
    BURNING_BLOOD: new class extends Relic {
        constructor() { super('burning_blood', 'バーニングブラッド', '戦闘終了時、HPを6回復する。', 'starter'); }
        onVictory(owner, engine) {
            owner.heal(6);
        }
    },

    // Common
    VAJRA: new class extends Relic {
        constructor() { super('vajra', '金剛杵', '戦闘開始時、筋力を1得る。', 'common'); }
        onBattleStart(owner, engine) {
            owner.addStatus('strength', 1);
        }
    },
    ANCHOR: new class extends Relic {
        constructor() { super('anchor', 'アンカー', '1ターン目の開始時、10ブロックを得る。', 'common'); }
        onBattleStart(owner, engine) {
            owner.addBlock(10);
        }
    },
    LANTERN: new class extends Relic {
        constructor() { super('lantern', 'ランタン', '1ターン目の開始時、エナジーを1得る。', 'common'); }
        onPlayerTurnStart(owner, engine) {
            if (engine.turn === 1) {
                owner.energy += 1;
            }
        }
    },
    BAG_OF_PREPARATION: new class extends Relic {
        constructor() { super('bag_of_preparation', '準備バッグ', '1ターン目の開始時、カードを2枚追加で引く。', 'common'); }
        onBattleStart(owner, engine) {
            // Engineの初期ドロー(5枚)の後に引く処理が必要だが、
            // onBattleStartは初期ドロー前か後か？
            // Engineの実装によるが、startPlayerTurnでdrawCards(5)しているので、
            // ここでフラグを立てるか、Engine側でレリックチェックするか。
            // 簡易的に「戦闘開始時にドロー」を呼び出す（startPlayerTurnの後ならOK）
            // Hooksの呼び出し位置による。
            // 今回は onPlayerTurnStart で turn === 1 の時に drawCards(2) するのが確実。
        }
        onPlayerTurnStart(owner, engine) {
            if (engine.turn === 1) {
                engine.drawCards(2);
            }
        }
    },
    BLOOD_VIAL: new class extends Relic {
        constructor() { super('blood_vial', '血の小瓶', '戦闘開始時、HPを2回復する。', 'common'); }
        onBattleStart(owner, engine) {
            owner.heal(2);
        }
    },
    STRAWBERRY: new class extends Relic {
        constructor() { super('strawberry', 'イチゴ', '拾った時、最大HP+7を得る。', 'common'); }
        onObtain(owner) {
            owner.maxHp += 7;
            owner.heal(7);
        }
    },
    OLD_COIN: new class extends Relic {
        constructor() { super('old_coin', '古のコイン', '拾った時、300ゴールドを得る。', 'rare'); }
        onObtain(owner) {
            owner.gold += 300;
        }
    },
    BRONZE_SCALES: new class extends Relic {
        constructor() { super('bronze_scales', '銅の鱗', '戦闘開始時、トゲ3を得る。', 'common'); }
        onBattleStart(owner, engine) {
            owner.addStatus('thorns', 3);
        }
    },
    ODDLY_SMOOTH_STONE: new class extends Relic {
        constructor() { super('oddly_smooth_stone', 'すべすべ石', '戦闘開始時、敏捷性1を得る。', 'common'); }
        onBattleStart(owner, engine) {
            owner.addStatus('dexterity', 1);
        }
    },
    ORICHALCUM: new class extends Relic {
        constructor() { super('orichalcum', 'オリハルコン', 'ターン終了時、ブロックが0なら6ブロックを得る。', 'common'); }
        onTurnEnd(owner, engine) {
            // プレイヤーのターン終了時
            if (owner.block === 0) {
                owner.addBlock(6);
            }
        }
    },
    // Potion Related
    POTION_BELT: new class extends Relic {
        constructor() { super('potion_belt', 'ポーションベルト', '拾った時、ポーションスロットを2つ得る。', 'common'); }
        onObtain(owner) {
            owner.potionSlots += 2;
            owner.potions.push(null, null);
        }
    },
    SACRED_BARK: new class extends Relic {
        constructor() { super('sacred_bark', '聖樹皮', 'ポーションの効果が2倍になる。', 'boss'); }
    },
    SOZU: new class extends Relic {
        constructor() { super('sozu', 'ししおどし', '毎ターンエナジーを1得る。ポーションを入手できなくなる。', 'boss'); }
        onPlayerTurnStart(owner) {
            owner.energy += 1;
        }
    },
    VELVET_CHOKER: new class extends Relic {
        constructor() { super('velvet_choker', 'ベルベットのチョーカー', '毎ターンエナジーを1得る。1ターンに6枚より多くのカードを使えない。', 'boss'); }
        onPlayerTurnStart(owner) {
            owner.energy += 1;
        }
        // カード使用制限はBattleEngine側でチェックする必要がある
    },
    CURSED_KEY: new class extends Relic {
        constructor() { super('cursed_key', '呪いの鍵', '毎ターンエナジーを1得る。宝箱を開けるたびに呪いを得る。', 'boss'); }
        onPlayerTurnStart(owner) {
            owner.energy += 1;
        }
    },
    SLAVERS_COLLAR: new class extends Relic {
        constructor() { super('slavers_collar', 'スレイヴの首輪', 'エリート、またはボスとの戦闘中、毎ターンエナジーを1得る。', 'boss'); }
        onPlayerTurnStart(owner, engine) {
            if (engine.isElite || engine.isBoss) {
                owner.energy += 1;
            }
        }
    }
};
