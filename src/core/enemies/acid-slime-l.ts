import { Enemy } from '../entity';
import { AcidSlimeM } from './acid-slime-m';

/**
 * 大型酸性スライム
 * 分裂時に AcidSlimeM を2体生成する
 */
export class AcidSlimeL extends Enemy {
    history: any[];

    constructor() {
        super('大型酸性スライム', 65 + Math.floor(Math.random() * 5), 'assets/images/enemies/AcidSlimeL.png');
        this.history = [];
    }

    onBattleStart(player, engine) {
        super.onBattleStart(player, engine);
        this.addStatus('split', 1);
    }

    takeDamage(amount, source) {
        const remainingDamage = super.takeDamage(amount, source);
        // HPが50%以下になった時に即座に分裂をセット
        if (this.hp > 0 && this.hp <= this.maxHp / 2 && (!this.nextMove || this.nextMove.id !== 'split')) {
            this.setNextMove({
                id: 'split',
                type: 'special',
                name: '分裂',
                effect: (self, player, engine) => engine.splitEnemy(self, AcidSlimeM)
            });
        }
        return remainingDamage;
    }

    decideNextMove() {
        // すでにHP50%以下なら常に分裂
        if (this.hp <= this.maxHp / 2) {
            this.setNextMove({
                id: 'split',
                type: 'special',
                name: '分裂',
                effect: (self, player, engine) => engine.splitEnemy(self, AcidSlimeM)
            });
            return;
        }

        const roll = Math.random() * 100;

        // 舐める (30%): 脱力2
        if (roll < 30) {
            this.setNextMove({
                id: 'lick',
                type: 'debuff',
                name: '舐める',
                effect: (self, player) => player.addStatus('weak', 2)
            });
        } else if (roll < 60) {
            // 腐食性の粘液 (30%): 11ダメ + 粘液2枚
            this.setNextMove({
                id: 'tackle',
                type: 'attack',
                value: 11,
                name: '腐食性の粘液',
                effect: (self, player, engine) => {
                    if (engine && engine.addCardsToDiscard) {
                        engine.addCardsToDiscard('slimed', 2);
                    }
                }
            });
        } else {
            // 体当たり (40%): 16ダメ
            this.setNextMove({ id: 'attack', type: 'attack', value: 16, name: '体当たり' });
        }
        this.history.push(this.nextMove.id);
    }
}
