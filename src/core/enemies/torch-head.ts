import { IntentType } from '../intent';
import { Enemy } from '../entity';

// トーチヘッド
export class TorchHead extends Enemy {
    constructor() {
        super('トーチヘッド', 38, 'assets/images/enemies/slime.png');
    }
    decideNextMove() {
        this.setNextMove({ type: IntentType.Attack, value: 7, name: '体当たり' });
    }
}
