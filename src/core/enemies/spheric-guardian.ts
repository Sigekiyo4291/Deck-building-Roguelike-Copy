import { IntentType } from '../intent';
import { Enemy } from '../entity';

/**
 * スフィアガーディアン
 */
export class SphericGuardian extends Enemy {
    turnCount: number = 0;

    constructor() {
        super('スフィアガーディアン', 20, 'assets/images/characters/enemies/slime.png');
    }

    onBattleStart() {
        this.addStatus('barricade', 1);
        this.addStatus('artifact', 3);
        this.addBlock(40);
    }

    decideNextMove() {
        this.turnCount++;
        if (this.turnCount === 1) {
            this.setNextMove({ type: IntentType.Defend, value: 25, name: '防御' });
        } else if (this.turnCount === 2) {
            this.setNextMove({ type: IntentType.AttackDebuff, value: 10, name: '攻撃+戦略', statuses: [{ id: 'frail', value: 5 }] });
        } else if (this.turnCount % 2 === 1) {
            this.setNextMove({ type: IntentType.Attack, value: 10, times: 2, name: '攻撃' });
        } else {
            this.setNextMove({ type: IntentType.AttackDefend, value: 10, block: 15, name: '攻撃+防御' });
        }
    }
}
