import { Enemy } from '../entity';

// ネメシス
export class Nemesis extends Enemy {
    turnCount: number = 0;
    constructor() { super('ネメシス', 200, 'assets/images/characters/enemies/slime.png'); }
    updateStatusAtTurnStart() {
        super.updateStatusAtTurnStart();
        this.turnCount++;
        if (this.turnCount % 2 === 1) this.addStatus('intangible', 1);
    }
    decideNextMove() {
        if (Math.random() < 0.5) this.setNextMove({ type: 'attack', value: 45, name: '大鎌' });
        else this.setNextMove({ type: 'attack_debuff', value: 7, multi: 3, name: '連撃', effect: (e, p, eng) => eng.addCardsToDiscard('burn', 3) });
    }
}
