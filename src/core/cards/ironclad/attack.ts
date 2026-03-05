import { Card } from '../../card-class';
import { CardLibrary } from '../../card';
import { IEntity, IPlayer, IBattleEngine } from '../../types';

export const ironcladAttackCards = {
    IRON_WAVE: new Card({
        id: 'iron_wave',
        name: 'アイアンウェーブ',
        cost: 1,
        type: 'attack',
        rarity: 'common',
        description: '5ダメージを与え、5ブロックを得る',
        effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            if (!t) return;
            await e.dealDamageWithEffect(s, t, s.calculateDamage(9));
            s.addBlock(5);
        },
        targetType: 'single',
        upgradeData: {
            description: '7ダメージを与え、7ブロックを得る',
            baseDamage: 7,
            baseBlock: 7,
            effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                if (!t) return;
                await e.dealDamageWithEffect(s, t, s.calculateDamage(9));
                s.addBlock(7);
            }
        },
        baseDamage: 5,
        baseBlock: 5,
        image: 'assets/images/cards/IronWave.png'
    }),
    CLEAVE: new Card({
        id: 'cleave',
        name: 'なぎ払い',
        cost: 1,
        type: 'attack',
        rarity: 'common',
        description: '全体に8ダメージを与える',
        effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            if (!t) return;
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(8));
            } else {
                t?.takeDamage(s.calculateDamage(8), s);
            }
        },
        targetType: 'all',
        upgradeData: {
            description: '全体に11ダメージを与える',
            baseDamage: 11,
            effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                if (!t) return;
                if (e && e.dealDamageWithEffect) {
                    await e.dealDamageWithEffect(s, t, s.calculateDamage(11));
                } else {
                    t?.takeDamage(s.calculateDamage(11), s);
                }
            }
        },
        baseDamage: 8,
        image: 'assets/images/cards/Cleave.png'
    }),
    CLASH: new Card({
        id: 'clash',
        name: 'クラッシュ',
        cost: 0,
        type: 'attack',
        rarity: 'common',
        description: '14ダメージを与える。手札が全てアタック時のみ使用可能。',
        effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            if (!t) return;
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(14));
            } else {
                t?.takeDamage(s.calculateDamage(14), s);
            }
        },
        targetType: 'single',
        upgradeData: {
            description: '18ダメージを与える。',
            baseDamage: 18,
            effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                if (!t) return;
                if (e && e.dealDamageWithEffect) {
                    await e.dealDamageWithEffect(s, t, s.calculateDamage(18));
                } else {
                    t?.takeDamage(s.calculateDamage(18), s);
                }
            }
        },
        canPlayCheck: (s: IEntity, e: IBattleEngine) => {
            const player = s as IPlayer;
            return player.hand.every(c => c.type === 'attack');
        },
        baseDamage: 14,
        image: 'assets/images/cards/Clash.png'
    }),
    THUNDERCLAP: new Card({
        id: 'thunderclap',
        name: 'サンダークラップ',
        cost: 1,
        type: 'attack',
        rarity: 'common',
        description: '全体に4ダメージを与え、脆弱(1)を付与。',
        effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            if (!t) return;
            await e.dealDamageWithEffect(s, t, s.calculateDamage(4));
            t?.addStatus('vulnerable', 1, s);
        },
        targetType: 'all',
        upgradeData: {
            description: '全体に7ダメージを与え、脆弱(1)を付与。',
            baseDamage: 7,
            effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                if (!t) return;
                await e.dealDamageWithEffect(s, t, s.calculateDamage(7));
                t?.addStatus('vulnerable', 1, s);
            }
        },
        baseDamage: 4,
        image: 'assets/images/cards/Thunderclap.png'
    }),
    SWORD_BOOMERANG: new Card({
        id: 'sword_boomerang',
        name: 'ソードブーメラン',
        cost: 1,
        type: 'attack',
        rarity: 'common',
        description: '3ダメージを3回与える(対象ランダム)',
        effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            if (!t) return;
            const count = (s as any).isUpgraded ? 4 : 3;
            const damage = s.calculateDamage(3);
            for (let i = 0; i < count; i++) {
                await e.attackRandomEnemy(damage);
            }
        },
        targetType: 'random',
        upgradeData: {
            description: '3ダメージを4回与える(対象ランダム)',
            baseDamage: 3,
            effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                if (!t) return;
                if (e && e.attackRandomEnemy) {
                    const damage = s.calculateDamage(3);
                    for (let i = 0; i < 4; i++) {
                        await e.attackRandomEnemy(damage);
                    }
                } else {
                    const damage = s.calculateDamage(3);
                    for (let i = 0; i < 4; i++) t?.takeDamage(damage, s);
                }
            }
        },
        baseDamage: 3,
        image: 'assets/images/cards/SwordBoomerang.png'
    }),
    ANGER: new Card({
        id: 'anger',
        name: '怒り',
        cost: 0,
        type: 'attack',
        rarity: 'common',
        description: '6ダメージ。自身の正確な複製を捨て札に1枚加える。',
        effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine, c: any) => {
            if (!t) return;
            await e.dealDamageWithEffect(s, t, s.calculateDamage(6));
            const player = s as IPlayer;
            player.discard.push(c.clone());
            e.uiUpdateCallback?.();
        },
        targetType: 'single',
        upgradeData: {
            description: '8ダメージ。自身の正確な複製を捨て札に1枚加える。',
            baseDamage: 8,
            effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine, c: any) => {
                if (!t) return;
                if (e && e.dealDamageWithEffect) {
                    await e.dealDamageWithEffect(s, t, s.calculateDamage(8));
                } else {
                    t?.takeDamage(s.calculateDamage(8), s);
                }
                if (e) {
                    e.player.discard.push(c.clone());
                    if (e.uiUpdateCallback) e.uiUpdateCallback?.();
                }
            }
        },
        baseDamage: 6
    }),
    PERFECT_STRIKE: new Card({
        id: 'perfect_strike',
        name: 'パーフェクトストライク',
        cost: 2,
        type: 'attack',
        rarity: 'common',
        description: '6ダメージ。デッキ内の「ストライク」1枚につき+2ダメージ。',
        effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            if (!t) return;
            if (!e) return;
            const allCards = [...e.player.deck, ...e.player.hand, ...e.player.discard];
            const count = allCards.filter(c => c.name.includes('ストライク') || c.baseName.includes('ストライク')).length;
            await e.dealDamageWithEffect(s, t, s.calculateDamage(6 + count * 2));
            e.uiUpdateCallback?.();
        },
        targetType: 'single',
        upgradeData: {
            description: '6ダメージ。デッキ内の「ストライク」1枚につき+3ダメージ。',
            damageCalculator: (s: any, e: any) => {
                if (!e) return 6;
                const allCards = [...e.player.deck, ...e.player.hand, ...e.player.discard];
                const count = allCards.filter(c => c.name.includes('ストライク') || c.baseName.includes('ストライク')).length;
                return 6 + count * 3;
            },
            effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                if (!t) return;
                if (!e) return;
                const player = s as IPlayer;
                const allCards = [...player.deck, ...player.hand, ...player.discard];
                const count = allCards.filter(c => c.name.includes('ストライク') || (c as any).baseName?.includes('ストライク')).length;
                await e.dealDamageWithEffect(s, t, s.calculateDamage(6 + count * 3));
                e.uiUpdateCallback?.();
            }
        },
        baseDamage: 6,
        damageCalculator: (s: IEntity, e: IBattleEngine | undefined) => {
            if (!e) return 6;
            const player = s as IPlayer;
            const allCards = [...player.deck, ...player.hand, ...player.discard];
            const count = allCards.filter(c => c.name.includes('ストライク') || (c as any).baseName?.includes('ストライク')).length;
            return 6 + count * 2;
        },
        image: 'assets/images/cards/PerfectStrike.png'
    }),
    DROPKICK: new Card({
        id: 'dropkick',
        name: 'ドロップキック',
        cost: 1,
        type: 'attack',
        rarity: 'uncommon',
        description: '5ダメージ。敵が脆弱なら1エナジー+1ドロー。',
        effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            if (!t) return;
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(5));
            } else {
                t?.takeDamage(s.calculateDamage(5), s);
            }
            if (t?.hasStatus('vulnerable') && e) {
                e.player.energy = Math.min(e.player.maxEnergy, e.player.energy + 1);
                e.drawCards(1);
                if (e.uiUpdateCallback) e.uiUpdateCallback?.();
            }
        },
        targetType: 'single',
        upgradeData: {
            description: '8ダメージ。敵が脆弱なら1エナジー+1ドロー。',
            baseDamage: 8,
            effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                if (!t) return;
                await e.dealDamageWithEffect(s, t, s.calculateDamage(8));
                if (t?.hasStatus('vulnerable')) {
                    const player = s as IPlayer;
                    player.energy = Math.min(player.maxEnergy, player.energy + 1);
                    e.drawCards(1);
                    e.uiUpdateCallback?.();
                }
            }
        },
        baseDamage: 5
    }),
    HEMOKINESIS: new Card({
        id: 'hemokinesis',
        name: 'ヘモキネシス',
        cost: 1,
        type: 'attack',
        rarity: 'uncommon',
        description: '15ダメージ。HPを2失う。',
        effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            if (!t) return;
            s.loseHP(2);
            await e.dealDamageWithEffect(s, t, s.calculateDamage(15));
            e.uiUpdateCallback?.();
        },
        targetType: 'single',
        upgradeData: {
            description: '20ダメージ。HPを2失う。',
            baseDamage: 20,
            effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                if (!t) return;
                s.loseHP(2);
                await e.dealDamageWithEffect(s, t, s.calculateDamage(20));
                e.uiUpdateCallback?.();
            }
        },
        baseDamage: 15
    }),
    RAMPAGE: new Card({
        id: 'rampage',
        name: 'ランページ',
        cost: 1,
        type: 'attack',
        rarity: 'uncommon',
        description: '8ダメージ。使うたびにこのカードのダメージが5増加する。',
        effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine, c: any) => {
            if (!t) return;
            if (!e) return;
            const damage = c.getFinalDamage(s, t, e);
            await e.dealDamageWithEffect(s, t, damage);
            c.miscValue += 5;
            e.uiUpdateCallback?.();
        },
        targetType: 'single',
        upgradeData: {
            description: '8ダメージ。使うたびにこのカードのダメージが8増加する。',
            baseDamage: 8,
            effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine, c: any) => {
                if (!t) return;
                if (!e) return;
                const damage = c.getFinalDamage(s, t, e);
                await e.dealDamageWithEffect(s, t, damage);
                c.miscValue += 8;
                e.uiUpdateCallback?.();
            }
        },
        baseDamage: 8
    }),
    BLOOD_FOR_BLOOD: new Card({
        id: 'blood_for_blood',
        name: '血には血を',
        cost: 4,
        type: 'attack',
        rarity: 'uncommon',
        description: 'コストは戦闘中にダメージを受けた回数分減少する。18ダメージを与える。',
        effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            if (!t) return;
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(18));
            } else {
                t?.takeDamage(s.calculateDamage(18), s);
            }
        },
        targetType: 'single',
        upgradeData: {
            cost: 3,
            description: 'コストは戦闘中にダメージを受けた回数分減少する。22ダメージを与える。',
            baseDamage: 22,
            costCalculator: (s: any, t?: any, e?: any) => Math.max(0, 3 - (s.hpLossCount || 0)),
            effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                if (!t) return;
                await e.dealDamageWithEffect(s, t, s.calculateDamage(22));
            }
        },
        baseDamage: 18,
        costCalculator: (s: any, t?: any, e?: any) => Math.max(0, 4 - (s.hpLossCount || 0))
    }),
    SEVER_SOUL: new Card({
        id: 'sever_soul',
        name: '霊魂切断',
        cost: 2,
        type: 'attack',
        rarity: 'uncommon',
        description: '16ダメージ。アタック以外の手札を全廃棄。',
        effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            if (!t) return;
            const player = s as IPlayer;
            // アタック以外のカードを特定して廃棄
            const nonAttacks = player.hand.filter(c => c.type !== 'attack');
            nonAttacks.forEach(c => player.exhaustCard(c, e));
            // 手札からアタック以外を削除
            player.hand = player.hand.filter(c => c.type === 'attack');

            // ダメージ
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(16));
            } else {
                t?.takeDamage(s.calculateDamage(16), s);
            }
            if (e && e.uiUpdateCallback) e.uiUpdateCallback?.();
        },
        targetType: 'single',
        upgradeData: {
            description: '22ダメージ。アタック以外の手札を全廃棄。',
            baseDamage: 22,
            effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                if (!t) return;
                const player = s as IPlayer;
                const nonAttacks = player.hand.filter(c => c.type !== 'attack');
                nonAttacks.forEach(c => player.exhaustCard(c, e));
                player.hand = player.hand.filter(c => c.type === 'attack');
                await e.dealDamageWithEffect(s, t, s.calculateDamage(22));
                e.uiUpdateCallback?.();
            }
        },
        baseDamage: 16
    }),
    FEED: new Card({
        id: 'feed',
        name: '捕食',
        cost: 1,
        type: 'attack',
        rarity: 'rare',
        description: '10ダメージ。これで敵を倒すと最大HPが+3される。廃棄。',
        effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            if (!t) return;
            if (t) {
                if (e && e.dealDamageWithEffect) {
                    await e.dealDamageWithEffect(s, t, s.calculateDamage(10));
                } else {
                    t?.takeDamage(s.calculateDamage(10), s);
                }
                if (t.isDead()) {
                    (s as IPlayer).increaseMaxHp(3);
                    if (e && e.uiUpdateCallback) e.uiUpdateCallback?.();
                }
            }
        },
        targetType: 'single',
        upgradeData: {
            description: '12ダメージ。これで敵を倒すと最大HPが+4される。廃棄。',
            baseDamage: 12,
            effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                if (!t) return;
                if (t) {
                    await e.dealDamageWithEffect(s, t, s.calculateDamage(12));
                    if (t.isDead()) {
                        (s as IPlayer).increaseMaxHp(4);
                        e.uiUpdateCallback?.();
                    }
                }
            }
        },
        baseDamage: 10,
        isExhaust: true
    }),
    REAPER: new Card({
        id: 'reaper',
        name: '死神',
        cost: 2,
        type: 'attack',
        rarity: 'rare',
        description: '全体に4ダメージ。与えたダメージの合計分回復する。廃棄。',
        effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            if (!t) return; // Added null guard for t
            // 生存している全ての敵に効果を適用
            let totalActualDamage = 0;
            for (const enemy of e.enemies) {
                if (!enemy.isDead()) {
                    const targetElement = document.querySelectorAll('.entity.enemy')[e.enemies.indexOf(enemy as any)];
                    if (e.effectManager && targetElement) {
                        await e.effectManager.showAttackEffectAsync(targetElement, 'slash');
                    }
                    totalActualDamage += enemy.takeDamage(s.calculateDamage(4), s, e);
                }
            }
            s.heal(totalActualDamage);
            e.uiUpdateCallback?.();
        },
        targetType: 'all',
        upgradeData: {
            description: '全体に5ダメージ。与えたダメージの合計分回復する。廃棄。',
            baseDamage: 5,
            effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                let actualDamage = 0;
                const targetElement = document.querySelectorAll('.entity.enemy')[t ? e.enemies.indexOf(t as any) : -1];
                if (e.effectManager && targetElement) {
                    await e.effectManager.showAttackEffectAsync(targetElement, 'slash');
                }
                actualDamage = t?.takeDamage(s.calculateDamage(5), s, e) || 0;
                s.heal(actualDamage);
                e.uiUpdateCallback?.();
            }
        },
        baseDamage: 4,
        isExhaust: true
    }),
    IMMOLATE: new Card({
        id: 'immolate',
        name: '焼身',
        cost: 2,
        type: 'attack',
        rarity: 'rare',
        description: '全体に21ダメージ。捨て札に火傷を1枚加える。',
        effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            if (!t) return; // Added null guard for t
            if (t) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(21));
            }
            const player = s as IPlayer;
            player.discard.push(CardLibrary.BURN.clone());
            e.uiUpdateCallback?.();
        },
        targetType: 'all',
        upgradeData: {
            description: '全体に28ダメージ。捨て札に火傷を1枚加える。',
            baseDamage: 28,
            effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                if (!t) return;
                await e.dealDamageWithEffect(s, t!, s.calculateDamage(28));
                const player = s as IPlayer;
                player.discard.push(CardLibrary.BURN.clone());
                e.uiUpdateCallback?.();
            }
        },
        baseDamage: 21
    }),
    FIEND_FIRE: new Card({
        id: 'fiend_fire',
        name: '鬼火',
        cost: 2,
        type: 'attack',
        rarity: 'rare',
        description: '手札を全て廃棄し、1枚につき7ダメージを与える。廃棄。',
        effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            if (!t) return; // Added null guard for t
            const player = s as IPlayer;
            const count = player.hand.length;
            player.hand.forEach(c => player.exhaustCard(c, e));
            player.hand.length = 0; // 手札を空にする
            if (t) {
                const targetIndex = t ? e.enemies.indexOf(t as any) : -1;
                for (let i = 0; i < count; i++) {
                    await e.attackWithEffect(s, t, s.calculateDamage(7), targetIndex);
                }
            }
            e.uiUpdateCallback?.();
        },
        targetType: 'single',
        upgradeData: {
            description: '手札を全て廃棄し、1枚につき10ダメージを与える。廃棄。',
            baseDamage: 10,
            effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                const player = s as IPlayer;
                const count = player.hand.length;
                player.hand.forEach(c => player.exhaustCard(c, e));
                player.hand.length = 0; // 手札を空にする
                if (t) {
                    const targetIndex = t ? e.enemies.indexOf(t as any) : -1;
                    for (let i = 0; i < count; i++) {
                        await e.attackWithEffect(s, t, s.calculateDamage(10), targetIndex);
                    }
                }
                e.uiUpdateCallback?.();
            }
        },
        baseDamage: 7,
        isExhaust: true
    }),
    CARNAGE: new Card({
        id: 'carnage',
        name: '大虐殺',
        cost: 2,
        type: 'attack',
        rarity: 'uncommon',
        description: 'エセリアル。20ダメージを与える。',
        effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            if (!t) return; // Added null guard for t
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(20));
            } else {
                t?.takeDamage(s.calculateDamage(20), s);
            }
        },
        targetType: 'single',
        upgradeData: {
            description: 'エセリアル。28ダメージを与える。',
            baseDamage: 28,
            effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                await e.dealDamageWithEffect(s, t!, s.calculateDamage(28));
            }
        },
        baseDamage: 20,
        isEthereal: true
    }),
    FLASH_OF_STEEL: new Card({
        id: 'flash_of_steel',
        name: '閃光の一撃',
        cost: 0,
        type: 'attack',
        rarity: 'common',
        description: '3ダメージを与え、カードを1枚引く。',
        effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            if (!t) return;
            await e.dealDamageWithEffect(s, t, s.calculateDamage(3));
            e.drawCards(1);
            e.uiUpdateCallback?.();
        },
        targetType: 'single',
        upgradeData: {
            description: '6ダメージを与え、カードを1枚引く。',
            baseDamage: 6,
            effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                if (!t) return;
                await e.dealDamageWithEffect(s, t, s.calculateDamage(6));
                e.drawCards(1);
                e.uiUpdateCallback?.();
            }
        },
        baseDamage: 3,
        image: 'assets/images/cards/FlashOfSteel.png'
    }),
    PUMMEL: new Card({
        id: 'pummel',
        name: '猛撃',
        cost: 1,
        type: 'attack',
        rarity: 'uncommon',
        description: '2ダメージを4回与える。廃棄。',
        effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            if (!t) return; // Added null guard for t
            const targetIndex = t ? e.enemies.indexOf(t as any) : -1;
            for (let i = 0; i < 4; i++) {
                await e.attackWithEffect(s, t, s.calculateDamage(2), targetIndex);
            }
        },
        targetType: 'single',
        upgradeData: {
            description: '2ダメージを5回与える。廃棄。',
            effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                const targetIndex = t ? e.enemies.indexOf(t as any) : -1;
                for (let i = 0; i < 5; i++) {
                    await e.attackWithEffect(s, t!, s.calculateDamage(2), targetIndex);
                }
            }
        },
        baseDamage: 2,
        isExhaust: true
    }),
    WHIRLWIND: new Card({
        id: 'whirlwind',
        name: '旋風刃',
        cost: 'X',
        type: 'attack',
        rarity: 'uncommon',
        description: 'コストX。敵全体に5ダメージをX回与える。',
        effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine, c: any, x: number) => {
            if (!t) return; // Added null guard for t
            if (e && e.attackWithEffect) {
                const targetIndex = t ? e.enemies.indexOf(t as any) : -1;
                for (let i = 0; i < x; i++) {
                    await e.attackWithEffect(s, t, s.calculateDamage(5), targetIndex);
                }
            } else {
                for (let i = 0; i < x; i++) {
                    t?.takeDamage(s.calculateDamage(5), s);
                }
            }
        },
        targetType: 'all',
        upgradeData: {
            description: 'コストX。敵全体に8ダメージをX回与える。',
            baseDamage: 8,
            effect: async (s: IEntity, t: IEntity, e: IBattleEngine, c: any, x: number) => {
                const targetIndex = t ? e.enemies.indexOf(t as any) : -1;
                for (let i = 0; i < x; i++) {
                    await e.attackWithEffect(s, t!, s.calculateDamage(8), targetIndex);
                }
            }
        },
        baseDamage: 5
    }),
    RECKLESS_CHARGE: new Card({
        id: 'reckless_charge',
        name: '無謀なる突進',
        cost: 0,
        type: 'attack',
        rarity: 'common',
        description: '7ダメージを与える。山札にめまいを1枚加える。',
        effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            if (!t) return; // Added null guard for t
            await e.dealDamageWithEffect(s, t, s.calculateDamage(7));
            const player = s as IPlayer;
            player.deck.push(CardLibrary.DAZED.clone());
            e.shuffle(player.deck);
            e.uiUpdateCallback?.();
        },
        targetType: 'single',
        upgradeData: {
            description: '10ダメージを与える。山札にめまいを1枚加える。',
            baseDamage: 10,
            effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                if (!t) return; // Added null guard for t
                if (e && e.dealDamageWithEffect) {
                    await e.dealDamageWithEffect(s, t, s.calculateDamage(10));
                } else {
                    t?.takeDamage(s.calculateDamage(10), s);
                }
                if (e) {
                    e.player.deck.push(CardLibrary.DAZED.clone());
                    e.shuffle(e.player.deck);
                }
            }
        },
        baseDamage: 7
    }),
    HEADBUTT: new Card({
        id: 'headbutt',
        name: 'ヘッドバット',
        cost: 1,
        type: 'attack',
        rarity: 'common',
        description: '9ダメージを与える。捨て札からカードを1枚選び、山札の一番上に置く。',
        effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            if (!t) return; // Added null guard for t
            await e.dealDamageWithEffect(s, t, s.calculateDamage(9));
            const player = s as IPlayer;
            if (e.onCardSelectionRequest && player.discard.length > 0) {
                e.onCardSelectionRequest('捨て札からカードを選択 (山札の一番上に置く)', player.discard, (card: any, index?: number) => {
                    if (card && index !== undefined) {
                        player.discard.splice(index, 1);
                        player.deck.push(card);
                        e.uiUpdateCallback?.();
                    }
                });
            }
        },
        targetType: 'single',
        upgradeData: {
            description: '12ダメージを与える。捨て札からカードを1枚選び、山札の一番上に置く。',
            baseDamage: 12,
            effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                if (!t) return; // Added null guard for t
                await e.dealDamageWithEffect(s, t, s.calculateDamage(12));
                const player = s as IPlayer;
                if (e.onCardSelectionRequest && player.discard.length > 0) {
                    e.onCardSelectionRequest('捨て札からカードを選択 (山札の一番上に置く)', player.discard, (card: any, index?: number) => {
                        if (card && index !== undefined) {
                            player.discard.splice(index, 1);
                            player.deck.push(card);
                            e.uiUpdateCallback?.();
                        }
                    });
                }
            }
        },
        baseDamage: 9
    }),
    TWIN_STRIKE: new Card({
        id: 'twin_strike',
        name: 'ツインストライク',
        cost: 1,
        type: 'attack',
        rarity: 'common',
        description: '5ダメージを2回与える',
        effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            if (!t) return; // Added null guard for t
            const targetIndex = e ? t ? e.enemies.indexOf(t as any) : -1 : 0;
            if (e && e.attackWithEffect) {
                await e.attackWithEffect(s, t, s.calculateDamage(5), targetIndex);
                await e.attackWithEffect(s, t, s.calculateDamage(5), targetIndex);
            } else {
                t?.takeDamage(s.calculateDamage(5), s);
                t?.takeDamage(s.calculateDamage(5), s);
            }
        },
        targetType: 'single',
        upgradeData: {
            description: '7ダメージを2回与える',
            baseDamage: 7,
            effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                if (!t) return; // Added null guard for t
                const targetIndex = e ? t ? e.enemies.indexOf(t as any) : -1 : 0;
                if (e && e.attackWithEffect) {
                    await e.attackWithEffect(s, t, s.calculateDamage(7), targetIndex);
                    await e.attackWithEffect(s, t, s.calculateDamage(7), targetIndex);
                } else {
                    t?.takeDamage(s.calculateDamage(7), s);
                    t?.takeDamage(s.calculateDamage(7), s);
                }
            }
        },
        baseDamage: 5
    }),
    POMMEL_STRIKE: new Card({
        id: 'pommel_strike',
        name: 'ポンメルストライク',
        cost: 1,
        type: 'attack',
        rarity: 'common',
        description: '9ダメージを与え、カードを1枚引く',
        effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            if (!t) return; // Added null guard for t
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(9));
            } else {
                t?.takeDamage(s.calculateDamage(9), s);
            }
            if (e) e.drawCards(1);
        },
        targetType: 'single',
        upgradeData: {
            description: '10ダメージを与え、カードを2枚引く',
            baseDamage: 10,
            effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                if (!t) return; // Added null guard for t
                if (e && e.dealDamageWithEffect) {
                    await e.dealDamageWithEffect(s, t, s.calculateDamage(10));
                } else {
                    t?.takeDamage(s.calculateDamage(10), s);
                }
                if (e) e.drawCards(2);
            }
        },
        baseDamage: 9
    }),
    CLOTHESLINE: new Card({
        id: 'clothesline',
        name: 'ラリアット',
        cost: 2,
        type: 'attack',
        rarity: 'common',
        description: '12ダメージを与え、脱力(2)を付与',
        effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            if (!t) return;
            await e.dealDamageWithEffect(s, t, s.calculateDamage(12));
            t?.addStatus('weak', 2, s);
            e.uiUpdateCallback?.();
        },
        targetType: 'single',
        upgradeData: {
            description: '14ダメージを与え、脱力(3)を付与',
            baseDamage: 14,
            effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                if (!t) return;
                await e.dealDamageWithEffect(s, t, s.calculateDamage(14));
                t?.addStatus('weak', 3, s);
                e.uiUpdateCallback?.();
            }
        },
        baseDamage: 12
    }),
    UPPERCUT: new Card({
        id: 'uppercut',
        name: 'アッパーカット',
        cost: 2,
        type: 'attack',
        rarity: 'uncommon',
        description: '13ダメージを与え、脱力(1)と脆弱(1)を付与',
        effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            if (!t) return;
            await e.dealDamageWithEffect(s, t, s.calculateDamage(13));
            t?.addStatus('weak', 1, s);
            t?.addStatus('vulnerable', 1, s);
            e.uiUpdateCallback?.();
        },
        targetType: 'single',
        upgradeData: {
            description: '13ダメージを与え、脱力(2)と脆弱(2)を付与',
            baseDamage: 13,
            effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                if (!t) return;
                await e.dealDamageWithEffect(s, t, s.calculateDamage(13));
                t?.addStatus('weak', 2, s);
                t?.addStatus('vulnerable', 2, s);
                e.uiUpdateCallback?.();
            }
        },
        baseDamage: 13
    }),
    HEAVY_BLADE: new Card({
        id: 'heavy_blade',
        name: 'ヘヴィブレード',
        cost: 2,
        type: 'attack',
        rarity: 'uncommon',
        description: '14ダメージ。筋力の効果を3倍受ける。',
        effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            if (!t) return;
            const str = (s as any).getStatusValue('strength');
            await e.dealDamageWithEffect(s, t, s.calculateDamage(14 + str * 2));
            e.uiUpdateCallback?.();
        },
        targetType: 'single',
        upgradeData: {
            description: '14ダメージ。筋力の効果を5倍受ける。',
            baseDamage: 14,
            damageCalculator: (s: IEntity, e: IBattleEngine | undefined) => {
                const str = s.getStatusValue ? s.getStatusValue('strength') : (s.statusEffects['strength'] || 0);
                return 14 + str * 4;
            },
            effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                if (!t) return;
                const str = s.getStatusValue ? s.getStatusValue('strength') : (s.statusEffects['strength'] || 0);
                await e.dealDamageWithEffect(s, t, s.calculateDamage(14 + str * 4));
                e.uiUpdateCallback?.();
            }
        },
        baseDamage: 14,
        damageCalculator: (s: IEntity, e: IBattleEngine | undefined) => {
            const str = s.getStatusValue ? s.getStatusValue('strength') : 0;
            return 14 + str * 2;
        },
        image: 'assets/images/cards/HeavyBlade.png'
    }),
    BODY_SLAM: new Card({
        id: 'body_slam',
        name: 'ボディスラム',
        cost: 1,
        type: 'attack',
        rarity: 'uncommon',
        description: '0ダメージを与える。現在のブロック値に等しいダメージを与える。',
        effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            if (!t) return;
            await e.dealDamageWithEffect(s, t, s.calculateDamage(s.block));
            e.uiUpdateCallback?.();
        },
        targetType: 'single',
        upgradeData: {
            cost: 0,
            description: '0ダメージを与える。現在のブロック値に等しいダメージを与える。',
            effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                if (!t) return;
                await e.dealDamageWithEffect(s, t, s.calculateDamage(s.block));
                e.uiUpdateCallback?.();
            },
            damageCalculator: (s: any, e: any) => s.block
        },
        damageCalculator: (s: any, e: any) => s.block,
        image: 'assets/images/cards/BodySlam.png'
    }),
    WILD_STRIKE: new Card({
        id: 'wild_strike',
        name: 'ワイルドストライク',
        cost: 1,
        type: 'attack',
        rarity: 'common',
        description: '12ダメージを与える。山札に「負傷」を1枚混ぜる。',
        effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            if (!t) return;
            await e.dealDamageWithEffect(s, t, s.calculateDamage(12));
            if (e) {
                e.player.deck.push(CardLibrary.WOUND.clone());
                e.shuffle(e.player.deck);
                e.uiUpdateCallback?.();
            }
        },
        targetType: 'single',
        upgradeData: {
            description: '17ダメージを与える。山札に「負傷」を1枚混ぜる。',
            baseDamage: 17,
            effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                if (!t) return;
                await e.dealDamageWithEffect(s, t, s.calculateDamage(17));
                const player = s as IPlayer;
                player.deck.push(CardLibrary.WOUND.clone());
                e.shuffle(player.deck);
                e.uiUpdateCallback?.();
            }
        },
        baseDamage: 12
    }),
    BLUDGEON: new Card({
        id: 'bludgeon',
        name: 'ヘビーストライク',
        cost: 3,
        type: 'attack',
        rarity: 'rare',
        description: '32ダメージを与える',
        effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            if (!t) return;
            await e.dealDamageWithEffect(s, t, s.calculateDamage(32));
            e.uiUpdateCallback?.();
        },
        targetType: 'single',
        upgradeData: {
            description: '42ダメージを与える',
            baseDamage: 42,
            effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                if (!t) return;
                await e.dealDamageWithEffect(s, t, s.calculateDamage(42));
                e.uiUpdateCallback?.();
            }
        },
        baseDamage: 32,
        image: 'assets/images/cards/Bludgeon.png'
    })
};
