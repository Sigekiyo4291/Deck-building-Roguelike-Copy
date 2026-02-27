import { Enemy } from '../entity';

// 刺創の本
export class BookOfStabbing extends Enemy {
    attackTimes: number = 1;
    constructor() {
        super('刺創の本', 160, 'assets/images/characters/enemies/slime.png');
    }
    onBattleStart() {
        this.addStatus('painful_stabs', 1);
    }
    decideNextMove() {
        if (Math.random() < 0.8) {
            this.setNextMove({ type: 'attack', value: 6, multi: this.attackTimes, name: '連続刺し' });
            this.attackTimes++;
        } else {
            this.setNextMove({ type: 'attack', value: 21, name: '強刺し' });
        }
    }
}
