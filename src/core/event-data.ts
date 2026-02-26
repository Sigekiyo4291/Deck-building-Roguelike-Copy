import { CardLibrary } from './card';
import { RelicLibrary } from './relic';

/**
 * イベントライブラリ
 * 各イベントは以下の構造を持ちます:
 * - id: イベントID
 * - name: イベント名
 * - image: 画像アイコン（絵文字）
 * - getChoices(game, state): 選択肢を動的に生成する関数
 *   - state: イベント内の状態（繰り返し選択可能なイベント用）
 *   - 戻り値: [{ text: '選択肢テキスト', action: (game, updateState) => {...} }, ...]
 */

export const EventLibrary = {
    // 1. 生きている壁
    LIVING_WALL: {
        id: 'living_wall',
        name: '生きている壁',
        image: '🧱',
        getChoices: (game, state = {}) => [
            {
                text: '[忘却] デッキからカードを1枚削除',
                action: (game, updateState) => {
                    game.showCardRemovalSelection(() => {
                        game.finishEvent();
                    });
                }
            },
            {
                text: '[変容] デッキのカードを1枚変化させる',
                action: (game, updateState) => {
                    game.showCardTransformSelection(() => {
                        game.finishEvent();
                    });
                }
            },
            {
                text: '[成長] デッキのカードを1枚アップグレード',
                action: (game, updateState) => {
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
        getChoices: (game, state = {}) => [
            {
                text: '[ゴールドを回収] ゴールド75獲得。HPを11失う。',
                action: (game, updateState) => {
                    game.player.gold += 75;
                    game.player.takeDamage(11, game.player);
                    alert(`ゴールドを75獲得しましたが、HPを11失いました...`);
                    game.finishEvent();
                }
            },
            {
                text: '[立ち去る] ゴールド35を失う',
                action: (game, updateState) => {
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
        getChoices: (game, state = {}) => [
            {
                text: '[取る] 黄金の偶像を取得。罠を発動。',
                action: (game, updateState) => {
                    // サブ選択肢を表示
                    updateState({
                        phase: 'trap',
                        choices: [
                            {
                                text: '[逃げ切る] 呪い-怪我を受け取る',
                                action: (game, updateState2) => {
                                    game.player.masterDeck.push(CardLibrary.INJURY.clone());
                                    alert('呪い「怪我」をデッキに追加しました。');
                                    game.finishEvent();
                                }
                            },
                            {
                                text: '[衝突] 最大HPの25%ダメージ',
                                action: (game, updateState2) => {
                                    const damage = Math.floor(game.player.maxHp * 0.25);
                                    game.player.takeDamage(damage, game.player);
                                    alert(`${damage}ダメージを受けました！`);
                                    game.finishEvent();
                                }
                            },
                            {
                                text: '[隠れる] 最大HP-8%',
                                action: (game, updateState2) => {
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
                action: (game, updateState) => {
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
        getChoices: (game, state = {}) => {
            const has10DamageCard = game.player.masterDeck.some(card =>
                card.type === 'attack' && card.description.match(/\d+ダメージ/) && parseInt(card.description.match(/(\d+)ダメージ/)[1]) >= 10
            );

            const choices = [
                {
                    text: '[祈る] デッキからカードを1枚削除。HP7を失う。',
                    action: (game, updateState) => {
                        game.player.takeDamage(7, game.player);
                        game.showCardRemovalSelection(() => {
                            game.finishEvent();
                        });
                    }
                },
                {
                    text: '[立ち去る]',
                    action: (game, updateState) => {
                        alert('何も起きませんでした。');
                        game.finishEvent();
                    }
                }
            ];

            if (has10DamageCard) {
                choices.splice(1, 0, {
                    text: '[ロック] ゴールド50-80獲得',
                    action: (game, updateState) => {
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
        getChoices: (game, state = {}) => [
            {
                text: '[入る] ランダムなカード2枚をアップグレード。最大HPの20%を失う。',
                action: (game, updateState) => {
                    const upgradableCards = game.player.masterDeck.filter(c => !c.isUpgraded);
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
                action: (game, updateState) => {
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
        getChoices: (game, state = {}) => [
            {
                text: '[同意] ゴールド175獲得。呪い-疑念を受け取る。',
                action: (game, updateState) => {
                    game.player.gold += 175;
                    game.player.masterDeck.push(CardLibrary.DOUBT.clone());
                    alert('ゴールド175を獲得しましたが、呪い「疑念」をデッキに追加しました。');
                    game.finishEvent();
                }
            },
            {
                text: '[同意しない]',
                action: (game, updateState) => {
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
                    action: (game, updateState) => {
                        game.player.takeDamage(hpCost, game.player);
                        const roll = Math.random() * 100;
                        if (roll < chance) {
                            // レリック獲得
                            const ownedIds = game.player.relics.map(r => r.id);
                            const candidates = Object.values(RelicLibrary).filter(r =>
                                !ownedIds.includes(r.id) && r.rarity !== 'starter' && r.rarity !== 'boss'
                            );
                            if (candidates.length > 0) {
                                const relic = candidates[Math.floor(Math.random() * candidates.length)];
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
                    action: (game, updateState) => {
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
        getChoices: (game, state = {}) => [
            {
                text: '[回復] 35ゴールド: 最大HPの25%回復',
                action: (game, updateState) => {
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
                action: (game, updateState) => {
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
                action: (game, updateState) => {
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
        getChoices: (game, state = {}) => [
            {
                text: '[バナナ] 最大HPの33%回復',
                action: (game, updateState) => {
                    const healAmount = Math.floor(game.player.maxHp * 0.33);
                    game.player.heal(healAmount);
                    alert(`HPを${healAmount}回復しました！`);
                    game.finishEvent();
                }
            },
            {
                text: '[ドーナツ] 最大HP +5増加',
                action: (game, updateState) => {
                    game.player.maxHp += 5;
                    game.player.hp += 5;
                    alert('最大HPが5増加しました！');
                    game.finishEvent();
                }
            },
            {
                text: '[箱] レリックを受け取る。呪い-後悔を受け取る。',
                action: (game, updateState) => {
                    const ownedIds = game.player.relics.map(r => r.id);
                    const candidates = Object.values(RelicLibrary).filter(r =>
                        !ownedIds.includes(r.id) && r.rarity !== 'starter' && r.rarity !== 'boss'
                    );
                    if (candidates.length > 0) {
                        const relic = candidates[Math.floor(Math.random() * candidates.length)];
                        game.player.relics.push(relic);
                        if (relic.onObtain) relic.onObtain(game.player, game);
                        game.player.masterDeck.push(CardLibrary.REGRET.clone());
                        alert(`レリック「${relic.name}」を獲得しましたが、呪い「後悔」をデッキに追加しました。`);
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
                    action: (game, updateState) => {
                        const roll = Math.random() * 100;
                        if (roll < encounterChance) {
                            // モンスターに遭遇
                            alert('モンスターに見つかった！');
                            // TODO: 実際の戦闘開始処理を実装する場合はここで呼び出す
                            game.finishEvent();
                        } else {
                            // 戦利品を発見
                            const lootRoll = Math.random();
                            if (!foundRelic && lootRoll < 0.4) {
                                // レリック獲得
                                const ownedIds = game.player.relics.map(r => r.id);
                                const candidates = Object.values(RelicLibrary).filter(r =>
                                    !ownedIds.includes(r.id) && r.rarity !== 'starter' && r.rarity !== 'boss'
                                );
                                if (candidates.length > 0) {
                                    const relic = candidates[Math.floor(Math.random() * candidates.length)];
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
                    action: (game, updateState) => {
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
        getChoices: (game, state = {}) => [
            {
                text: '[踏み潰す] キノコビーストx3と戦闘。(未実装: 戦闘後レリック獲得)',
                action: (game, updateState) => {
                    alert('キノコビーストとの戦闘は未実装です。イベントを終了します。');
                    // TODO: 実際の戦闘開始処理を実装する場合はここで呼び出す
                    game.finishEvent();
                }
            },
            {
                text: '[食べる] 最大HPの25%回復。呪い-寄生を受け取る。',
                action: (game, updateState) => {
                    const healAmount = Math.floor(game.player.maxHp * 0.25);
                    game.player.heal(healAmount);
                    game.player.masterDeck.push(CardLibrary.PARASITE.clone());
                    alert(`HPを${healAmount}回復しましたが、呪い「寄生」をデッキに追加しました。`);
                    game.finishEvent();
                }
            }
        ]
    }
};

// ランダムなイベントを取得する関数
export function getRandomEvent() {
    const events = Object.values(EventLibrary);
    return events[Math.floor(Math.random() * events.length)];
}
