import { IntentType } from '../intent';
import { Enemy } from '../entity';

import { Dagger } from './dagger';

// レプトマンサー
export class Reptomancer extends Enemy {
    turnCount: number = 0;
    constructor() { super('レプトマンサー', 200, 'assets/images/characters/enemies/slime.png'); }
    decideNextMove(player?: any, engine?: any) {
        this.turnCount++;
        let daggersCount = 0;
        if (engine && engine.enemies) {
            daggersCount = engine.enemies.filter(e => e.name === 'ダガー' && !e.isDead()).length;
        }

        let chooseSummon = false;
        if (this.turnCount === 1) {
            chooseSummon = true;
        } else if (Math.random() < 0.33) {
            chooseSummon = true;
        }

        if (chooseSummon && daggersCount < 4) {
            this.setNextMove({
                type: IntentType.Buff, value: 0, name: 'ダガー召喚', effect: (e, p, eng) => {
                    if (!eng || !eng.enemies) return;
                    const daggersNow = eng.enemies.filter(x => x.name === 'ダガー' && !x.isDead()).length;
                    const maxSpawn = 4 - daggersNow;
                    if (maxSpawn > 0) {
                        const dagger = new Dagger();
                        eng.enemies.push(dagger);
                        if (dagger.onBattleStart) dagger.onBattleStart(p, eng);
                        if (eng.uiUpdateCallback) eng.uiUpdateCallback();
                    }
                }
            });
            return;
        }

        if (Math.random() < 0.5) {
            this.setNextMove({ type: IntentType.AttackDebuff, value: 13, times: 2, name: '毒牙', statuses: [{ id: 'weak', value: 2 }] });
        } else {
            this.setNextMove({ type: IntentType.Attack, value: 30, name: '単発攻撃' });
        }
    }
}
