export class Card {
    constructor(id, name, cost, type, description, effect) {
        this.id = id;
        this.name = name;
        this.cost = cost;
        this.type = type; // 'attack', 'skill', 'power'
        this.description = description;
        this.effect = effect; // 関数: (source, target) => { ... }
    }

    play(source, target) {
        if (source.energy >= this.cost) {
            source.energy -= this.cost;
            this.effect(source, target);
            return true;
        }
        return false;
    }

    clone() {
        return new Card(this.id, this.name, this.cost, this.type, this.description, this.effect);
    }
}

// 初期カードセットの定義
export const CardLibrary = {
    STRIKE: new Card('strike', 'ストライク', 1, 'attack', '6ダメージを与える', (s, t) => {
        t.takeDamage(6);
    }),
    DEFEND: new Card('defend', 'ディフェンド', 1, 'skill', '5ブロックを得る', (s, t) => {
        s.addBlock(5);
    }),
    BASH: new Card('bash', '強打', 2, 'attack', '10ダメージを与え、脆弱(2)を付与', (s, t) => {
        t.takeDamage(10);
        // TODO: 状態異常の実装
    })
};
