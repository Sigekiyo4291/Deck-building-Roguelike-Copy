import { IntentType } from '../intent';
import { Enemy } from '../entity';

// デカ
export class Deca extends Enemy {
    constructor() { super('デカ', 250, 'assets/images/characters/enemies/slime.png'); }
    onBattleStart() { this.addStatus('artifact', 2); }
    decideNextMove() {
        if (Math.random() < 0.5) this.setNextMove({ type: IntentType.Attack, value: 12, times: 2, name: 'ビーム' });
        else this.setNextMove({ type: IntentType.Defend, value: 16, name: 'シールド', effect: (e, p, eng) => eng.enemies.forEach(x => { if (!x.isDead()) x.addBlock(16); }) });
    }
}
