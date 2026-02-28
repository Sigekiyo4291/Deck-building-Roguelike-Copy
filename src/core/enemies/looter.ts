import { IntentType } from '../intent';
import { Enemy } from '../entity';

/**
 * 略奪者
 */
export class Looter extends Enemy {
    history: any[];
    stolenGold: number;

    constructor() {
        super('略奪者', 44 + Math.floor(Math.random() * 5), 'assets/images/enemies/Looter.png');
        this.history = [];
        this.stolenGold = 0;
    }

    onBattleStart(player, engine) {
        super.onBattleStart(player, engine);
        this.addStatus('thievery', 15);
    }

    decideNextMove() {
        const turn = this.history.length + 1;
        const lastMove = this.history[this.history.length - 1];

        if (turn <= 2) {
            // コソ泥 (1-2ターン目): 10ダメ + ゴールド強奪
            this.setNextMove({
                id: 'mug',
                type: IntentType.Attack,
                value: 10,
                name: 'コソ泥',
                effect: (self, player) => {
                    const stealAmount = self.getStatusValue('thievery') || 15;
                    const amount = Math.min(player.gold, stealAmount);
                    player.gold -= amount;
                    this.stolenGold += amount;
                    console.log(`Looter stole ${amount} gold! Total: ${this.stolenGold}`);
                }
            });
        } else if (turn === 3) {
            // 3ターン目: 50%で突き、50%で煙玉
            if (Math.random() < 0.5) {
                this.setNextMove({
                    id: 'lunge',
                    type: IntentType.Attack,
                    value: 12,
                    name: '突き',
                    effect: (self, player) => {
                        const stealAmount = self.getStatusValue('thievery') || 15;
                        const amount = Math.min(player.gold, stealAmount);
                        player.gold -= amount;
                        this.stolenGold += amount;
                        console.log(`Looter stole ${amount} gold! Total: ${this.stolenGold}`);
                    }
                });
            } else {
                this.setNextMove({
                    id: 'smoke',
                    type: IntentType.Buff,
                    name: '煙玉',
                    effect: (self) => self.addBlock(6)
                });
            }
        } else if (lastMove === 'lunge') {
            // 突き（T3）の次は煙玉（T4）
            this.setNextMove({
                id: 'smoke',
                type: IntentType.Buff,
                name: '煙玉',
                effect: (self) => self.addBlock(6)
            });
        } else if (lastMove === 'smoke') {
            // 煙玉の次は逃走
            this.setNextMove({
                id: 'escape',
                type: IntentType.Special,
                name: '逃走',
                effect: (self, player, engine) => engine.removeEnemy(self)
            });
        } else {
            // 前に煙玉を使っていた場合は逃走（念のため）
            this.setNextMove({
                id: 'escape',
                type: IntentType.Special,
                name: '逃走',
                effect: (self, player, engine) => engine.removeEnemy(self)
            });
        }
        this.history.push(this.nextMove.id);
    }

    onDeath(player, engine) {
        if (this.stolenGold > 0) {
            player.gold += this.stolenGold;
            console.log(`Recovered ${this.stolenGold} gold from Looter!`);
        }
    }
}
