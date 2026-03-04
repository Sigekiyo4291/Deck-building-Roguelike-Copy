import { IntentType } from '../intent';
import { Enemy } from '../entity';

/**
 * ポインティ (Pointy)
 * HP: 27-30
 * 攻撃: 5x2ダメージ
 */
export class Pointy extends Enemy {
    constructor() {
        const hp = 27 + Math.floor(Math.random() * 4); // 27-30
        super('ポインティ', hp, 'assets/images/enemies/Pointy.png');
    }

    decideNextMove() {
        // 常に 5x2 ダメージ
        this.setNextMove({
            id: 'attack',
            type: IntentType.Attack,
            value: 5,
            times: 2,
            name: '攻撃'
        });
    }
}
