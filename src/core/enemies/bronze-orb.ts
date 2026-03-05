import { IntentType } from '../intent';
import { Enemy } from '../entity';

// オーブ（ブロンズ・オーブ）
export class BronzeOrb extends Enemy {
    stolenCard: any = null;
    hasStolen: boolean = false;

    constructor() {
        super('オーブ', 58, 'assets/images/enemies/slime.png');
    }
    decideNextMove(player?: any, engine?: any) {
        if (!this.hasStolen && Math.random() < 0.75) {
            this.setNextMove({
                type: IntentType.Debuff, value: 0, name: '停滞', effect: (e, p, eng) => {
                    if (p && p.deck && p.deck.length > 0) {
                        const randIdx = Math.floor(Math.random() * p.deck.length);
                        this.stolenCard = p.deck.splice(randIdx, 1)[0];
                        this.hasStolen = true;
                    }
                }
            });
            return;
        }

        if (Math.random() < 0.3) {
            this.setNextMove({ type: IntentType.Attack, value: 8, name: 'ビーム' });
        } else {
            this.setNextMove({
                type: IntentType.Defend, name: '防御', effect: (e, p, eng) => {
                    if (eng && eng.enemies) {
                        const boss = (eng.enemies as any[]).find(x => x.name === 'ブロンズ・オートマトン');
                        if (boss && !boss.isDead()) boss.addBlock(12);
                        else e.addBlock(12);
                    } else {
                        e.addBlock(12);
                    }
                }
            });
        }
    }

    takeDamage(damage: number, source?: any, engine?: any): number {
        const dealt = super.takeDamage(damage, source, engine);
        if (this.hp <= 0 && this.stolenCard) {
            if (engine && engine.player) {
                engine.player.hand.push(this.stolenCard);
                this.stolenCard = null;
                if (engine.uiUpdateCallback) engine.uiUpdateCallback();
            }
        }
        return dealt;
    }
}
