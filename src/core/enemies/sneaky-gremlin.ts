import { IntentType } from '../intent';
import { Enemy } from '../entity';

/**
 * スニーキーグレムリン
 */
export class SneakyGremlin extends Enemy {
    constructor() {
        super('スニーキーグレムリン', 10 + Math.floor(Math.random() * 5), 'assets/images/enemies/slime.png');
    }

    decideNextMove() {
        this.setNextMove({ type: IntentType.Attack, value: 9, name: '攻撃' });
    }
}
