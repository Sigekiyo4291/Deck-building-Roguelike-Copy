import { Enemy } from '../entity';

/**
 * マッドグレムリン
 */
export class MadGremlin extends Enemy {
    constructor() {
        super('マッドグレムリン', 20 + Math.floor(Math.random() * 5), 'assets/images/characters/enemies/slime.png');
    }

    onBattleStart() {
        this.addStatus('angry', 1);
    }

    decideNextMove() {
        this.setNextMove({ type: 'attack', value: 4, name: '攻撃' });
    }
}
