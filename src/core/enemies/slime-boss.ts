import { IntentType } from '../intent';
import { Enemy, Entity } from '../entity';
import { AcidSlimeL } from './acid-slime-l';
import { SpikeSlimeL } from './spike-slime-l';
import { IBattleEngine, IEntity } from '../types';

/**
 * スライムボス
 * 分裂時に AcidSlimeL と SpikeSlimeL を生成する
 */
export class SlimeBoss extends Enemy {
    history: any[];

    constructor() {
        super('スライムボス', 140, 'assets/images/enemies/SlimeBoss.png');
        this.history = [];
    }

    onBattleStart(player: any, engine: any) {
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
                effect: (self: any, player: any, engine: any) => (engine as any).splitEnemy(self, AcidSlimeL, SpikeSlimeL)
            });
        }
        return remainingDamage;
    }

    decideNextMove() {
        if (this.hp <= this.maxHp / 2) {
            this.setNextMove({
                id: 'split',
                type: IntentType.Special,
                name: '分裂',
                effect: (self: any, player: any, engine: any) => (engine as any).splitEnemy(self, AcidSlimeL, SpikeSlimeL)
            });
            return;
        }

        const turn = this.history.length + 1;
        const m = turn % 3;
        if (m === 1) {
            this.setNextMove({
                id: 'spray',
                type: IntentType.Debuff,
                name: '汚物スプレー',
                effect: (self: any, player: any, engine: any) => {
                    if (engine && engine.addCardsToDiscard) {
                        engine.addCardsToDiscard('SLIMED', 3);
                    }
                }
            });
        } else if (m === 2) {
            this.setNextMove({ id: 'prepare', type: IntentType.Special, name: '準備' });
        } else {
            this.setNextMove({ id: 'crush', type: IntentType.Attack, value: 35, name: 'スライムクラッシュ' });
        }
        if (this.nextMove) {
            this.history.push((this.nextMove as any).id);
        }
    }
}
