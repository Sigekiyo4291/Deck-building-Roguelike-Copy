import { IntentType } from '../intent';
import { Enemy } from '../entity';

// チャンプ
export class Champ extends Enemy {
    phase: number = 1;
    constructor() {
        super('チャンプ', 420, 'assets/images/characters/enemies/slime.png');
    }
    decideNextMove() {
        if (this.phase === 1 && this.hp <= this.maxHp / 2) {
            this.phase = 2;
            this.setNextMove({ type: IntentType.Buff, value: 0, name: '激怒', effect: (e) => { e.addStatus('strength', 12); e.addStatus('artifact', 2); } });
            return;
        }
        if (this.phase === 2) {
            if (Math.random() < 0.3) this.setNextMove({ type: IntentType.Attack, value: 15, times: 2, name: 'エクセキュート' });
            else this.setNextMove({ type: IntentType.Attack, value: 18, name: 'フェイススラップ' });
        } else {
            const r = Math.random();
            if (r < 0.4) this.setNextMove({ type: IntentType.Attack, value: 12, name: 'フェイススラップ' });
            else if (r < 0.7) this.setNextMove({ type: IntentType.AttackDebuff, value: 10, name: '嘲り', effect: (self, player) => player.addStatus('vulnerable', 2) });
            else this.setNextMove({ type: IntentType.Defend, value: 15, name: '防御態勢' });
        }
    }
}
