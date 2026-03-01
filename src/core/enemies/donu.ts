import { IntentType } from '../intent';
import { Enemy } from '../entity';

// ドヌー
export class Donu extends Enemy {
    constructor() { super('ドヌー', 250, 'assets/images/enemies/slime.png'); }
    onBattleStart() { this.addStatus('artifact', 2); }
    decideNextMove() {
        if (Math.random() < 0.5) this.setNextMove({ type: IntentType.Attack, value: 12, times: 2, name: 'ビーム' });
        else this.setNextMove({ type: IntentType.Buff, value: 0, name: '筋力アップ', effect: (e, p, eng) => eng.enemies.forEach(x => { if (!x.isDead()) x.addStatus('strength', 3); }) });
    }
}
