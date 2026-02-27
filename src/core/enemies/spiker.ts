import { Enemy } from '../entity';

// スパイカー
export class Spiker extends Enemy {
    constructor() {
        super('スパイカー', 42, 'assets/images/characters/enemies/slime.png');
    }
    onBattleStart() {
        this.addStatus('thorns', 3);
    }
    decideNextMove() {
        if (Math.random() < 0.5) {
            this.setNextMove({ type: 'attack', value: 7, name: '攻撃' });
        } else {
            this.setNextMove({ type: 'buff', value: 0, name: 'トゲ', effect: e => e.addStatus('thorns', 2) });
        }
    }
}
