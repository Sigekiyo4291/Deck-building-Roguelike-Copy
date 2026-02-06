export class Card {
    id: string;
    baseName: string;
    name: string;
    cost: number | string;
    costCalculator: any;
    type: string;
    rarity: string;
    description: string;
    effect: any;
    isUpgraded: boolean;
    upgradeData: any;
    targetType: string;
    canPlayCheck: any;
    baseDamage: number;
    damageCalculator: any;
    baseBlock: number;
    blockCalculator: any;
    isEthereal: boolean;
    isExhaust: boolean;
    miscValue: number;
    image: string | null;
    effectType: string;

    constructor(id, name, cost, type, rarity, description, effect, targetType, isUpgraded = false, upgradeData = null, canPlayCheck = null, baseDamage = 0, damageCalculator = null, baseBlock = 0, blockCalculator = null, isEthereal = false, isExhaust = false, costCalculator = null, image = null, effectType = 'slash') {
        this.id = id;
        this.baseName = name;
        this.name = name + (isUpgraded ? '+' : '');
        this.cost = cost;
        this.costCalculator = costCalculator;
        this.type = type; // 'attack', 'skill', 'power'
        this.rarity = rarity; // 'basic', 'common', 'uncommon', 'rare'
        this.description = description;
        this.effect = effect; // 関数: (source, target) => { ... }
        this.isUpgraded = isUpgraded;
        this.upgradeData = upgradeData;

        if (targetType) {
            this.targetType = targetType;
        } else {
            // デフォルト: アタックは単体、その他は自分（または対象指定なし）
            this.targetType = (type === 'attack') ? 'single' : 'self';
        }
        this.canPlayCheck = canPlayCheck;
        this.baseDamage = baseDamage;
        this.damageCalculator = damageCalculator;
        this.baseBlock = baseBlock;
        this.blockCalculator = blockCalculator;
        this.isEthereal = isEthereal;
        this.isExhaust = isExhaust;
        this.miscValue = 0; // 戦闘中などの動的な値を保持するプロパティ（ランページ等で使用）
        this.image = image;
        this.effectType = effectType; // エフェクトタイプ（'slash', 'impact', etc.）
    }

    getCost(source) {
        if (this.costCalculator) {
            return this.costCalculator(source, this);
        }
        return this.cost;
    }

    getDamage(source, engine) {
        let base = this.baseDamage;
        if (this.damageCalculator) {
            base = this.damageCalculator(source, engine, this);
        }
        base += (this.miscValue || 0);

        if (base === 0 && this.type !== 'attack') return 0;
        return source.calculateDamage(base);
    }

    getFinalDamage(source, target, engine) {
        const damage = this.getDamage(source, engine);
        if (target) {
            return target.applyTargetModifiers(damage);
        }
        return damage;
    }

    getBlock(source, engine) {
        let base = this.baseBlock;
        if (this.blockCalculator) {
            base = this.blockCalculator(source, engine);
        }
        if (base === 0) return 0;
        return source.calculateBlock(base);
    }

    canPlay(source, engine) {
        if (this.canPlayCheck) {
            return this.canPlayCheck(source, engine);
        }
        return true;
    }

    upgrade() {
        if (this.isUpgraded || !this.upgradeData) return;

        this.isUpgraded = true;
        this.name = this.baseName + '+';

        if (this.upgradeData.cost !== undefined) this.cost = this.upgradeData.cost;
        if (this.upgradeData.costCalculator) this.costCalculator = this.upgradeData.costCalculator;
        if (this.upgradeData.description) this.description = this.upgradeData.description;
        if (this.upgradeData.effect) this.effect = this.upgradeData.effect;
        if (this.upgradeData.name) this.name = this.upgradeData.name;
        if (this.upgradeData.baseDamage !== undefined) this.baseDamage = this.upgradeData.baseDamage;
        if (this.upgradeData.damageCalculator) this.damageCalculator = this.upgradeData.damageCalculator;
        if (this.upgradeData.baseBlock !== undefined) this.baseBlock = this.upgradeData.baseBlock;
        if (this.upgradeData.blockCalculator) this.blockCalculator = this.upgradeData.blockCalculator;
    }

    async play(source, target, engine) {
        if (this.type === 'curse') return false;

        const currentCost = this.getCost(source);

        let xValue = 0;
        if (currentCost === 'X') {
            xValue = source.energy;
            source.energy = 0;
        } else if (typeof currentCost === 'number' && currentCost >= 0 && source.energy >= currentCost) {
            source.energy -= currentCost;
            xValue = currentCost;
        } else if (typeof currentCost === 'number' && currentCost < 0) {
            // 呪いなど使用不可
            return false;
        } else {
            return false;
        }

        if (this.targetType === 'all' && engine) {
            // 生存している全ての敵に効果を適用
            for (const enemy of engine.enemies) {
                if (!enemy.isDead()) {
                    await this.effect(source, enemy, engine, this, xValue);
                }
            }
        } else {
            await this.effect(source, target, engine, this, xValue);
        }
        return true;
    }

    clone() {
        const c = new Card(
            this.id,
            this.baseName,
            this.cost,
            this.type,
            this.rarity,
            this.description,
            this.effect,
            this.targetType,
            this.isUpgraded,
            this.upgradeData,
            this.canPlayCheck,
            this.baseDamage,
            this.damageCalculator,
            this.baseBlock,
            this.blockCalculator,
            this.isEthereal,
            this.isExhaust,
            this.costCalculator,
            this.image,
            this.effectType
        );
        c.miscValue = this.miscValue;
        return c;
    }
}

// カードライブラリ
export const CardLibrary = {
    // Basic
    STRIKE: new Card('strike', 'ストライク', 1, 'attack', 'basic', '6ダメージを与える', async (s, t, e) => {
        if (e && e.dealDamageWithEffect) {
            await e.dealDamageWithEffect(s, t, s.calculateDamage(6));
        } else {
            t.takeDamage(s.calculateDamage(6), s);
        }
    }, 'single', false, {
        description: '9ダメージを与える',
        baseDamage: 9,
        effect: async (s, t, e) => {
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(9));
            } else {
                t.takeDamage(s.calculateDamage(9), s);
            }
        }
    }, null, 6, null, 0, null, false, false, null, 'assets/images/cards/Strike.png'),
    DEFEND: new Card('defend', 'ディフェンド', 1, 'skill', 'basic', '5ブロックを得る', (s, t) => {
        s.addBlock(5);
    }, 'self', false, {
        description: '8ブロックを得る',
        baseBlock: 8,
        effect: (s, t) => { s.addBlock(8); }
    }, null, 0, null, 5, null, false, false, null, 'assets/images/cards/Defend.png'),
    BASH: new Card('bash', '強打', 2, 'attack', 'basic', '8ダメージを与え、脆弱(2)を付与', async (s, t, e) => {
        if (e && e.dealDamageWithEffect) {
            await e.dealDamageWithEffect(s, t, s.calculateDamage(8));
        } else {
            t.takeDamage(s.calculateDamage(8), s);
        }
        t.addStatus('vulnerable', 2);
    }, 'single', false, {
        description: '10ダメージを与え、脆弱(3)を付与',
        baseDamage: 10,
        effect: async (s, t, e) => {
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(10));
            } else {
                t.takeDamage(s.calculateDamage(10), s);
            }
            t.addStatus('vulnerable', 3);
        }
    }, null, 8, null, 0, null, false, false, null, 'assets/images/cards/Bash.png'),

    // Common
    IRON_WAVE: new Card('iron_wave', 'アイアンウェーブ', 1, 'attack', 'common', '5ダメージを与え、5ブロックを得る', async (s, t, e) => {
        if (e && e.dealDamageWithEffect) {
            await e.dealDamageWithEffect(s, t, s.calculateDamage(5));
        } else {
            t.takeDamage(s.calculateDamage(5), s);
        }
        s.addBlock(5);
    }, 'single', false, {
        description: '7ダメージを与え、7ブロックを得る',
        baseDamage: 7,
        baseBlock: 7,
        effect: async (s, t, e) => {
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(7));
            } else {
                t.takeDamage(s.calculateDamage(7), s);
            }
            s.addBlock(7);
        }
    }, null, 5, null, 5, null, false, false, null, 'assets/images/cards/IronWave.png'),
    CLEAVE: new Card('cleave', 'なぎ払い', 1, 'attack', 'common', '全体に8ダメージを与える', async (s, t, e) => {
        if (e && e.dealDamageWithEffect) {
            await e.dealDamageWithEffect(s, t, s.calculateDamage(8));
        } else {
            t.takeDamage(s.calculateDamage(8), s);
        }
    }, 'all', false, {
        description: '全体に11ダメージを与える',
        baseDamage: 11,
        effect: async (s, t, e) => {
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(11));
            } else {
                t.takeDamage(s.calculateDamage(11), s);
            }
        }
    }, null, 8, null, 0, null, false, false, null, 'assets/images/cards/Cleave.png'),
    CLASH: new Card('clash', 'クラッシュ', 0, 'attack', 'common', '14ダメージを与える。手札が全てアタック時のみ使用可能。', async (s, t, e) => {
        if (e && e.dealDamageWithEffect) {
            await e.dealDamageWithEffect(s, t, s.calculateDamage(14));
        } else {
            t.takeDamage(s.calculateDamage(14), s);
        }
    }, 'single', false, {
        description: '18ダメージを与える。',
        baseDamage: 18,
        effect: async (s, t, e) => {
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(18));
            } else {
                t.takeDamage(s.calculateDamage(18), s);
            }
        }
    }, (s, e) => {
        if (!e) return true;
        return e.player.hand.every(c => c.type === 'attack');
    }, 14, null, 0, null, false, false, null, 'assets/images/cards/Clash.png'),
    THUNDERCLAP: new Card('thunderclap', 'サンダークラップ', 1, 'attack', 'common', '全体に4ダメージを与え、脆弱(1)を付与。', async (s, t, e) => {
        if (e && e.dealDamageWithEffect) {
            await e.dealDamageWithEffect(s, t, s.calculateDamage(4));
        } else {
            t.takeDamage(s.calculateDamage(4), s);
        }
        t.addStatus('vulnerable', 1);
    }, 'all', false, {
        description: '全体に7ダメージを与え、脆弱(1)を付与。',
        baseDamage: 7,
        effect: async (s, t, e) => {
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(7));
            } else {
                t.takeDamage(s.calculateDamage(7), s);
            }
            t.addStatus('vulnerable', 1);
        }
    }, null, 4, null, 0, null, false, false, null, 'assets/images/cards/Thunderclap.png'),
    SWORD_BOOMERANG: new Card('sword_boomerang', 'ソードブーメラン', 1, 'attack', 'common', '3ダメージを3回与える(対象ランダム)', async (s, t, e) => {
        if (e && e.attackWithEffect) {
            for (let i = 0; i < 3; i++) {
                // ランダムな敵を選択
                const aliveEnemies = e.enemies.filter(enemy => !enemy.isDead());
                if (aliveEnemies.length === 0) break;
                const randomTarget = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
                const targetIndex = e.enemies.indexOf(randomTarget);
                await e.attackWithEffect(s, randomTarget, s.calculateDamage(3), targetIndex);
            }
        } else {
            t.takeDamage(s.calculateDamage(3), s);
            t.takeDamage(s.calculateDamage(3), s);
            t.takeDamage(s.calculateDamage(3), s);
        }
    }, 'random', false, {
        description: '3ダメージを4回与える(対象ランダム)',
        baseDamage: 3,
        effect: async (s, t, e) => {
            if (e && e.attackWithEffect) {
                for (let i = 0; i < 4; i++) {
                    const aliveEnemies = e.enemies.filter(enemy => !enemy.isDead());
                    if (aliveEnemies.length === 0) break;
                    const randomTarget = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
                    const targetIndex = e.enemies.indexOf(randomTarget);
                    await e.attackWithEffect(s, randomTarget, s.calculateDamage(3), targetIndex);
                }
            } else {
                for (let i = 0; i < 4; i++) t.takeDamage(s.calculateDamage(3), s);
            }
        }
    }, null, 3, null, 0, null, false, false, null, 'assets/images/cards/SwordBoomerang.png'),
    ANGER: new Card('anger', '怒り', 0, 'attack', 'common', '6ダメージ。自身の正確な複製を捨て札に1枚加える。', async (s, t, e, c) => {
        if (e && e.dealDamageWithEffect) {
            await e.dealDamageWithEffect(s, t, s.calculateDamage(6));
        } else {
            t.takeDamage(s.calculateDamage(6), s);
        }
        if (e) {
            e.player.discard.push(c.clone());
            if (e.uiUpdateCallback) e.uiUpdateCallback();
        }
    }, 'single', false, {
        description: '8ダメージ。自身の正確な複製を捨て札に1枚加える。',
        baseDamage: 8,
        effect: async (s, t, e, c) => {
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(8));
            } else {
                t.takeDamage(s.calculateDamage(8), s);
            }
            if (e) {
                e.player.discard.push(c.clone());
                if (e.uiUpdateCallback) e.uiUpdateCallback();
            }
        }
    }, null, 6),
    PERFECT_STRIKE: new Card('perfect_strike', 'パーフェクトストライク', 2, 'attack', 'common', '6ダメージ。デッキ内の「ストライク」1枚につき+2ダメージ。', async (s, t, e) => {
        if (!e) return;
        const allCards = [...e.player.deck, ...e.player.hand, ...e.player.discard];
        const count = allCards.filter(c => c.name.includes('ストライク') || c.baseName.includes('ストライク')).length;

        if (e.dealDamageWithEffect) {
            await e.dealDamageWithEffect(s, t, s.calculateDamage(6 + count * 2));
        } else {
            t.takeDamage(s.calculateDamage(6 + count * 2), s);
        }
    }, 'single', false, {
        description: '6ダメージ。デッキ内の「ストライク」1枚につき+3ダメージ。',
        damageCalculator: (s, e) => {
            if (!e) return 6;
            const allCards = [...e.player.deck, ...e.player.hand, ...e.player.discard];
            const count = allCards.filter(c => c.name.includes('ストライク') || c.baseName.includes('ストライク')).length;
            return 6 + count * 3;
        },
        effect: async (s, t, e) => {
            if (!e) return;
            const allCards = [...e.player.deck, ...e.player.hand, ...e.player.discard];
            const count = allCards.filter(c => c.name.includes('ストライク') || c.baseName.includes('ストライク')).length;

            if (e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(6 + count * 3));
            } else {
                t.takeDamage(s.calculateDamage(6 + count * 3), s);
            }
        }
    }, null, 6, (s, e) => {
        if (!e) return 6;
        const allCards = [...e.player.deck, ...e.player.hand, ...e.player.discard];
        const count = allCards.filter(c => c.name.includes('ストライク') || c.baseName.includes('ストライク')).length;
        return 6 + count * 2;
    }, 0, null, false, false, null, 'assets/images/cards/PerfectStrike.png'),
    DROPKICK: new Card('dropkick', 'ドロップキック', 1, 'attack', 'uncommon', '5ダメージ。敵が脆弱なら1エナジー+1ドロー。', async (s, t, e) => {
        if (e && e.dealDamageWithEffect) {
            await e.dealDamageWithEffect(s, t, s.calculateDamage(5));
        } else {
            t.takeDamage(s.calculateDamage(5), s);
        }
        if (t.hasStatus('vulnerable') && e) {
            e.player.energy = Math.min(e.player.maxEnergy, e.player.energy + 1);
            e.drawCards(1);
            if (e.uiUpdateCallback) e.uiUpdateCallback();
        }
    }, 'single', false, {
        description: '8ダメージ。敵が脆弱なら1エナジー+1ドロー。',
        baseDamage: 8,
        effect: async (s, t, e) => {
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(8));
            } else {
                t.takeDamage(s.calculateDamage(8), s);
            }
            if (t.hasStatus('vulnerable') && e) {
                e.player.energy = Math.min(e.player.maxEnergy, e.player.energy + 1);
                e.drawCards(1);
                if (e.uiUpdateCallback) e.uiUpdateCallback();
            }
        }
    }, null, 5),
    HEMOKINESIS: new Card('hemokinesis', 'ヘモキネシス', 1, 'attack', 'uncommon', '15ダメージ。HPを2失う。', async (s, t, e) => {
        s.loseHP(2);
        if (e && e.dealDamageWithEffect) {
            await e.dealDamageWithEffect(s, t, s.calculateDamage(15));
        } else {
            t.takeDamage(s.calculateDamage(15), s);
        }
        if (e && e.uiUpdateCallback) e.uiUpdateCallback();
    }, 'single', false, {
        description: '20ダメージ。HPを2失う。',
        baseDamage: 20,
        effect: async (s, t, e) => {
            s.loseHP(2);
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(20));
            } else {
                t.takeDamage(s.calculateDamage(20), s);
            }
            if (e && e.uiUpdateCallback) e.uiUpdateCallback();
        }
    }, null, 15),
    RAMPAGE: new Card('rampage', 'ランページ', 1, 'attack', 'uncommon', '8ダメージ。使うたびにこのカードのダメージが5増加する。', async (s, t, e, c) => {
        const damage = c.getFinalDamage(s, t, e);
        if (e && e.dealDamageWithEffect) {
            await e.dealDamageWithEffect(s, t, damage);
        } else {
            t.takeDamage(damage, s);
        }
        c.miscValue += 5;
        if (e && e.uiUpdateCallback) e.uiUpdateCallback();
    }, 'single', false, {
        description: '8ダメージ。使うたびにこのカード의ダメージが8増加する。',
        baseDamage: 8,
        effect: async (s, t, e, c) => {
            const damage = c.getFinalDamage(s, t, e);
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, damage);
            } else {
                t.takeDamage(damage, s);
            }
            c.miscValue += 8;
            if (e && e.uiUpdateCallback) e.uiUpdateCallback();
        }
    }, null, 8),
    BLOOD_FOR_BLOOD: new Card('blood_for_blood', '血には血を', 4, 'attack', 'uncommon', 'コストは戦闘中にダメージを受けた回数分減少する。18ダメージを与える。', async (s, t, e) => {
        if (e && e.dealDamageWithEffect) {
            await e.dealDamageWithEffect(s, t, s.calculateDamage(18));
        } else {
            t.takeDamage(s.calculateDamage(18), s);
        }
    }, 'single', false, {
        cost: 3,
        description: 'コストは戦闘中にダメージを受けた回数分減少する。22ダメージを与える。',
        baseDamage: 22,
        costCalculator: (s) => Math.max(0, 3 - (s.hpLossCount || 0)),
        effect: async (s, t, e) => {
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(22));
            } else {
                t.takeDamage(s.calculateDamage(22), s);
            }
        }
    }, null, 18, null, 0, null, false, false, (s) => Math.max(0, 4 - (s.hpLossCount || 0))),
    SEVER_SOUL: new Card('sever_soul', '霊魂切断', 2, 'attack', 'uncommon', '16ダメージ。アタック以外の手札を全廃棄。', async (s, t, e) => {
        // アタック以外のカードを特定して廃棄
        const nonAttacks = s.hand.filter(c => c.type !== 'attack');
        nonAttacks.forEach(c => s.exhaust.push(c));
        // 手札からアタック以外を削除
        s.hand = s.hand.filter(c => c.type === 'attack');

        // ダメージ
        if (t) {
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(16));
            } else {
                t.takeDamage(s.calculateDamage(16), s);
            }
        }
        if (e && e.uiUpdateCallback) e.uiUpdateCallback();
    }, 'single', false, {
        description: '22ダメージ。アタック以外の手札を全廃棄。',
        baseDamage: 22,
        effect: async (s, t, e) => {
            const nonAttacks = s.hand.filter(c => c.type !== 'attack');
            nonAttacks.forEach(c => s.exhaust.push(c));
            s.hand = s.hand.filter(c => c.type === 'attack');
            if (t) {
                if (e && e.dealDamageWithEffect) {
                    await e.dealDamageWithEffect(s, t, s.calculateDamage(22));
                } else {
                    t.takeDamage(s.calculateDamage(22), s);
                }
            }
            if (e && e.uiUpdateCallback) e.uiUpdateCallback();
        }
    }, null, 16),
    FEED: new Card('feed', '捕食', 1, 'attack', 'rare', '10ダメージ。これで敵を倒すと最大HPが+3される。廃棄。', async (s, t, e) => {
        if (t) {
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(10));
            } else {
                t.takeDamage(s.calculateDamage(10), s);
            }
            if (t.isDead()) {
                s.increaseMaxHp(3);
                if (e && e.uiUpdateCallback) e.uiUpdateCallback();
            }
        }
    }, 'single', false, {
        description: '12ダメージ。これで敵を倒すと最大HPが+4される。廃棄。',
        baseDamage: 12,
        effect: async (s, t, e) => {
            if (t) {
                if (e && e.dealDamageWithEffect) {
                    await e.dealDamageWithEffect(s, t, s.calculateDamage(12));
                } else {
                    t.takeDamage(s.calculateDamage(12), s);
                }
                if (t.isDead()) {
                    s.increaseMaxHp(4);
                    if (e && e.uiUpdateCallback) e.uiUpdateCallback();
                }
            }
        }
    }, null, 10, null, 0, null, false, true),
    REAPER: new Card('reaper', '死神', 2, 'attack', 'rare', '全体に4ダメージ。与えたダメージの合計分回復する。廃棄。', async (s, t, e) => {
        let actualDamage = 0;
        if (e && e.dealDamageWithEffect) {
            const damageBefore = t.hp; // 簡易的な計算（厳密にはtakeDamageの戻り値が必要だが、dealDamageWithEffectはawaitするので難しい）
            // dealDamageWithEffectの戻り値をtakeDamageの戻り値にするよう修正が必要だが、ここでは簡易的に実装
            await e.dealDamageWithEffect(s, t, s.calculateDamage(4));
            // 本来は damageBefore - t.hp だが、ブロックやオーバーキルを考慮すると takeDamage の戻り値が最適。
            // しかし、非同期化で takeDamage の結果を直接受け取るのが少し手間。
            // ここでは effect 内で計算を行うか、ヘルパーがダメージ値を返すようにする必要があるが、
            // 既存の実装に合わせて HP 差分で計算する（ただしブロックで防がれた場合は回復しない仕様なので注意）
            // 修正: dealDamageWithEffectは内部でtakeDamageを呼ぶが戻り値を返さないので、
            // 厳密な挙動にはヘルパーの修正が必要。しかし、今回は visual effect 重視で、
            // 「ダメージを与えた後のHP減少分」を回復量とする（ブロックで防がれたら回復しない）
            // が、t.hpの変化を見るしかない。
            /*
              しかし、全体攻撃(Card.targetType === 'all')の場合、Card.playでループして呼ばれる。
              この `t` は個々の敵。
            */
            // ここでは takeDamage を直接呼ぶわけではないので、戻り値が得られない。
            // 暫定的に「計算ダメージ」ではなく「実際の減少HP」を見る実装にする。
            // 事前のHPを保存するのは難しい（非同期なので）。
            // ひとまず、標準的な実装として、 takeDamage自体の戻り値（実際に与えたダメージ）を利用したいが、
            // dealDamageWithEffectはvoid。
            // → 一旦、回復効果は「ブロック貫通した分」とするため、少し不正確だがダメージ計算後のHP差分等を
            //   見たいが、ここでは単純に「攻撃後のHP差分」を得にくい。
            //   一旦、Reaperは例外的に takeDamage を直接呼ぶか、あるいはヘルパーを使わない（全体エフェクトはCard.play側で制御されるので）
            //   
            //   Card.playの修正で `targetType === 'all'` の場合、ループして `await this.effect(...)` される。
            //   つまりここで `t` は個々の敵。
            //   Reaperのエフェクトは「全体攻撃」だが、処理は個々。
            //   全敵にエフェクト → 全敵にダメージ、としたいが、Card.playのループだと「敵1エフェクト→敵1ダメージ→敵2エフェクト...」となる。
            //   これは今回の要件（一斉攻撃エフェクト）とは異なるかもしれないが、個別の攻撃エフェクトなら問題ない。
            //   Reaperの回復処理:
            //     `const actualDamage = t.takeDamage(...)`
            //   これを非同期にするなら:
            //     `const actualDamage = await e.dealDamageWithEffectReturnsDamage(...)`
            //   みたいなのが必要。
            //   
            //   今回は reaper については、エフェクトとダメージを「同期」させるために、
            //   takeDamageの戻り値が必要なので、自前で `showAttackEffectAsync` してから `takeDamage` する形にする。
            if (e && e.effectManager) { // エフェクトだけ出す
                const targetElement = document.querySelectorAll('.entity.enemy')[e.enemies.indexOf(t)];
                if (targetElement) await e.effectManager.showAttackEffectAsync(targetElement, 'slash');
            }
            actualDamage = t.takeDamage(s.calculateDamage(4), s);
        } else {
            actualDamage = t.takeDamage(s.calculateDamage(4), s);
        }
        s.heal(actualDamage);
        if (e && e.uiUpdateCallback) e.uiUpdateCallback();
    }, 'all', false, {
        description: '全体に5ダメージ。与えたダメージの合計分回復する。廃棄。',
        baseDamage: 5,
        effect: async (s, t, e) => {
            let actualDamage = 0;
            if (e && e.effectManager) {
                const targetElement = document.querySelectorAll('.entity.enemy')[e.enemies.indexOf(t)];
                if (targetElement) await e.effectManager.showAttackEffectAsync(targetElement, 'slash');
                actualDamage = t.takeDamage(s.calculateDamage(5), s);
            } else {
                actualDamage = t.takeDamage(s.calculateDamage(5), s);
            }
            s.heal(actualDamage);
            if (e && e.uiUpdateCallback) e.uiUpdateCallback();
        }
    }, null, 4, null, 0, null, false, true),
    IMMOLATE: new Card('immolate', '焼身', 2, 'attack', 'rare', '全体に21ダメージ。捨て札に火傷を1枚加える。', async (s, t, e) => {
        if (t) {
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(21));
            } else {
                t.takeDamage(s.calculateDamage(21), s);
            }
        }
        if (e) {
            e.player.discard.push(CardLibrary.BURN.clone());
            if (e.uiUpdateCallback) e.uiUpdateCallback();
        }
    }, 'all', false, {
        description: '全体に28ダメージ。捨て札に火傷を1枚加える。',
        baseDamage: 28,
        effect: async (s, t, e) => {
            if (t) {
                if (e && e.dealDamageWithEffect) {
                    await e.dealDamageWithEffect(s, t, s.calculateDamage(28));
                } else {
                    t.takeDamage(s.calculateDamage(28), s);
                }
            }
            if (e) {
                e.player.discard.push(CardLibrary.BURN.clone());
                if (e.uiUpdateCallback) e.uiUpdateCallback();
            }
        }
    }, null, 21),
    FIEND_FIRE: new Card('fiend_fire', '鬼火', 2, 'attack', 'rare', '手札を全て廃棄し、1枚につき7ダメージを与える。廃棄。', async (s, t, e) => {
        const count = s.hand.length;
        s.hand.forEach(c => s.exhaust.push(c));
        s.hand.length = 0; // 手札を空にする
        if (t) {
            if (e && e.attackWithEffect) {
                const targetIndex = e.enemies.indexOf(t);
                for (let i = 0; i < count; i++) {
                    await e.attackWithEffect(s, t, s.calculateDamage(7), targetIndex);
                }
            } else {
                for (let i = 0; i < count; i++) {
                    t.takeDamage(s.calculateDamage(7), s);
                }
            }
        }
        if (e && e.uiUpdateCallback) e.uiUpdateCallback();
    }, 'single', false, {
        description: '手札を全て廃棄し、1枚につき10ダメージを与える。廃棄。',
        baseDamage: 10,
        effect: async (s, t, e) => {
            const count = s.hand.length;
            s.hand.forEach(c => s.exhaust.push(c));
            s.hand.length = 0; // 手札を空にする
            if (t) {
                if (e && e.attackWithEffect) {
                    const targetIndex = e.enemies.indexOf(t);
                    for (let i = 0; i < count; i++) {
                        await e.attackWithEffect(s, t, s.calculateDamage(10), targetIndex);
                    }
                } else {
                    for (let i = 0; i < count; i++) {
                        t.takeDamage(s.calculateDamage(10), s);
                    }
                }
            }
            if (e && e.uiUpdateCallback) e.uiUpdateCallback();
        }
    }, null, 7, null, 0, null, false, true),
    CARNAGE: new Card('carnage', '大虐殺', 2, 'attack', 'uncommon', 'エセリアル。20ダメージを与える。', async (s, t, e) => {
        if (e && e.dealDamageWithEffect) {
            await e.dealDamageWithEffect(s, t, s.calculateDamage(20));
        } else {
            t.takeDamage(s.calculateDamage(20), s);
        }
    }, 'single', false, {
        description: 'エセリアル。28ダメージを与える。',
        baseDamage: 28,
        effect: async (s, t, e) => {
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(28));
            } else {
                t.takeDamage(s.calculateDamage(28), s);
            }
        }
    }, null, 20, null, 0, null, true),
    PUMMEL: new Card('pummel', '猛撃', 1, 'attack', 'uncommon', '2ダメージを4回与える。廃棄。', async (s, t, e) => {
        const targetIndex = e ? e.enemies.indexOf(t) : 0;
        if (e && e.attackWithEffect) {
            for (let i = 0; i < 4; i++) {
                await e.attackWithEffect(s, t, s.calculateDamage(2), targetIndex);
            }
        } else {
            for (let i = 0; i < 4; i++) {
                t.takeDamage(s.calculateDamage(2), s);
            }
        }
    }, 'single', false, {
        description: '2ダメージを5回与える。廃棄。',
        effect: async (s, t, e) => {
            const targetIndex = e ? e.enemies.indexOf(t) : 0;
            if (e && e.attackWithEffect) {
                for (let i = 0; i < 5; i++) {
                    await e.attackWithEffect(s, t, s.calculateDamage(2), targetIndex);
                }
            } else {
                for (let i = 0; i < 5; i++) {
                    t.takeDamage(s.calculateDamage(2), s);
                }
            }
        }
    }, null, 2, null, 0, null, false, true),
    WHIRLWIND: new Card('whirlwind', '旋風刃', 'X', 'attack', 'uncommon', 'コストX。敵全体に5ダメージをX回与える。', async (s, t, e, c, x) => {
        if (e && e.attackWithEffect) {
            const targetIndex = e.enemies.indexOf(t);
            for (let i = 0; i < x; i++) {
                await e.attackWithEffect(s, t, s.calculateDamage(5), targetIndex);
            }
        } else {
            for (let i = 0; i < x; i++) {
                t.takeDamage(s.calculateDamage(5), s);
            }
        }
    }, 'all', false, {
        description: 'コストX。敵全体に8ダメージをX回与える。',
        baseDamage: 8,
        effect: async (s, t, e, c, x) => {
            if (e && e.attackWithEffect) {
                const targetIndex = e.enemies.indexOf(t);
                for (let i = 0; i < x; i++) {
                    await e.attackWithEffect(s, t, s.calculateDamage(8), targetIndex);
                }
            } else {
                for (let i = 0; i < x; i++) {
                    t.takeDamage(s.calculateDamage(8), s);
                }
            }
        }
    }, null, 5),
    RECKLESS_CHARGE: new Card('reckless_charge', '無謀なる突進', 0, 'attack', 'common', '7ダメージを与える。山札にめまいを1枚加える。', async (s, t, e) => {
        if (e && e.dealDamageWithEffect) {
            await e.dealDamageWithEffect(s, t, s.calculateDamage(7));
        } else {
            t.takeDamage(s.calculateDamage(7), s);
        }
        if (e) {
            e.player.deck.push(CardLibrary.DAZED.clone());
            e.shuffle(e.player.deck);
            if (e.uiUpdateCallback) e.uiUpdateCallback();
        }
    }, 'single', false, {
        description: '10ダメージを与える。山札にめまいを1枚加える。',
        baseDamage: 10,
        effect: async (s, t, e) => {
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(10));
            } else {
                t.takeDamage(s.calculateDamage(10), s);
            }
            if (e) {
                e.player.deck.push(CardLibrary.DAZED.clone());
                e.shuffle(e.player.deck);
            }
        }
    }, null, 7),
    HEADBUTT: new Card('headbutt', 'ヘッドバット', 1, 'attack', 'common', '9ダメージを与える。捨て札からカードを1枚選び、山札の一番上に置く。', async (s, t, e) => {
        if (e && e.dealDamageWithEffect) {
            await e.dealDamageWithEffect(s, t, s.calculateDamage(9));
        } else {
            t.takeDamage(s.calculateDamage(9), s);
        }
        if (e && e.onCardSelectionRequest && e.player.discard.length > 0) {
            e.onCardSelectionRequest('捨て札からカードを選択 (山札の一番上に置く)', e.player.discard, (card, index) => {
                if (card) {
                    e.player.discard.splice(index, 1);
                    e.player.deck.push(card);
                    if (e.uiUpdateCallback) e.uiUpdateCallback();
                }
            });
        }
    }, 'single', false, {
        description: '12ダメージを与える。捨て札からカードを1枚選び、山札の一番上に置く。',
        baseDamage: 12,
        effect: async (s, t, e) => {
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(12));
            } else {
                t.takeDamage(s.calculateDamage(12), s);
            }
            if (e && e.onCardSelectionRequest && e.player.discard.length > 0) {
                e.onCardSelectionRequest('捨て札からカードを選択 (山札の一番上に置く)', e.player.discard, (card, index) => {
                    if (card) {
                        e.player.discard.splice(index, 1);
                        e.player.deck.push(card);
                        if (e.uiUpdateCallback) e.uiUpdateCallback();
                    }
                });
            }
        }
    }, null, 9, null, 0, null, false, false, null, 'assets/images/cards/Headbutt.png'),
    TWIN_STRIKE: new Card('twin_strike', 'ツインストライク', 1, 'attack', 'common', '5ダメージを2回与える', async (s, t, e) => {
        const targetIndex = e ? e.enemies.indexOf(t) : 0;
        if (e && e.attackWithEffect) {
            await e.attackWithEffect(s, t, s.calculateDamage(5), targetIndex);
            await e.attackWithEffect(s, t, s.calculateDamage(5), targetIndex);
        } else {
            t.takeDamage(s.calculateDamage(5), s);
            t.takeDamage(s.calculateDamage(5), s);
        }
    }, 'single', false, {
        description: '7ダメージを2回与える',
        baseDamage: 7,
        effect: async (s, t, e) => {
            const targetIndex = e ? e.enemies.indexOf(t) : 0;
            if (e && e.attackWithEffect) {
                await e.attackWithEffect(s, t, s.calculateDamage(7), targetIndex);
                await e.attackWithEffect(s, t, s.calculateDamage(7), targetIndex);
            } else {
                t.takeDamage(s.calculateDamage(7), s);
                t.takeDamage(s.calculateDamage(7), s);
            }
        }
    }, null, 5, null, 0, null, false, false, null, 'assets/images/cards/TwinStrike.png'),
    POMMEL_STRIKE: new Card('pommel_strike', 'ポンメルストライク', 1, 'attack', 'common', '9ダメージを与え、カードを1枚引く', async (s, t, e) => {
        if (e && e.dealDamageWithEffect) {
            await e.dealDamageWithEffect(s, t, s.calculateDamage(9));
        } else {
            t.takeDamage(s.calculateDamage(9), s);
        }
        if (e) e.drawCards(1);
    }, 'single', false, {
        description: '10ダメージを与え、カードを2枚引く',
        baseDamage: 10,
        effect: async (s, t, e) => {
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(10));
            } else {
                t.takeDamage(s.calculateDamage(10), s);
            }
            if (e) e.drawCards(2);
        }
    }, null, 9, null, 0, null, false, false, null, 'assets/images/cards/PommelStrike.png'),
    SHRUG_IT_OFF: new Card('shrug_it_off', '受け流し', 1, 'skill', 'common', '8ブロックを得て、カードを1枚引く', (s, t, e) => {
        s.addBlock(8);
        if (e) e.drawCards(1);
    }, 'self', false, {
        description: '11ブロックを得て、カードを1枚引く',
        baseBlock: 11,
        effect: (s, t, e) => {
            s.addBlock(11);
            if (e) e.drawCards(1);
        }
    }, null, 0, null, 8, null, false, false, null, 'assets/images/cards/ShrugItOff.png'),
    CLOTHESLINE: new Card('clothesline', 'ラリアット', 2, 'attack', 'common', '12ダメージを与え、脱力(2)を付与', async (s, t, e) => {
        if (e && e.dealDamageWithEffect) {
            await e.dealDamageWithEffect(s, t, s.calculateDamage(12));
        } else {
            t.takeDamage(s.calculateDamage(12), s);
        }
        t.addStatus('weak', 2);
    }, 'single', false, {
        description: '14ダメージを与え、脱力(3)を付与',
        baseDamage: 14,
        effect: async (s, t, e) => {
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(14));
            } else {
                t.takeDamage(s.calculateDamage(14), s);
            }
            t.addStatus('weak', 3);
        }
    }, null, 12),

    // Uncommon
    UPPERCUT: new Card('uppercut', 'アッパーカット', 2, 'attack', 'uncommon', '13ダメージを与え、脱力(1)と脆弱(1)を付与', async (s, t, e) => {
        if (e && e.dealDamageWithEffect) {
            await e.dealDamageWithEffect(s, t, s.calculateDamage(13));
        } else {
            t.takeDamage(s.calculateDamage(13), s);
        }
        t.addStatus('weak', 1);
        t.addStatus('vulnerable', 1);
    }, 'single', false, {
        description: '13ダメージを与え、脱力(2)と脆弱(2)を付与',
        baseDamage: 13,
        effect: async (s, t, e) => {
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(13));
            } else {
                t.takeDamage(s.calculateDamage(13), s);
            }
            t.addStatus('weak', 2);
            t.addStatus('vulnerable', 2);
        }
    }, null, 13),
    HEAVY_BLADE: new Card('heavy_blade', 'ヘヴィブレード', 2, 'attack', 'uncommon', '14ダメージ。筋力の効果を3倍受ける。', async (s, t, e) => {
        const str = s.getStatusValue('strength');
        if (e && e.dealDamageWithEffect) {
            await e.dealDamageWithEffect(s, t, s.calculateDamage(14 + str * 2));
        } else {
            t.takeDamage(s.calculateDamage(14 + str * 2), s);
        }
    }, 'single', false, {
        description: '14ダメージ。筋力の効果を5倍受ける。',
        damageCalculator: (s, e) => {
            const str = s.getStatusValue('strength');
            return 14 + str * 4;
        },
        effect: async (s, t, e) => {
            const str = s.getStatusValue('strength');
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(14 + str * 4));
            } else {
                t.takeDamage(s.calculateDamage(14 + str * 4), s);
            }
        }
    }, null, 14, (s, e) => {
        const str = s.getStatusValue('strength');
        return 14 + str * 2;
    }),
    BODY_SLAM: new Card('body_slam', 'ボディスラム', 1, 'attack', 'uncommon', '0ダメージを与える。現在のブロック値に等しいダメージを与える。', async (s, t, e) => {
        if (e && e.dealDamageWithEffect) {
            await e.dealDamageWithEffect(s, t, s.calculateDamage(s.block));
        } else {
            t.takeDamage(s.calculateDamage(s.block), s);
        }
    }, 'single', false, {
        cost: 0,
        description: '0ダメージを与える。現在のブロック値に等しいダメージを与える。',
        effect: async (s, t, e) => {
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(s.block));
            } else {
                t.takeDamage(s.calculateDamage(s.block), s);
            }
        },
        damageCalculator: (s, e) => s.block
    }, null, 0, (s, e) => (s as any).block, 0, null, false, false, null, 'assets/images/cards/BodySlam.png'),
    WILD_STRIKE: new Card('wild_strike', 'ワイルドストライク', 1, 'attack', 'common', '12ダメージを与える。山札に「負傷」を1枚混ぜる。', async (s, t, e) => {
        if (e && e.dealDamageWithEffect) {
            await e.dealDamageWithEffect(s, t, s.calculateDamage(12));
        } else {
            t.takeDamage(s.calculateDamage(12), s);
        }
        if (e) {
            e.player.deck.push(CardLibrary.WOUND.clone());
            e.shuffle(e.player.deck);
        }
    }, 'single', false, {
        description: '17ダメージを与える。山札に「負傷」を1枚混ぜる。',
        baseDamage: 17,
        effect: async (s, t, e) => {
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(17));
            } else {
                t.takeDamage(s.calculateDamage(17), s);
            }
            if (e) {
                e.player.deck.push(CardLibrary.WOUND.clone());
                e.shuffle(e.player.deck);
            }
        }
    }, null, 12),
    INFLAME: new Card('inflame', '炎症', 1, 'power', 'uncommon', '筋力を2得る', (s, t) => {
        s.addStatus('strength', 2);
    }, 'self', false, {
        description: '筋力を3得る',
        effect: (s, t) => { s.addStatus('strength', 3); }
    }, null, 0, null, 0, null, false, false, null, 'assets/images/cards/Inflame.png'),
    METALLICIZE: new Card('metallicize', '金属音', 1, 'power', 'uncommon', 'ターン終了時に3ブロックを得る', (s, t) => {
        s.addStatus('metallicize', 3);
    }, 'self', false, {
        description: 'ターン終了時に4ブロックを得る',
        effect: (s, t) => { s.addStatus('metallicize', 4); }
    }),

    // Rare
    BLUDGEON: new Card('bludgeon', 'ヘビーストライク', 3, 'attack', 'rare', '32ダメージを与える', async (s, t, e) => {
        if (e && e.dealDamageWithEffect) {
            await e.dealDamageWithEffect(s, t, s.calculateDamage(32));
        } else {
            t.takeDamage(s.calculateDamage(32), s);
        }
    }, 'single', false, {
        description: '42ダメージを与える',
        baseDamage: 42,
        effect: async (s, t, e) => {
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(42));
            } else {
                t.takeDamage(s.calculateDamage(42), s);
            }
        }
    }, null, 32, null, 0, null, false, false, null, 'assets/images/cards/Bludgeon.png'),
    IMPERVIOUS: new Card('impervious', '不動', 2, 'skill', 'rare', '30ブロックを得る', (s, t) => {
        s.addBlock(30);
    }, 'self', false, {
        description: '40ブロックを得る',
        baseBlock: 40,
        effect: (s, t) => { s.addBlock(40); }
    }, null, 0, null, 30),
    DEMON_FORM: new Card('demon_form', '悪魔化', 3, 'power', 'rare', 'ターン開始時に筋力を2得る', (s, t) => {
        s.addStatus('demon_form', 1); // 1スタック = 2筋力/ターンとする既存ロジック用
    }, 'self', false, {
        description: 'ターン開始時に筋力を3得る',
        effect: (s, t) => { s.addStatus('demon_form_plus', 1); } // 強化版用フラグ
    }),


    // Status (ステータスカード - 戦闘中のみ)
    WOUND: new Card('wound', '負傷', -1, 'curse', 'common', '使用できないカード。', (s, t) => {
        // 使用不可
    }, 'self', false, null),
    DAZED: new Card('dazed', 'めまい', -1, 'curse', 'common', '使用できない。エセリアル。', (s, t) => {
        // 使用不可
    }, 'self', false, null, null, 0, null, 0, null, true),
    BURN: new Card('burn', '火傷', -1, 'curse', 'common', '使用できない。ターン終了時に手札にあると2ダメージ。', (s, t) => {
        // 使用不可
    }, 'self', false, null),

    // Curse (呪いカード)
    INJURY: new Card('injury', '怪我', -1, 'curse', 'curse', '消耗。何もしない。', (s, t) => {
        // 何もしない
    }, 'self', false, null),
    DOUBT: new Card('doubt', '疑念', -1, 'curse', 'curse', '何もしない。', (s, t) => {
        // 何もしない
    }, 'self', false, null),
    REGRET: new Card('regret', '後悔', -1, 'curse', 'curse', '何もしない。', (s, t) => {
        // 何もしない
    }, 'self', false, null),
    PARASITE: new Card('parasite', '寄生', -1, 'curse', 'curse', 'この呪いはデッキから削除できない。', (s, t) => {
        // 特殊処理: 削除不可
    }, 'self', false, null)
};

