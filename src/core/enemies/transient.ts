import { IntentType } from '../intent';
import { Enemy } from '../entity';

// 消えゆくもの
export class Transient extends Enemy {
    turnCount: number = 0;
    baseDamage: number = 30;
    constructor() {
        super('消えゆくもの', 999, 'assets/images/characters/enemies/slime.png');
    }
    onBattleStart() {
        this.addStatus('fading', 6); // 1ターン目で次とカウントされるため
    }
    decideNextMove() {
        this.turnCount++;
        this.baseDamage = 30 + (this.turnCount - 1) * 10;
        this.setNextMove({ type: IntentType.Attack, value: this.baseDamage, name: '攻撃' });
    }
    takeDamage(damage: number, source?: any, engine?: any): number {
        const dealt = super.takeDamage(damage, source, engine);
        if (dealt > 0) this.addStatus('strength', -dealt);
        return dealt;
    }
    updateStatusAtTurnStart() {
        super.updateStatusAtTurnStart();
        const currentStrength = this.getStatusValue('strength');
        if (currentStrength < 0) this.addStatus('strength', -currentStrength);
    }
}
