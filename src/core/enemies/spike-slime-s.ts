import { IntentType } from '../intent';
import { Enemy } from '../entity';

/**
 * スパイクスライム(S)
 */
export class SpikeSlimeS extends Enemy {
    constructor() {
        super('スパイクスライム(S)', 10 + Math.floor(Math.random() * 5), 'assets/images/enemies/SpikeSlimeS.png');
    }

    decideNextMove() {
        this.setNextMove({ type: IntentType.Attack, value: 5, name: '体当たり' });
    }
}
