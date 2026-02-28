import { IntentType } from '../intent';
import { Enemy } from '../entity';

/**
 * 狂信者
 */
export class Cultist extends Enemy {
    isFirstTurn: boolean;

    constructor() {
        super('狂信者', 48 + Math.floor(Math.random() * 7), 'assets/images/enemies/Cultist.png');
        this.isFirstTurn = true;
    }

    decideNextMove() {
        if (this.isFirstTurn) {
            this.setNextMove({
                type: IntentType.Buff,
                name: '儀式',
                effect: (self) => {
                    self.addStatus('ritual', 3);
                    console.log('Cultist uses Incantation! Thine end is near!');
                }
            });
            this.isFirstTurn = false;
        } else {
            this.setNextMove({ type: IntentType.Attack, value: 6, name: 'ダークストライク' });
        }
    }
}
