import { Enemy } from '../entity';

// エクスプローダー
export class Exploder extends Enemy {
    turnCount: number = 0;
    constructor() {
        super('エクスプローダー', 30, 'assets/images/characters/enemies/slime.png');
    }
    decideNextMove() {
        this.turnCount++;
        if (this.turnCount >= 3) {
            this.setNextMove({ type: 'attack', value: 30, name: '自爆', effect: e => e.hp = 0 });
        } else {
            this.setNextMove({ type: 'attack', value: 9, name: '攻撃' });
        }
    }
}
