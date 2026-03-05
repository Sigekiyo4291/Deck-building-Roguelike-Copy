import { CardLibrary } from './card';
import { RelicLibrary } from './relic';
import {
    createMaskedBanditsEncounter, createDeadAdventurerEncounter, createLouseGroup,
    createColosseumSlaversEncounter, createColosseumEliteEncounter,
    createMysteriousSphereEncounter, createMindBloomBossEncounter
} from './encounter-data';
import { FungiBeast } from './enemies';

/**
 * イベントライブラリ
 * 各イベントは以下の構造を持ちます:
 * - id: イベントID
 * - name: イベント名
 * - image: 画像アイコン（絵文字）
 * - getChoices(game, state): 選択肢を動的に生成する関数
 *   - state: イベント内の状態（繰り返し選択可能なイベント用）
 *   - 戻り値: [{ text: '選択肢テキスト', action: (game: any, updateState: any) => {...} }, ...]
 */

export const EventLibrary = {
    // 1. 生きている壁
    LIVING_WALL: {
        id: 'living_wall',
        name: '生きている壁',
        image: '🧱',
        getChoices: (game: any, state: any = {}) => [
            {
                text: '[忘却] デッキからカードを1枚削除',
                action: (game: any, updateState: any) => {
                    game.showCardRemovalSelection(() => {
                        game.finishEvent();
                    });
                }
            },
            {
                text: '[変容] デッキのカードを1枚変化させる',
                action: (game: any, updateState: any) => {
                    game.showCardTransformSelection(() => {
                        game.finishEvent();
                    });
                }
            },
            {
                text: '[成長] デッキのカードを1枚アップグレード',
                action: (game: any, updateState: any) => {
                    game.showUpgradeSelection(() => {
                        game.finishEvent();
                    });
                }
            }

        ]
    },

    // 2. 一面の堆積物
    GOOP_PUDDLE: {
        id: 'goop_puddle',
        name: '一面の堆積物',
        image: '🟢',
        getChoices: (game: any, state: any = {}) => [
            {
                text: '[ゴールドを回収] ゴールド75獲得。HPを11失う。',
                action: (game: any, updateState: any) => {
                    game.player.gold += 75;
                    game.player.takeDamage(11, game.player);
                    alert(`ゴールドを75獲得しましたが、HPを11失いました...`);
                    game.finishEvent();
                }
            },
            {
                text: '[立ち去る] ゴールド35を失う',
                action: (game: any, updateState: any) => {
                    const loss = Math.min(35, game.player.gold);
                    game.player.gold -= loss;
                    alert(`ゴールドを${loss}失いました。`);
                    game.finishEvent();
                }
            }
        ]
    },

    // 3. 黄金の偶像
    GOLDEN_IDOL: {
        id: 'golden_idol',
        name: '黄金の偶像',
        image: '🗿',
        getChoices: (game: any, state: any = {}) => [
            {
                text: '[取る] 黄金の偶像を取得。罠を発動。',
                action: (game: any, updateState: any) => {
                    // サブ選択肢を表示
                    updateState({
                        phase: 'trap',
                        choices: [
                            {
                                text: '[逃げ切る] 呪い-怪我を受け取る',
                                action: (game: any, updateState2: any) => {
                                    if (game.player.addCard(CardLibrary.INJURY.clone())) {
                                        alert('呪い「怪我」をデッキに追加しました。');
                                    } else {
                                        alert('お守りが発動し、呪い「怪我」を無効化しました！');
                                    }
                                    game.finishEvent();
                                }
                            },
                            {
                                text: '[衝突] 最大HPの25%ダメージ',
                                action: (game: any, updateState2: any) => {
                                    const damage = Math.floor(game.player.maxHp * 0.25);
                                    game.player.takeDamage(damage, game.player);
                                    alert(`${damage}ダメージを受けました！`);
                                    game.finishEvent();
                                }
                            },
                            {
                                text: '[隠れる] 最大HP-8%',
                                action: (game: any, updateState2: any) => {
                                    const loss = Math.floor(game.player.maxHp * 0.08);
                                    game.player.maxHp -= loss;
                                    game.player.hp = Math.min(game.player.hp, game.player.maxHp);
                                    alert(`最大HPが${loss}減少しました。`);
                                    game.finishEvent();
                                }
                            }
                        ]
                    });
                }
            },
            {
                text: '[立ち去る]',
                action: (game: any, updateState: any) => {
                    alert('何も起きませんでした。');
                    game.finishEvent();
                }
            }
        ]
    },

    // 4. 黄金の翼
    GOLDEN_WING: {
        id: 'golden_wing',
        name: '黄金の翼',
        image: '🪽',
        getChoices: (game: any, state: any = {}) => {
            const has10DamageCard = game.player.masterDeck.some((card: any) =>
                card.type === 'attack' && card.description.match(/\d+ダメージ/) && parseInt(card.description.match(/(\d+)ダメージ/)[1]) >= 10
            );

            const choices = [
                {
                    text: '[祈る] デッキからカードを1枚削除。HP7を失う。',
                    action: (game: any, updateState: any) => {
                        game.player.takeDamage(7, game.player);
                        game.showCardRemovalSelection(() => {
                            game.finishEvent();
                        });
                    }
                },
                {
                    text: '[立ち去る]',
                    action: (game: any, updateState: any) => {
                        alert('何も起きませんでした。');
                        game.finishEvent();
                    }
                }
            ];

            if (has10DamageCard) {
                choices.splice(1, 0, {
                    text: '[ロック] ゴールド50-80獲得',
                    action: (game: any, updateState: any) => {
                        const gold = 50 + Math.floor(Math.random() * 31);
                        game.player.gold += gold;
                        alert(`ロックを破壊し、${gold}ゴールドを獲得しました！`);
                        game.finishEvent();
                    }
                });
            }

            return choices;
        }
    },

    // 5. 輝く光
    SHINING_LIGHT: {
        id: 'shining_light',
        name: '輝く光',
        image: '✨',
        getChoices: (game: any, state: any = {}) => [
            {
                text: '[入る] ランダムなカード2枚をアップグレード。最大HPの20%を失う。',
                action: (game: any, updateState: any) => {
                    const upgradableCards = game.player.masterDeck.filter((c: any) => !c.isUpgraded);
                    if (upgradableCards.length > 0) {
                        for (let i = 0; i < Math.min(2, upgradableCards.length); i++) {
                            const idx = Math.floor(Math.random() * upgradableCards.length);
                            upgradableCards[idx].upgrade();
                            upgradableCards.splice(idx, 1);
                        }
                        const hpLoss = Math.floor(game.player.maxHp * 0.2);
                        game.player.takeDamage(hpLoss, game.player);
                        alert(`カード2枚をアップグレードしましたが、HPを${hpLoss}失いました。`);
                    } else {
                        alert('アップグレード可能なカードがありません。');
                    }
                    game.finishEvent();
                }
            },
            {
                text: '[立ち去る]',
                action: (game: any, updateState: any) => {
                    alert('何も起きませんでした。');
                    game.finishEvent();
                }
            }
        ]
    },

    // 6. サーペント (サ・サ・サ・サ・サーペント)
    LIARS_GAME: {
        id: 'liars_game',
        name: 'サ・サ・サ・サ・サーペント',
        image: '🐍',
        getChoices: (game: any, state: any = {}) => [
            {
                text: '[同意] ゴールド175獲得。呪い-疑念を受け取る。',
                action: (game: any, updateState: any) => {
                    game.player.gold += 175;
                    if (game.player.addCard(CardLibrary.DOUBT.clone())) {
                        alert('ゴールド175を獲得しましたが、呪い「疑念」をデッキに追加しました。');
                    } else {
                        alert('ゴールド175を獲得しました！お守りが発動し、呪い「疑念」を無効化しました。');
                    }
                    game.finishEvent();
                }
            },
            {
                text: '[同意しない]',
                action: (game: any, updateState: any) => {
                    alert('何も起きませんでした。');
                    game.finishEvent();
                }
            }
        ]
    },

    // 7. スクラップスライム
    SCRAP_OOZE: {
        id: 'scrap_ooze',
        name: 'スクラップスライム',
        image: '🟩',
        getChoices: (game: any, state: any = {}) => {
            const hpCost = state.hpCost || 3;
            const chance = state.chance || 25;

            return [
                {
                    text: `[中に手を伸ばす] HPを${hpCost}失う。${chance}%の確率でレリックを発見。`,
                    action: (game: any, updateState: any) => {
                        game.player.takeDamage(hpCost, game.player);
                        const roll = Math.random() * 100;
                        if (roll < chance) {
                            // レリック獲得
                            const relic = game.getRelicFromPool(['common', 'uncommon', 'rare']);
                            if (relic) {
                                game.player.relics.push(relic);
                                if (relic.onObtain) relic.onObtain(game.player, game);
                                alert(`レリック「${relic.name}」を獲得しました！`);
                                game.finishEvent();
                            } else {
                                alert('レリックを見つけられませんでした...');
                                game.finishEvent();
                            }
                        } else {
                            // 失敗、再挑戦可能
                            alert('レリックを見つけられませんでした...');
                            updateState({
                                hpCost: hpCost + 1,
                                chance: chance + 10
                            });
                        }
                    }
                },
                {
                    text: '[立ち去る]',
                    action: (game: any, updateState: any) => {
                        alert('何も起きませんでした。');
                        game.finishEvent();
                    }
                }
            ];
        }
    },

    // 8. 聖職者
    CLERIC: {
        id: 'cleric',
        name: '聖職者',
        image: '⛪',
        getChoices: (game: any, state: any = {}) => [
            {
                text: '[回復] 35ゴールド: 最大HPの25%回復',
                action: (game: any, updateState: any) => {
                    if (game.player.gold >= 35) {
                        game.player.gold -= 35;
                        const healAmount = Math.floor(game.player.maxHp * 0.25);
                        game.player.heal(healAmount);
                        alert(`35ゴールドを支払い、HPを${healAmount}回復しました。`);
                        game.finishEvent();
                    } else {
                        alert('ゴールドが足りません！');
                    }
                }
            },
            {
                text: '[浄化] 50ゴールド: デッキからカードを1枚削除',
                action: (game: any, updateState: any) => {
                    if (game.player.gold >= 50) {
                        game.player.gold -= 50;
                        game.showCardRemovalSelection(() => {
                            game.finishEvent();
                        });
                    } else {
                        alert('ゴールドが足りません！');
                    }
                }
            },
            {
                text: '[立ち去る]',
                action: (game: any, updateState: any) => {
                    alert('何も起きませんでした。');
                    game.finishEvent();
                }
            }
        ]
    },

    // 9. ビッグフィッシュ
    BIG_FISH: {
        id: 'big_fish',
        name: 'ビッグフィッシュ',
        image: '🐟',
        getChoices: (game: any, state: any = {}) => [
            {
                text: '[バナナ] 最大HPの33%回復',
                action: (game: any, updateState: any) => {
                    const healAmount = Math.floor(game.player.maxHp * 0.33);
                    game.player.heal(healAmount);
                    alert(`HPを${healAmount}回復しました！`);
                    game.finishEvent();
                }
            },
            {
                text: '[ドーナツ] 最大HP +5増加',
                action: (game: any, updateState: any) => {
                    game.player.maxHp += 5;
                    game.player.hp += 5;
                    alert('最大HPが5増加しました！');
                    game.finishEvent();
                }
            },
            {
                text: '[箱] レリックを受け取る。呪い-後悔を受け取る。',
                action: (game: any, updateState: any) => {
                    const relic = game.getRelicFromPool(['common', 'uncommon', 'rare']);
                    if (relic) {
                        game.player.relics.push(relic);
                        if (relic.onObtain) relic.onObtain(game.player, game);
                        if (game.player.addCard(CardLibrary.REGRET.clone())) {
                            alert(`レリック「${relic.name}」を獲得しましたが、呪い「後悔」をデッキに追加しました。`);
                        } else {
                            alert(`レリック「${relic.name}」を獲得しました！お守りが発動し、呪い「後悔」を無効化しました。`);
                        }
                    }
                    game.finishEvent();
                }
            }
        ]
    },

    // 10. 冒険者の屍
    DEAD_ADVENTURER: {
        id: 'dead_adventurer',
        name: '冒険者の屍',
        image: '💀',
        getChoices: (game: any, state: any = {}) => {
            const searchCount = state.searchCount || 0;
            const encounterChance = 25 + searchCount * 25;
            const foundRelic = state.foundRelic || false;
            const foundGold = state.foundGold || false;

            return [
                {
                    text: `[探索] 戦利品を発見。${encounterChance}%の確率でモンスターが戻ってくる。`,
                    action: (game: any, updateState: any) => {
                        const roll = Math.random() * 100;
                        if (roll < encounterChance) {
                            // モンスターに遭遇
                            alert('モンスターに見つかった！');
                            const enemies = createDeadAdventurerEncounter(game.currentAct);
                            game.startEventBattle(createDeadAdventurerEncounter(game.currentAct), () => {
                                const extraRewards = [];
                                if (!foundRelic) {
                                    const relic = game.getRelicFromPool(['common', 'uncommon', 'rare']);
                                    if (relic) {
                                        extraRewards.push({ type: 'relic', data: relic, taken: false });
                                    }
                                }
                                if (!foundGold) {
                                    extraRewards.push({ type: 'gold', value: 30, taken: false });
                                }
                                game.showRewardScene(false, false, false, extraRewards, () => {
                                    game.finishEvent();
                                }, false);
                            }, false);
                        } else {
                            // 戦利品を発見
                            const lootRoll = Math.random();
                            if (!foundRelic && lootRoll < 0.4) {
                                // レリック獲得
                                const relic = game.getRelicFromPool(['common', 'uncommon', 'rare']);
                                if (relic) {
                                    game.player.relics.push(relic);
                                    if (relic.onObtain) relic.onObtain(game.player, game);
                                    alert(`レリック「${relic.name}」を発見しました！`);
                                    updateState({ searchCount: searchCount + 1, foundRelic: true, foundGold: foundGold });
                                }
                            } else if (!foundGold && lootRoll < 0.7) {
                                // ゴールド獲得
                                const gold = 50 + Math.floor(Math.random() * 50);
                                game.player.gold += gold;
                                alert(`${gold}ゴールドを発見しました！`);
                                updateState({ searchCount: searchCount + 1, foundRelic: foundRelic, foundGold: true });
                            } else {
                                // 何もなし
                                alert('何も見つかりませんでした...');
                                updateState({ searchCount: searchCount + 1, foundRelic: foundRelic, foundGold: foundGold });
                            }
                        }
                    }
                },
                {
                    text: '[立ち去る]',
                    action: (game: any, updateState: any) => {
                        alert('何も起きませんでした。');
                        game.finishEvent();
                    }
                }
            ];
        }
    },

    // 11. マッシュルーム
    MUSHROOMS: {
        id: 'mushrooms',
        name: 'マッシュルーム',
        image: '🍄',
        getChoices: (game: any, state: any = {}) => [
            {
                text: '[踏み潰す] キノコビーストx3と戦闘。',
                action: (game: any, updateState: any) => {
                    const enemies = [new FungiBeast(), new FungiBeast(), new FungiBeast()];
                    game.startEventBattle(enemies, () => {
                        // 通常報酬（カード、ゴールド）+ 特定のレリック（奇妙なキノコ）
                        const extraRewards = [{ type: 'relic', data: RelicLibrary.ODD_MUSHROOM, taken: false }];
                        game.showRewardScene(false, false, false, extraRewards, () => {
                            game.finishEvent();
                        });
                    });
                }
            },
            {
                text: '[食べる] 最大HPの25%回復。呪い-寄生を受け取る。',
                action: (game: any, updateState: any) => {
                    const healAmount = Math.floor(game.player.maxHp * 0.25);
                    game.player.heal(healAmount);
                    if (game.player.addCard(CardLibrary.PARASITE.clone())) {
                        alert(`HPを${healAmount}回復しましたが、呪い「寄生」をデッキに追加しました。`);
                    } else {
                        alert(`HPを${healAmount}回復しました！お守りが発動し、呪い「寄生」を無効化しました。`);
                    }
                    game.finishEvent();
                }
            }
        ]
    },
    // --- Act 2 Events ---
    VAMPIRES: {
        id: 'vampires',
        name: '吸血鬼（？）',
        image: '🧛',
        getChoices: (game: any, state: any = {}) => {
            const choices = [
                {
                    text: `[受け入れる] すべてのストライクを削除。5枚の「噛みつき」を獲得。最大HP30%を失う。`,
                    action: (game: any, updateState: any) => {
                        // ストライクをすべて削除
                        game.player.masterDeck = game.player.masterDeck.filter((c: any) => !c.id.includes('strike') && !c.name.includes('ストライク'));
                        // 噛みつきを5枚追加
                        for (let i = 0; i < 5; i++) {
                            game.player.masterDeck.push(CardLibrary.BITE.clone());
                        }
                        const hpLoss = Math.floor(game.player.maxHp * 0.3);
                        game.player.maxHp -= hpLoss;
                        game.player.hp = Math.min(game.player.hp, game.player.maxHp);
                        alert(`ストライクを全て失い、噛みつきを5枚獲得しました。最大HPが${hpLoss}減少しました。`);
                        game.finishEvent();
                    }
                }
            ];

            const hasBloodVial = game.player.relics.some((r: any) => r.id === 'blood_vial');
            if (hasBloodVial) {
                choices.push({
                    text: `[供物：血のガラス瓶] このレリックを失う。すべてのストライクを削除。5枚の「噛みつき」を獲得。`,
                    action: (game: any, updateState: any) => {
                        game.player.relics = game.player.relics.filter((r: any) => r.id !== 'blood_vial');
                        game.player.masterDeck = game.player.masterDeck.filter((c: any) => !c.id.includes('strike') && !c.name.includes('ストライク'));
                        for (let i = 0; i < 5; i++) {
                            game.player.masterDeck.push(CardLibrary.BITE.clone());
                        }
                        alert(`「血のガラス瓶」を捧げ、噛みつきを5枚獲得しました。`);
                        game.finishEvent();
                    }
                });
            }

            choices.push({
                text: '[拒否] 何も起こらない。',
                action: (game: any, updateState: any) => {
                    game.finishEvent();
                }
            });
            return choices;
        }
    },
    ANCIENT_WRITING: {
        id: 'ancient_writing',
        name: '古代の筆跡',
        image: '📜',
        getChoices: (game: any, state: any = {}) => [
            {
                text: '[優雅] デッキからカードを1枚削除。',
                action: (game: any, updateState: any) => {
                    game.showCardRemovalSelection(() => {
                        game.finishEvent();
                    });
                }
            },
            {
                text: '[シンプル] 全ての「ストライク」と「ディフェンド」をアップグレード。',
                action: (game: any, updateState: any) => {
                    game.player.masterDeck.forEach((c: any) => {
                        if (c.id.includes('strike') || c.id.includes('defend')) {
                            c.upgrade();
                        }
                    });
                    alert('全てのストライクとディフェンドをアップグレードしました。');
                    game.finishEvent();
                }
            }
        ]
    },
    KNOWING_SKULL: {
        id: 'knowing_skull',
        name: 'しゃれこうべ',
        image: '💀',
        getChoices: (game: any, state: any = {}) => {
            const hpCost = Math.floor(game.player.maxHp * 0.1);
            return [
                {
                    text: `[景気づけ？] ランダムなポーションを獲得。HPを${hpCost}失う。`,
                    action: (game: any, updateState: any) => {
                        game.player.takeDamage(hpCost, game.player);
                        game.gainRandomPotion();
                        // 繰り返し可能
                    }
                },
                {
                    text: `[富？] ゴールド90獲得。HPを${hpCost}失う。`,
                    action: (game: any, updateState: any) => {
                        game.player.takeDamage(hpCost, game.player);
                        game.player.gold += 90;
                        alert('90ゴールドを獲得しました。');
                    }
                },
                {
                    text: `[成功？] ランダムな無色のカード獲得。HPを${hpCost}失う。`,
                    action: (game: any, updateState: any) => {
                        game.player.takeDamage(hpCost, game.player);
                        const colorlessCards = Object.values(CardLibrary).filter((c: any) => c.cardClass === 'colorless');
                        if (colorlessCards.length > 0) {
                            const card = colorlessCards[Math.floor(Math.random() * colorlessCards.length)].clone();
                            game.player.masterDeck.push(card);
                            alert(`カード「${card.name}」を獲得しました。`);
                        }
                    }
                },
                {
                    text: `[立ち去る？] HPを${hpCost}失う。`,
                    action: (game: any, updateState: any) => {
                        game.player.takeDamage(hpCost, game.player);
                        game.finishEvent();
                    }
                }
            ];
        }
    },
    ADDICT: {
        id: 'addict',
        name: 'すがりつくホームレス',
        image: '🏚️',
        getChoices: (game: any, state: any = {}) => {
            const choices = [];
            if (game.player.gold >= 85) {
                choices.push({
                    text: '[ゴールドを渡す] 85ゴールド: レリックを受け取る。',
                    action: (game: any, updateState: any) => {
                        game.player.gold -= 85;
                        game.gainRandomRelicByRarity('uncommon'); // StSではアンコモン相当
                        game.finishEvent();
                    }
                });
            }
            choices.push({
                text: '[強奪] レリックを奪い取る。呪い-羞恥。',
                action: (game: any, updateState: any) => {
                    game.gainRandomRelicByRarity('uncommon');
                    game.player.addCard(CardLibrary.SHAME.clone());
                    alert('レリックを強奪しましたが、呪い「羞恥」を受けました。');
                    game.finishEvent();
                }
            });
            choices.push({
                text: '[立ち去る]',
                action: (game: any, updateState: any) => {
                    game.finishEvent();
                }
            });
            return choices;
        }
    },
    BEGGAR: {
        id: 'beggar',
        name: '年老いた物乞い',
        image: '👴',
        getChoices: (game: any, state: any = {}) => {
            const choices = [];
            if (game.player.gold >= 75) {
                choices.push({
                    text: '[ゴールドを提供] 75ゴールド: カードを1枚削除。',
                    action: (game: any, updateState: any) => {
                        game.player.gold -= 75;
                        game.showCardRemovalSelection(() => {
                            game.finishEvent();
                        });
                    }
                });
            }
            choices.push({
                text: '[立ち去る]',
                action: (game: any, updateState: any) => {
                    game.finishEvent();
                }
            });
            return choices;
        }
    },
    THE_LIBRARY: {
        id: 'library',
        name: '図書館',
        image: '📚',
        getChoices: (game: any, state: any = {}) => [
            {
                text: '[読書] 20枚のカードの中から、デッキに加えるカードを1枚選択。',
                action: (game: any, updateState: any) => {
                    const allCards = Object.values(CardLibrary).filter((c: any) => c.type !== 'curse' && c.type !== 'status' && c.rarity !== 'basic' && c.rarity !== 'special');
                    const candidates = [];
                    for (let i = 0; i < 20; i++) {
                        candidates.push(allCards[Math.floor(Math.random() * allCards.length)].clone());
                    }
                    game.onCardSelectionRequest('図書館: カードを1枚選択', candidates, (selectedCard: any) => {
                        if (selectedCard) {
                            game.player.masterDeck.push(selectedCard);
                            alert(`${selectedCard.name} をデッキに加えました。`);
                        }
                        game.finishEvent();
                    });
                }
            },
            {
                text: '[睡眠] 最大HPの33%回復。',
                action: (game: any, updateState: any) => {
                    const healAmount = Math.floor(game.player.maxHp * 0.33);
                    game.player.heal(healAmount);
                    alert(`HPを${healAmount}回復しました。`);
                    game.finishEvent();
                }
            }
        ]
    },
    NLOTH: {
        id: 'nloth',
        name: 'ヌロス',
        image: '👺',
        getChoices: (game: any, state: any = {}) => {
            const choices = [];
            const relics = game.player.relics.filter((r: any) => r.rarity !== 'starter' && r.rarity !== 'event' && r.rarity !== 'special');
            if (relics.length > 0) {
                const randomRelic = relics[Math.floor(Math.random() * relics.length)];
                choices.push({
                    text: `[供物：${randomRelic.name}] このレリックを失い、ヌロスの贈り物を獲得。`,
                    action: (game: any, updateState: any) => {
                        game.player.relics = game.player.relics.filter((r: any) => r !== randomRelic);
                        game.player.relics.push(RelicLibrary.NLOTH_GIFT);
                        alert(`「${randomRelic.name}」を失い、「ヌロスの贈り物」を獲得しました。`);
                        game.finishEvent();
                    }
                });
            }
            choices.push({
                text: '[立ち去る]',
                action: (game: any, updateState: any) => {
                    game.finishEvent();
                }
            });
            return choices;
        }
    },
    CURSED_TOME: {
        id: 'cursed_tome',
        name: '呪われた本',
        image: '📖',
        getChoices: (game: any, state: any = {}) => {
            const step = state.step || 0;
            const hpLossMap = [1, 2, 3, 10, 0];
            const hpLoss = hpLossMap[step];

            if (step === 4) {
                return [
                    {
                        text: '[取る] 本を手に入れる。',
                        action: (game: any, updateState: any) => {
                            const candidates = [RelicLibrary.ENCHIRIDION, RelicLibrary.NECRONOMICON, RelicLibrary.NILRY_CODEX];
                            const relic = candidates[Math.floor(Math.random() * candidates.length)];
                            game.player.relics.push(relic);
                            if (relic.onObtain) relic.onObtain(game.player, game);
                            alert(`レリック「${relic.name}」を獲得しました！`);
                            game.finishEvent();
                        }
                    }
                ];
            }

            return [
                {
                    text: step === 0 ? '[読む] ページをめくる。' : `[読み進める] さらにページをめくる。HPを${hpLoss}失う。`,
                    action: (game: any, updateState: any) => {
                        if (hpLoss > 0) game.player.takeDamage(hpLoss, game.player);
                        updateState({ step: step + 1 });
                    }
                },
                {
                    text: '[止める] 本を閉じる。',
                    action: (game: any, updateState: any) => {
                        game.player.takeDamage(3, game.player);
                        game.finishEvent();
                    }
                }
            ];
        }
    },
    MASKED_BANDITS: {
        id: 'masked_bandits',
        name: '覆面の盗賊',
        image: '🥷',
        getChoices: (game: any, state: any = {}) => [
            {
                text: '[支払う] 全てのゴールドを失う。',
                action: (game: any, updateState: any) => {
                    const lostGold = game.player.gold;
                    game.player.gold = 0;
                    alert(`${lostGold}ゴールドを支払いました。`);
                    game.finishEvent();
                }
            },
            {
                text: '[戦闘！] モンスターを撃退する。',
                action: (game: any, updateState: any) => {
                    const enemies = createMaskedBanditsEncounter();
                    game.startEventBattle(enemies, () => {
                        // 通常報酬 + レッドマスク
                        const extraRewards = [{ type: 'relic', data: RelicLibrary.RED_MASK, taken: false }];
                        game.showRewardScene(false, false, false, extraRewards, () => {
                            game.finishEvent();
                        });
                    });
                }
            }
        ]
    },
    DRUG_DEALER: {
        id: 'drug_dealer',
        name: '増強因子',
        image: '🧪',
        getChoices: (game: any, state: any = {}) => [
            {
                text: '[J.A.X.を試す] ジャックスする。',
                action: (game: any, updateState: any) => {
                    game.player.masterDeck.push(CardLibrary.JAX.clone());
                    alert('カード「J.A.X.」を獲得しました。');
                    game.finishEvent();
                }
            },
            {
                text: '[実験体に志願] 2枚のカードを変化させる。',
                action: (game: any, updateState: any) => {
                    game.showCardTransformSelection(() => {
                        game.showCardTransformSelection(() => {
                            game.finishEvent();
                        });
                    });
                }
            },
            {
                text: '[突然変異原を摂取] 突然変異性筋肥大を獲得。',
                action: (game: any, updateState: any) => {
                    game.player.relics.push(RelicLibrary.MUTAGENIC_STRENGTH);
                    alert('レリック「突然変異性筋肥大」を獲得しました。');
                    game.finishEvent();
                }
            }
        ]
    },
    DESIGNER_IN_SPIRE: {
        id: 'designer_in_spire',
        name: 'デザイナー　イン・スパイア',
        image: '👔',
        getChoices: (game: any, state: any = {}) => {
            const choices = [];

            // 抽選結果の初期化/保持
            if (state.tailorResult === undefined) {
                state.tailorResult = Math.random() < 0.5 ? 'upgrade_select' : 'upgrade_random_2';
            }
            if (state.cleaningResult === undefined) {
                state.cleaningResult = Math.random() < 0.5 ? 'remove_select' : 'transform_2';
            }

            // 1. 仕立直し (40G)
            const tailorText = state.tailorResult === 'upgrade_select'
                ? '選んだカードを1枚アップグレードする'
                : 'ランダムなカードを2枚アップグレードする';

            if (game.player.gold >= 40) {
                choices.push({
                    text: `[仕立直し] 40ゴールドを失う。(${tailorText})`,
                    action: (game: any) => {
                        game.player.gold -= 40;
                        if (state.tailorResult === 'upgrade_select') {
                            const upgradable = game.player.masterDeck.filter((c: any) => !c.isUpgraded);
                            game.onCardSelectionRequest('強化するカードを選択', upgradable, (card: any) => {
                                if (card) card.upgrade();
                                game.finishEvent();
                            });
                        } else {
                            game.upgradeRandomCard();
                            game.upgradeRandomCard();
                            game.finishEvent();
                        }
                    }
                });
            }

            // 2. クリーニング (60G)
            const cleaningText = state.cleaningResult === 'remove_select'
                ? '選んだカードを1枚削除する'
                : '選んだカードを2枚変化する';

            if (game.player.gold >= 60) {
                choices.push({
                    text: `[クリーニング] 60ゴールドを失う。(${cleaningText})`,
                    action: (game: any) => {
                        game.player.gold -= 60;
                        if (state.cleaningResult === 'remove_select') {
                            game.showCardRemovalSelection(() => {
                                game.finishEvent();
                            });
                        } else {
                            game.showCardTransformSelection(() => {
                                game.showCardTransformSelection(() => {
                                    game.finishEvent();
                                });
                            });
                        }
                    }
                });
            }

            // 3. フルサービス (90G)
            if (game.player.gold >= 90) {
                choices.push({
                    text: '[フルサービス] 90ゴールドを失う。カードを1枚削除し、ランダムな1枚を強化。',
                    action: (game: any) => {
                        game.player.gold -= 90;
                        game.showCardRemovalSelection(() => {
                            game.upgradeRandomCard();
                            game.finishEvent();
                        });
                    }
                });
            }

            // 4. 殴る (3ダメージ)
            choices.push({
                text: '[殴る] HPを3失う。',
                action: (game: any) => {
                    game.player.takeDamage(3, game.player);
                    game.finishEvent();
                }
            });

            return choices;
        }
    },
    COUNCIL_OF_GHOSTS: {
        id: 'ghost_council',
        name: '幽霊議会',
        image: '👻',
        getChoices: (game: any, state: any = {}) => [
            {
                text: '[承諾] 5枚の「幻姿」を獲得。最大HPの50%を失う。',
                action: (game: any, updateState: any) => {
                    const hpLoss = Math.floor(game.player.maxHp * 0.5);
                    game.player.maxHp -= hpLoss;
                    game.player.hp = Math.min(game.player.hp, game.player.maxHp);
                    for (let i = 0; i < 5; i++) {
                        game.player.masterDeck.push(CardLibrary.APPARITION.clone());
                    }
                    alert(`幻姿を5枚獲得し、最大HPが${hpLoss}減少しました。`);
                    game.finishEvent();
                }
            },
            {
                text: '[拒否]',
                action: (game: any, updateState: any) => {
                    game.finishEvent();
                }
            }
        ]
    },
    MAUSOLEUM: {
        id: 'mausoleum',
        name: '霊廟',
        image: '🏛️',
        getChoices: (game: any, state: any = {}) => [
            {
                text: '[石棺を開封] レリックを受け取る。50%で呪い-苦悩。',
                action: (game: any, updateState: any) => {
                    game.gainRandomRelicByRarity('rare');
                    if (Math.random() < 0.5) {
                        game.player.addCard(CardLibrary.WRITHE.clone());
                        alert('レリックを獲得しましたが、呪い「苦悩」を受けました。');
                    } else {
                        alert('レリックを獲得しました！');
                    }
                    game.finishEvent();
                }
            },
            {
                text: '[立ち去る]',
                action: (game: any, updateState: any) => {
                    game.finishEvent();
                }
            }
        ]
    },
    FORGOTTEN_ALTAR: {
        id: 'forgotten_altar',
        name: '忘れられた祭壇',
        image: '🕯️',
        getChoices: (game: any, state: any = {}) => {
            const choices = [];
            const hasGoldenIdol = game.player.relics.some((r: any) => r.id === 'golden_idol_relic');
            if (hasGoldenIdol) {
                choices.push({
                    text: '[供物：黄金の偶像] スペシャルレリック「血塗られた偶像」を受け取る。',
                    action: (game: any, updateState: any) => {
                        game.player.relics = game.player.relics.filter((r: any) => r.id !== 'golden_idol_relic');
                        game.player.relics.push(RelicLibrary.BLOODY_IDOL);
                        alert('「黄金の偶像」を捧げ、「血塗られた偶像」を獲得しました。');
                        game.finishEvent();
                    }
                });
            }
            choices.push({
                text: `[犠牲] 最大HP+5。HPを${Math.floor(game.player.maxHp * 0.25)}失う。`,
                action: (game: any, updateState: any) => {
                    game.player.maxHp += 5;
                    game.player.hp += 5;
                    const hpLoss = Math.floor(game.player.maxHp * 0.25);
                    game.player.takeDamage(hpLoss, game.player);
                    alert(`最大HPが5増加しましたが、HPを${hpLoss}失いました。`);
                    game.finishEvent();
                }
            });
            choices.push({
                text: '[冒涜] 呪い-腐敗を受け取る。',
                action: (game: any, updateState: any) => {
                    game.player.addCard(CardLibrary.DECAY.clone());
                    alert('呪い「腐敗」を受け取りました。');
                    game.finishEvent();
                }
            });
            return choices;
        }
    },
    COLOSSEUM: {
        id: 'colosseum',
        name: 'コロシアム',
        image: '⚔️',
        getChoices: (game: any, state: any = {}) => {
            if (state.phase === 'victory_selection') {
                return [
                    {
                        text: '[臆病者め] 逃げる。',
                        action: (game: any, updateState: any) => {
                            game.finishEvent();
                        }
                    },
                    {
                        text: '[勝利を!] 屈強な敵に挑み、沢山の褒賞を手にする。',
                        action: (game: any, updateState: any) => {
                            const enemies = createColosseumEliteEncounter();
                            game.startEventBattle(enemies, () => {
                                // 勝利報酬: 100ゴールド、アンコモンレリック、レアレリック + 通常報酬
                                const extraRewards = [
                                    { type: 'gold', value: 100, taken: false },
                                    { type: 'relic', data: game.getRelicFromPool(['uncommon']), taken: false },
                                    { type: 'relic', data: game.getRelicFromPool(['rare']), taken: false }
                                ];
                                game.showRewardScene(false, false, false, extraRewards, () => {
                                    game.finishEvent();
                                }, false);
                            }, false);
                        }
                    }
                ];
            }
            return [
                {
                    text: '[戦闘！] スレイバー+スレイバー赤との強制戦闘。',
                    action: (game: any, updateState: any) => {
                        const enemies = createColosseumSlaversEncounter();
                        game.startEventBattle(enemies, () => {
                            // 1戦目に通常の戦闘報酬はない
                            game.showRewardScene(false, false, false, [], () => {
                                // 報酬画面終了後にイベント画面を表示して連戦へ
                                game.sceneManager.showEvent();
                                updateState({ phase: 'victory_selection' });
                            }, false);
                        }, false);
                    }
                }
            ];
        }
    },
    THE_NEST: {
        id: 'the_nest',
        name: '巣窟',
        image: '🪹',
        getChoices: (game: any, state: any = {}) => [
            {
                text: '[強奪] 99ゴールドを得る。',
                action: (game: any, updateState: any) => {
                    game.player.gold += 99;
                    alert('99ゴールドを獲得しました。');
                    game.finishEvent();
                }
            },
            {
                text: '[留まる] 儀式の短剣を獲得する。6ダメージを受ける。',
                action: (game: any, updateState: any) => {
                    game.player.takeDamage(6, game.player);
                    game.player.masterDeck.push(CardLibrary.RITUAL_DAGGER.clone());
                    alert('カード「儀式の短剣」を獲得しました。');
                    game.finishEvent();
                }
            }
        ]
    },
    THE_JOUST: {
        id: 'the_joust',
        name: '馬上槍',
        image: '🐎',
        getChoices: (game: any, state: any = {}) => [
            {
                text: '[仇敵] 賭け金50ゴールド (70%で100ゴールド獲得)',
                action: (game: any, updateState: any) => {
                    if (game.player.gold >= 50) {
                        game.player.gold -= 50;
                        if (Math.random() < 0.7) {
                            game.player.gold += 100;
                            alert('勝利！100ゴールド獲得しました。');
                        } else {
                            alert('敗北...ゴールドを失いました。');
                        }
                    } else {
                        alert('ゴールドが足りません。');
                    }
                    game.finishEvent();
                }
            },
            {
                text: '[飼い主] 賭け金50ゴールド (30%で250ゴールド獲得)',
                action: (game: any, updateState: any) => {
                    if (game.player.gold >= 50) {
                        game.player.gold -= 50;
                        if (Math.random() < 0.3) {
                            game.player.gold += 250;
                            alert('大勝利！250ゴールド獲得しました。');
                        } else {
                            alert('敗北...ゴールドを失いました。');
                        }
                    } else {
                        alert('ゴールドが足りません。');
                    }
                    game.finishEvent();
                }
            }
        ]
    },
    FACE_TRADER: {
        id: 'face_trader',
        name: 'フェイストレーダー',
        image: '👺',
        getChoices: (game: any, state: any = {}) => [
            {
                text: `[触れる] HPを${Math.floor(game.player.maxHp * 0.1)}失う。75ゴールドを得る。`,
                action: (game: any, updateState: any) => {
                    const hpLoss = Math.floor(game.player.maxHp * 0.1);
                    game.player.takeDamage(hpLoss, game.player);
                    game.player.gold += 75;
                    alert(`HPを${hpLoss}失い、75ゴールドを獲得しました。`);
                    game.finishEvent();
                }
            },
            {
                text: '[取引する] 50%で良い顔、50%で悪い顔。',
                action: (game: any, updateState: any) => {
                    if (Math.random() < 0.5) {
                        const goodFaces = [RelicLibrary.CLERIC_FACE, RelicLibrary.CULTIST_HEADPIECE];
                        const relic = goodFaces[Math.floor(Math.random() * goodFaces.length)];
                        game.player.relics.push(relic);
                        alert(`良い顔「${relic.name}」を獲得しました！`);
                    } else {
                        const badFaces = [RelicLibrary.NLOTH_HUNGRY_FACE, RelicLibrary.GREMLIN_VISAGE];
                        const relic = badFaces[Math.floor(Math.random() * badFaces.length)];
                        game.player.relics.push(relic);
                        alert(`悪い顔「${relic.name}」を獲得しました...`);
                    }
                    game.finishEvent();
                }
            },
            {
                text: '[立ち去る]',
                action: (game: any, updateState: any) => {
                    game.finishEvent();
                }
            }
        ]
    },
    // --- Act 3 Events ---
    RED_MASK_TOMB: {
        id: 'red_mask_tomb',
        name: '紅の覆面王の墓石',
        image: '🗿',
        getChoices: (game: any, state: any = {}) => {
            const choices = [];
            const hasRedMask = game.player.relics.some((r: any) => r.id === 'red_mask');
            if (hasRedMask) {
                choices.push({
                    text: '[ロック] 必要なもの：赤いマスク。222ゴールドを獲得。',
                    action: (game: any, updateState: any) => {
                        game.player.gold += 222;
                        alert('墓石にマスクを合わせると、隠し場所が開きました。222ゴールド獲得！');
                        game.finishEvent();
                    }
                });
            }
            choices.push({
                text: '[供物] ゴールドを全て失う。レリック「赤いマスク」を獲得。',
                action: (game: any, updateState: any) => {
                    game.player.gold = 0;
                    game.player.relics.push(RelicLibrary.RED_MASK);
                    alert('全ての持ち金を捧げ、赤いマスクを手に入れました。');
                    game.finishEvent();
                }
            });
            choices.push({
                text: '[立ち去る]',
                action: (game: any, updateState: any) => {
                    game.finishEvent();
                }
            });
            return choices;
        }
    },
    MYSTERIOUS_SPHERE: {
        id: 'mysterious_sphere',
        name: '神秘の球体',
        image: '🔮',
        getChoices: (game: any, state: any = {}) => [
            {
                text: '[球体を開く] 大いなる守護者と戦闘。',
                action: (game: any, updateState: any) => {
                    const enemies = createMysteriousSphereEncounter();
                    game.startEventBattle(enemies, () => {
                        // 勝利報酬: レアレリック + 通常報酬
                        const extraRewards = [{ type: 'relic', data: game.getRelicFromPool(['rare']), taken: false }];
                        game.showRewardScene(true, false, false, extraRewards, () => {
                            game.finishEvent();
                        }, true);
                    }, false); // エリート扱い
                }
            },
            {
                text: '[立ち去る]',
                action: (game: any, updateState: any) => {
                    game.finishEvent();
                }
            }
        ]
    },
    SENSORY_STONE: {
        id: 'sensory_stone',
        name: 'センサリーストーン',
        image: '💎',
        getChoices: (game: any, state: any = {}) => {
            const getColorlessCards = (count: number) => {
                const colorless = Object.values(CardLibrary).filter((c: any) => c.cardClass === 'colorless');
                const result = [];
                for (let i = 0; i < count; i++) {
                    result.push(colorless[Math.floor(Math.random() * colorless.length)].clone());
                }
                return result;
            };

            return [
                {
                    text: '[思い起こす] 無色のカード1枚をデッキに加える。',
                    action: (game: any, updateState: any) => {
                        const candidates = getColorlessCards(3);
                        game.onCardSelectionRequest('センサリーストーン: カードを1枚選択', candidates, (card: any) => {
                            if (card) game.player.masterDeck.push(card);
                            game.finishEvent();
                        });
                    }
                },
                {
                    text: '[思い起こす] 無色のカード2枚をデッキに加える。HPを5失う。',
                    action: (game: any, updateState: any) => {
                        game.player.takeDamage(5, game.player);
                        const candidates = getColorlessCards(3);
                        game.onCardSelectionRequest('センサリーストーン: 1枚目を選択', candidates, (card1: any) => {
                            if (card1) game.player.masterDeck.push(card1);
                            const candidates2 = getColorlessCards(3);
                            game.onCardSelectionRequest('センサリーストーン: 2枚目を選択', candidates2, (card2: any) => {
                                if (card2) game.player.masterDeck.push(card2);
                                game.finishEvent();
                            });
                        });
                    }
                },
                {
                    text: '[思い起こす] 無色のカード3枚をデッキに加える。HPを10失う。',
                    action: (game: any, updateState: any) => {
                        game.player.takeDamage(10, game.player);
                        const pickNext = (remaining: number) => {
                            if (remaining <= 0) {
                                game.finishEvent();
                                return;
                            }
                            const candidates = getColorlessCards(3);
                            game.onCardSelectionRequest(`センサリーストーン: 残り${remaining}枚`, candidates, (card: any) => {
                                if (card) game.player.masterDeck.push(card);
                                pickNext(remaining - 1);
                            });
                        };
                        pickNext(3);
                    }
                }
            ];
        }
    },
    SECRET_PORTAL: {
        id: 'secret_portal',
        name: '秘密のポータル',
        image: '🌀',
        getChoices: (game: any, state: any = {}) => [
            {
                text: '[ポータルに入る] 即座にボスのところまでワープする。',
                action: (game: any, updateState: any) => {
                    alert('ポータルに飛び込み、フロアの最奥へワープしました！');
                    if ((game as any).skipToBoss) (game as any).skipToBoss();
                    game.finishEvent();
                }
            },
            {
                text: '[立ち去る]',
                action: (game: any, updateState: any) => {
                    game.finishEvent();
                }
            }
        ]
    },
    MIND_BLOOM: {
        id: 'mind_bloom',
        name: 'マインドブルーム',
        image: '🧠',
        getChoices: (game: any, state: any = {}) => {
            const choices = [
                {
                    text: '[私は闘争者] アクト1のボスと戦う。レアレリックを一つ獲得する。',
                    action: (game: any, updateState: any) => {
                        const enemies = createMindBloomBossEncounter();
                        game.startEventBattle(enemies, () => {
                            // 勝利報酬: レアレリック + 通常報酬
                            const extraRewards = [{ type: 'relic', data: game.getRelicFromPool(['rare']), taken: false }];
                            game.showRewardScene(true, false, false, extraRewards, () => {
                                game.finishEvent();
                            }, true);
                        }, true); // ボス扱いではないがエリート扱いで良いか
                    }
                },
                {
                    text: '[私は目覚めた] 全てのカードをアップグレード。回復不可になる。',
                    action: (game: any, updateState: any) => {
                        game.player.masterDeck.forEach((c: any) => c.upgrade());
                        game.player.relics.push(RelicLibrary.MARK_OF_THE_BLOOM);
                        alert('全てのカードを強化しましたが、呪われた花の印により二度とHPを回復できなくなりました。');
                        game.finishEvent();
                    }
                }
            ];

            const floor = game.currentFloor || 35;
            if (floor >= 41) {
                choices.push({
                    text: '[私は健康] HPを全回復する。呪い-疑念を獲得。',
                    action: (game: any, updateState) => {
                        game.player.hp = game.player.maxHp;
                        game.player.addCard(CardLibrary.DOUBT.clone());
                        alert('HPを全回復しましたが、強い疑念に囚われました。');
                        game.finishEvent();
                    }
                });
            } else {
                choices.push({
                    text: '[私はお金持ち] 999ゴールドを得る。呪い-凡庸を2枚獲得。',
                    action: (game: any, updateState) => {
                        game.player.gold += 999;
                        game.player.addCard(CardLibrary.NORMALITY.clone());
                        game.player.addCard(CardLibrary.NORMALITY.clone());
                        alert('莫大な富を手に入れましたが、あなたの心は凡庸に染まりました。');
                        game.finishEvent();
                    }
                });
            }
            return choices;
        }
    },
    WINDING_HOLES: {
        id: 'winding_holes',
        name: '曲がりくねった穴',
        image: '🕳️',
        getChoices: (game: any, state: any = {}) => [
            {
                text: `[狂気の抱擁] 狂気を2枚獲得。HPを${Math.floor(game.player.maxHp * 0.15)}失う。`,
                action: (game: any, updateState: any) => {
                    game.player.takeDamage(Math.floor(game.player.maxHp * 0.15), game.player);
                    game.player.addCard(CardLibrary.MADNESS.clone());
                    game.player.addCard(CardLibrary.MADNESS.clone());
                    alert('気が狂いそうになりながら、2枚の「狂気」を手に入れました。');
                    game.finishEvent();
                }
            },
            {
                text: `[集中] 呪い-苦悩になる。HPを${Math.floor(game.player.maxHp * 0.25)}回復。`,
                action: (game: any, updateState: any) => {
                    game.player.heal(Math.floor(game.player.maxHp * 0.25));
                    game.player.addCard(CardLibrary.WRITHE.clone());
                    alert('深い集中により傷が癒えましたが、苦悩が付き纏います。');
                    game.finishEvent();
                }
            },
            {
                text: '[来た道を引き返す] 最大HPを5%失う。',
                action: (game: any, updateState: any) => {
                    const loss = Math.floor(game.player.maxHp * 0.05);
                    game.player.maxHp -= loss;
                    game.player.hp = Math.min(game.player.hp, game.player.maxHp);
                    alert(`引き返す最中に体力が削られ、最大HPが${loss}減少しました。`);
                    game.finishEvent();
                }
            }
        ]
    },
    MOAI_HEAD: {
        id: 'moai_head',
        name: 'モアイ',
        image: '🗿',
        getChoices: (game: any, state: any = {}) => {
            const choices = [
                {
                    text: `[中に飛び込む] HPを全回復。最大HP-${Math.floor(game.player.maxHp * 0.18)}。`,
                    action: (game: any, updateState: any) => {
                        const loss = Math.floor(game.player.maxHp * 0.18);
                        game.player.maxHp -= loss;
                        game.player.hp = game.player.maxHp;
                        alert(`若返りの肉体を得ましたが、魂の器（最大HP）が${loss}減少しました。`);
                        game.finishEvent();
                    }
                }
            ];
            if (game.player.relics.some((r: any) => r.id === 'golden_idol_relic')) {
                choices.push({
                    text: '[供げる：黄金の偶像] 333ゴールドを獲得。黄金の偶像を失う。',
                    action: (game: any, updateState: any) => {
                        game.player.relics = game.player.relics.filter((r: any) => r.id !== 'golden_idol_relic');
                        game.player.gold += 333;
                        alert('黄金の偶像を捧げ、333ゴールドを受け取りました。');
                        game.finishEvent();
                    }
                });
            }
            choices.push({ text: '[立ち去る]', action: (game: any) => game.finishEvent() });
            return choices;
        }
    },
    FALLING: {
        id: 'falling',
        name: '落下',
        image: '🪂',
        getChoices: (game: any, state: any = {}) => {
            const attacks = game.player.masterDeck.filter((c: any) => c.type === 'attack');
            const skills = game.player.masterDeck.filter((c: any) => c.type === 'skill');
            const powers = game.player.masterDeck.filter((c: any) => c.type === 'power');
            const choices = [];
            if (skills.length > 0) {
                const sk = skills[Math.floor(Math.random() * skills.length)];
                choices.push({ text: `[着地] スキル「${sk.name}」を紛失。`, action: (game: any) => { game.player.masterDeck = game.player.masterDeck.filter((c: any) => c !== sk); game.finishEvent(); } });
            }
            if (powers.length > 0) {
                const pw = powers[Math.floor(Math.random() * powers.length)];
                choices.push({ text: `[接続] パワー「${pw.name}」を紛失。`, action: (game: any) => { game.player.masterDeck = game.player.masterDeck.filter((c: any) => c !== pw); game.finishEvent(); } });
            }
            if (attacks.length > 0) {
                const at = attacks[Math.floor(Math.random() * attacks.length)];
                choices.push({ text: `[ストライク] アタック「${at.name}」を紛失。`, action: (game: any) => { game.player.masterDeck = game.player.masterDeck.filter((c: any) => c !== at); game.finishEvent(); } });
            }
            if (choices.length === 0) choices.push({ text: '[何もしない]', action: (game: any) => game.finishEvent() });
            return choices;
        }
    },
    // --- Common Events ---
    LADY_IN_BLUE: {
        id: 'lady_in_blue',
        name: '青い服の女',
        image: '👩‍🎤',
        getChoices: (game: any, state: any = {}) => [
            {
                text: '[ポーション1個購入] 20ゴールド',
                action: (game: any) => { if (game.player.gold >= 20) { game.player.gold -= 20; game.gainRandomPotion(); } else { alert('ゴールドが足りません'); } game.finishEvent(); }
            },
            {
                text: '[ポーション2個購入] 30ゴールド',
                action: (game: any) => { if (game.player.gold >= 30) { game.player.gold -= 30; game.gainRandomPotion(); game.gainRandomPotion(); } else { alert('ゴールドが足りません'); } game.finishEvent(); }
            },
            {
                text: '[ポーション3個購入] 40ゴールド',
                action: (game: any) => { if (game.player.gold >= 40) { game.player.gold -= 40; game.gainRandomPotion(); game.gainRandomPotion(); game.gainRandomPotion(); } else { alert('ゴールドが足りません'); } game.finishEvent(); }
            },
            {
                text: '[立ち去る] 4ダメージ受ける。',
                action: (game: any) => { game.player.takeDamage(4, game.player); game.finishEvent(); }
            }
        ]
    },
    TRANSFORMATION_SHRINE: {
        id: 'transformation_shrine',
        name: '一変',
        image: '🪄',
        getChoices: (game: any, state: any = {}) => [
            {
                text: '[祈る] カードを変化。',
                action: (game: any) => game.showCardTransformSelection(() => game.finishEvent(), 1)
            },
            { text: '[立ち去る]', action: (game: any) => game.finishEvent() }
        ]
    },
    GOLD_SHRINE: {
        id: 'gold_shrine',
        name: '黄金寺院',
        image: '⛩️',
        getChoices: (game: any, state: any = {}) => [
            {
                text: '[祈る] 100ゴールドを獲得。',
                action: (game: any) => { game.player.gold += 100; alert('100ゴールド獲得しました。'); game.finishEvent(); }
            },
            {
                text: '[冒涜] 275ゴールドを獲得。呪い-後悔。',
                action: (game: any) => { game.player.gold += 275; game.player.addCard(CardLibrary.REGRET.clone()); alert('275ゴールド獲得。しかし、後悔があなたを苛みます。'); game.finishEvent(); }
            },
            { text: '[立ち去る]', action: (game: any) => game.finishEvent() }
        ]
    },
    PURIFICATION_SHRINE: {
        id: 'purification_shrine',
        name: '清め',
        image: '⛲',
        getChoices: (game: any, state: any = {}) => [
            {
                text: '[祈る] デッキ内のカード1枚を削除。',
                action: (game: any) => game.showCardRemovalSelection(() => game.finishEvent())
            },
            { text: '[立ち去る]', action: (game: any) => game.finishEvent() }
        ]
    },
    LABORATORY: {
        id: 'laboratory',
        name: '研究室',
        image: '🧪',
        getChoices: (game: any, state: any = {}) => [
            {
                text: '[探索] ポーションを3つ獲得。',
                action: (game: any) => { game.gainRandomPotion(); game.gainRandomPotion(); game.gainRandomPotion(); game.finishEvent(); }
            }
        ]
    },
    UPGRADE_SHRINE: {
        id: 'upgrade_shrine',
        name: '向上の聖堂',
        image: '🛠️',
        getChoices: (game: any, state: any = {}) => [
            {
                text: '[祈る] カードをアップグレード。',
                action: (game: any) => {
                    const upgradable = game.player.masterDeck.filter((c: any) => !c.isUpgraded);
                    game.onCardSelectionRequest('アップグレードするカードを選択', upgradable, (card: any) => {
                        if (card) card.upgrade();
                        game.finishEvent();
                    });
                }
            },
            { text: '[立ち去る]', action: (game: any) => game.finishEvent() }
        ]
    },
    MATCH_AND_KEEP: {
        id: 'match_and_keep',
        name: '神経衰弱！',
        image: '🃏',
        getChoices: (game: any, state: any = {}) => [
            {
                text: '[続行] (簡易版: ランダムなカードを2枚。呪いを1枚得る)',
                action: (game: any) => {
                    alert('神経衰弱ミニゲームは簡略化され、ランダムな報酬となります。');
                    const allCards = Object.values(CardLibrary).filter((c: any) => c.rarity !== 'curse' && c.cardClass !== 'status');
                    game.player.masterDeck.push(allCards[Math.floor(Math.random() * allCards.length)].clone());
                    game.player.masterDeck.push(allCards[Math.floor(Math.random() * allCards.length)].clone());
                    game.player.addCard(CardLibrary.REGRET.clone());
                    game.finishEvent();
                }
            }
        ]
    },
    FOUNTAIN: {
        id: 'fountain',
        name: '聖なる泉',
        image: '⛲',
        getChoices: (game: any, state: any = {}) => [
            {
                text: '[飲む] 呪いをすべて削除。',
                action: (game: any) => {
                    game.player.masterDeck = game.player.masterDeck.filter((c: any) => c.type !== 'curse' || c.id === 'necronomicurse');
                    alert('聖なる泉の力で、あなたの魂から呪いが洗い流されました。');
                    game.finishEvent();
                }
            },
            { text: '[立ち去る]', action: (game: any) => game.finishEvent() }
        ]
    },
    BONFIRE: {
        id: 'bonfire',
        name: 'たき火の精霊',
        image: '🔥',
        getChoices: (game: any, state: any = {}) => [
            {
                text: '[供物] カードを捧げる。',
                action: (game: any) => {
                    game.onCardSelectionRequest('捧げるカードを選択', game.player.masterDeck, (card: any) => {
                        if (card) {
                            game.player.masterDeck = game.player.masterDeck.filter((c: any) => c !== card);
                            if (card.rarity === 'rare') { game.player.heal(999); game.player.maxHp += 10; alert('精霊は大喜びです！'); }
                            else if (card.rarity === 'uncommon') { game.player.heal(999); alert('精霊は満足しています。'); }
                            else if (card.type === 'curse') { game.player.relics.push(RelicLibrary.SPIRIT_POOP); alert('精霊は不快そうです...'); }
                            else { game.player.heal(5); alert('精霊は微笑みました。'); }
                        }
                        game.finishEvent();
                    });
                }
            }
        ]
    },
    DUPLICATOR: {
        id: 'duplicator',
        name: 'デュプリケーター',
        image: '👥',
        getChoices: (game: any, state: any = {}) => [
            {
                text: '[祈る] デッキ内のカード1枚をコピー。',
                action: (game: any) => {
                    game.onCardSelectionRequest('コピーするカードを選択', game.player.masterDeck, (card: any) => {
                        if (card) game.player.masterDeck.push(card.clone());
                        game.finishEvent();
                    });
                }
            },
            { text: '[立ち去る]', action: (game: any) => game.finishEvent() }
        ]
    },
    BLACKSMITH: {
        id: 'blacksmith',
        name: '不吉な鍛冶場',
        image: '⚒️',
        getChoices: (game: any, state: any = {}) => [
            {
                text: '[鍛冶場] カードを1枚アップグレード。',
                action: (game: any) => {
                    const upgradable = game.player.masterDeck.filter((c: any) => !c.isUpgraded);
                    game.onCardSelectionRequest('アップグレードするカードを選択', upgradable, (card: any) => {
                        if (card) card.upgrade();
                        game.finishEvent();
                    });
                }
            },
            {
                text: '[探索] レリック。呪い-痛み。',
                action: (game: any) => {
                    game.player.addCard(CardLibrary.PAIN.clone());
                    game.gainRandomRelicByRarity('uncommon');
                    game.finishEvent();
                }
            },
            { text: '[立ち去る]', action: (game: any) => game.finishEvent() }
        ]
    },
    WHEEL_OF_CHANGE: {
        id: 'wheel_of_change',
        name: '変化のルーレット',
        image: '🎡',
        getChoices: (game: any, state: any = {}) => [
            {
                text: '[プレイ] ルーレットを回す。',
                action: (game: any) => {
                    const r = Math.random();
                    if (r < 0.16) { game.player.gold += 100 * (game.currentAct || 1); alert('ゴールド獲得！'); }
                    else if (r < 0.32) { game.gainRandomRelicByRarity('common'); alert('レリック獲得！'); }
                    else if (r < 0.48) { game.player.heal(999); alert('HP全回復！'); }
                    else if (r < 0.64) { game.player.addCard(CardLibrary.DECAY.clone()); alert('呪い「腐敗」獲得...'); }
                    else if (r < 0.80) { game.showCardRemovalSelection(() => { }); alert('カード削除！'); }
                    else { game.player.takeDamage(Math.floor(game.player.maxHp * 0.1), game.player); alert('ダメージを受けた...'); }
                    game.finishEvent();
                }
            }
        ]
    },
    WE_MEET_AGAIN: {
        id: 'we_meet_again',
        name: 'また会ったな!',
        image: '🥪',
        getChoices: (game: any, state: any = {}) => {
            const choices = [];
            const potions = game.player.potions.filter((p: any) => p !== null);
            if (potions.length > 0) {
                choices.push({
                    text: `[ポーションを渡す] ポーション「${potions[0].name}」を失い、レリック獲得。`,
                    action: (game: any) => { game.player.potions[game.player.potions.indexOf(potions[0])] = null; game.gainRandomRelicByRarity('common'); game.finishEvent(); }
                });
            }
            if (game.player.gold >= 50) {
                choices.push({
                    text: '[ゴールドを渡す] 50ゴールドを失い、レリック獲得。',
                    action: (game: any) => { game.player.gold -= 50; game.gainRandomRelicByRarity('common'); game.finishEvent(); }
                });
            }
            if (game.player.masterDeck.length > 0) {
                const card = game.player.masterDeck[Math.floor(Math.random() * game.player.masterDeck.length)];
                choices.push({
                    text: `[カードを渡す] 「${card.name}」を失い、レリック獲得。`,
                    action: (game: any) => { game.player.masterDeck = game.player.masterDeck.filter((c: any) => c !== card); game.gainRandomRelicByRarity('common'); game.finishEvent(); }
                });
            }
            choices.push({ text: '[攻撃] 逃げる。', action: (game: any) => game.finishEvent() });
            return choices;
        }
    }
};


/**
 * アクトごとのイベント出現プール
 */
export const EVENT_POOLS: { [key: number]: string[] } = {
    1: [
        'living_wall', 'goop_puddle', 'golden_idol', 'golden_wing', 'shining_light',
        'liars_game', 'scrap_ooze', 'cleric', 'big_fish', 'dead_adventurer', 'mushrooms', 'face_trader',
        // 共通
        'lady_in_blue', 'transformation_shrine', 'gold_shrine', 'purification_shrine',
        'laboratory', 'upgrade_shrine', 'match_and_keep', 'fountain', 'bonfire',
        'duplicator', 'blacksmith', 'wheel_of_change', 'we_meet_again'
    ],
    2: [
        'vampires', 'ancient_writing', 'knowing_skull', 'addict', 'beggar', 'library',
        'nloth', 'cursed_tome', 'masked_bandits', 'drug_dealer', 'ghost_council',
        'mausoleum', 'forgotten_altar', 'colosseum', 'the_nest', 'the_joust', 'face_trader',
        'designer_in_spire',
        // 共通
        'lady_in_blue', 'transformation_shrine', 'gold_shrine', 'purification_shrine',
        'laboratory', 'upgrade_shrine', 'match_and_keep', 'fountain', 'bonfire',
        'duplicator', 'blacksmith', 'wheel_of_change', 'we_meet_again'
    ],
    3: [
        'red_mask_tomb', 'mysterious_sphere', 'sensory_stone', 'secret_portal',
        'mind_bloom', 'winding_holes', 'moai_head', 'falling',
        'designer_in_spire',
        // 共通
        'lady_in_blue', 'transformation_shrine', 'gold_shrine', 'purification_shrine',
        'laboratory', 'upgrade_shrine', 'match_and_keep', 'fountain', 'bonfire',
        'duplicator', 'blacksmith', 'wheel_of_change', 'we_meet_again'
    ]
};

// ランダムなイベントを取得する関数
export function getRandomEvent(actNum: number = 1) {
    const pool = EVENT_POOLS[actNum] || EVENT_POOLS[1];
    const eventId = pool[Math.floor(Math.random() * pool.length)];
    // EventLibraryからIDに一致するイベントを検索して返す
    const event = Object.values(EventLibrary).find(e => e.id === eventId);
    return event || EventLibrary.LIVING_WALL; // フォールバック
}
