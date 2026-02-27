import { Enemy } from '../entity';

/**
 * スレイバー(赤)
 */
export class RedSlaver extends Enemy {
    history: any[];
    hasEntangled: boolean;

    constructor() {
        super('スレイバー(赤)', 46 + Math.floor(Math.random() * 5), 'assets/images/enemies/RedSlaver.png');
        this.history = [];
        this.hasEntangled = false;
    }

    decideNextMove() {
        const turn = this.history.length + 1;
        const roll = Math.random() * 100;
        const lastMove = this.history[this.history.length - 1];

        if (turn > 1 && !this.hasEntangled && roll < 25) {
            this.setNextMove({
                id: 'entangle',
                type: 'debuff',
                name: '絡めとる',
                statusEffects: [{ type: 'entangled', value: 1 }],
                effect: (self, player) => {
                    player.addStatus('entangled', 1);
                    this.hasEntangled = true;
                }
            });
        } else if (roll < 50 && lastMove !== 'scrape') {
            this.setNextMove({ id: 'scrape', type: 'attack', value: 8, name: '引っ掻き', statusEffects: [{ type: 'vulnerable', value: 1 }], effect: (self, player) => player.addStatus('vulnerable', 1) });
        } else {
            this.setNextMove({ id: 'stab', type: 'attack', value: 13, name: '突き' });
        }
        this.history.push(this.nextMove.id);
    }
}
