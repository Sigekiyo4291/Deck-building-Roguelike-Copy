import { Enemy } from '../entity';

// タスクマスター
export class Taskmaster extends Enemy {
    constructor() {
        super('タスクマスター', 54, 'assets/images/characters/enemies/slime.png');
    }
    decideNextMove() {
        if (Math.random() < 0.6) {
            this.setNextMove({ type: 'attack', value: 7, name: '鞭打ち', effect: (e, p, eng) => eng.addCardsToDiscard('wound', 1) });
        } else {
            this.setNextMove({ type: 'buff', value: 0, name: '号令', effect: (e, p, eng) => eng.enemies.forEach(x => { if (!x.isDead()) x.addStatus('strength', 1); }) });
        }
    }
}
