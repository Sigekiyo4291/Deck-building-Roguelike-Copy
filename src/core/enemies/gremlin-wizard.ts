import { IntentType } from '../intent';
import { Enemy } from '../entity';

/**
 * グレムリンウィザード
 */
export class GremlinWizard extends Enemy {
    turnCount: number = 0;

    constructor() {
        super('グレムリンウィザード', 21 + Math.floor(Math.random() * 5), 'assets/images/enemies/slime.png');
    }

    decideNextMove() {
        this.turnCount++;
        // 1-2ターン目に使用、攻撃後3回使用し再度攻撃
        // ターン3, 7, 11...で攻撃
        if (this.turnCount % 4 === 3) {
            this.setNextMove({ type: IntentType.Attack, value: 25, name: 'アルティメットブラスト' });
        } else {
            this.setNextMove({ type: IntentType.Special, value: 0, name: 'チャージ' });
        }
    }
}
