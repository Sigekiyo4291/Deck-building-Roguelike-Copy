import { IntentType } from '../intent';
import { Enemy } from '../entity';

// タイムイーター
export class TimeEater extends Enemy {
    phase: number = 1;
    constructor() { super('タイムイーター', 480, 'assets/images/enemies/slime.png'); }
    onBattleStart() { this.addStatus('time_warp', 12); }
    decideNextMove() {
        if (this.phase === 1 && this.hp <= this.maxHp / 2) {
            this.phase = 2;
            this.setNextMove({
                type: IntentType.Heal, value: 0, name: '回復', effect: e => {
                    e.heal(e.maxHp / 2 - e.hp);
                    // Clear debuffs: Keep only time_warp or strength
                    for (const type in e.statusEffects) {
                        if (type !== 'time_warp' && type !== 'strength') {
                            delete e.statusEffects[type];
                        }
                    }
                }
            });
            return;
        }
        if (Math.random() < 0.5) this.setNextMove({ type: IntentType.Attack, value: 26, name: 'スマッシュ' });
        else if (Math.random() < 0.8) this.setNextMove({ type: IntentType.AttackDebuff, value: 8, times: 3, name: '連撃', effect: (self, player) => { player.addStatus('frail', 1); player.addStatus('vulnerable', 1); } });
        else this.setNextMove({ type: IntentType.Defend, name: '防御', effect: e => e.addBlock(20) });
    }
}
