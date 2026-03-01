import { IntentType } from '../intent';
import { Enemy } from '../entity';

// スネッコ
export class Snecko extends Enemy {
    turnCount: number = 0;
    constructor() {
        super('スネッコ', 114 + Math.floor(Math.random() * 7), 'assets/images/enemies/slime.png');
    }
    decideNextMove() {
        this.turnCount++;
        if (this.turnCount === 1) {
            this.setNextMove({ type: IntentType.Debuff, value: 0, name: '混乱の凝視', effect: (e, p) => p.addStatus('confusion', 1) });
        } else {
            if (Math.random() < 0.4) {
                this.setNextMove({ type: IntentType.AttackDebuff, value: 8, name: 'テイルウィップ', effect: (self, player) => { player.addStatus('vulnerable', 2); player.addStatus('weak', 2); } });
            } else {
                this.setNextMove({ type: IntentType.Attack, value: 15, name: '噛みつき' });
            }
        }
    }
}
