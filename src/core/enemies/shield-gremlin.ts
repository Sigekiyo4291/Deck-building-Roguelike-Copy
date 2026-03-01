import { IntentType } from '../intent';
import { Enemy } from '../entity';

/**
 * シールドグレムリン
 */
export class ShieldGremlin extends Enemy {
    constructor() {
        super('シールドグレムリン', 12 + Math.floor(Math.random() * 4), 'assets/images/enemies/slime.png');
    }

    decideNextMove(player?: any) {
        // 本当は engine が欲しいが、Enemy の定義では引数は player?: any のみ
        // 味方がいるかどうかは簡易的にランダム等で代替するか、参照の仕方を工夫する
        if (Math.random() < 0.5) {
            this.setNextMove({ type: IntentType.Attack, value: 6, name: '攻撃' });
        } else {
            this.setNextMove({
                type: IntentType.Defend, name: 'かばう',
                effect: (e, p, eng) => {
                    eng.enemies.forEach(x => {
                        if (!x.isDead()) x.addBlock(7);
                    });
                }
            });
        }
    }
}
