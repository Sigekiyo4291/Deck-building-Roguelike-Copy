import { IntentType } from '../intent';
import { Enemy } from '../entity';

/**
 * ラガヴーリン
 */
export class Lagavulin extends Enemy {
    isSleeping: boolean;
    idleTurns: number;
    attackCycle: number;

    constructor() {
        super('ラガヴーリン', 109 + Math.floor(Math.random() * 3), 'assets/images/enemies/Lagavulin.png');
        this.addStatus('metallicize', 8);
        this.isSleeping = true;
        this.idleTurns = 0;
        this.attackCycle = 0;
    }

    takeDamage(amount, source) {
        const prevHp = this.hp;
        const damage = super.takeDamage(amount, source);
        if (this.isSleeping && this.hp < prevHp) {
            this.wakeUp(true);
        }
        return damage;
    }

    wakeUp(byDamage) {
        this.isSleeping = false;
        this.removeStatus('metallicize');
        if (byDamage) {
            this.setNextMove({ id: 'stun', type: IntentType.Special, name: 'スタン', effect: () => console.log('Lagavulin is stunned!') });
        }
        console.log('Lagavulin has awoken!');
    }

    decideNextMove() {
        if (this.isSleeping) {
            this.idleTurns++;
            if (this.idleTurns >= 3) {
                this.setNextMove({ id: 'wake', type: IntentType.Special, name: '覚醒', effect: () => this.wakeUp(false) });
            } else {
                this.setNextMove({ id: 'sleep', type: IntentType.Special, name: '睡眠中' });
            }
            return;
        }

        if (this.nextMove && this.nextMove.id === 'stun') {
            // スタンの次は攻撃サイクルの最初から
            this.attackCycle = 0;
        }

        const m = this.attackCycle % 3;
        if (m === 0 || m === 1) {
            this.setNextMove({ id: 'attack', type: IntentType.Attack, value: 18, name: '攻撃' });
        } else {
            this.setNextMove({
                id: 'siphon', type: IntentType.Debuff, name: '魂抽出', effect: (self, player) => {
                    player.addStatus('strength', -1);
                    player.addStatus('dexterity', -1);
                }
            });
        }
        this.attackCycle++;
    }
}
