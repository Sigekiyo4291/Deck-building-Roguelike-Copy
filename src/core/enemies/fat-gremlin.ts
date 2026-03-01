import { IntentType } from '../intent';
import { Enemy } from '../entity';

/**
 * 太っちょグレムリン
 */
export class FatGremlin extends Enemy {
    constructor() {
        super('太っちょグレムリン', 13 + Math.floor(Math.random() * 5), 'assets/images/characters/enemies/slime.png');
    }

    decideNextMove() {
        this.setNextMove({
            type: IntentType.AttackDebuff,
            value: 4,
            name: 'スマッシュ',
            effect: (self, player) => {
                player.addStatus('weak', 1);
                player.addStatus('vulnerable', 1);
            }
        });
    }
}
