import { Enemy } from '../entity';

/**
 * スニーキーグレムリン
 */
export class SneakyGremlin extends Enemy {
    constructor() {
        super('スニーキーグレムリン', 10 + Math.floor(Math.random() * 5), 'assets/images/characters/enemies/slime.png');
    }

    decideNextMove() {
        this.setNextMove({ type: 'attack', value: 9, name: '攻撃' });
    }
}
