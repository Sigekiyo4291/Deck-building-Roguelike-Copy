import { IntentType } from '../intent';
import { Enemy } from '../entity';

/**
 * ロメオ (Romeo)
 * HP: 37-38
 * 1ターン目: 未知 (セリフのみ)
 * 2ターン目以降偶数(2+3の倍数)ターン: 攻撃+デバフ (10ダメージ 脱力2)
 * 2ターン目以降奇数(3の倍数および1+3の倍数)ターン: 攻撃 (15ダメージ)
 */
export class Romeo extends Enemy {
    private turnCount: number = 0;

    constructor() {
        const hp = 37 + Math.floor(Math.random() * 2); // 37-38
        super('ロメオ', hp, 'assets/images/enemies/Romeo.png');
    }

    decideNextMove() {
        this.turnCount++;

        if (this.turnCount === 1) {
            // 1ターン目: 未知
            this.setNextMove({
                id: 'unknown',
                type: IntentType.Unknown,
                name: '未知',
                effect: () => {
                    console.log('Romeo: 「……行くぞ。」');
                }
            });
        } else if ((this.turnCount - 2) % 3 === 0) {
            // 2, 5, 8... ターン: 攻撃+デバフ (10ダメージ 脱力2)
            // ユーザー指定: 2ターン目以降偶数(2+3の倍数)ターン
            // 2, 5, 8, 11... 
            this.setNextMove({
                id: 'attack_debuff',
                type: IntentType.AttackDebuff,
                value: 10,
                name: '攻撃+デバフ',
                statusEffects: [{ type: 'weak', value: 2 }]
            });
        } else {
            // 3, 4, 6, 7... ターン: 攻撃 (15ダメージ)
            // ユーザー指定: 2ターン目以降奇数(3の倍数および1+3の倍数)ターン
            // 3, 4, 6, 7, 9, 10...
            this.setNextMove({
                id: 'attack',
                type: IntentType.Attack,
                value: 15,
                name: '攻撃'
            });
        }
    }
}
