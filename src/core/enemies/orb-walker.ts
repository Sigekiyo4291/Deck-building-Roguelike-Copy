import { Enemy } from '../entity';

// オーブウォーカー
export class OrbWalker extends Enemy {
    constructor() {
        super('オーブウォーカー', 90, 'assets/images/characters/enemies/slime.png');
    }
    decideNextMove() {
        if (Math.random() < 0.6) {
            this.setNextMove({ type: 'attack', value: 15, name: 'レーザー' });
        } else {
            this.setNextMove({
                type: 'attack_debuff', value: 10, name: '焼き印', effect: (e, p, eng) => {
                    // 仮の火傷の処理。既存関数でDiscardに生成
                    eng.addCardsToDiscard('burn', 1);
                }
            });
        }
    }
}
