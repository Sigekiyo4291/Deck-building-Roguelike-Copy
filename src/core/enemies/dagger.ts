import { IntentType } from '../intent';
import { Enemy } from '../entity';

// ダガー
export class Dagger extends Enemy {
    turnCount: number = 0;
    constructor() { super('ダガー', 25, 'assets/images/enemies/slime.png'); }
    decideNextMove() {
        this.turnCount++;
        // 1ターン目: 9ダメージ, 2ターン目: 自爆 (25ダメージ)
        if (this.turnCount === 1) this.setNextMove({ type: IntentType.Attack, value: 9, name: '急所突き' });
        else this.setNextMove({ type: IntentType.Attack, value: 25, name: '自爆', effect: e => e.hp = 0 });
    }
}
