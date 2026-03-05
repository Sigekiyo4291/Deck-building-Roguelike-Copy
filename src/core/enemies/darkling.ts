import { IntentType } from '../intent';
import { Enemy } from '../entity';

// ダークリング
export class Darkling extends Enemy {
    reviveTimer: number = -1;

    constructor() {
        super('ダークリング', 48, 'assets/images/enemies/slime.png');
    }

    isDead(): boolean {
        return this.hp <= 0 && this.reviveTimer < 0;
    }

    takeDamage(damage: number, source?: any, engine?: any): number {
        if (this.reviveTimer >= 0) return 0; // 復活待機中はダメージを受けない

        const dealt = super.takeDamage(damage, source, engine);

        if (this.hp <= 0 && this.reviveTimer < 0) {
            if (engine && engine.enemies) {
                const aliveDarklings = engine.enemies.filter((e: any) => e.name === 'ダークリング' && e !== this && e.hp > 0);
                if (aliveDarklings.length > 0) {
                    this.reviveTimer = 0; // 1ターン後に復活
                    this.statusEffects = {};
                    this.setNextMove({ type: IntentType.Unknown, value: 0, name: '復活待機' });
                    if (engine.uiUpdateCallback) engine.uiUpdateCallback();
                } else {
                    // 他のダークリングがすべてダウンまたは死んでいる場合、全員を完全に死亡させる
                    engine.enemies.filter((e: any) => e.name === 'ダークリング').forEach((e: any) => {
                        e.reviveTimer = -1;
                        e.hp = 0;
                    });
                }
            }
        }
        return dealt;
    }

    decideNextMove(player?: any, engine?: any) {
        if (this.reviveTimer > 0) {
            this.reviveTimer--;
            this.setNextMove({ type: IntentType.Buff, value: 0, name: '復活待機' });
            return;
        } else if (this.reviveTimer === 0) {
            this.setNextMove({
                type: IntentType.Heal, value: 0, name: '復活', effect: (e) => {
                    const dark = e as Darkling;
                    dark.reviveTimer = -1;
                    dark.heal(Math.floor(dark.maxHp / 2));
                }
            });
            return;
        }

        const rand = Math.random();
        if (rand < 0.4) this.setNextMove({ type: IntentType.Attack, value: 8, name: '噛みつき' });
        else if (rand < 0.8) this.setNextMove({ type: IntentType.Attack, value: 8, times: 2, name: '連続噛みつき' });
        else this.setNextMove({ type: IntentType.DefendBuff, name: '硬化', effect: e => { e.addBlock(12); e.addStatus('strength', 2); } });
    }
}
