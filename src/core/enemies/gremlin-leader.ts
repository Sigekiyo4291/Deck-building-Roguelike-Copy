import { Enemy } from '../entity';

// グレムリンリーダー
export class GremlinLeader extends Enemy {
    constructor() {
        super('グレムリンリーダー', 140 + Math.floor(Math.random() * 8), 'assets/images/characters/enemies/slime.png');
    }
    decideNextMove(player?: any, engine?: any) {
        const rand = Math.random();
        if (rand < 0.3) {
            this.setNextMove({ type: 'buff', value: 0, name: '激励', effect: (e, p, eng) => eng.enemies.forEach(x => { if (!x.isDead()) x.addStatus('strength', 3); }) });
        } else if (rand < 0.6) {
            this.setNextMove({ type: 'attack', value: 6, multi: 3, name: '刺突' });
        } else {
            this.setNextMove({ type: 'defend', value: 10, name: '防御', effect: (e, p, eng) => eng.enemies.forEach(x => { if (!x.isDead()) x.addBlock(10); }) });
        }
    }
}
