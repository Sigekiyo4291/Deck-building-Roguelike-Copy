import { IntentType } from '../intent';
import { Enemy } from '../entity';
import { SpikeSlimeM } from './spike-slime-m';
import { IEntity, IBattleEngine } from '../types';

/**
 * 大型スパイクスライム
 * 分裂時に SpikeSlimeM を2体生成する
 */
export class SpikeSlimeL extends Enemy {
    history: any[];

    constructor() {
        super('大型スパイクスライム', 64 + Math.floor(Math.random() * 7), 'assets/images/enemies/SpikeSlimeL.png');
        this.history = [];
    }

    onBattleStart(player: IEntity, engine: IBattleEngine) {
        super.onBattleStart(player, engine);
        this.addStatus('split', 1);
    }

    takeDamage(amount: number, source: IEntity | null = null, engine?: IBattleEngine): number {
        const remainingDamage = super.takeDamage(amount, source, engine);
        // HPが50%以下になった時に即座に分裂をセット
        if (this.hp > 0 && this.hp <= this.maxHp / 2 && (!this.nextMove || (this.nextMove as any).id !== 'split')) {
            this.setNextMove({
                id: 'split',
                type: IntentType.Special,
                name: '分裂',
                effect: (self: any, player: any, engine: any) => (engine as any).splitEnemy(self, SpikeSlimeM)
            });
        }
        return remainingDamage;
    }

    decideNextMove() {
        // すでにHP50%以下なら常に分裂
        if (this.hp <= this.maxHp / 2) {
            this.setNextMove({
                id: 'split',
                type: IntentType.Special,
                name: '分裂',
                effect: (self: any, player: any, engine: any) => (engine as any).splitEnemy(self, SpikeSlimeM)
            });
            return;
        }

        const roll = Math.random() * 100;

        // 舐める (70%): 脆弱2
        if (roll < 70) {
            this.setNextMove({
                id: 'lick',
                type: IntentType.Debuff,
                name: '舐める',
                effect: (self: any, player: any) => player.addStatus('vulnerable', 2)
            });
        } else {
            // 炎の体当たり (30%): 16ダメ + 粘液2枚
            this.setNextMove({
                id: 'tackle',
                type: IntentType.Attack,
                value: 16,
                name: '炎の体当たり',
                effect: (self: any, player: any, engine: any) => {
                    if (engine && engine.addCardsToDiscard) {
                        engine.addCardsToDiscard('slimed', 2);
                    }
                }
            });
        }
        if (this.nextMove) {
            this.history.push((this.nextMove as any).id);
        }
    }
}
