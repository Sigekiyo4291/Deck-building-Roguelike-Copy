import { IntentType } from '../intent';
import { Enemy } from '../entity';

import { SneakyGremlin } from './sneaky-gremlin';
import { MadGremlin } from './mad-gremlin';
import { GremlinWizard } from './gremlin-wizard';
import { ShieldGremlin } from './shield-gremlin';
import { FatGremlin } from './fat-gremlin';

export class GremlinLeader extends Enemy {
    constructor() {
        super('グレムリンリーダー', 140 + Math.floor(Math.random() * 8), 'assets/images/enemies/slime.png');
    }
    decideNextMove(player?: any, engine?: any) {
        let minionsCount = 0;
        if (engine && engine.enemies) {
            minionsCount = engine.enemies.filter((e: any) => e !== this && !e.isDead()).length;
        }

        // ミニオンが1体以下のとき高確率（ここでは70%）で召喚
        if (minionsCount <= 1 && Math.random() < 0.7) {
            this.setNextMove({
                type: IntentType.Buff,
                value: 0,
                name: 'みんな集まれ！',
                effect: (e, p, eng) => {
                    if (!eng || !eng.enemies) return;
                    const currentMinions = eng.enemies.filter(x => !x.isDead()).length;
                    const spawnCount = Math.min(2, 4 - currentMinions);

                    for (let i = 0; i < spawnCount; i++) {
                        const types = [SneakyGremlin, MadGremlin, GremlinWizard, ShieldGremlin, FatGremlin];
                        const MinionClass = types[Math.floor(Math.random() * types.length)];
                        const minion = new MinionClass();
                        eng.enemies.push(minion);
                        if (minion.onBattleStart) minion.onBattleStart(p, eng);
                    }
                    if (eng.uiUpdateCallback) eng.uiUpdateCallback();
                }
            });
            return;
        }

        const rand = Math.random();
        if (rand < 0.4) {
            this.setNextMove({ type: IntentType.DefendBuff, name: '激励', effect: (e, p, eng) => eng.enemies.forEach(x => { if (!x.isDead()) { x.addBlock(6); x.addStatus('strength', 3); } }) });
        } else {
            this.setNextMove({ type: IntentType.Attack, value: 6, times: 3, name: 'スマッシュ' });
        }
    }
}
