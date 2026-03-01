import { IntentType } from '../intent';
import { Enemy } from '../entity';

// ミスティック
export class Mystic extends Enemy {
    constructor() {
        super('ミスティック', 48 + Math.floor(Math.random() * 9), 'assets/images/characters/enemies/slime.png');
    }
    decideNextMove(player?: any, engine?: any) {
        let needsHeal = false;
        if (engine && engine.enemies) {
            for (const e of engine.enemies) {
                if (!e.isDead() && e.maxHp - e.hp >= 16) {
                    needsHeal = true;
                    break;
                }
            }
        }
        if (needsHeal) {
            this.setNextMove({
                type: IntentType.Heal, value: 16, name: 'ヒール', effect: (e, p, eng) => {
                    eng.enemies.forEach(ene => { if (!ene.isDead()) ene.heal(16); });
                }
            });
            return;
        }

        if (Math.random() < 0.6) {
            this.setNextMove({ type: IntentType.AttackDebuff, value: 8, name: '弱体化', effect: (self, player) => player.addStatus('frail', 2) });
        } else {
            this.setNextMove({
                type: IntentType.Buff, value: 0, name: 'バフ', effect: (e, p, eng) => {
                    eng.enemies.forEach(ene => { if (!ene.isDead()) ene.addStatus('strength', 2); });
                }
            });
        }
    }
}
