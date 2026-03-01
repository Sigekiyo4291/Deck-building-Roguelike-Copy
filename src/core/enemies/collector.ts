import { IntentType } from '../intent';
import { Enemy } from '../entity';

import { TorchHead } from './torch-head';

// コレクター
export class Collector extends Enemy {
    turnCount: number = 0;
    constructor() {
        super('コレクター', 282, 'assets/images/characters/enemies/slime.png');
    }
    decideNextMove(player?: any, engine?: any) {
        this.turnCount++;
        let torchHeadsCount = 0;
        if (engine && engine.enemies) {
            torchHeadsCount = engine.enemies.filter(e => e.name === 'トーチヘッド' && !e.isDead()).length;
        }

        if (this.turnCount === 1 || (torchHeadsCount <= 1 && Math.random() < 0.25)) {
            this.setNextMove({
                type: IntentType.Buff, value: 0, name: '召喚', effect: (e, p, eng) => {
                    if (!eng || !eng.enemies) return;
                    const currentTorch = eng.enemies.filter(x => x.name === 'トーチヘッド' && !x.isDead()).length;
                    const spawnCount = Math.min(2, 2 - currentTorch);
                    for (let i = 0; i < spawnCount; i++) {
                        const torch = new TorchHead();
                        eng.enemies.push(torch);
                        if (torch.onBattleStart) torch.onBattleStart(p, eng);
                    }
                    if (eng.uiUpdateCallback) eng.uiUpdateCallback();
                }
            });
            return;
        }

        if (this.turnCount === 4) {
            this.setNextMove({
                type: IntentType.Debuff,
                value: 0,
                name: 'お前はわたしの物だ！！',
                effect: (self, player) => {
                    player.addStatus('weak', 3);
                    player.addStatus('vulnerable', 3);
                    player.addStatus('frail', 3);
                }
            });
            return;
        }

        const r = Math.random();
        let useAttack = false;
        if (torchHeadsCount >= 2) {
            useAttack = r < 0.7;
        } else {
            useAttack = r < 0.45;
        }

        if (useAttack) {
            this.setNextMove({ type: IntentType.Attack, value: 18, name: 'ファイヤーボール' });
        } else {
            this.setNextMove({ type: IntentType.Defend, value: 15, name: 'バフ', effect: (e, p, eng) => eng.enemies.forEach(x => { if (!x.isDead()) { x.addBlock(15); x.addStatus('strength', 3); } }) });
        }
    }
}
