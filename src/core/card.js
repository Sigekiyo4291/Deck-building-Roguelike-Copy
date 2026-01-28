export class Card {
    constructor(id, name, cost, type, rarity, description, effect, targetType) {
        this.id = id;
        this.name = name;
        this.cost = cost;
        this.type = type; // 'attack', 'skill', 'power'
        this.rarity = rarity; // 'basic', 'common', 'uncommon', 'rare'
        this.description = description;
        this.effect = effect; // 関数: (source, target) => { ... }

        if (targetType) {
            this.targetType = targetType;
        } else {
            // デフォルト: アタックは単体、その他は自分（または対象指定なし）
            this.targetType = (type === 'attack') ? 'single' : 'self';
        }
    }

    play(source, target, engine) {
        if (source.energy >= this.cost) {
            source.energy -= this.cost;
            this.effect(source, target, engine);
            return true;
        }
        return false;
    }

    clone() {
        return new Card(this.id, this.name, this.cost, this.type, this.rarity, this.description, this.effect, this.targetType);
    }
}

// カードライブラリ
export const CardLibrary = {
    // Basic
    STRIKE: new Card('strike', 'ストライク', 1, 'attack', 'basic', '6ダメージを与える', (s, t) => {
        t.takeDamage(s.calculateDamage(6));
    }),
    DEFEND: new Card('defend', 'ディフェンド', 1, 'skill', 'basic', '5ブロックを得る', (s, t) => {
        s.addBlock(5);
    }),
    BASH: new Card('bash', '強打', 2, 'attack', 'basic', '8ダメージを与え、脆弱(2)を付与', (s, t) => {
        t.takeDamage(s.calculateDamage(8));
        t.addStatus('vulnerable', 2);
    }),

    // Common
    IRON_WAVE: new Card('iron_wave', '鉄の波', 1, 'attack', 'common', '5ダメージを与え、5ブロックを得る', (s, t) => {
        t.takeDamage(s.calculateDamage(5));
        s.addBlock(5);
    }),
    SWORD_BOOMERANG: new Card('sword_boomerang', 'ソードブーメラン', 1, 'attack', 'common', '3ダメージを3回与える(対象ランダム)', (s, t) => {
        // 現在は敵が単体なので、単体に3回
        t.takeDamage(s.calculateDamage(3));
        t.takeDamage(s.calculateDamage(3));
        t.takeDamage(s.calculateDamage(3));
    }, 'random'),
    TWIN_STRIKE: new Card('twin_strike', 'ツインストライク', 1, 'attack', 'common', '5ダメージを2回与える', (s, t) => {
        t.takeDamage(s.calculateDamage(5));
        t.takeDamage(s.calculateDamage(5));
    }),
    POMMEL_STRIKE: new Card('pommel_strike', 'ポンメルストライク', 1, 'attack', 'common', '9ダメージを与え、カードを1枚引く', (s, t, e) => {
        t.takeDamage(s.calculateDamage(9));
        if (e) e.drawCards(1);
    }),
    SHRUG_IT_OFF: new Card('shrug_it_off', '受け流し', 1, 'skill', 'common', '8ブロックを得て、カードを1枚引く', (s, t, e) => {
        s.addBlock(8);
        if (e) e.drawCards(1);
    }),

    // Uncommon
    UPPERCUT: new Card('uppercut', 'アッパーカット', 2, 'attack', 'uncommon', '13ダメージを与え、弱体(1)を与える', (s, t) => {
        t.takeDamage(s.calculateDamage(13));
        t.addStatus('vulnerable', 1);
        // 脱力（Weak）は未実装のため省略
    }),
    INFLAME: new Card('inflame', '炎症', 1, 'power', 'uncommon', '筋力を2得る', (s, t) => {
        s.addStatus('strength', 2);
    }),
    WHIRLWIND: new Card('whirlwind', '旋風刃', 2, 'attack', 'uncommon', '全ての敵に8ダメージ(仮:2コスト)', (s, t) => {
        t.takeDamage(s.calculateDamage(8)); // 将来的には全体攻撃
    }, 'all'),
    METALLICIZE: new Card('metallicize', '金属音', 1, 'power', 'uncommon', 'ターン終了時に3ブロックを得る(未実装)', (s, t) => {
        s.addStatus('metallicize', 3);
    }),

    // Rare
    BLUDGEON: new Card('bludgeon', 'ヘビーストライク', 3, 'attack', 'rare', '32ダメージを与える', (s, t) => {
        t.takeDamage(s.calculateDamage(32));
    }),
    IMPERVIOUS: new Card('impervious', '不動', 2, 'skill', 'rare', '30ブロックを得る', (s, t) => {
        s.addBlock(30);
    }),
    DEMON_FORM: new Card('demon_form', '悪魔化', 3, 'power', 'rare', 'ターン開始時に筋力を2得る(未実装)', (s, t) => {
        s.addStatus('demon_form', 1);
    }),
    REAPER: new Card('reaper', '死神', 2, 'attack', 'rare', '全体に4ダメージを与え、未ブロック分のHP回復(未実装)', (s, t) => {
        t.takeDamage(s.calculateDamage(4));
        console.log('HP回復は未実装');
    }, 'all')
};
