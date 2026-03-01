import { IntentType } from '../intent';
import { Enemy } from '../entity';

// 選ばれし者
export class Chosen extends Enemy {
    turnCount: number = 0;
    constructor() {
        super('選ばれし者', 95 + Math.floor(Math.random() * 5), 'assets/images/characters/enemies/slime.png');
    }
    decideNextMove() {
        this.turnCount++;
        if (this.turnCount === 1) {
            this.setNextMove({ type: IntentType.Attack, value: 5, times: 2, name: '攻撃' });
        } else if (this.turnCount === 2) {
            this.setNextMove({
                type: IntentType.Debuff, value: 0, name: '呪詛',
                effect: (enemy, player) => player.addStatus('hex', 1)
            });
        } else {
            const rand = Math.random();
            if (this.turnCount % 2 === 0) {
                if (rand < 0.6) this.setNextMove({ type: IntentType.Attack, value: 5, times: 2, name: '攻撃' });
                else this.setNextMove({ type: IntentType.Attack, value: 18, name: '強攻撃' });
            } else {
                if (rand < 0.5) {
                    this.setNextMove({ type: IntentType.AttackDebuff, value: 10, name: '弱体化', effect: (self, player) => player.addStatus('vulnerable', 2) });
                } else {
                    this.setNextMove({
                        type: IntentType.Debuff, value: 0, name: 'ドレイン',
                        effect: (enemy, player) => {
                            player.addStatus('weak', 3);
                            enemy.addStatus('strength', 3);
                        }
                    });
                }
            }
        }
    }
}
