import { IntentType } from '../intent';
import { Enemy } from '../entity';

/**
 * アシッドスライム(M)
 */
export class AcidSlimeM extends Enemy {
    history: any[];

    constructor() {
        super('アシッドスライム(M)', 28 + Math.floor(Math.random() * 5), 'assets/images/enemies/AcidSlimeM.png');
        this.history = [];
    }

    decideNextMove() {
        const roll = Math.random() * 100;
        const lastMove = this.history[this.history.length - 1];

        // 舐める (30%): 脱力1, 連続不可
        if (roll < 30 && lastMove !== 'lick') {
            this.setNextMove({
                id: 'lick',
                type: IntentType.Debuff,
                name: '舐める',
                statusEffects: [{ type: 'weak', value: 1 }],
                effect: (self, player) => player.addStatus('weak', 1)
            });
        } else if (roll < 60) {
            // 膿んだ一撃 (30%): 7ダメ + 粘液(TODO)
            this.setNextMove({
                id: 'tackle',
                type: IntentType.Attack,
                value: 7,
                name: '膿んだ一撃',
                effect: (self, player) => console.log('Slimed!') // 本来はカード追加
            });
        } else {
            // 攻撃 (40%)
            this.setNextMove({ id: 'attack', type: IntentType.Attack, value: 10, name: '体当たり' });
        }
        this.history.push(this.nextMove.id);
    }
}
