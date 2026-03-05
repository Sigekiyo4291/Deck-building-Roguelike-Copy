import { IntentType } from '../intent';
import { Enemy } from '../entity';
import { CardLibrary } from '../card';

// リパルサー
export class Repulsor extends Enemy {
    constructor() {
        super('リパルサー', 35, 'assets/images/enemies/slime.png');
    }
    decideNextMove() {
        if (Math.random() < 0.5) this.setNextMove({ type: IntentType.Attack, value: 11, name: '攻撃' });
        else this.setNextMove({
            type: IntentType.Debuff, value: 0, name: 'めまい', effect: (e, p, eng) => {
                // めまいカードを山札に2枚追加
                eng.addCardToDrawPile(CardLibrary.DAZED.clone());
                eng.addCardToDrawPile(CardLibrary.DAZED.clone());
            }
        });
    }
}
