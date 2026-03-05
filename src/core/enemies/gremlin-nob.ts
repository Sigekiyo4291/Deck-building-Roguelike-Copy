import { IntentType } from '../intent';
import { Enemy } from '../entity';

/**
 * グレムリンノブ
 */
export class GremlinNob extends Enemy {
    history: any[];

    constructor() {
        super('グレムリンノブ', 82 + Math.floor(Math.random() * 5), 'assets/images/enemies/GremlinNob.png');
        this.history = [];
    }

    decideNextMove() {
        const turn = this.history.length + 1;
        if (turn === 1) {
            this.setNextMove({
                id: 'enrage',
                type: IntentType.Buff,
                name: '激怒',
                effect: (self: any) => {
                    self.addStatus('enrage_enemy', 2);
                    console.log('Gremlin Nob is enraged! Skill play will buff him!');
                }
            });
        } else {
            const roll = Math.random() * 100;
            if (roll < 33) {
                this.setNextMove({ id: 'bash', type: IntentType.AttackDebuff, value: 6, name: 'スカルバッシュ', effect: (self, player) => player.addStatus('weak', 2) });
            } else {
                this.setNextMove({ id: 'rush', type: IntentType.Attack, value: 14, name: 'ラッシュ' });
            }
        }
        if (this.nextMove) {
            this.history.push(this.nextMove.id);
        }
    }

    onPlayerPlayCard(card: any) {
        const enrageValue = this.getStatusValue('enrage_enemy');
        if (enrageValue > 0 && card.type === 'skill') {
            this.addStatus('strength', enrageValue);
            console.log(`Nob gets stronger from your skill! (+${enrageValue} Strength)`);
        }
    }
}
