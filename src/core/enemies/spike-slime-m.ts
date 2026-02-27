import { Enemy } from '../entity';

/**
 * スパイクスライム(M)
 */
export class SpikeSlimeM extends Enemy {
    history: any[];

    constructor() {
        super('スパイクスライム(M)', 28 + Math.floor(Math.random() * 5), 'assets/images/enemies/SpikeSlimeM.png');
        this.history = [];
    }

    decideNextMove() {
        const roll = Math.random() * 100;
        const lastMove = this.history[this.history.length - 1];

        // 舐める (70%): 脆弱化1
        if (roll < 70 && lastMove !== 'lick') {
            this.setNextMove({
                id: 'lick',
                type: 'debuff',
                name: '舐める',
                effect: (self, player) => player.addStatus('vulnerable', 1)
            });
        } else {
            // 炎の体当たり (30%): 8ダメ + 粘液(TODO)
            this.setNextMove({
                id: 'tackle',
                type: 'attack',
                value: 8,
                name: '炎の体当たり'
            });
        }
        this.history.push(this.nextMove.id);
    }
}
