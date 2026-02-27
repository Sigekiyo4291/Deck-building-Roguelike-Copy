import { Enemy } from '../entity';

// オーブ（ブロンズ・オーブ）
export class BronzeOrb extends Enemy {
    constructor() {
        super('オーブ', 58, 'assets/images/characters/enemies/slime.png');
    }
    decideNextMove() {
        if (Math.random() < 0.5) {
            this.setNextMove({ type: 'attack', value: 8, name: 'ビーム' });
        } else {
            this.setNextMove({
                type: 'defend', value: 12, name: '防御', effect: (e, p, eng) => {
                    const boss = eng.enemies.find(x => x.name === 'ブロンズ・オートマトン');
                    if (boss && !boss.isDead()) boss.addBlock(12);
                    else e.addBlock(12);
                }
            });
        }
    }
}
