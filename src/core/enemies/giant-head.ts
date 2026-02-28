import { IntentType } from '../intent';
import { Enemy } from '../entity';

// ジャイアントヘッド
export class GiantHead extends Enemy {
    turnCount: number = 0;
    constructor() { super('ジャイアントヘッド', 500, 'assets/images/characters/enemies/slime.png'); }
    onBattleStart() { this.addStatus('slow', 1); }
    decideNextMove() {
        this.turnCount++;
        if (this.turnCount <= 4) {
            this.setNextMove({ type: IntentType.AttackDebuff, value: 13, name: 'カウントダウン', statuses: [{ id: 'weak', value: 1 }] });
        } else {
            const damage = 30 + (this.turnCount - 5) * 10;
            this.setNextMove({ type: IntentType.Attack, value: damage, name: 'It is Time' });
        }
    }
}
