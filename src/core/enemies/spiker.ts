import { IntentType } from '../intent';
import { Enemy } from '../entity';

// スパイカー
export class Spiker extends Enemy {
    constructor() {
        super('スパイカー', 42, 'assets/images/enemies/slime.png');
    }
    onBattleStart() {
        this.addStatus('thorns', 3);
    }
    decideNextMove() {
        if (Math.random() < 0.5) {
            this.setNextMove({ type: IntentType.Attack, value: 7, name: '攻撃' });
        } else {
            this.setNextMove({ type: IntentType.Buff, value: 0, name: 'トゲ', effect: e => e.addStatus('thorns', 2) });
        }
    }
}
