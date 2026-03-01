import { IntentType } from '../intent';
import { Enemy } from '../entity';

/**
 * スレイバー(青)
 */
export class BlueSlaver extends Enemy {
    history: any[];

    constructor() {
        super('スレイバー(青)', 46 + Math.floor(Math.random() * 5), 'assets/images/enemies/BlueSlaver.png');
        this.history = [];
    }

    decideNextMove() {
        const roll = Math.random() * 100;
        const lastMove = this.history[this.history.length - 1];

        if (roll < 40 && lastMove !== 'rake') {
            this.setNextMove({ id: 'rake', type: IntentType.Attack, value: 7, name: 'レーキ', effect: (self, player) => player.addStatus('weak', 1) });
        } else {
            this.setNextMove({ id: 'stab', type: IntentType.Attack, value: 12, name: '突き' });
        }
        this.history.push(this.nextMove.id);
    }
}
