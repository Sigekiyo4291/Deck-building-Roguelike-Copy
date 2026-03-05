import { IntentType } from '../intent';
import { Enemy } from '../entity';
import { IEntity, IBattleEngine } from '../types';

/**
 * スパイクスライム(M)
 */
export class SpikeSlimeM extends Enemy {
    history: any[];

    constructor() {
        super('スパイクスライム(M)', 28 + Math.floor(Math.random() * 5), 'assets/images/enemies/SpikeSlimeM.png');
        this.history = [];
    }

    decideNextMove(player?: IEntity, engine?: IBattleEngine) {
        const roll = Math.random() * 100;
        const lastMove = this.history[this.history.length - 1];

        // 舐める (70%): 脆弱化1
        if (roll < 70 && lastMove !== 'lick') {
            this.setNextMove({
                id: 'lick',
                type: IntentType.Debuff,
                name: '舐める',
                effect: (self: any, player: any) => player.addStatus('vulnerable', 1)
            });
        } else {
            // 炎の体当たり (30%): 8ダメ + 粘液(TODO)
            this.setNextMove({
                id: 'tackle',
                type: IntentType.Attack,
                value: 8,
                name: '炎の体当たり'
            });
        }
        if (this.nextMove) {
            this.history.push((this.nextMove as any).id);
        }
    }
}
