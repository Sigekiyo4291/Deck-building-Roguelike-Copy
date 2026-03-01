import { IntentType } from '../intent';
import { Enemy } from '../entity';

/**
 * ヘキサゴースト
 */
export class Hexaghost extends Enemy {
    history: any[];
    isFirstTurn: boolean = true;
    isInfernoUsed: boolean = false;

    constructor() {
        super('ヘキサゴースト', 250, 'assets/images/enemies/Hexaghost.png');
        this.history = [];
    }

    decideNextMove(player?: any) {
        const turn = this.history.length + 1;
        let move;

        if (turn === 1) {
            move = { id: 'idle', type: IntentType.Special, name: '活性化中' };
        } else if (turn === 2) {
            // プレイヤーの現在HPに依存: (HP/12 + 1)x6
            const p = player ? player.hp : 72;
            const dmg = Math.floor(p / 12) + 1;
            move = { id: 'divider', type: IntentType.Attack, value: dmg, times: 6, name: 'ディバイダー' };
        } else {
            const loopTurn = (turn - 3) % 7;
            switch (loopTurn) {
                case 0: // シアー
                case 2:
                case 5:
                    move = {
                        id: 'sear',
                        type: IntentType.Attack,
                        value: 6,
                        name: 'シアー',
                        effect: (self, p, engine) => {
                            if (engine && engine.addCardsToDiscard) {
                                engine.addCardsToDiscard('BURN', 1, this.isInfernoUsed);
                            }
                        }
                    };
                    break;
                case 1: // 二連撃
                case 4:
                    move = { id: 'tackle', type: IntentType.Attack, value: 5, times: 2, name: '二連撃' };
                    break;
                case 3: // 発火
                    move = {
                        id: 'ignite',
                        type: IntentType.DefendBuff,
                        name: '発火',
                        effect: (self) => {
                            self.addStatus('strength', 2);
                            self.addBlock(12);
                        }
                    };
                    break;
                case 6: // インフェルノ
                    move = {
                        id: 'inferno',
                        type: IntentType.Attack,
                        value: 2,
                        times: 6,
                        name: 'インフェルノ',
                        effect: (self, p, engine) => {
                            // 1. 強化済み火傷3枚を捨て札に追加
                            if (engine && engine.addCardsToDiscard) {
                                engine.addCardsToDiscard('BURN', 3, true);
                            }
                            // 2. 手札・山札・捨て札にある全ての「火傷」カードを強化
                            const upgradeBurnsInList = (list) => {
                                list.forEach(card => {
                                    if (card.id === 'burn') card.upgrade();
                                });
                            };
                            if (engine && engine.player) {
                                upgradeBurnsInList(engine.player.hand);
                                upgradeBurnsInList(engine.player.deck);
                                upgradeBurnsInList(engine.player.discard);
                            }
                            // 3. 以降のシアーを強化
                            this.isInfernoUsed = true;
                        }
                    };
                    break;
            }
        }
        this.setNextMove(move);
        this.history.push(move.id);
    }
}
