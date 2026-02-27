import { Enemy } from '../entity';

// センチュリオン
export class Centurion extends Enemy {
    constructor() {
        super('センチュリオン', 76 + Math.floor(Math.random() * 5), 'assets/images/characters/enemies/slime.png');
    }
    decideNextMove(player?: any, engine?: any) {
        const mystic = engine?.enemies?.find(e => e.name === 'ミスティック' && !e.isDead());
        if (mystic) {
            if (Math.random() < 0.65) {
                this.setNextMove({ type: 'defend', value: 15, name: '防御', effect: (e) => mystic.addBlock(15) });
            } else {
                this.setNextMove({ type: 'attack', value: 12, name: '攻撃' });
            }
        } else {
            if (Math.random() < 0.65) {
                this.setNextMove({ type: 'attack', value: 6, multi: 3, name: '猛烈な攻撃' });
            } else {
                this.setNextMove({ type: 'attack', value: 12, name: '攻撃' });
            }
        }
    }
}
