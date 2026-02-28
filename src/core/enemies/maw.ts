import { IntentType } from '../intent';
import { Enemy } from '../entity';

// モー
export class Maw extends Enemy {
    turnCount: number = 0;
    constructor() {
        super('モー', 300, 'assets/images/characters/enemies/slime.png');
    }
    decideNextMove() {
        this.turnCount++;
        if (this.turnCount === 1) {
            this.setNextMove({ type: IntentType.Buff, value: 0, name: '咆哮', effect: e => e.addStatus('strength', 3) });
        } else if (Math.random() < 0.5) {
            this.setNextMove({ type: IntentType.Attack, value: 25, name: '噛みつき' });
        } else {
            this.setNextMove({ type: IntentType.Attack, value: 5, multi: 5, name: 'よだれ' });
        }
    }
}
