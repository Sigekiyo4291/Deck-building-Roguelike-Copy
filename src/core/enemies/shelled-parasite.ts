import { IntentType } from '../intent';
import { Enemy } from '../entity';

// ヤドカリパラサイト
export class ShelledParasite extends Enemy {
    stunned: boolean = false;
    constructor() {
        super('ヤドカリパラサイト', 68 + Math.floor(Math.random() * 5), 'assets/images/enemies/slime.png');
    }
    onBattleStart() {
        this.addStatus('plated_armor', 14);
    }
    decideNextMove() {
        if (this.getStatusValue('plated_armor') === 0 && !this.stunned) {
            this.stunned = true;
            this.setNextMove({ type: IntentType.Stun, value: 0, name: '気絶' });
            return;
        }
        this.stunned = false;

        const rand = Math.random();
        // 攻撃(40%), 攻撃+バフ(40%), 攻撃+デバフ(20%)
        if (rand < 0.4) {
            this.setNextMove({ type: IntentType.Attack, value: 6, name: '攻撃' });
        } else if (rand < 0.8) {
            this.setNextMove({
                type: IntentType.AttackHeal, value: 10, name: '吸血',
                effect: (enemy, player: any, engine: any) => {
                    const dealt = (enemy as any).lastDamageDealt || 0;
                    if (dealt > 0) enemy.heal(dealt);
                }
            });
        } else {
            this.setNextMove({ type: IntentType.AttackDebuff, value: 18, name: 'スマッシュ', effect: (self, player) => player.addStatus('vulnerable', 2) });
        }
    }
}
