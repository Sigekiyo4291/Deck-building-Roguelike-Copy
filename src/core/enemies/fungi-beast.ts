import { Enemy } from '../entity';

/**
 * キノコビースト
 */
export class FungiBeast extends Enemy {
    history: any[];

    constructor() {
        super('キノコビースト', 22 + Math.floor(Math.random() * 7), 'assets/images/enemies/FungiBeast.png');
        this.history = [];
    }

    onBattleStart(player, engine) {
        super.onBattleStart(player, engine);
        this.addStatus('spore_cloud', 2);
    }

    onDeath(player, engine) {
        player.addStatus('vulnerable', 2);
        console.log(`${this.name} released a Spore Cloud! Player is Vulnerable!`);
    }

    decideNextMove() {
        const roll = Math.random() * 100;
        const lastMove = this.history[this.history.length - 1];

        // 成長 (40%): 筋力3, 連続不可
        if (roll < 40 && lastMove !== 'grow') {
            this.setNextMove({
                id: 'grow',
                type: 'buff',
                name: '成長',
                effect: (self) => self.addStatus('strength', 3)
            });
        } else {
            // 攻撃 (60%): 6ダメージ
            this.setNextMove({ id: 'attack', type: 'attack', value: 6, name: '咬みつき' });
        }
        this.history.push(this.nextMove.id);
    }
}
