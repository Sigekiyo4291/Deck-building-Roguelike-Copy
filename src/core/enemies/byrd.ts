import { Enemy } from '../entity';

// ビャード
export class Byrd extends Enemy {
    flied: boolean = true;
    constructor() {
        super('ビャード', 25 + Math.floor(Math.random() * 7), 'assets/images/characters/enemies/slime.png');
    }
    onBattleStart() {
        this.addStatus('flight', 3);
        this.flied = true;
    }
    decideNextMove() {
        const flight = this.getStatusValue('flight');
        if (this.flied && flight === 0) {
            this.flied = false;
            this.setNextMove({ type: 'stun', value: 0, name: '撃墜' });
            return;
        }

        const rand = Math.random();
        if (flight > 0) {
            if (rand < 0.5) {
                this.setNextMove({ type: 'attack', value: 1, multi: 5, name: 'ついばみ' });
            } else if (rand < 0.7) {
                this.setNextMove({ type: 'attack', value: 12, name: '急降下' });
            } else {
                this.setNextMove({ type: 'buff', value: 0, name: '鳴き声', effect: (e) => e.addStatus('strength', 1) });
            }
        } else {
            if (rand < 0.5) {
                this.setNextMove({ type: 'attack', value: 3, name: '頭突き' });
            } else {
                this.setNextMove({ type: 'buff', value: 0, name: '飛び立つ', effect: (e) => { e.addStatus('flight', 3); (e as any).flied = true; } });
            }
        }
    }
}
