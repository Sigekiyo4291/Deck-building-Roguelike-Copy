import { Enemy } from '../entity';

// レプトマンサー
export class Reptomancer extends Enemy {
    constructor() { super('レプトマンサー', 200, 'assets/images/characters/enemies/slime.png'); }
    decideNextMove() {
        const rand = Math.random();
        // 1ターンおきにダガー召喚、それ以外は攻撃(16x2)か弱体化。簡単のためランダム。
        if (rand < 0.3) this.setNextMove({ type: 'attack', value: 16, multi: 2, name: '双撃' });
        else if (rand < 0.6) this.setNextMove({ type: 'attack_debuff', value: 13, name: '毒牙', statuses: [{ id: 'weak', value: 1 }] });
        else this.setNextMove({
            type: 'buff', value: 0, name: 'ダガー召喚', effect: (e, p, eng) => {
                // Placeholder actions if spawning requires map logic adjustments
            }
        });
    }
}
