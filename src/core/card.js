export class Card {
    constructor(id, name, cost, type, rarity, description, effect, targetType, isUpgraded = false, upgradeData = null, canPlayCheck = null, baseDamage = 0, damageCalculator = null, baseBlock = 0, blockCalculator = null) {
        this.id = id;
        this.baseName = name;
        this.name = name + (isUpgraded ? '+' : '');
        this.cost = cost;
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
    }

    getDamage(source, engine) {
        let base = this.baseDamage;
        if (this.damageCalculator) {
            base = this.damageCalculator(source, engine);
        }
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
        if (this.upgradeData.description) this.description = this.upgradeData.description;
        if (this.upgradeData.effect) this.effect = this.upgradeData.effect;
        if (this.upgradeData.name) this.name = this.upgradeData.name;
        if (this.upgradeData.baseDamage !== undefined) this.baseDamage = this.upgradeData.baseDamage;
        if (this.upgradeData.damageCalculator) this.damageCalculator = this.upgradeData.damageCalculator;
        if (this.upgradeData.baseBlock !== undefined) this.baseBlock = this.upgradeData.baseBlock;
        if (this.upgradeData.blockCalculator) this.blockCalculator = this.upgradeData.blockCalculator;
    }

    play(source, target, engine) {
        if (this.type === 'curse') return false;

        if (source.energy >= this.cost) {
            source.energy -= this.cost;

            if (this.targetType === 'all' && engine) {
                // 生存している全ての敵に効果を適用
                engine.enemies.forEach(enemy => {
                    if (!enemy.isDead()) {
                        this.effect(source, enemy, engine);
                    }
                });
            } else {
                this.effect(source, target, engine);
            }
            return true;
        }
        return false;
    }

    clone() {
        return new Card(
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
            this.blockCalculator
        );
    }
}

// カードライブラリ
export const CardLibrary = {
    // Basic
    STRIKE: new Card('strike', 'ストライク', 1, 'attack', 'basic', '6ダメージを与える', (s, t) => {
        t.takeDamage(s.calculateDamage(6), s);
    }, 'single', false, {
        description: '9ダメージを与える',
        baseDamage: 9,
        effect: (s, t) => { t.takeDamage(s.calculateDamage(9), s); }
    }, null, 6),
    DEFEND: new Card('defend', 'ディフェンド', 1, 'skill', 'basic', '5ブロックを得る', (s, t) => {
        s.addBlock(5);
    }, 'self', false, {
        description: '8ブロックを得る',
        baseBlock: 8,
        effect: (s, t) => { s.addBlock(8); }
    }, null, 0, null, 5),
    BASH: new Card('bash', '強打', 2, 'attack', 'basic', '8ダメージを与え、脆弱(2)を付与', (s, t) => {
        t.takeDamage(s.calculateDamage(8), s);
        t.addStatus('vulnerable', 2);
    }, 'single', false, {
        description: '10ダメージを与え、脆弱(3)を付与',
        baseDamage: 10,
        effect: (s, t) => {
            t.takeDamage(s.calculateDamage(10), s);
            t.addStatus('vulnerable', 3);
        }
    }, null, 8),

    // Common
    IRON_WAVE: new Card('iron_wave', 'アイアンウェーブ', 1, 'attack', 'common', '5ダメージを与え、5ブロックを得る', (s, t) => {
        t.takeDamage(s.calculateDamage(5), s);
        s.addBlock(5);
    }, 'single', false, {
        description: '7ダメージを与え、7ブロックを得る',
        baseDamage: 7,
        baseBlock: 7,
        effect: (s, t) => {
            t.takeDamage(s.calculateDamage(7), s);
            s.addBlock(7);
        }
    }, null, 5, null, 5),
    CLEAVE: new Card('cleave', 'なぎ払い', 1, 'attack', 'common', '全体に8ダメージを与える', (s, t) => {
        t.takeDamage(s.calculateDamage(8), s);
    }, 'all', false, {
        description: '全体に11ダメージを与える',
        baseDamage: 11,
        effect: (s, t) => {
            t.takeDamage(s.calculateDamage(11), s);
        }
    }, null, 8),
    CLASH: new Card('clash', 'クラッシュ', 0, 'attack', 'common', '14ダメージを与える。手札が全てアタック時のみ使用可能。', (s, t) => {
        t.takeDamage(s.calculateDamage(14), s);
    }, 'single', false, {
        description: '18ダメージを与える。',
        baseDamage: 18,
        effect: (s, t) => {
            t.takeDamage(s.calculateDamage(18), s);
        }
    }, (s, e) => {
        if (!e) return true;
        return e.player.hand.every(c => c.type === 'attack');
    }, 14),
    THUNDERCLAP: new Card('thunderclap', 'サンダークラップ', 1, 'attack', 'common', '全体に4ダメージを与え、脆弱(1)を付与。', (s, t) => {
        t.takeDamage(s.calculateDamage(4), s);
        t.addStatus('vulnerable', 1);
    }, 'all', false, {
        description: '全体に7ダメージを与え、脆弱(1)を付与。',
        baseDamage: 7,
        effect: (s, t) => {
            t.takeDamage(s.calculateDamage(7), s);
            t.addStatus('vulnerable', 1);
        }
    }, null, 4),
    SWORD_BOOMERANG: new Card('sword_boomerang', 'ソードブーメラン', 1, 'attack', 'common', '3ダメージを3回与える(対象ランダム)', (s, t) => {
        t.takeDamage(s.calculateDamage(3), s);
        t.takeDamage(s.calculateDamage(3), s);
        t.takeDamage(s.calculateDamage(3), s);
    }, 'random', false, {
        description: '3ダメージを4回与える(対象ランダム)',
        baseDamage: 3,
        effect: (s, t) => {
            for (let i = 0; i < 4; i++) t.takeDamage(s.calculateDamage(3), s);
        }
    }, null, 3),
    PERFECT_STRIKE: new Card('perfect_strike', 'パーフェクトストライク', 2, 'attack', 'common', '6ダメージ。デッキ内の「ストライク」1枚につき+2ダメージ。', (s, t, e) => {
        if (!e) return;
        const allCards = [...e.player.deck, ...e.player.hand, ...e.player.discard];
        const count = allCards.filter(c => c.name.includes('ストライク') || c.baseName.includes('ストライク')).length;
        t.takeDamage(s.calculateDamage(6 + count * 2), s);
    }, 'single', false, {
        description: '6ダメージ。デッキ内の「ストライク」1枚につき+3ダメージ。',
        damageCalculator: (s, e) => {
            if (!e) return 6;
            const allCards = [...e.player.deck, ...e.player.hand, ...e.player.discard];
            const count = allCards.filter(c => c.name.includes('ストライク') || c.baseName.includes('ストライク')).length;
            return 6 + count * 3;
        },
        effect: (s, t, e) => {
            if (!e) return;
            const allCards = [...e.player.deck, ...e.player.hand, ...e.player.discard];
            const count = allCards.filter(c => c.name.includes('ストライク') || c.baseName.includes('ストライク')).length;
            t.takeDamage(s.calculateDamage(6 + count * 3), s);
        }
    }, null, 6, (s, e) => {
        if (!e) return 6;
        const allCards = [...e.player.deck, ...e.player.hand, ...e.player.discard];
        const count = allCards.filter(c => c.name.includes('ストライク') || c.baseName.includes('ストライク')).length;
        return 6 + count * 2;
    }),
    TWIN_STRIKE: new Card('twin_strike', 'ツインストライク', 1, 'attack', 'common', '5ダメージを2回与える', (s, t) => {
        t.takeDamage(s.calculateDamage(5), s);
        t.takeDamage(s.calculateDamage(5), s);
    }, 'single', false, {
        description: '7ダメージを2回与える',
        baseDamage: 7,
        effect: (s, t) => {
            t.takeDamage(s.calculateDamage(7), s);
            t.takeDamage(s.calculateDamage(7), s);
        }
    }, null, 5),
    POMMEL_STRIKE: new Card('pommel_strike', 'ポンメルストライク', 1, 'attack', 'common', '9ダメージを与え、カードを1枚引く', (s, t, e) => {
        t.takeDamage(s.calculateDamage(9), s);
        if (e) e.drawCards(1);
    }, 'single', false, {
        description: '10ダメージを与え、カードを2枚引く',
        baseDamage: 10,
        effect: (s, t, e) => {
            t.takeDamage(s.calculateDamage(10), s);
            if (e) e.drawCards(2);
        }
    }, null, 9),
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
    }, null, 0, null, 8),
    CLOTHESLINE: new Card('clothesline', 'ラリアット', 2, 'attack', 'common', '12ダメージを与え、脱力(2)を付与', (s, t) => {
        t.takeDamage(s.calculateDamage(12), s);
        t.addStatus('weak', 2);
    }, 'single', false, {
        description: '14ダメージを与え、脱力(3)を付与',
        baseDamage: 14,
        effect: (s, t) => {
            t.takeDamage(s.calculateDamage(14), s);
            t.addStatus('weak', 3);
        }
    }, null, 12),

    // Uncommon
    UPPERCUT: new Card('uppercut', 'アッパーカット', 2, 'attack', 'uncommon', '13ダメージを与え、脱力(1)と脆弱(1)を付与', (s, t) => {
        t.takeDamage(s.calculateDamage(13), s);
        t.addStatus('weak', 1);
        t.addStatus('vulnerable', 1);
    }, 'single', false, {
        description: '13ダメージを与え、脱力(2)と脆弱(2)を付与',
        baseDamage: 13,
        effect: (s, t) => {
            t.takeDamage(s.calculateDamage(13), s);
            t.addStatus('weak', 2);
            t.addStatus('vulnerable', 2);
        }
    }, null, 13),
    INFLAME: new Card('inflame', '炎症', 1, 'power', 'uncommon', '筋力を2得る', (s, t) => {
        s.addStatus('strength', 2);
    }, 'self', false, {
        description: '筋力を3得る',
        effect: (s, t) => { s.addStatus('strength', 3); }
    }),
    WHIRLWIND: new Card('whirlwind', '旋風刃', 2, 'attack', 'uncommon', '全ての敵に8ダメージ', (s, t) => {
        t.takeDamage(s.calculateDamage(8), s);
    }, 'all', false, {
        description: '全ての敵に14ダメージ',
        baseDamage: 14,
        effect: (s, t) => { t.takeDamage(s.calculateDamage(14), s); }
    }, null, 8),
    METALLICIZE: new Card('metallicize', '金属音', 1, 'power', 'uncommon', 'ターン終了時に3ブロックを得る', (s, t) => {
        s.addStatus('metallicize', 3);
    }, 'self', false, {
        description: 'ターン終了時に4ブロックを得る',
        effect: (s, t) => { s.addStatus('metallicize', 4); }
    }),

    // Rare
    BLUDGEON: new Card('bludgeon', 'ヘビーストライク', 3, 'attack', 'rare', '32ダメージを与える', (s, t) => {
        t.takeDamage(s.calculateDamage(32), s);
    }, 'single', false, {
        description: '42ダメージを与える',
        baseDamage: 42,
        effect: (s, t) => { t.takeDamage(s.calculateDamage(42), s); }
    }, null, 32),
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
    REAPER: new Card('reaper', '死神', 2, 'attack', 'rare', '全体に4ダメージを与え、HP回復(仮)', (s, t) => {
        t.takeDamage(s.calculateDamage(4), s);
    }, 'all', false, {
        description: '全体に5ダメージを与え、HP回復(仮)',
        baseDamage: 5,
        effect: (s, t) => { t.takeDamage(s.calculateDamage(5), s); }
    }, null, 4),

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

