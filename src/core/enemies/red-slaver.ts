import { IntentType } from '../intent';
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
                type: IntentType.Debuff,
                name: '絡めとる',
                effect: (self, player) => {
                    player.addStatus('entangled', 1);
                    this.hasEntangled = true;
                }
            });
        } else if (roll < 50 && lastMove !== 'scrape') {
            this.setNextMove({ id: 'scrape', type: IntentType.AttackDebuff, value: 8, name: '引っ掻き', effect: (self, player) => player.addStatus('vulnerable', 1) });
        } else {
            this.setNextMove({ id: 'stab', type: IntentType.Attack, value: 13, name: '突き' });
        }
        if (this.nextMove) {
            this.history.push(this.nextMove.id);
        }
    }
}
