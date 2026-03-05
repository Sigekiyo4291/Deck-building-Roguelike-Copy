import { IntentType } from '../intent';
import { Enemy } from '../entity';

/**
 * ベア (Bear)
 * HP: 38-41
 * 1ターン目: 強デバフ (敏捷-2)
 * 2ターン目以降偶数ターン: 攻撃+防御 (9ダメージ 9ブロック)
 * 2ターン目以降奇数ターン: 攻撃 (18ダメージ)
 */
export class Bear extends Enemy {
    private turnCount: number = 0;

    constructor() {
        const hp = 38 + Math.floor(Math.random() * 4); // 38-41
        super('ベア', hp, 'assets/images/enemies/Bear.png');
    }

    decideNextMove() {
        this.turnCount++;

        if (this.turnCount === 1) {
            // 1ターン目: 強デバフ (敏捷-2)
            this.setNextMove({
                id: 'debuff',
                type: IntentType.Debuff,
                name: '強デバフ',
                statusEffects: [{ type: 'dexterity', value: -2 }]
            });
        } else if (this.turnCount % 2 === 0) {
            // 2, 4, 6... ターン: 攻撃+防御 (9ダメージ 9ブロック)
            this.setNextMove({
                id: 'attack_defend',
                type: IntentType.AttackDefend,
                value: 9,
                name: '攻撃+防御',
                effect: (self: any) => {
                    self.addBlock(9);
                }
            });
        } else {
            // 3, 5, 7... ターン: 攻撃 (18ダメージ)
            this.setNextMove({
                id: 'attack',
                type: IntentType.Attack,
                value: 18,
                name: '攻撃'
            });
        }
    }
}
