import { Card } from '../../card-class';
import { CardLibrary } from '../../card';
import { IEntity, IPlayer, IBattleEngine } from '../../types';

export const ironcladSkillCards = {
    SHRUG_IT_OFF: new Card({
        id: 'shrug_it_off',
        name: '受け流し',
        cost: 1,
        type: 'skill',
        rarity: 'common',
        description: '8ブロックを得て、カードを1枚引く',
        effect: (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            s.addBlock(8);
            e.drawCards(1);
        },
        targetType: 'self',
        upgradeData: {
            description: '11ブロックを得て、カードを1枚引く',
            baseBlock: 11,
            effect: (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                s.addBlock(11);
                e.drawCards(1);
            }
        },
        baseBlock: 8
    }),
    FLEX: new Card({
        id: 'flex',
        name: 'フレックス',
        cost: 0,
        type: 'skill',
        rarity: 'common',
        description: '筋力を2得る。ターン終了時、筋力を2失う。',
        effect: (s: any, t: any, e?: any) => {
            s.addStatus('strength', 2);
            s.addStatus('strength_down', 2);
        },
        targetType: 'self',
        upgradeData: {
            description: '筋力を4得る。ターン終了時、筋力を4失う。',
            effect: (s: IEntity, t: IEntity | null) => {
                s.addStatus('strength', 4);
                s.addStatus('strength_down', 4);
            }
        }
    }),
    TRUE_GRIT: new Card({
        id: 'true_grit',
        name: '不屈の闘志',
        cost: 1,
        type: 'skill',
        rarity: 'common',
        description: '7ブロックを得る。手札からランダムに1枚廃棄する。',
        effect: (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            s.addBlock(7);
            const player = s as IPlayer;
            if (player.hand.length > 0) {
                const randomIndex = Math.floor(Math.random() * player.hand.length);
                const exhausted = player.hand.splice(randomIndex, 1)[0];
                player.exhaustCard(exhausted, e);
                e.uiUpdateCallback?.();
            }
        },
        targetType: 'self',
        upgradeData: {
            description: '9ブロックを得る。手札から1枚選んで廃棄する。',
            baseBlock: 9,
            effect: (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                s.addBlock(9);
                const player = s as IPlayer;
                if (e.onCardSelectionRequest && player.hand.length > 0) {
                    e.onCardSelectionRequest('廃棄するカードを選択', player.hand, (card: any, index: number) => {
                        if (card) {
                            player.hand.splice(index, 1);
                            player.exhaustCard(card, e);
                            e.uiUpdateCallback?.();
                        }
                    });
                }
            }
        },
        baseBlock: 7
    }),
    ARMAMENTS: new Card({
        id: 'armaments',
        name: '武装',
        cost: 1,
        type: 'skill',
        rarity: 'common',
        description: '5ブロックを得る。手札のカード1枚を戦闘中のみ強化する。',
        effect: (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            s.addBlock(5);
            const player = s as IPlayer;
            if (e.onCardSelectionRequest && player.hand.length > 0) {
                e.onCardSelectionRequest('強化するカードを選択', player.hand, (card: any, index: number) => {
                    if (card && !card.isUpgraded) {
                        card.upgrade();
                        e.uiUpdateCallback?.();
                    }
                });
            }
        },
        targetType: 'self',
        upgradeData: {
            description: '5ブロックを得る。手札の全てのカードを戦闘中のみ強化する。',
            baseBlock: 5,
            effect: (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                s.addBlock(5);
                const player = s as IPlayer;
                player.hand.forEach(card => {
                    if (!card.isUpgraded) card.upgrade();
                });
                e.uiUpdateCallback?.();
            }
        },
        baseBlock: 5
    }),
    HAVOC: new Card({
        id: 'havoc',
        name: '荒廃',
        cost: 1,
        type: 'skill',
        rarity: 'uncommon',
        description: '山札の一番上のカードをプレイして廃棄する。',
        effect: async (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            const player = s as IPlayer;
            if (player.deck.length > 0) {
                const card = player.deck.pop();
                if (card) {
                    let target = t;
                    if (card.targetType === 'single') {
                        const randomTarget = e.getRandomAliveEnemy();
                        if (randomTarget) {
                            target = randomTarget;
                        }
                    }

                    card.isExhaust = true;

                    await card.play(player, target, e, true);

                    player.exhaustCard(card, e);

                    e.uiUpdateCallback?.();
                }
            }
        },
        targetType: 'self',
        upgradeData: {
            cost: 0,
            description: '山札の一番上のカードをプレイして廃棄する。'
        }
    }),
    WARCRY: new Card({
        id: 'warcry',
        name: '雄叫び',
        cost: 0,
        type: 'skill',
        rarity: 'common',
        description: 'カードを1枚引く。手札のカード1枚を山札の一番上に置く。廃棄。',
        effect: (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            e.drawCards(1);
            const player = s as IPlayer;
            if (e.onCardSelectionRequest && player.hand.length > 0) {
                e.onCardSelectionRequest('山札の一番上に置くカードを選択', player.hand, (card: any, index: number) => {
                    if (card) {
                        player.hand.splice(index, 1);
                        player.deck.push(card);
                        e.uiUpdateCallback?.();
                    }
                });
            }
        },
        targetType: 'self',
        upgradeData: {
            description: 'カードを2枚引く。手札のカード1枚を山札の一番上に置く。廃棄。',
            effect: (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                e.drawCards(2);
                const player = s as IPlayer;
                if (e.onCardSelectionRequest && player.hand.length > 0) {
                    e.onCardSelectionRequest('山札の一番上に置くカードを選択', player.hand, (card: any, index: number) => {
                        if (card) {
                            player.hand.splice(index, 1);
                            player.deck.push(card);
                            e.uiUpdateCallback?.();
                        }
                    });
                }
            }
        },
        isExhaust: true
    }),
    POWER_THROUGH: new Card({
        id: 'power_through',
        name: 'やせ我慢',
        cost: 1,
        type: 'skill',
        rarity: 'uncommon',
        description: '15ブロックを得る。手札に負傷を2枚加える。',
        effect: (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            s.addBlock(15);
            const player = s as IPlayer;
            player.hand.push(CardLibrary.WOUND.clone());
            player.hand.push(CardLibrary.WOUND.clone());
            e.uiUpdateCallback?.();
        },
        targetType: 'self',
        upgradeData: {
            description: '20ブロックを得る。手札に負傷を2枚加える。',
            baseBlock: 20,
            effect: (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                s.addBlock(20);
                const player = s as IPlayer;
                player.hand.push(CardLibrary.WOUND.clone());
                player.hand.push(CardLibrary.WOUND.clone());
                e.uiUpdateCallback?.();
            }
        },
        baseBlock: 15
    }),
    GHOSTLY_ARMOR: new Card({
        id: 'ghostly_armor',
        name: 'ゴーストアーマー',
        cost: 1,
        type: 'skill',
        rarity: 'uncommon',
        description: 'エセリアル。10ブロックを得る。',
        effect: (s: any, t: any, e?: any) => {
            s.addBlock(10);
        },
        targetType: 'self',
        upgradeData: {
            description: 'エセリアル。13ブロックを得る。',
            baseBlock: 13,
            effect: (s: any, t: any, e?: any) => { s.addBlock(13); }
        },
        baseBlock: 10,
        isEthereal: true
    }),
    SECOND_WIND: new Card({
        id: 'second_wind',
        name: 'セカンドウィンド',
        cost: 1,
        type: 'skill',
        rarity: 'uncommon',
        description: '手札の非アタックカードを全て廃棄し、1枚につき5ブロックを得る。',
        effect: (s: any, t: any, e: any) => {
            const player = s as IPlayer;
            const nonAttacks = player.hand.filter(c => c.type !== 'attack');
            const count = nonAttacks.length;
            nonAttacks.forEach(c => player.exhaustCard(c, e));
            player.hand = player.hand.filter(c => c.type === 'attack');
            s.addBlock(5 * count);
            if (e && e.uiUpdateCallback) e.uiUpdateCallback?.();
        },
        targetType: 'self',
        upgradeData: {
            description: '手札の非アタックカードを全て廃棄し、1枚につき7ブロックを得る。',
            effect: (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                const player = s as IPlayer;
                const nonAttacks = player.hand.filter(c => c.type !== 'attack');
                const count = nonAttacks.length;
                nonAttacks.forEach(c => player.exhaustCard(c, e));
                player.hand = player.hand.filter(c => c.type === 'attack');
                player.addBlock(7 * count);
                e.uiUpdateCallback?.();
            }
        }
    }),
    BATTLE_TRANCE: new Card({
        id: 'battle_trance',
        name: 'バトルトランス',
        cost: 0,
        type: 'skill',
        rarity: 'uncommon',
        description: 'カードを3枚引く。このターン、カードを引けなくなる。',
        effect: (s: any, t: any, e: any) => {
            if (e) {
                e.drawCards(3);
                s.addStatus('no_draw', 1);
            }
        },
        targetType: 'self',
        upgradeData: {
            description: 'カードを4枚引く。このターン、カードを引けなくなる。',
            effect: (s: any, t: any, e: any) => {
                if (e) {
                    e.drawCards(4);
                    s.addStatus('no_draw', 1);
                }
            }
        }
    }),
    DUAL_WIELD: new Card({
        id: 'dual_wield',
        name: '二刀流',
        cost: 1,
        type: 'skill',
        rarity: 'uncommon',
        description: '手札のアタックかパワーカード1枚の複製を手札に加える。',
        effect: (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            const player = s as IPlayer;
            if (e.onCardSelectionRequest) {
                const targets = player.hand.filter(c => c.type === 'attack' || c.type === 'power');
                if (targets.length > 0) {
                    e.onCardSelectionRequest('複製するカードを選択', targets, (card: any, index: number) => {
                        if (card) {
                            player.hand.push(card.clone());
                            e.uiUpdateCallback?.();
                        }
                    });
                }
            }
        },
        targetType: 'self',
        upgradeData: {
            description: '手札のアタックかパワーカード1枚の複製を2枚手札に加える。',
            effect: (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                const player = s as IPlayer;
                if (e.onCardSelectionRequest) {
                    const targets = player.hand.filter(c => c.type === 'attack' || c.type === 'power');
                    if (targets.length > 0) {
                        e.onCardSelectionRequest('複製するカードを選択', targets, (card: any, index: number) => {
                            if (card) {
                                player.hand.push(card.clone());
                                player.hand.push(card.clone());
                                e.uiUpdateCallback?.();
                            }
                        });
                    }
                }
            }
        }
    }),
    ENTRENCH: new Card({
        id: 'entrench',
        name: '塹壕',
        cost: 2,
        type: 'skill',
        rarity: 'uncommon',
        description: '現在のブロック値を2倍にする。',
        effect: (s: any, t: any, e?: any) => {
            s.block *= 2;
        },
        targetType: 'self',
        upgradeData: {
            cost: 1,
            description: '現在のブロック値を2倍にする。'
        }
    }),
    INTIMIDATE: new Card({
        id: 'intimidate',
        name: '威嚇',
        cost: 0,
        type: 'skill',
        rarity: 'uncommon',
        description: '全ての敵に脱力(1)を付与する。廃棄。',
        effect: (s: any, t: any, e: any) => {
            if (e) {
                e.enemies.forEach((enemy: any) => {
                    if (!enemy.isDead()) enemy.addStatus('weak', 1);
                });
            }
        },
        targetType: 'all',
        upgradeData: {
            description: '全ての敵に脱力(2)を付与する。廃棄。',
            effect: (s: any, t: any, e: any) => {
                if (e) {
                    e.enemies.forEach((enemy: any) => {
                        if (!enemy.isDead()) enemy.addStatus('weak', 2);
                    });
                }
            }
        },
        isExhaust: true
    }),
    SPOT_WEAKNESS: new Card({
        id: 'spot_weakness',
        name: '弱点発見',
        cost: 1,
        type: 'skill',
        rarity: 'uncommon',
        description: '敵が攻撃予定なら筋力を3得る。',
        effect: (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            const enemy = t as any;
            if (enemy && enemy.nextMove && enemy.nextMove.type === 'attack') {
                s.addStatus('strength', 3);
            }
        },
        targetType: 'single',
        upgradeData: {
            description: '敵が攻撃予定なら筋力を4得る。',
            effect: (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                const enemy = t as any;
                if (enemy && enemy.nextMove && enemy.nextMove.type === 'attack') {
                    s.addStatus('strength', 4);
                }
            }
        }
    }),
    RAGE: new Card({
        id: 'rage',
        name: '激怒',
        cost: 0,
        type: 'skill',
        rarity: 'uncommon',
        description: 'このターン、アタックカードをプレイする度に3ブロックを得る。',
        effect: (s: any, t: any, e: any) => {
            s.addStatus('rage', 3);
        },
        targetType: 'self',
        upgradeData: {
            description: 'このターン、アタックカードをプレイする度に5ブロックを得る。',
            effect: (s: any, t: any, e: any) => { s.addStatus('rage', 5); }
        }
    }),
    DISARM: new Card({
        id: 'disarm',
        name: '武装解除',
        cost: 1,
        type: 'skill',
        rarity: 'uncommon',
        description: '敵の筋力を2減らす。廃棄。',
        effect: (s: any, t: any, e?: any) => {
            t?.addStatus('strength', -2);
        },
        targetType: 'single',
        upgradeData: {
            description: '敵の筋力を3減らす。廃棄。',
            effect: (s: any, t: any, e?: any) => { t?.addStatus('strength', -3); }
        },
        isExhaust: true
    }),
    SEEING_RED: new Card({
        id: 'seeing_red',
        name: '激昂',
        cost: 1,
        type: 'skill',
        rarity: 'uncommon',
        description: '2エナジーを得る。廃棄。',
        effect: (s: any, t: any, e: any) => {
            if (e) (s as IPlayer).energy += 2;
        },
        targetType: 'self',
        upgradeData: {
            cost: 0,
            description: '2エナジーを得る。廃棄。'
        },
        isExhaust: true
    }),
    BLOODLETTING: new Card({
        id: 'bloodletting',
        name: '瀉血',
        cost: 0,
        type: 'skill',
        rarity: 'uncommon',
        description: 'HPを3失い、2エナジーを得る。',
        effect: (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            s.loseHP(3);
            const player = s as IPlayer;
            player.energy += 2;
            e.uiUpdateCallback?.();
        },
        targetType: 'self',
        upgradeData: {
            description: 'HPを3失い、3エナジーを得る。',
            effect: (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                s.loseHP(3);
                const player = s as IPlayer;
                player.energy += 3;
                e.uiUpdateCallback?.();
            }
        }
    }),
    FLAME_BARRIER: new Card({
        id: 'flame_barrier',
        name: '炎の障壁',
        cost: 2,
        type: 'skill',
        rarity: 'uncommon',
        description: '12ブロックを得る。攻撃を受けると攻撃者に4ダメージを与える。',
        effect: (s: IEntity, t: IEntity | null) => {
            s.addBlock(12);
            s.addStatus('flame_barrier', 4);
        },
        targetType: 'self',
        upgradeData: {
            description: '16ブロックを得る。攻撃を受けると攻撃者に6ダメージを与える。',
            baseBlock: 16,
            effect: (s: any, t: any, e?: any) => {
                s.addBlock(16);
                s.addStatus('flame_barrier', 6);
            }
        },
        baseBlock: 12
    }),
    BURNING_PACT: new Card({
        id: 'burning_pact',
        name: '焦熱の契約',
        cost: 1,
        type: 'skill',
        rarity: 'uncommon',
        description: '手札のカード1枚を廃棄し、カードを2枚引く。',
        effect: (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            const player = s as IPlayer;
            if (e.onCardSelectionRequest && player.hand.length > 0) {
                e.onCardSelectionRequest('廃棄するカードを選択', player.hand, (card: any, index: number) => {
                    if (card) {
                        player.hand.splice(index, 1);
                        player.exhaustCard(card, e);
                        e.drawCards(2);
                        e.uiUpdateCallback?.();
                    }
                });
            }
        },
        targetType: 'self',
        upgradeData: {
            description: '手札のカード1枚を廃棄し、カードを3枚引く。',
            effect: (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                const player = s as IPlayer;
                if (e.onCardSelectionRequest && player.hand.length > 0) {
                    e.onCardSelectionRequest('廃棄するカードを選択', player.hand, (card: any, index: number) => {
                        if (card) {
                            player.hand.splice(index, 1);
                            player.exhaustCard(card, e);
                            e.drawCards(3);
                            e.uiUpdateCallback?.();
                        }
                    });
                }
            }
        }
    }),
    SHOCKWAVE: new Card({
        id: 'shockwave',
        name: '衝撃波',
        cost: 2,
        type: 'skill',
        rarity: 'uncommon',
        description: '全ての敵に脱力(3)と脆弱(3)を付与する。廃棄。',
        effect: (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            if (t && !t.isDead()) {
                t?.addStatus('weak', 3);
                t?.addStatus('vulnerable', 3);
            }
        },
        targetType: 'all',
        upgradeData: {
            description: '全ての敵に脱力(5)と脆弱(5)を付与する。廃棄。',
            effect: (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                if (t && !t.isDead()) {
                    t?.addStatus('weak', 5);
                    t?.addStatus('vulnerable', 5);
                }
            }
        },
        isExhaust: true
    }),
    SENTINEL: new Card({
        id: 'sentinel',
        name: '見張り',
        cost: 1,
        type: 'skill',
        rarity: 'uncommon',
        description: '5ブロックを得る。このカードが廃棄された時、2エナジーを得る。',
        effect: (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            s.addBlock(5);
        },
        targetType: 'self',
        upgradeData: {
            description: '8ブロックを得る。このカードが廃棄された時、3エナジーを得る。',
            baseBlock: 8,
            effect: (s: IEntity, t: IEntity | null, e: IBattleEngine) => { s.addBlock(8); },
            onExhaust: (s: IEntity, e: IBattleEngine | undefined) => {
                if (e) {
                    const player = s as IPlayer;
                    player.energy += 3;
                    e.uiUpdateCallback?.();
                }
            }
        },
        baseBlock: 5,
        onExhaust: (s: IEntity, e: IBattleEngine | undefined) => {
            if (e) {
                const player = s as IPlayer;
                player.energy += 2;
                e.uiUpdateCallback?.();
            }
        }
    }),
    DARK_SHACKLES: new Card({
        id: 'dark_shackles',
        name: '非道の刃',
        cost: 1,
        type: 'skill',
        rarity: 'rare',
        description: 'ランダムなアタックカード1枚を生成し、そのコストを0にする。廃棄。',
        effect: (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            const player = s as IPlayer;
            const attackCards = Object.values(CardLibrary).filter((c: any) => c.type === 'attack');
            const randomCard = attackCards[Math.floor(Math.random() * attackCards.length)].clone();
            (randomCard as any).temporaryCost = 0; // ターン終了時にリセットされる一時的なコスト変更
            player.hand.push(randomCard);
            e.uiUpdateCallback?.();
        },
        targetType: 'self',
        upgradeData: {
            cost: 0,
            description: 'ランダムなアタックカード1枚を生成し、そのコストを0にする。廃棄。'
        },
        isExhaust: true
    }),
    DOUBLE_TAP: new Card({
        id: 'double_tap',
        name: 'ダブルタップ',
        cost: 1,
        type: 'skill',
        rarity: 'rare',
        description: '次にプレイするアタックカードを2回プレイする。',
        effect: (s: IEntity, t: IEntity | null) => {
            s.addStatus('double_tap', 1);
        },
        targetType: 'self',
        upgradeData: {
            description: '次にプレイする2枚のアタックカードをそれぞれ2回プレイする。',
            effect: (s: IEntity, t: IEntity | null) => { s.addStatus('double_tap', 2); }
        }
    }),
    LIMIT_BREAK: new Card({
        id: 'limit_break',
        name: 'リミットブレイク',
        cost: 1,
        type: 'skill',
        rarity: 'rare',
        description: '筋力を2倍にする。廃棄。',
        effect: (s: IEntity, t: IEntity | null) => {
            const currentStr = s.getStatusValue('strength');
            s.addStatus('strength', currentStr);
        },
        targetType: 'self',
        upgradeData: {
            description: '筋力を2倍にする。',
            effect: (s: IEntity, t: IEntity | null) => {
                const currentStr = s.getStatusValue('strength');
                s.addStatus('strength', currentStr);
            },
            isExhaust: false
        },
        isExhaust: true
    }),
    OFFERING: new Card({
        id: 'offering',
        name: '供物',
        cost: 0,
        type: 'skill',
        rarity: 'rare',
        description: 'HPを6失い、2エナジーを得て、カードを3枚引く。廃棄。',
        effect: (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            s.loseHP(6);
            const player = s as IPlayer;
            player.energy += 2;
            e.drawCards(3);
            e.uiUpdateCallback?.();
        },
        targetType: 'self',
        upgradeData: {
            description: 'HPを6失い、2エナジーを得て、カードを5枚引く。廃棄。',
            effect: (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                s.loseHP(6);
                const player = s as IPlayer;
                player.energy += 2;
                e.drawCards(5);
                e.uiUpdateCallback?.();
            }
        },
        isExhaust: true
    }),
    EXHUME: new Card({
        id: 'exhume',
        name: '発掘',
        cost: 1,
        type: 'skill',
        rarity: 'rare',
        description: '廃棄置き場からカード1枚を手札に加える。廃棄。',
        effect: (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            const player = s as IPlayer;
            if (e.onCardSelectionRequest && player.exhaust.length > 0) {
                e.onCardSelectionRequest('回収するカードを選択', player.exhaust, (card: any, index: number) => {
                    if (card) {
                        player.exhaust.splice(index, 1);
                        player.hand.push(card);
                        e.uiUpdateCallback?.();
                    }
                });
            }
        },
        targetType: 'self',
        upgradeData: {
            cost: 0,
            description: '廃棄置き場からカード1枚を手札に加える。廃棄。'
        },
        isExhaust: true
    }),
    IMPERVIOUS: new Card({
        id: 'impervious',
        name: '不動',
        cost: 2,
        type: 'skill',
        rarity: 'rare',
        description: '30ブロックを得る',
        effect: (s: IEntity, t: IEntity | null) => {
            s.addBlock(30);
        },
        targetType: 'self',
        upgradeData: {
            description: '40ブロックを得る',
            baseBlock: 40,
            effect: (s: IEntity, t: IEntity | null) => { s.addBlock(40); }
        },
        baseBlock: 30
    }),
    FINESSE: new Card({
        id: 'finesse',
        name: '技巧',
        cost: 0,
        type: 'skill',
        cardClass: 'colorless',
        rarity: 'uncommon',
        description: '2ブロックを得る。カードを1枚引く。',
        effect: (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
            s.addBlock(2);
            e.drawCards(1);
        },
        targetType: 'self',
        upgradeData: {
            description: '4ブロックを得る。カードを1枚引く。',
            baseBlock: 4,
            effect: (s: IEntity, t: IEntity | null, e: IBattleEngine) => {
                s.addBlock(4);
                e.drawCards(1);
            }
        },
        baseBlock: 2
    }),
};
