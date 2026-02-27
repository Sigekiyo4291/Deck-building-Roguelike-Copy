import { Enemy } from '../entity';

// ブロンズ・オートマトン
export class BronzeAutomaton extends Enemy {
    turnCount: number = 0;
    constructor() {
        super('ブロンズ・オートマトン', 300, 'assets/images/characters/enemies/slime.png');
    }
    onBattleStart() {
        this.addStatus('artifact', 3);
    }
    decideNextMove() {
        this.turnCount++;
        if (this.turnCount % 6 === 5) {
            this.setNextMove({ type: 'buff', value: 0, name: 'ハイパービーム準備' });
        } else if (this.turnCount % 6 === 0) {
            this.setNextMove({ type: 'attack', value: 45, name: 'ハイパービーム' });
        } else {
            if (this.turnCount === 1) this.setNextMove({ type: 'buff', value: 0, name: '力溜め', effect: e => e.addStatus('strength', 3) });
            else if (Math.random() < 0.6) this.setNextMove({ type: 'attack', value: 11, multi: 2, name: '連撃' });
            else this.setNextMove({ type: 'attack', value: 15, name: '一撃' });
        }
    }
}
