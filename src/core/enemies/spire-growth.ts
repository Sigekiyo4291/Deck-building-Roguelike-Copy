import { Enemy } from '../entity';

// 塔で成長するもの
export class SpireGrowth extends Enemy {
    constructor() {
        super('塔で成長するもの', 170, 'assets/images/characters/enemies/slime.png');
    }
    decideNextMove() {
        if (Math.random() < 0.5) {
            this.setNextMove({ type: 'attack', value: 22, name: 'スマッシュ' });
        } else {
            this.setNextMove({ type: 'attack_debuff', value: 16, name: '締め付け', statuses: [{ id: 'constricted', value: 10 }] });
        }
    }
}
