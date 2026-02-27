import { Enemy } from '../entity';

// ヤドカリパラサイト
export class ShelledParasite extends Enemy {
    stunned: boolean = false;
    constructor() {
        super('ヤドカリパラサイト', 68 + Math.floor(Math.random() * 5), 'assets/images/characters/enemies/slime.png');
    }
    onBattleStart() {
        this.addStatus('plated_armor', 14);
    }
    decideNextMove() {
        if (this.getStatusValue('plated_armor') === 0 && !this.stunned) {
            this.stunned = true;
            this.setNextMove({ type: 'stun', value: 0, name: '気絶' });
            return;
        }
        this.stunned = false;

        const rand = Math.random();
        // 攻撃(40%), 攻撃+バフ(40%), 攻撃+デバフ(20%)
        if (rand < 0.4) {
            this.setNextMove({ type: 'attack', value: 6, name: '攻撃' });
        } else if (rand < 0.8) {
            this.setNextMove({
                type: 'attack_heal', value: 10, name: '吸血',
                effect: (enemy, player, engine) => {
                    const dealt = (enemy as any).lastDamageDealt || 0;
                    if (dealt > 0) enemy.heal(dealt);
                }
            });
        } else {
            this.setNextMove({ type: 'attack_debuff', value: 18, name: 'スマッシュ', statuses: [{ id: 'vulnerable', value: 2 }] });
        }
    }
}
