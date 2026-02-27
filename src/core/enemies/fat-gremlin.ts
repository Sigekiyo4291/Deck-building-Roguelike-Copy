import { Enemy } from '../entity';

/**
 * 太っちょグレムリン
 */
export class FatGremlin extends Enemy {
    constructor() {
        super('太っちょグレムリン', 13 + Math.floor(Math.random() * 5), 'assets/images/characters/enemies/slime.png');
    }

    decideNextMove() {
        this.setNextMove({
            type: 'attack_debuff',
            value: 4,
            name: 'スマッシュ',
            statuses: [
                { id: 'weak', value: 1 },
                { id: 'vulnerable', value: 1 }
            ]
        });
    }
}
