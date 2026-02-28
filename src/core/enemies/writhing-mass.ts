import { IntentType } from '../intent';
import { Enemy } from '../entity';

// もがき蠢く塊
export class WrithingMass extends Enemy {
    constructor() { super('もがき蠢く塊', 160, 'assets/images/characters/enemies/slime.png'); }
    decideNextMove() {
        this.randomizeMove();
    }
    randomizeMove() {
        const rand = Math.random();
        if (rand < 0.25) this.setNextMove({ type: IntentType.Attack, value: 38, name: '強攻撃' });
        else if (rand < 0.5) this.setNextMove({ type: IntentType.AttackDebuff, value: 16, name: '攻撃+脆弱化', statuses: [{ id: 'vulnerable', value: 2 }] });
        else if (rand < 0.75) this.setNextMove({ type: IntentType.Attack, value: 9, multi: 3, name: '連続攻撃' });
        else this.setNextMove({ type: IntentType.Debuff, value: 0, name: '寄生', effect: (e, p, eng) => eng.addCardsToDrawPile({ id: 'parasite', name: '寄生', type: 'curse', description: '消尽。プレイ不可。HP-3。', isExhaust: true, play: () => { } }) });
    }
    takeDamage(damage: number, source?: any, engine?: any): number {
        const dealt = super.takeDamage(damage, source, engine);
        if (dealt > 0 && source) {
            this.randomizeMove();
            if (engine && engine.uiUpdateCallback) engine.uiUpdateCallback();
        }
        return dealt;
    }
}
