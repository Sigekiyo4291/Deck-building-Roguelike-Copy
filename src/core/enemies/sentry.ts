import { IntentType } from '../intent';
import { Enemy } from '../entity';

/**
 * センチネル
 */
export class Sentry extends Enemy {
    position: number;
    turnCount: number;

    constructor(position) {
        super('センチネル', 38 + Math.floor(Math.random() * 5), 'assets/images/enemies/Sentry.png');
        this.addStatus('artifact', 1);
        this.position = position; // 0: left, 1: middle, 2: right
        this.turnCount = 0;
    }

    decideNextMove() {
        // 左右：めまい -> ビーム。 中央：ビーム -> めまい。
        const isBeamTurn = (this.position === 1) ? (this.turnCount % 2 === 0) : (this.turnCount % 2 === 1);

        if (isBeamTurn) {
            this.setNextMove({ id: 'beam', type: IntentType.Attack, value: 9, name: 'ビーム' });
        } else {
            this.setNextMove({
                id: 'dazed', type: IntentType.Debuff, name: 'めまい', effect: (self, player, engine) => {
                    if (engine && engine.addCardsToDiscard) {
                        engine.addCardsToDiscard('DAZED', 3);
                    }
                    console.log("3x Dazed added to discard!");
                }
            });
        }
        this.turnCount++;
    }
}
