import { Enemy } from '../entity';

// コレクター
export class Collector extends Enemy {
    turnCount: number = 0;
    constructor() {
        super('コレクター', 282, 'assets/images/characters/enemies/slime.png');
    }
    decideNextMove() {
        this.turnCount++;
        if (this.turnCount === 1) {
            this.setNextMove({ type: 'buff', value: 0, name: '超強化', effect: (e, p, eng) => eng.enemies.forEach(x => { if (!x.isDead()) x.addStatus('strength', 3); }) });
        } else if (this.turnCount === 2) {
            this.setNextMove({ type: 'attack', value: 18, name: 'ファイヤーボール' });
        } else {
            const r = Math.random();
            if (r < 0.4) this.setNextMove({ type: 'attack', value: 18, name: 'ファイヤーボール' });
            else if (r < 0.7) this.setNextMove({ type: 'debuff', value: 0, name: 'メガデバフ', statuses: [{ id: 'weak', value: 3 }, { id: 'vulnerable', value: 3 }, { id: 'frail', value: 3 }] });
            else this.setNextMove({ type: 'defend', value: 15, name: '防御', effect: (e, p, eng) => eng.enemies.forEach(x => { if (!x.isDead()) x.addBlock(15); }) });
        }
    }
}
