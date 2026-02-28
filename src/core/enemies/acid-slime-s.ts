import { IntentType } from '../intent';
import { Enemy } from '../entity';

/**
 * アシッドスライム(S)
 */
export class AcidSlimeS extends Enemy {
    isFirstTurn: boolean;

    constructor() {
        super('アシッドスライム(S)', 8 + Math.floor(Math.random() * 5), 'assets/images/enemies/AcidSlimeS.png');
        this.isFirstTurn = true;
    }

    decideNextMove() {
        if (this.isFirstTurn) {
            this.setNextMove({
                type: IntentType.Debuff,
                name: '舐める',
                effect: (self, player) => player.addStatus('weak', 1)
            });
            this.isFirstTurn = false;
        } else {
            this.setNextMove({ type: IntentType.Attack, value: 3, name: '体当たり' });
        }
    }
}
