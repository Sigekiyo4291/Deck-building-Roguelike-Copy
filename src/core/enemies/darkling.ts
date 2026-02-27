import { Enemy } from '../entity';

// ダークリング
export class Darkling extends Enemy {
    constructor() {
        super('ダークリング', 48, 'assets/images/characters/enemies/slime.png');
    }
    decideNextMove() {
        const rand = Math.random();
        if (rand < 0.4) this.setNextMove({ type: 'attack', value: 8, name: '噛みつき' });
        else if (rand < 0.8) this.setNextMove({ type: 'attack', value: 8, multi: 2, name: '連続噛みつき' });
        else this.setNextMove({ type: 'defend', value: 12, name: '硬化' });
    }
}
