import { Potion } from './potion';

export const PotionLibrary = {
    // Common Potions
    BLOOD_POTION: new class extends Potion {
        constructor() {
            super('blood_potion', 'ブラッドポーション', '最大HPの20%を回復する。', 'common', 'none', false);
        }
        onUse(player: any) {
            const amount = Math.floor(player.maxHp * 0.2 * this.getMultiplier(player));
            player.heal(amount);
            console.log(`${this.name}を使用: ${amount}回復`);
        }
    },
    BLOCK_POTION: new class extends Potion {
        constructor() {
            super('block_potion', 'ブロックポーション', 'ブロック12を得る。', 'common', 'none', true);
        }
        onUse(player: any, target: any, engine: any) {
            const amount = 12 * this.getMultiplier(player);
            player.addBlock(amount);
            if (engine) engine.showEffectForPlayer('block');
        }
    },
    FIRE_POTION: new class extends Potion {
        constructor() {
            super('fire_potion', '火炎ポーション', 'ダメージ20を与える。', 'common', 'single', true);
        }
        async onUse(player: any, target: any, engine: any) {
            if (!target) return;
            const damage = 20 * this.getMultiplier(player);
            // Engineのヘルパーを使用してエフェクト付きダメージ
            if (engine) {
                await engine.attackWithEffect(player, target, damage);
            } else {
                target.takeDamage(damage, player);
            }
        }
    },
    STRENGTH_POTION: new class extends Potion {
        constructor() {
            super('strength_potion', '筋力ポーション', '筋力2を得る。', 'common', 'none', true);
        }
        onUse(player: any) {
            const amount = 2 * this.getMultiplier(player);
            player.addStatus('strength', amount);
        }
    },
    SPEED_POTION: new class extends Potion {
        constructor() {
            super('speed_potion', 'スピードポーション', '敏捷性5を得る。ターン終了時、敏捷性5を失う。', 'common', 'none', true);
        }
        onUse(player: any) {
            const amount = 5 * this.getMultiplier(player);
            player.addStatus('dexterity', amount);
            // ターン終了時に失うためのデバフ（frailではない独自処理が必要になる可能性があるが、
            // 既存のflexと同様の logic を使うなら 'dexterity_down' などを追加する必要がある）
            // 現状のupdateStatusに 'strength_down' しかないため、汎用的な仕組みが必要。
            // 簡易的にステータスを追加
            player.addStatus('dexterity_down', amount);
        }
    },
    STEROID_POTION: new class extends Potion {
        constructor() {
            super('steroid_potion', 'ステロイドポーション', '筋力5を得る。ターン終了時、筋力5を失う。', 'common', 'none', true);
        }
        onUse(player: any) {
            const amount = 5 * this.getMultiplier(player);
            player.addStatus('strength', amount);
            player.addStatus('strength_down', amount);
        }
    },
    SWIFT_POTION: new class extends Potion {
        constructor() {
            super('swift_potion', '加速ポーション', 'カードを3枚引く。', 'common', 'none', true);
        }
        onUse(player: any, target: any, engine: any) {
            if (engine) {
                const amount = 3 * this.getMultiplier(player);
                engine.drawCards(amount);
            }
        }
    }
};

// ユーティリティ: ランダムなポーションを取得
export function getRandomPotion(rarityRoll?: number): Potion {
    const roll = rarityRoll ?? Math.random() * 100;
    let rarity: 'common' | 'uncommon' | 'rare' = 'common';

    if (roll < 10) rarity = 'rare';
    else if (roll < 35) rarity = 'uncommon'; // 10 + 25
    else rarity = 'common';

    const allPotions = Object.values(PotionLibrary);
    const eligible = allPotions.filter(p => p.rarity === rarity);

    // まだ全種類実装していないので、なければコモンから探す
    const targetList = eligible.length > 0 ? eligible : allPotions.filter(p => p.rarity === 'common');
    const template = targetList[Math.floor(Math.random() * targetList.length)];
    return template.clone();
}
