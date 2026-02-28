import { IntentType } from '../intent';
import { Enemy } from '../entity';

// リパルサー
export class Repulsor extends Enemy {
    constructor() {
        super('リパルサー', 35, 'assets/images/characters/enemies/slime.png');
    }
    decideNextMove() {
        if (Math.random() < 0.5) this.setNextMove({ type: IntentType.Attack, value: 11, name: '攻撃' });
        else this.setNextMove({
            type: IntentType.Debuff, value: 0, name: 'めまい', effect: (e, p, eng) => {
                // モック状態異常「めまい」を作成して追加
                const dazed = { id: 'dazed', name: 'めまい', type: 'status', cost: -1, description: '使用不能。さらに無益。エセリアル。', isEthereal: true, play: () => { } };
                eng.addCardToDrawPile(dazed);
                eng.addCardToDrawPile(dazed);
            }
        });
    }
}
