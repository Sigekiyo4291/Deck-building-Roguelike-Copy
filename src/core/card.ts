export interface CardInitParams {
    id: string;
    name: string;
    cost: number | string;
    type: string;
    rarity: string;
    description: string;
    effect?: any;
    targetType?: string;
    isUpgraded?: boolean;
    upgradeData?: any;
    canPlayCheck?: any;
    baseDamage?: number;
    damageCalculator?: any;
    baseBlock?: number;
    blockCalculator?: any;
    isEthereal?: boolean;
    isExhaust?: boolean;
    costCalculator?: any;
    image?: string | null;
    effectType?: string;
    onExhaust?: any;
    isInnate?: boolean;
    isStatus?: boolean;
}

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
    onExhaust: any;
    temporaryCost: number | null;
    isStatus: boolean;
    isInnate: boolean;

    constructor(params: CardInitParams) {
        this.id = params.id;
        this.baseName = params.name;
        this.name = params.name + (params.isUpgraded ? '+' : '');
        this.cost = params.cost;
        this.costCalculator = params.costCalculator;
        this.type = params.type;
        this.rarity = params.rarity;
        this.description = params.description;
        this.effect = params.effect;
        this.isUpgraded = params.isUpgraded || false;
        this.upgradeData = params.upgradeData || null;

        if (params.targetType) {
            this.targetType = params.targetType;
        } else {
            this.targetType = (params.type === 'attack') ? 'single' : 'self';
        }
        this.canPlayCheck = params.canPlayCheck || null;
        this.baseDamage = params.baseDamage || 0;
        this.damageCalculator = params.damageCalculator || null;
        this.baseBlock = params.baseBlock || 0;
        this.blockCalculator = params.blockCalculator || null;
        this.isEthereal = params.isEthereal || false;
        this.isExhaust = params.isExhaust || false;
        this.miscValue = 0;
        this.image = params.image || null;
        this.effectType = params.effectType || 'slash';
        this.onExhaust = params.onExhaust || null;
        this.temporaryCost = null;
        this.isStatus = params.isStatus || false;
        this.isInnate = params.isInnate || false;
    }

    getCost(source) {
        // 堕落 (Corruption) の処理: スキルカードのコストを0にする
        if (source && source.hasStatus && source.hasStatus('corruption') && this.type === 'skill') {
            return 0;
        }

        // temporaryCost が設定されている場合は優先
        if (this.temporaryCost !== null && this.temporaryCost !== undefined) {
            return this.temporaryCost;
        }
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
        if (this.upgradeData.onExhaust) this.onExhaust = this.upgradeData.onExhaust;
    }

    async play(source, target, engine, freePlay = false) {
        if (this.type === 'curse') return false;

        const currentCost = this.getCost(source);

        let xValue = 0;
        if (currentCost === 'X') {
            xValue = source.energy;
            if (!freePlay) source.energy = 0;
        } else if (typeof currentCost === 'number' && currentCost >= 0) {
            if (freePlay) {
                xValue = currentCost;
            } else if (source.energy >= currentCost) {
                source.energy -= currentCost;
                xValue = currentCost;
            } else {
                return false;
            }
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
        const c = new Card({
            id: this.id,
            name: this.baseName,
            cost: this.cost,
            type: this.type,
            rarity: this.rarity,
            description: this.description,
            effect: this.effect,
            targetType: this.targetType,
            isUpgraded: this.isUpgraded,
            upgradeData: this.upgradeData,
            canPlayCheck: this.canPlayCheck,
            baseDamage: this.baseDamage,
            damageCalculator: this.damageCalculator,
            baseBlock: this.baseBlock,
            blockCalculator: this.blockCalculator,
            isEthereal: this.isEthereal,
            isExhaust: this.isExhaust,
            costCalculator: this.costCalculator,
            image: this.image,
            effectType: this.effectType,
            onExhaust: this.onExhaust
        });
        c.miscValue = this.miscValue;
        return c;
    }
}

// カードライブラリ
export const CardLibrary = {
    // Basic
    STRIKE: new Card({
        id: 'strike',
        name: 'ストライク',
        cost: 1,
        type: 'attack',
        rarity: 'basic',
        description: '6ダメージを与える',
        effect: async (s, t, e) => {
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(6));
            } else {
                t.takeDamage(s.calculateDamage(6), s);
            }
        },
        targetType: 'single',
        upgradeData: {
            description: '9ダメージを与える',
            baseDamage: 9,
            effect: async (s, t, e) => {
                if (e && e.dealDamageWithEffect) {
                    await e.dealDamageWithEffect(s, t, s.calculateDamage(9));
                } else {
                    t.takeDamage(s.calculateDamage(9), s);
                }
            }
        },
        baseDamage: 6,
        image: 'assets/images/cards/Strike.png'
    }),
    DEFEND: new Card({
        id: 'defend',
        name: 'ディフェンド',
        cost: 1,
        type: 'skill',
        rarity: 'basic',
        description: '5ブロックを得る',
        effect: (s, t) => {
            s.addBlock(5);
        },
        targetType: 'self',
        upgradeData: {
            description: '8ブロックを得る',
            baseBlock: 8,
            effect: (s, t) => { s.addBlock(8); }
        },
        baseBlock: 5,
        image: 'assets/images/cards/Defend.png'
    }),
    BASH: new Card({
        id: 'bash',
        name: '強打',
        cost: 2,
        type: 'attack',
        rarity: 'basic',
        description: '8ダメージを与え、脆弱(2)を付与',
        effect: async (s, t, e) => {
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(8));
            } else {
                t.takeDamage(s.calculateDamage(8), s);
            }
            t.addStatus('vulnerable', 2);
        },
        targetType: 'single',
        upgradeData: {
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
        },
        baseDamage: 8,
        image: 'assets/images/cards/Bash.png'
    }),

    // Common
    IRON_WAVE: new Card({
        id: 'iron_wave',
        name: 'アイアンウェーブ',
        cost: 1,
        type: 'attack',
        rarity: 'common',
        description: '5ダメージを与え、5ブロックを得る',
        effect: async (s, t, e) => {
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(5));
            } else {
                t.takeDamage(s.calculateDamage(5), s);
            }
            s.addBlock(5);
        },
        targetType: 'single',
        upgradeData: {
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
        effect: async (s, t, e) => {
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(8));
            } else {
                t.takeDamage(s.calculateDamage(8), s);
            }
        },
        targetType: 'all',
        upgradeData: {
            description: '全体に11ダメージを与える',
            baseDamage: 11,
            effect: async (s, t, e) => {
                if (e && e.dealDamageWithEffect) {
                    await e.dealDamageWithEffect(s, t, s.calculateDamage(11));
                } else {
                    t.takeDamage(s.calculateDamage(11), s);
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
        effect: async (s, t, e) => {
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(14));
            } else {
                t.takeDamage(s.calculateDamage(14), s);
            }
        },
        targetType: 'single',
        upgradeData: {
            description: '18ダメージを与える。',
            baseDamage: 18,
            effect: async (s, t, e) => {
                if (e && e.dealDamageWithEffect) {
                    await e.dealDamageWithEffect(s, t, s.calculateDamage(18));
                } else {
                    t.takeDamage(s.calculateDamage(18), s);
                }
            }
        },
        canPlayCheck: (s, e) => {
            if (!e) return true;
            return e.player.hand.every(c => c.type === 'attack');
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
        effect: async (s, t, e) => {
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(4));
            } else {
                t.takeDamage(s.calculateDamage(4), s);
            }
            t.addStatus('vulnerable', 1);
        },
        targetType: 'all',
        upgradeData: {
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
        effect: async (s, t, e) => {
            if (e && e.attackRandomEnemy) {
                const count = (s.isUpgraded) ? 4 : 3;
                const damage = s.calculateDamage(3);
                for (let i = 0; i < count; i++) {
                    await e.attackRandomEnemy(damage);
                }
            } else {
                const damage = s.calculateDamage(3);
                t.takeDamage(damage, s);
                t.takeDamage(damage, s);
                t.takeDamage(damage, s);
            }
        },
        targetType: 'random',
        upgradeData: {
            description: '3ダメージを4回与える(対象ランダム)',
            baseDamage: 3,
            effect: async (s, t, e) => {
                if (e && e.attackRandomEnemy) {
                    const damage = s.calculateDamage(3);
                    for (let i = 0; i < 4; i++) {
                        await e.attackRandomEnemy(damage);
                    }
                } else {
                    const damage = s.calculateDamage(3);
                    for (let i = 0; i < 4; i++) t.takeDamage(damage, s);
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
        effect: async (s, t, e, c) => {
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(6));
            } else {
                t.takeDamage(s.calculateDamage(6), s);
            }
            if (e) {
                e.player.discard.push(c.clone());
                if (e.uiUpdateCallback) e.uiUpdateCallback();
            }
        },
        targetType: 'single',
        upgradeData: {
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
        effect: async (s, t, e) => {
            if (!e) return;
            const allCards = [...e.player.deck, ...e.player.hand, ...e.player.discard];
            const count = allCards.filter(c => c.name.includes('ストライク') || c.baseName.includes('ストライク')).length;

            if (e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(6 + count * 2));
            } else {
                t.takeDamage(s.calculateDamage(6 + count * 2), s);
            }
        },
        targetType: 'single',
        upgradeData: {
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
        },
        baseDamage: 6,
        damageCalculator: (s, e) => {
            if (!e) return 6;
            const allCards = [...e.player.deck, ...e.player.hand, ...e.player.discard];
            const count = allCards.filter(c => c.name.includes('ストライク') || c.baseName.includes('ストライク')).length;
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
        effect: async (s, t, e) => {
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
        },
        targetType: 'single',
        upgradeData: {
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
        effect: async (s, t, e) => {
            s.loseHP(2);
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(15));
            } else {
                t.takeDamage(s.calculateDamage(15), s);
            }
            if (e && e.uiUpdateCallback) e.uiUpdateCallback();
        },
        targetType: 'single',
        upgradeData: {
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
        effect: async (s, t, e, c) => {
            const damage = c.getFinalDamage(s, t, e);
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, damage);
            } else {
                t.takeDamage(damage, s);
            }
            c.miscValue += 5;
            if (e && e.uiUpdateCallback) e.uiUpdateCallback();
        },
        targetType: 'single',
        upgradeData: {
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
        effect: async (s, t, e) => {
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(18));
            } else {
                t.takeDamage(s.calculateDamage(18), s);
            }
        },
        targetType: 'single',
        upgradeData: {
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
        },
        baseDamage: 18,
        costCalculator: (s) => Math.max(0, 4 - (s.hpLossCount || 0))
    }),
    SEVER_SOUL: new Card({
        id: 'sever_soul',
        name: '霊魂切断',
        cost: 2,
        type: 'attack',
        rarity: 'uncommon',
        description: '16ダメージ。アタック以外の手札を全廃棄。',
        effect: async (s, t, e) => {
            // アタック以外のカードを特定して廃棄
            const nonAttacks = s.hand.filter(c => c.type !== 'attack');
            nonAttacks.forEach(c => s.exhaustCard(c, e));
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
        },
        targetType: 'single',
        upgradeData: {
            description: '22ダメージ。アタック以外の手札を全廃棄。',
            baseDamage: 22,
            effect: async (s, t, e) => {
                const nonAttacks = s.hand.filter(c => c.type !== 'attack');
                nonAttacks.forEach(c => s.exhaustCard(c, e));
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
        effect: async (s, t, e) => {
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
        },
        targetType: 'single',
        upgradeData: {
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
        effect: async (s, t, e) => {
            let actualDamage = 0;
            if (e && e.dealDamageWithEffect) {
                const damageBefore = t.hp;
                // dealDamageWithEffectの戻り値をtakeDamageの戻り値にするよう修正が必要だが、ここでは簡易的に実装
                // 注: 元のコードのコメントとロジックを保持
                if (e.effectManager) {
                    const targetElement = document.querySelectorAll('.entity.enemy')[e.enemies.indexOf(t)];
                    if (targetElement) await e.effectManager.showAttackEffectAsync(targetElement, 'slash');
                }
                actualDamage = t.takeDamage(s.calculateDamage(4), s);
            } else {
                actualDamage = t.takeDamage(s.calculateDamage(4), s);
            }
            s.heal(actualDamage);
            if (e && e.uiUpdateCallback) e.uiUpdateCallback();
        },
        targetType: 'all',
        upgradeData: {
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
        effect: async (s, t, e) => {
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
        },
        targetType: 'all',
        upgradeData: {
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
        effect: async (s, t, e) => {
            const count = s.hand.length;
            s.hand.forEach(c => s.exhaustCard(c, e));
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
        },
        targetType: 'single',
        upgradeData: {
            description: '手札を全て廃棄し、1枚につき10ダメージを与える。廃棄。',
            baseDamage: 10,
            effect: async (s, t, e) => {
                const count = s.hand.length;
                s.hand.forEach(c => s.exhaustCard(c, e));
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
        effect: async (s, t, e) => {
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(20));
            } else {
                t.takeDamage(s.calculateDamage(20), s);
            }
        },
        targetType: 'single',
        upgradeData: {
            description: 'エセリアル。28ダメージを与える。',
            baseDamage: 28,
            effect: async (s, t, e) => {
                if (e && e.dealDamageWithEffect) {
                    await e.dealDamageWithEffect(s, t, s.calculateDamage(28));
                } else {
                    t.takeDamage(s.calculateDamage(28), s);
                }
            }
        },
        baseDamage: 20,
        isEthereal: true
    }),
    PUMMEL: new Card({
        id: 'pummel',
        name: '猛撃',
        cost: 1,
        type: 'attack',
        rarity: 'uncommon',
        description: '2ダメージを4回与える。廃棄。',
        effect: async (s, t, e) => {
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
        },
        targetType: 'single',
        upgradeData: {
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
        effect: async (s, t, e, c, x) => {
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
        },
        targetType: 'all',
        upgradeData: {
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
        effect: async (s, t, e) => {
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
        },
        targetType: 'single',
        upgradeData: {
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
        effect: async (s, t, e) => {
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
        },
        targetType: 'single',
        upgradeData: {
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
        effect: async (s, t, e) => {
            const targetIndex = e ? e.enemies.indexOf(t) : 0;
            if (e && e.attackWithEffect) {
                await e.attackWithEffect(s, t, s.calculateDamage(5), targetIndex);
                await e.attackWithEffect(s, t, s.calculateDamage(5), targetIndex);
            } else {
                t.takeDamage(s.calculateDamage(5), s);
                t.takeDamage(s.calculateDamage(5), s);
            }
        },
        targetType: 'single',
        upgradeData: {
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
        effect: async (s, t, e) => {
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(9));
            } else {
                t.takeDamage(s.calculateDamage(9), s);
            }
            if (e) e.drawCards(1);
        },
        targetType: 'single',
        upgradeData: {
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
        },
        baseDamage: 9
    }),
    SHRUG_IT_OFF: new Card({
        id: 'shrug_it_off',
        name: '受け流し',
        cost: 1,
        type: 'skill',
        rarity: 'common',
        description: '8ブロックを得て、カードを1枚引く',
        effect: (s, t, e) => {
            s.addBlock(8);
            if (e) e.drawCards(1);
        },
        targetType: 'self',
        upgradeData: {
            description: '11ブロックを得て、カードを1枚引く',
            baseBlock: 11,
            effect: (s, t, e) => {
                s.addBlock(11);
                if (e) e.drawCards(1);
            }
        },
        baseBlock: 8
    }),
    FLEX: new Card({
        id: 'flex',
        name: 'フレックス',
        cost: 0,
        type: 'skill',
        rarity: 'common',
        description: '筋力を2得る。ターン終了時、筋力を2失う。',
        effect: (s, t) => {
            s.addStatus('strength', 2);
            s.addStatus('strength_down', 2);
        },
        targetType: 'self',
        upgradeData: {
            description: '筋力を4得る。ターン終了時、筋力を4失う。',
            effect: (s, t) => {
                s.addStatus('strength', 4);
                s.addStatus('strength_down', 4);
            }
        }
    }),
    TRUE_GRIT: new Card({
        id: 'true_grit',
        name: '不屈の闘志',
        cost: 1,
        type: 'skill',
        rarity: 'common',
        description: '7ブロックを得る。手札からランダムに1枚廃棄する。',
        effect: (s, t, e) => {
            s.addBlock(7);
            if (e && s.hand.length > 0) {
                const randomIndex = Math.floor(Math.random() * s.hand.length);
                const exhausted = s.hand.splice(randomIndex, 1)[0];
                s.exhaustCard(exhausted, e);
                if (e.uiUpdateCallback) e.uiUpdateCallback();
            }
        },
        targetType: 'self',
        upgradeData: {
            description: '9ブロックを得る。手札から1枚選んで廃棄する。',
            baseBlock: 9,
            effect: (s, t, e) => {
                s.addBlock(9);
                if (e && e.onCardSelectionRequest && s.hand.length > 0) {
                    e.onCardSelectionRequest('廃棄するカードを選択', s.hand, (card, index) => {
                        if (card) {
                            s.hand.splice(index, 1);
                            s.exhaustCard(card, e);
                            if (e.uiUpdateCallback) e.uiUpdateCallback();
                        }
                    });
                }
            }
        },
        baseBlock: 7
    }),
    CLOTHESLINE: new Card({
        id: 'clothesline',
        name: 'ラリアット',
        cost: 2,
        type: 'attack',
        rarity: 'common',
        description: '12ダメージを与え、脱力(2)を付与',
        effect: async (s, t, e) => {
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(12));
            } else {
                t.takeDamage(s.calculateDamage(12), s);
            }
            t.addStatus('weak', 2);
        },
        targetType: 'single',
        upgradeData: {
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
        },
        baseDamage: 12
    }),

    // Uncommon
    UPPERCUT: new Card({
        id: 'uppercut',
        name: 'アッパーカット',
        cost: 2,
        type: 'attack',
        rarity: 'uncommon',
        description: '13ダメージを与え、脱力(1)と脆弱(1)を付与',
        effect: async (s, t, e) => {
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(13));
            } else {
                t.takeDamage(s.calculateDamage(13), s);
            }
            t.addStatus('weak', 1);
            t.addStatus('vulnerable', 1);
        },
        targetType: 'single',
        upgradeData: {
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
        effect: async (s, t, e) => {
            const str = s.getStatusValue ? s.getStatusValue('strength') : (s.status.find(st => st.name === 'strength')?.value || 0);
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(14 + str * 2));
            } else {
                t.takeDamage(s.calculateDamage(14 + str * 2), s);
            }
        },
        targetType: 'single',
        upgradeData: {
            description: '14ダメージ。筋力の効果を5倍受ける。',
            baseDamage: 14,
            damageCalculator: (s, e) => {
                const str = s.getStatusValue ? s.getStatusValue('strength') : (s.status.find(st => st.name === 'strength')?.value || 0);
                return 14 + str * 4;
            },
            effect: async (s, t, e) => {
                const str = s.getStatusValue ? s.getStatusValue('strength') : (s.status.find(st => st.name === 'strength')?.value || 0);
                if (e && e.dealDamageWithEffect) {
                    await e.dealDamageWithEffect(s, t, s.calculateDamage(14 + str * 4));
                } else {
                    t.takeDamage(s.calculateDamage(14 + str * 4), s);
                }
            }
        },
        baseDamage: 14,
        damageCalculator: (s, e) => {
            const str = s.getStatusValue ? s.getStatusValue('strength') : (s.status.find(st => st.name === 'strength')?.value || 0);
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
        effect: async (s, t, e) => {
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(s.block));
            } else {
                t.takeDamage(s.calculateDamage(s.block), s);
            }
        },
        targetType: 'single',
        upgradeData: {
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
        },
        damageCalculator: (s, e) => s.block,
        image: 'assets/images/cards/BodySlam.png'
    }),
    WILD_STRIKE: new Card({
        id: 'wild_strike',
        name: 'ワイルドストライク',
        cost: 1,
        type: 'attack',
        rarity: 'common',
        description: '12ダメージを与える。山札に「負傷」を1枚混ぜる。',
        effect: async (s, t, e) => {
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(12));
            } else {
                t.takeDamage(s.calculateDamage(12), s);
            }
            if (e) {
                e.player.deck.push(CardLibrary.WOUND.clone());
                e.shuffle(e.player.deck);
            }
        },
        targetType: 'single',
        upgradeData: {
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
        },
        baseDamage: 12
    }),
    ARMAMENTS: new Card({
        id: 'armaments',
        name: '武装',
        cost: 1,
        type: 'skill',
        rarity: 'common',
        description: '5ブロックを得る。手札のカード1枚を戦闘中のみ強化する。',
        effect: (s, t, e) => {
            s.addBlock(5);
            if (e && e.onCardSelectionRequest && s.hand.length > 0) {
                e.onCardSelectionRequest('強化するカードを選択', s.hand, (card, index) => {
                    if (card && !card.isUpgraded) {
                        card.upgrade();
                        if (e.uiUpdateCallback) e.uiUpdateCallback();
                    }
                });
            }
        },
        targetType: 'self',
        upgradeData: {
            description: '5ブロックを得る。手札の全てのカードを戦闘中のみ強化する。',
            baseBlock: 5,
            effect: (s, t, e) => {
                s.addBlock(5);
                s.hand.forEach(card => {
                    if (!card.isUpgraded) card.upgrade();
                });
                if (e && e.uiUpdateCallback) e.uiUpdateCallback();
            }
        },
        baseBlock: 5
    }),
    HAVOC: new Card({
        id: 'havoc',
        name: '荒廃',
        cost: 1,
        type: 'skill',
        rarity: 'uncommon',
        description: '山札の一番上のカードをプレイして廃棄する。',
        effect: async (s, t, e) => {
            if (e && e.player.deck.length > 0) {
                const card = e.player.deck.pop();
                if (card) {
                    // StSのHavocは山札の一番上のカードをプレイする。
                    // ターゲットが必要な場合はランダムに選択。
                    let target = t;
                    if (card.targetType === 'single') {
                        const randomTarget = e.getRandomAliveEnemy();
                        if (randomTarget) {
                            target = randomTarget;
                        }
                    }

                    // 強制的に廃棄フラグを立てる
                    card.isExhaust = true;

                    // プレイ（コスト無料）
                    await card.play(e.player, target, e, true);

                    // プレイ後に廃棄パイルへ
                    e.player.exhaustCard(card, e);

                    if (e.uiUpdateCallback) e.uiUpdateCallback();
                }
            }
        },
        targetType: 'self',
        upgradeData: {
            cost: 0,
            description: '山札の一番上のカードをプレイして廃棄する。'
        }
    }),
    WARCRY: new Card({
        id: 'warcry',
        name: '雄叫び',
        cost: 0,
        type: 'skill',
        rarity: 'common',
        description: 'カードを1枚引く。手札のカード1枚を山札の一番上に置く。廃棄。',
        effect: (s, t, e) => {
            if (e) {
                e.drawCards(1);
                if (e.onCardSelectionRequest && s.hand.length > 0) {
                    e.onCardSelectionRequest('山札の一番上に置くカードを選択', s.hand, (card, index) => {
                        if (card) {
                            s.hand.splice(index, 1);
                            e.player.deck.push(card);
                            if (e.uiUpdateCallback) e.uiUpdateCallback();
                        }
                    });
                }
            }
        },
        targetType: 'self',
        upgradeData: {
            description: 'カードを2枚引く。手札のカード1枚を山札の一番上に置く。廃棄。',
            effect: (s, t, e) => {
                if (e) {
                    e.drawCards(2);
                    if (e.onCardSelectionRequest && s.hand.length > 0) {
                        e.onCardSelectionRequest('山札の一番上に置くカードを選択', s.hand, (card, index) => {
                            if (card) {
                                s.hand.splice(index, 1);
                                e.player.deck.push(card);
                                if (e.uiUpdateCallback) e.uiUpdateCallback();
                            }
                        });
                    }
                }
            }
        },
        isExhaust: true
    }),
    POWER_THROUGH: new Card({
        id: 'power_through',
        name: 'やせ我慢',
        cost: 1,
        type: 'skill',
        rarity: 'uncommon',
        description: '15ブロックを得る。手札に負傷を2枚加える。',
        effect: (s, t, e) => {
            s.addBlock(15);
            if (e) {
                s.hand.push(CardLibrary.WOUND.clone());
                s.hand.push(CardLibrary.WOUND.clone());
                if (e.uiUpdateCallback) e.uiUpdateCallback();
            }
        },
        targetType: 'self',
        upgradeData: {
            description: '20ブロックを得る。手札に負傷を2枚加える。',
            baseBlock: 20,
            effect: (s, t, e) => {
                s.addBlock(20);
                if (e) {
                    s.hand.push(CardLibrary.WOUND.clone());
                    s.hand.push(CardLibrary.WOUND.clone());
                    if (e.uiUpdateCallback) e.uiUpdateCallback();
                }
            }
        },
        baseBlock: 15
    }),
    GHOSTLY_ARMOR: new Card({
        id: 'ghostly_armor',
        name: 'ゴーストアーマー',
        cost: 1,
        type: 'skill',
        rarity: 'uncommon',
        description: 'エセリアル。10ブロックを得る。',
        effect: (s, t) => {
            s.addBlock(10);
        },
        targetType: 'self',
        upgradeData: {
            description: 'エセリアル。13ブロックを得る。',
            baseBlock: 13,
            effect: (s, t) => { s.addBlock(13); }
        },
        baseBlock: 10,
        isEthereal: true
    }),
    SECOND_WIND: new Card({
        id: 'second_wind',
        name: 'セカンドウィンド',
        cost: 1,
        type: 'skill',
        rarity: 'uncommon',
        description: '手札の非アタックカードを全て廃棄し、1枚につき5ブロックを得る。',
        effect: (s, t, e) => {
            const nonAttacks = s.hand.filter(c => c.type !== 'attack');
            const count = nonAttacks.length;
            nonAttacks.forEach(c => s.exhaustCard(c, e));
            s.hand = s.hand.filter(c => c.type === 'attack');
            s.addBlock(5 * count);
            if (e && e.uiUpdateCallback) e.uiUpdateCallback();
        },
        targetType: 'self',
        upgradeData: {
            description: '手札の非アタックカードを全て廃棄し、1枚につき7ブロックを得る。',
            effect: (s, t, e) => {
                const nonAttacks = s.hand.filter(c => c.type !== 'attack');
                const count = nonAttacks.length;
                nonAttacks.forEach(c => s.exhaustCard(c, e));
                s.hand = s.hand.filter(c => c.type === 'attack');
                s.addBlock(7 * count);
                if (e && e.uiUpdateCallback) e.uiUpdateCallback();
            }
        }
    }),
    BATTLE_TRANCE: new Card({
        id: 'battle_trance',
        name: 'バトルトランス',
        cost: 0,
        type: 'skill',
        rarity: 'uncommon',
        description: 'カードを3枚引く。このターン、カードを引けなくなる。',
        effect: (s, t, e) => {
            if (e) {
                e.drawCards(3);
                s.addStatus('no_draw', 1);
            }
        },
        targetType: 'self',
        upgradeData: {
            description: 'カードを4枚引く。このターン、カードを引けなくなる。',
            effect: (s, t, e) => {
                if (e) {
                    e.drawCards(4);
                    s.addStatus('no_draw', 1);
                }
            }
        }
    }),
    DUAL_WIELD: new Card({
        id: 'dual_wield',
        name: '二刀流',
        cost: 1,
        type: 'skill',
        rarity: 'uncommon',
        description: '手札のアタックかパワーカード1枚の複製を手札に加える。',
        effect: (s, t, e) => {
            if (e && e.onCardSelectionRequest) {
                const targets = s.hand.filter(c => c.type === 'attack' || c.type === 'power');
                if (targets.length > 0) {
                    e.onCardSelectionRequest('複製するカードを選択', targets, (card, index) => {
                        if (card) {
                            s.hand.push(card.clone());
                            if (e.uiUpdateCallback) e.uiUpdateCallback();
                        }
                    });
                }
            }
        },
        targetType: 'self',
        upgradeData: {
            description: '手札のアタックかパワーカード1枚の複製を2枚手札に加える。',
            effect: (s, t, e) => {
                if (e && e.onCardSelectionRequest) {
                    const targets = s.hand.filter(c => c.type === 'attack' || c.type === 'power');
                    if (targets.length > 0) {
                        e.onCardSelectionRequest('複製するカードを選択', targets, (card, index) => {
                            if (card) {
                                s.hand.push(card.clone());
                                s.hand.push(card.clone());
                                if (e.uiUpdateCallback) e.uiUpdateCallback();
                            }
                        });
                    }
                }
            }
        }
    }),
    ENTRENCH: new Card({
        id: 'entrench',
        name: '塹壕',
        cost: 2,
        type: 'skill',
        rarity: 'uncommon',
        description: '現在のブロック値を2倍にする。',
        effect: (s, t) => {
            s.block *= 2;
        },
        targetType: 'self',
        upgradeData: {
            cost: 1,
            description: '現在のブロック値を2倍にする。'
        }
    }),
    INTIMIDATE: new Card({
        id: 'intimidate',
        name: '威嚇',
        cost: 0,
        type: 'skill',
        rarity: 'uncommon',
        description: '全ての敵に脱力(1)を付与する。廃棄。',
        effect: (s, t, e) => {
            if (e) {
                e.enemies.forEach(enemy => {
                    if (!enemy.isDead()) enemy.addStatus('weak', 1);
                });
            }
        },
        targetType: 'all',
        upgradeData: {
            description: '全ての敵に脱力(2)を付与する。廃棄。',
            effect: (s, t, e) => {
                if (e) {
                    e.enemies.forEach(enemy => {
                        if (!enemy.isDead()) enemy.addStatus('weak', 2);
                    });
                }
            }
        },
        isExhaust: true
    }),
    SPOT_WEAKNESS: new Card({
        id: 'spot_weakness',
        name: '弱点発見',
        cost: 1,
        type: 'skill',
        rarity: 'uncommon',
        description: '敵が攻撃予定なら筋力を3得る。',
        effect: (s, t, e) => {
            if (t && t.nextMove && t.nextMove.type === 'attack') {
                s.addStatus('strength', 3);
            }
        },
        targetType: 'single',
        upgradeData: {
            description: '敵が攻撃予定なら筋力を4得る。',
            effect: (s, t, e) => {
                if (t && t.nextMove && t.nextMove.type === 'attack') {
                    s.addStatus('strength', 4);
                }
            }
        }
    }),
    RAGE: new Card({
        id: 'rage',
        name: '激怒',
        cost: 0,
        type: 'skill',
        rarity: 'uncommon',
        description: 'このターン、アタックカードをプレイする度に3ブロックを得る。',
        effect: (s, t, e) => {
            s.addStatus('rage', 3);
        },
        targetType: 'self',
        upgradeData: {
            description: 'このターン、アタックカードをプレイする度に5ブロックを得る。',
            effect: (s, t, e) => { s.addStatus('rage', 5); }
        }
    }),
    DISARM: new Card({
        id: 'disarm',
        name: '武装解除',
        cost: 1,
        type: 'skill',
        rarity: 'uncommon',
        description: '敵の筋力を2減らす。廃棄。',
        effect: (s, t) => {
            t.addStatus('strength', -2);
        },
        targetType: 'single',
        upgradeData: {
            description: '敵の筋力を3減らす。廃棄。',
            effect: (s, t) => { t.addStatus('strength', -3); }
        },
        isExhaust: true
    }),
    SEEING_RED: new Card({
        id: 'seeing_red',
        name: '激昂',
        cost: 1,
        type: 'skill',
        rarity: 'uncommon',
        description: '2エナジーを得る。廃棄。',
        effect: (s, t, e) => {
            if (e) s.energy += 2;
        },
        targetType: 'self',
        upgradeData: {
            cost: 0,
            description: '2エナジーを得る。廃棄。'
        },
        isExhaust: true
    }),
    BLOODLETTING: new Card({
        id: 'bloodletting',
        name: '瀉血',
        cost: 0,
        type: 'skill',
        rarity: 'uncommon',
        description: 'HPを3失い、2エナジーを得る。',
        effect: (s, t, e) => {
            s.loseHP(3);
            if (e) {
                s.energy += 2;
                if (e.uiUpdateCallback) e.uiUpdateCallback();
            }
        },
        targetType: 'self',
        upgradeData: {
            description: 'HPを3失い、3エナジーを得る。',
            effect: (s, t, e) => {
                s.loseHP(3);
                if (e) {
                    s.energy += 3;
                    if (e.uiUpdateCallback) e.uiUpdateCallback();
                }
            }
        }
    }),
    FLAME_BARRIER: new Card({
        id: 'flame_barrier',
        name: '炎の障壁',
        cost: 2,
        type: 'skill',
        rarity: 'uncommon',
        description: '12ブロックを得る。攻撃を受けると攻撃者に4ダメージを与える。',
        effect: (s, t) => {
            s.addBlock(12);
            s.addStatus('flame_barrier', 4);
        },
        targetType: 'self',
        upgradeData: {
            description: '16ブロックを得る。攻撃を受けると攻撃者に6ダメージを与える。',
            baseBlock: 16,
            effect: (s, t) => {
                s.addBlock(16);
                s.addStatus('flame_barrier', 6);
            }
        },
        baseBlock: 12
    }),
    BURNING_PACT: new Card({
        id: 'burning_pact',
        name: '焦熱の契約',
        cost: 1,
        type: 'skill',
        rarity: 'uncommon',
        description: '手札のカード1枚を廃棄し、カードを2枚引く。',
        effect: (s, t, e) => {
            if (e && e.onCardSelectionRequest && s.hand.length > 0) {
                e.onCardSelectionRequest('廃棄するカードを選択', s.hand, (card, index) => {
                    if (card) {
                        s.hand.splice(index, 1);
                        s.exhaustCard(card, e);
                        e.drawCards(2);
                        if (e.uiUpdateCallback) e.uiUpdateCallback();
                    }
                });
            }
        },
        targetType: 'self',
        upgradeData: {
            description: '手札のカード1枚を廃棄し、カードを3枚引く。',
            effect: (s, t, e) => {
                if (e && e.onCardSelectionRequest && s.hand.length > 0) {
                    e.onCardSelectionRequest('廃棄するカードを選択', s.hand, (card, index) => {
                        if (card) {
                            s.hand.splice(index, 1);
                            s.exhaustCard(card, e);
                            e.drawCards(3);
                            if (e.uiUpdateCallback) e.uiUpdateCallback();
                        }
                    });
                }
            }
        }
    }),
    SHOCKWAVE: new Card({
        id: 'shockwave',
        name: '衝撃波',
        cost: 2,
        type: 'skill',
        rarity: 'uncommon',
        description: '全ての敵に脱力(3)と脆弱(3)を付与する。廃棄。',
        effect: (s, t, e) => {
            if (t && !t.isDead()) {
                t.addStatus('weak', 3);
                t.addStatus('vulnerable', 3);
            }
        },
        targetType: 'all',
        upgradeData: {
            description: '全ての敵に脱力(5)と脆弱(5)を付与する。廃棄。',
            effect: (s, t, e) => {
                if (t && !t.isDead()) {
                    t.addStatus('weak', 5);
                    t.addStatus('vulnerable', 5);
                }
            }
        },
        isExhaust: true
    }),
    SENTINEL: new Card({
        id: 'sentinel',
        name: '見張り',
        cost: 1,
        type: 'skill',
        rarity: 'uncommon',
        description: '5ブロックを得る。このカードが廃棄された時、2エナジーを得る。',
        effect: (s, t, e) => {
            s.addBlock(5);
        },
        targetType: 'self',
        upgradeData: {
            description: '8ブロックを得る。このカードが廃棄された時、3エナジーを得る。',
            baseBlock: 8,
            effect: (s, t, e) => { s.addBlock(8); },
            onExhaust: (s, e) => {
                if (e) {
                    s.energy += 3;
                    if (e.uiUpdateCallback) e.uiUpdateCallback();
                }
            }
        },
        baseBlock: 5,
        onExhaust: (s, e) => {
            if (e) {
                s.energy += 2;
                if (e.uiUpdateCallback) e.uiUpdateCallback();
            }
        }
    }),
    DARK_SHACKLES: new Card({
        id: 'dark_shackles',
        name: '非道の刃',
        cost: 1,
        type: 'skill',
        rarity: 'rare',
        description: 'ランダムなアタックカード1枚を生成し、そのコストを0にする。廃棄。',
        effect: (s, t, e) => {
            if (e) {
                const attackCards = Object.values(CardLibrary).filter((c: any) => c.type === 'attack');
                const randomCard = attackCards[Math.floor(Math.random() * attackCards.length)].clone();
                randomCard.temporaryCost = 0; // ターン終了時にリセットされる一時的なコスト変更
                s.hand.push(randomCard);
                if (e.uiUpdateCallback) e.uiUpdateCallback();
            }
        },
        targetType: 'self',
        upgradeData: {
            cost: 0,
            description: 'ランダムなアタックカード1枚を生成し、そのコストを0にする。廃棄。'
        },
        isExhaust: true
    }),
    DOUBLE_TAP: new Card({
        id: 'double_tap',
        name: 'ダブルタップ',
        cost: 1,
        type: 'skill',
        rarity: 'rare',
        description: '次にプレイするアタックカードを2回プレイする。',
        effect: (s, t) => {
            s.addStatus('double_tap', 1);
        },
        targetType: 'self',
        upgradeData: {
            description: '次にプレイする2枚のアタックカードをそれぞれ2回プレイする。',
            effect: (s, t) => { s.addStatus('double_tap', 2); }
        }
    }),
    LIMIT_BREAK: new Card({
        id: 'limit_break',
        name: 'リミットブレイク',
        cost: 1,
        type: 'skill',
        rarity: 'rare',
        description: '筋力を2倍にする。廃棄。',
        effect: (s, t) => {
            const currentStr = s.getStatusValue('strength');
            s.addStatus('strength', currentStr);
        },
        targetType: 'self',
        upgradeData: {
            description: '筋力を2倍にする。',
            effect: (s, t) => {
                const currentStr = s.getStatusValue('strength');
                s.addStatus('strength', currentStr);
            },
            isExhaust: false
        },
        isExhaust: true
    }),
    OFFERING: new Card({
        id: 'offering',
        name: '供物',
        cost: 0,
        type: 'skill',
        rarity: 'rare',
        description: 'HPを6失い、2エナジーを得て、カードを3枚引く。廃棄。',
        effect: (s, t, e) => {
            s.loseHP(6);
            if (e) {
                s.energy += 2;
                e.drawCards(3);
                if (e.uiUpdateCallback) e.uiUpdateCallback();
            }
        },
        targetType: 'self',
        upgradeData: {
            description: 'HPを6失い、2エナジーを得て、カードを5枚引く。廃棄。',
            effect: (s, t, e) => {
                s.loseHP(6);
                if (e) {
                    s.energy += 2;
                    e.drawCards(5);
                    if (e.uiUpdateCallback) e.uiUpdateCallback();
                }
            }
        },
        isExhaust: true
    }),
    EXHUME: new Card({
        id: 'exhume',
        name: '発掘',
        cost: 1,
        type: 'skill',
        rarity: 'rare',
        description: '廃棄置き場からカード1枚を手札に加える。廃棄。',
        effect: (s, t, e) => {
            if (e && e.onCardSelectionRequest && s.exhaust.length > 0) {
                e.onCardSelectionRequest('回収するカードを選択', s.exhaust, (card, index) => {
                    if (card) {
                        s.exhaust.splice(index, 1);
                        s.hand.push(card);
                        if (e.uiUpdateCallback) e.uiUpdateCallback();
                    }
                });
            }
        },
        targetType: 'self',
        upgradeData: {
            cost: 0,
            description: '廃棄置き場からカード1枚を手札に加える。廃棄。'
        },
        isExhaust: true
    }),

    INFLAME: new Card({
        id: 'inflame',
        name: '炎症',
        cost: 1,
        type: 'power',
        rarity: 'uncommon',
        description: '筋力を2得る',
        effect: (s, t) => {
            s.addStatus('strength', 2);
        },
        targetType: 'self',
        upgradeData: {
            description: '筋力を3得る',
            effect: (s, t) => { s.addStatus('strength', 3); }
        },
        image: 'assets/images/cards/Inflame.png'
    }),
    METALLICIZE: new Card({
        id: 'metallicize',
        name: '金属音',
        cost: 1,
        type: 'power',
        rarity: 'uncommon',
        description: 'ターン終了時に3ブロックを得る',
        effect: (s, t) => {
            s.addStatus('metallicize', 3);
        },
        targetType: 'self',
        upgradeData: {
            description: 'ターン終了時に4ブロックを得る',
            effect: (s, t) => { s.addStatus('metallicize', 4); }
        }
    }),
    FIRE_BREATHING: new Card({
        id: 'fire_breathing',
        name: '炎の吐息',
        cost: 1,
        type: 'power',
        rarity: 'uncommon',
        description: 'ステータスか呪いカードを引くたび、全ての敵に6ダメージを与える',
        effect: (s, t) => {
            s.addStatus('fire_breathing', 6);
        },
        targetType: 'self',
        upgradeData: {
            description: 'ステータスか呪いカードを引くたび、全ての敵に10ダメージを与える',
            effect: (s, t) => { s.addStatus('fire_breathing', 10); }
        }
    }),
    FEEL_NO_PAIN: new Card({
        id: 'feel_no_pain',
        name: '無痛',
        cost: 1,
        type: 'power',
        rarity: 'uncommon',
        description: 'カードが廃棄されるたび、3ブロックを得る',
        effect: (s, t) => {
            s.addStatus('feel_no_pain', 3);
        },
        targetType: 'self',
        upgradeData: {
            description: 'カードが廃棄されるたび、4ブロックを得る',
            effect: (s, t) => { s.addStatus('feel_no_pain', 4); }
        }
    }),
    COMBUST: new Card({
        id: 'combust',
        name: '燃焼',
        cost: 1,
        type: 'power',
        rarity: 'uncommon',
        description: 'ターン終了時、1HPを失い、全ての敵に5ダメージを与える',
        effect: (s, t) => {
            s.addStatus('combust', 5);
        },
        targetType: 'self',
        upgradeData: {
            description: 'ターン終了時、1HPを失い、全ての敵に7ダメージを与える',
            effect: (s, t) => { s.addStatus('combust', 7); }
        }
    }),
    RUPTURE: new Card({
        id: 'rupture',
        name: '破裂',
        cost: 1,
        type: 'power',
        rarity: 'uncommon',
        description: 'カードによってHPを失うたび、筋力を1得る',
        effect: (s, t) => {
            s.addStatus('rupture', 1);
        },
        targetType: 'self',
        upgradeData: {
            description: 'カードによってHPを失うたび、筋力を2得る',
            effect: (s, t) => { s.addStatus('rupture', 2); }
        }
    }),
    EVOLVE: new Card({
        id: 'evolve',
        name: '進化',
        cost: 1,
        type: 'power',
        rarity: 'uncommon',
        description: 'ステータスカードを引くたび、1枚カードを引く',
        effect: (s, t) => {
            s.addStatus('evolve', 1);
        },
        targetType: 'self',
        upgradeData: {
            description: 'ステータスカードを引くたび、2枚カードを引く',
            effect: (s, t) => { s.addStatus('evolve', 2); }
        }
    }),
    DARK_EMBRACE: new Card({
        id: 'dark_embrace',
        name: '闇の抱擁',
        cost: 2,
        type: 'power',
        rarity: 'uncommon',
        description: 'カードが廃棄されるたび、1枚カードを引く',
        effect: (s, t) => {
            s.addStatus('dark_embrace', 1);
        },
        targetType: 'self',
        upgradeData: {
            cost: 1,
            description: 'カードが廃棄されるたび、1枚カードを引く',
            effect: (s, t) => { s.addStatus('dark_embrace', 1); }
        }
    }),

    // Rare
    JUGGERNAUT: new Card({
        id: 'juggernaut',
        name: 'ジャガーノート',
        cost: 2,
        type: 'power',
        rarity: 'rare',
        description: 'ブロックを獲得するたび、ランダムな敵に5ダメージを与える',
        effect: (s, t) => {
            s.addStatus('juggernaut', 5);
        },
        targetType: 'self',
        upgradeData: {
            description: 'ブロックを獲得するたび、ランダムな敵に7ダメージを与える',
            effect: (s, t) => { s.addStatus('juggernaut', 7); }
        }
    }),
    BARRICADE: new Card({
        id: 'barricade',
        name: 'バリケード',
        cost: 3,
        type: 'power',
        rarity: 'rare',
        description: 'ターン開始時にブロックが失われなくなる',
        effect: (s, t) => {
            s.addStatus('barricade', 1);
        },
        targetType: 'self',
        upgradeData: {
            cost: 2,
            description: 'ターン開始時にブロックが失われなくなる',
            effect: (s, t) => { s.addStatus('barricade', 1); }
        }
    }),
    CORRUPTION: new Card({
        id: 'corruption',
        name: '堕落',
        cost: 3,
        type: 'power',
        rarity: 'rare',
        description: 'スキルカードのコストを0にする。スキルを使用するたび、廃棄する。',
        effect: (s, t) => {
            s.addStatus('corruption', 1);
        },
        targetType: 'self',
        upgradeData: {
            cost: 2,
            description: 'スキルカードのコストを0にする。スキルを使用するたび、廃棄する。',
            effect: (s, t) => { s.addStatus('corruption', 1); }
        }
    }),
    BRUTALITY: new Card({
        id: 'brutality',
        name: '残虐',
        cost: 0,
        type: 'power',
        rarity: 'rare',
        description: 'ターン開始時、1HPを失いカードを1枚引く',
        effect: (s, t) => {
            s.addStatus('brutality', 1);
        },
        targetType: 'self',
        upgradeData: {
            isInnate: true,
            description: '天賦。ターン開始時、1HPを失いカードを1枚引く',
            effect: (s, t) => { s.addStatus('brutality', 1); }
        }
    }),
    BERSERK: new Card({
        id: 'berserk',
        name: '狂戦士',
        cost: 0,
        type: 'power',
        rarity: 'rare',
        description: '自身に脆弱を2付与する。ターン開始時、エナジーを1得る',
        effect: (s, t) => {
            s.addStatus('vulnerable', 2);
            s.addStatus('berserk', 1);
        },
        targetType: 'self',
        upgradeData: {
            description: '自身に脆弱を1付与する。ターン開始時、エナジーを1得る',
            effect: (s, t) => {
                s.addStatus('vulnerable', 1);
                s.addStatus('berserk', 1);
            }
        }
    }),
    BLUDGEON: new Card({
        id: 'bludgeon',
        name: 'ヘビーストライク',
        cost: 3,
        type: 'attack',
        rarity: 'rare',
        description: '32ダメージを与える',
        effect: async (s, t, e) => {
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(32));
            } else {
                t.takeDamage(s.calculateDamage(32), s);
            }
        },
        targetType: 'single',
        upgradeData: {
            description: '42ダメージを与える',
            baseDamage: 42,
            effect: async (s, t, e) => {
                if (e && e.dealDamageWithEffect) {
                    await e.dealDamageWithEffect(s, t, s.calculateDamage(42));
                } else {
                    t.takeDamage(s.calculateDamage(42), s);
                }
            }
        },
        baseDamage: 32,
        image: 'assets/images/cards/Bludgeon.png'
    }),
    IMPERVIOUS: new Card({
        id: 'impervious',
        name: '不動',
        cost: 2,
        type: 'skill',
        rarity: 'rare',
        description: '30ブロックを得る',
        effect: (s, t) => {
            s.addBlock(30);
        },
        targetType: 'self',
        upgradeData: {
            description: '40ブロックを得る',
            baseBlock: 40,
            effect: (s, t) => { s.addBlock(40); }
        },
        baseBlock: 30
    }),
    DEMON_FORM: new Card({
        id: 'demon_form',
        name: '悪魔化',
        cost: 3,
        type: 'power',
        rarity: 'rare',
        description: 'ターン開始時に筋力を2得る',
        effect: (s, t) => {
            s.addStatus('demon_form', 1); // 1スタック = 2筋力/ターンとする既存ロジック用
        },
        targetType: 'self',
        upgradeData: {
            description: 'ターン開始時に筋力を3得る',
            effect: (s, t) => { s.addStatus('demon_form_plus', 1); } // 強化版用フラグ
        }
    }),


    // Status (ステータスカード - 戦闘中のみ)
    WOUND: new Card({
        id: 'wound',
        name: '負傷',
        cost: -1,
        type: 'status',
        rarity: 'common',
        description: '使用できないカード。',
        isStatus: true,
        effect: (s, t) => {
            // 使用不可
        },
        targetType: 'self'
    }),
    DAZED: new Card({
        id: 'dazed',
        name: 'めまい',
        cost: -1,
        type: 'status',
        rarity: 'common',
        description: '使用できない。エセリアル。',
        isStatus: true,
        effect: (s, t) => {
            // 使用不可
        },
        targetType: 'self',
        isEthereal: true
    }),
    BURN: new Card({
        id: 'burn',
        name: '火傷',
        cost: -1,
        type: 'status',
        rarity: 'common',
        description: '使用できない。ターン終了時に手札にあると2ダメージ。',
        isStatus: true,
        effect: (s, t) => {
            // 使用不可
        },
        targetType: 'self'
    }),
    SLIMED: new Card({
        id: 'slimed',
        name: '粘液',
        cost: 1,
        type: 'status',
        rarity: 'common',
        description: '使用すると廃棄される。',
        isStatus: true,
        isExhaust: true,
        effect: (s, t) => {
            // 使用すると廃棄される（Card.playの共通処理でexhaustされる）
        },
        targetType: 'self'
    }),

    // Curse (呪いカード)
    INJURY: new Card({
        id: 'injury',
        name: '怪我',
        cost: -1,
        type: 'curse',
        rarity: 'curse',
        description: '消耗。何もしない。',
        effect: (s, t) => {
            // 何もしない
        },
        targetType: 'self'
    }),
    DOUBT: new Card({
        id: 'doubt',
        name: '疑念',
        cost: -1,
        type: 'curse',
        rarity: 'curse',
        description: '何もしない。',
        effect: (s, t) => {
            // 何もしない
        },
        targetType: 'self'
    }),
    REGRET: new Card({
        id: 'regret',
        name: '後悔',
        cost: -1,
        type: 'curse',
        rarity: 'curse',
        description: '何もしない。',
        effect: (s, t) => {
            // 何もしない
        },
        targetType: 'self'
    }),
    PARASITE: new Card({
        id: 'parasite',
        name: '寄生',
        cost: -1,
        type: 'curse',
        rarity: 'curse',
        description: 'この呪いはデッキから削除できない。',
        effect: (s, t) => {
            // 特殊処理: 削除不可
        },
        targetType: 'self'
    })
};

