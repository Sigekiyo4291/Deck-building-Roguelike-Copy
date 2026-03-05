import { IntentType } from '../intent';
import { Enemy } from '../entity';

/**
 * 赤の寄生虫 / 緑の寄生虫
 */
export class Louse extends Enemy {
    color: string;
    curlUpValue: number;
    hasCurledUp: boolean;
    fixedDamage: number;
    history: any[];

    constructor(color: any) {
        const hp = 10 + Math.floor(Math.random() * 8); // 10-17
        const name = color === 'red' ? '赤の寄生虫' : '緑の寄生虫';
        super(name, hp, 'assets/images/enemies/Louse.png');
        this.color = color;
        this.curlUpValue = 3 + Math.floor(Math.random() * 5); // 3-7
        this.hasCurledUp = false;
        this.fixedDamage = 5 + Math.floor(Math.random() * 3); // 5-7 (個体ごとに固定)
        this.history = [];
    }

    onBattleStart(player: any, engine: any) {
        super.onBattleStart(player, engine);
        this.addStatus('curl_up', this.curlUpValue);
        console.log(`${this.name} will curl up for ${this.curlUpValue} block.`);
    }

    takeDamage(amount: any, source: any) {
        return super.takeDamage(amount, source);
    }

    decideNextMove() {
        const roll = Math.random() * 100;
        if (roll < 75) {
            // 攻撃 (75%)
            this.setNextMove({ type: IntentType.Attack, value: this.fixedDamage, name: 'バイト' });
        } else {
            // 戦略 (25%)
            if (this.color === 'red') {
                this.setNextMove({
                    type: IntentType.Buff,
                    name: '成長',
                    effect: (self: any) => self.addStatus('strength', 3)
                });
            } else {
                this.setNextMove({
                    type: IntentType.Debuff,
                    name: 'スパイトウェブ',
                    effect: (self, player) => player.addStatus('weak', 2)
                });
            }
        }
    }
}
