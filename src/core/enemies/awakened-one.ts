import { Enemy } from '../entity';

// 目覚めし者
export class AwakenedOne extends Enemy {
    phase: number = 1;
    constructor() { super('目覚めし者', 300, 'assets/images/characters/enemies/slime.png'); }
    onBattleStart() { this.addStatus('curiosity', 2); }
    decideNextMove() {
        if (Math.random() < 0.5) this.setNextMove({ type: 'attack', value: 20, name: '強攻撃' });
        else this.setNextMove({ type: 'attack', value: 6, multi: 4, name: '連続攻撃' });
    }
    isDead(): boolean {
        if (this.phase === 1 && this.hp <= 0) {
            this.phase = 2;
            this.hp = this.maxHp;
            this.removeStatus('curiosity');
            console.log('目覚めし者が第二形態へ移行しました！');
            return false;
        }
        return this.hp <= 0 && this.phase === 2;
    }
}
