import { IntentType } from '../intent';
import { Enemy } from '../entity';

// タイムイーター
export class TimeEater extends Enemy {
    phase: number = 1;
    constructor() { super('タイムイーター', 480, 'assets/images/characters/enemies/slime.png'); }
    onBattleStart() { this.addStatus('time_warp', 12); }
    decideNextMove() {
        if (this.phase === 1 && this.hp <= this.maxHp / 2) {
            this.phase = 2;
            this.setNextMove({
                type: IntentType.Heal, value: 0, name: '回復', effect: e => {
                    e.heal(e.maxHp);
                    e.statusEffects = e.statusEffects.filter(s => s.type === 'time_warp' || s.type === 'strength'); // Clear debuffs
                }
            });
            return;
        }
        if (Math.random() < 0.5) this.setNextMove({ type: IntentType.Attack, value: 26, name: 'スマッシュ' });
        else if (Math.random() < 0.8) this.setNextMove({ type: IntentType.AttackDebuff, value: 8, multi: 3, name: '連撃', statuses: [{ id: 'frail', value: 1 }, { id: 'vulnerable', value: 1 }] });
        else this.setNextMove({ type: IntentType.Defend, value: 20, name: '防御', effect: e => e.addBlock(20) });
    }
}
