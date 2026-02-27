import { Enemy } from '../entity';

/**
 * スフィアガーディアン
 */
export class SphericGuardian extends Enemy {
    turnCount: number = 0;

    constructor() {
        super('スフィアガーディアン', 20, 'assets/images/characters/enemies/slime.png');
    }

    onBattleStart() {
        this.addStatus('barricade', 1);
        this.addStatus('artifact', 3);
        this.addBlock(40);
    }

    decideNextMove() {
        this.turnCount++;
        if (this.turnCount === 1) {
            this.setNextMove({ type: 'defend', value: 25, name: '防御' });
        } else if (this.turnCount === 2) {
            this.setNextMove({ type: 'attack_debuff', value: 10, name: '攻撃+戦略', statuses: [{ id: 'frail', value: 5 }] });
        } else if (this.turnCount % 2 === 1) {
            this.setNextMove({ type: 'attack', value: 10, multi: 2, name: '攻撃' });
        } else {
            this.setNextMove({ type: 'attack_defend', value: 10, block: 15, name: '攻撃+防御' });
        }
    }
}
