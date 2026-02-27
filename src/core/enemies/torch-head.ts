import { Enemy } from '../entity';

// トーチヘッド
export class TorchHead extends Enemy {
    constructor() {
        super('トーチヘッド', 38, 'assets/images/characters/enemies/slime.png');
    }
    decideNextMove() {
        this.setNextMove({ type: 'attack', value: 7, name: '体当たり' });
    }
}
