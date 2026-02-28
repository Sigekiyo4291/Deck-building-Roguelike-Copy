import { IntentType } from '../intent';
import { Enemy } from '../entity';

// スネークプラント
export class SnakePlant extends Enemy {
    constructor() {
        super('スネークプラント', 75 + Math.floor(Math.random() * 5), 'assets/images/characters/enemies/slime.png');
    }
    onBattleStart() {
        this.addStatus('malleable', 3);
    }
    decideNextMove() {
        if (Math.random() < 0.65) {
            this.setNextMove({ type: IntentType.Attack, value: 7, multi: 3, name: '連撃' });
        } else {
            this.setNextMove({ type: IntentType.Debuff, value: 0, name: '衰弱の胞子', effect: (e, p) => p.addStatus('weak', 2) });
        }
    }
}
