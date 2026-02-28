import { IntentType } from '../intent';
import { Enemy } from '../entity';

import { BronzeOrb } from './bronze-orb';

// ブロンズ・オートマトン
export class BronzeAutomaton extends Enemy {
    turnCount: number = 0;
    constructor() {
        super('ブロンズ・オートマトン', 300, 'assets/images/characters/enemies/slime.png');
    }
    onBattleStart() {
        this.addStatus('artifact', 3);
    }
    decideNextMove(player?: any, engine?: any) {
        this.turnCount++;
        if (this.turnCount === 1) {
            this.setNextMove({
                type: IntentType.Buff, value: 0, name: 'オーブ召喚', effect: (e, p, eng) => {
                    if (!eng || !eng.enemies) return;
                    for (let i = 0; i < 2; i++) {
                        const orb = new BronzeOrb();
                        eng.enemies.push(orb);
                        if (orb.onBattleStart) orb.onBattleStart(p, eng);
                    }
                    if (eng.uiUpdateCallback) eng.uiUpdateCallback();
                }
            });
            return;
        }

        const routine = (this.turnCount - 2) % 6;
        if (routine === 0 || routine === 2) {
            this.setNextMove({ type: IntentType.Attack, value: 7, times: 2, name: '連撃' });
        } else if (routine === 1 || routine === 3) {
            this.setNextMove({ type: IntentType.Defend, value: 9, name: '防御', effect: e => { e.addBlock(9); e.addStatus('strength', 3); } });
        } else if (routine === 4) {
            this.setNextMove({ type: IntentType.Attack, value: 45, name: 'ハイパービーム' });
        } else {
            this.setNextMove({ type: IntentType.Stun, value: 0, name: 'スタン' });
        }
    }
}
