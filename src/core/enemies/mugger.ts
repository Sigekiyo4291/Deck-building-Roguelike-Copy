import { IntentType } from '../intent';
import { Enemy } from '../entity';

// 強盗
export class Mugger extends Enemy {
    turnCount: number = 0;
    constructor() {
        super('強盗', 48 + Math.floor(Math.random() * 5), 'assets/images/characters/enemies/slime.png');
    }
    onBattleStart() {
        this.addStatus('thievery', 15);
    }
    decideNextMove(player?: any, engine?: any) {
        this.turnCount++;
        if (this.turnCount <= 2) {
            this.setNextMove({ type: IntentType.Attack, value: 10, name: 'ジャグリング' });
        } else if (this.turnCount === 3) {
            if (Math.random() < 0.5) {
                this.setNextMove({ type: IntentType.Attack, value: 16, name: '突き刺し' });
            } else {
                this.setNextMove({ type: IntentType.Defend, name: '煙玉', effect: (e) => e.addBlock(11) });
            }
        } else {
            this.setNextMove({ type: IntentType.Escape, value: 0, name: '逃走', effect: (enemy, player, eng) => eng.removeEnemy(enemy) });
        }
    }
}
