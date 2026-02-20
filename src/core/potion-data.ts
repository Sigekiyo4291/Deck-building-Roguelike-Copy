import { Potion } from './potion';
import { CardLibrary } from './card';

function getRandomCardsForPotion(type: string, count: number): any[] {
    let keys = Object.keys(CardLibrary).filter(k => CardLibrary[k].type === type && CardLibrary[k].rarity !== 'basic' && CardLibrary[k].rarity !== 'special');

    if (type === 'colorless') {
        // 今回の要件での「無色」は汎用的なアンコモン・レアカード等で代用 (色属性の明確な定義がないため)
        keys = Object.keys(CardLibrary).filter(k => (CardLibrary[k].rarity === 'uncommon' || CardLibrary[k].rarity === 'rare') && CardLibrary[k].type !== 'curse' && CardLibrary[k].type !== 'status');
    }

    const result = [];
    const temp = [...keys];
    for (let i = 0; i < count; i++) {
        if (temp.length === 0) break;
        const idx = Math.floor(Math.random() * temp.length);
        result.push(CardLibrary[temp.splice(idx, 1)[0]].clone());
    }
    return result;
}

export const PotionLibrary = {
    // Common Potions
    BLOOD_POTION: new class extends Potion {
        constructor() {
            super('blood_potion', 'ブラッドポーション', '最大HPの20%を回復する。', 'common', 'none', false);
        }
        onUse(player: any) {
            const amount = Math.floor(player.maxHp * 0.2 * this.getMultiplier(player));
            player.heal(amount);
            console.log(`${this.name}を使用: ${amount}回復`);
        }
    },
    BLOCK_POTION: new class extends Potion {
        constructor() {
            super('block_potion', 'ブロックポーション', 'ブロック12を得る。', 'common', 'none', true);
        }
        onUse(player: any, target: any, engine: any) {
            const amount = 12 * this.getMultiplier(player);
            player.addBlock(amount);
            if (engine) engine.showEffectForPlayer('block');
        }
    },
    FIRE_POTION: new class extends Potion {
        constructor() {
            super('fire_potion', '火炎ポーション', 'ダメージ20を与える。', 'common', 'single', true);
        }
        async onUse(player: any, target: any, engine: any) {
            if (!target) return;
            const damage = 20 * this.getMultiplier(player);
            // Engineのヘルパーを使用してエフェクト付きダメージ
            if (engine) {
                await engine.attackWithEffect(player, target, damage);
            } else {
                target.takeDamage(damage, player);
            }
        }
    },
    STRENGTH_POTION: new class extends Potion {
        constructor() {
            super('strength_potion', '筋力ポーション', '筋力2を得る。', 'common', 'none', true);
        }
        onUse(player: any) {
            const amount = 2 * this.getMultiplier(player);
            player.addStatus('strength', amount);
        }
    },
    SPEED_POTION: new class extends Potion {
        constructor() {
            super('speed_potion', 'スピードポーション', '敏捷性5を得る。ターン終了時、敏捷性5を失う。', 'common', 'none', true);
        }
        onUse(player: any) {
            const amount = 5 * this.getMultiplier(player);
            player.addStatus('dexterity', amount);
            // ターン終了時に失うためのデバフ（frailではない独自処理が必要になる可能性があるが、
            // 既存のflexと同様の logic を使うなら 'dexterity_down' などを追加する必要がある）
            // 現状のupdateStatusに 'strength_down' しかないため、汎用的な仕組みが必要。
            // 簡易的にステータスを追加
            player.addStatus('dexterity_down', amount);
        }
    },
    STEROID_POTION: new class extends Potion {
        constructor() {
            super('steroid_potion', 'ステロイドポーション', '筋力5を得る。ターン終了時、筋力5を失う。', 'common', 'none', true);
        }
        onUse(player: any) {
            const amount = 5 * this.getMultiplier(player);
            player.addStatus('strength', amount);
            player.addStatus('strength_down', amount);
        }
    },
    SWIFT_POTION: new class extends Potion {
        constructor() {
            super('swift_potion', '加速ポーション', 'カードを3枚引く。', 'common', 'none', true);
        }
        onUse(player: any, target: any, engine: any) {
            if (engine) {
                const amount = 3 * this.getMultiplier(player);
                engine.drawCards(amount);
            }
        }
    },
    AGILITY_POTION: new class extends Potion {
        constructor() {
            super('agility_potion', '機敏ポーション', '敏捷性2を得る。', 'common', 'none', true);
        }
        onUse(player: any) {
            const amount = 2 * this.getMultiplier(player);
            player.addStatus('dexterity', amount);
        }
    },
    ENERGY_POTION: new class extends Potion {
        constructor() {
            super('energy_potion', 'エナジーポーション', 'エナジー2を得る。', 'common', 'none', true);
        }
        onUse(player: any) {
            const amount = 2 * this.getMultiplier(player);
            player.energy += amount;
        }
    },
    EXPLOSIVE_POTION: new class extends Potion {
        constructor() {
            super('explosive_potion', '爆発ポーション', '敵全体にダメージ10を与える。', 'common', 'all', true);
        }
        async onUse(player: any, target: any, engine: any) {
            const damage = 10 * this.getMultiplier(player);
            if (engine) {
                // 敵全体にダメージ
                for (const enemy of engine.enemies) {
                    if (!enemy.isDead()) {
                        await engine.attackWithEffect(player, enemy, damage);
                    }
                }
            }
        }
    },
    WEAK_POTION: new class extends Potion {
        constructor() {
            super('weak_potion', '脱力ポーション', '脱力3を与える。', 'common', 'single', true);
        }
        onUse(player: any, target: any, engine: any) {
            if (!target) return;
            const amount = 3 * this.getMultiplier(player);
            target.addStatus('weak', amount);
        }
    },
    FEAR_POTION: new class extends Potion {
        constructor() {
            // ユーザー要望の「恐怖ポーション」＝「弱体3」は「脆弱3」と解釈
            super('fear_potion', '恐怖ポーション', '脆弱3を与える。', 'common', 'single', true);
        }
        onUse(player: any, target: any, engine: any) {
            if (!target) return;
            const amount = 3 * this.getMultiplier(player);
            target.addStatus('vulnerable', amount);
        }
    },
    BLESSING_OF_THE_FORGE: new class extends Potion {
        constructor() {
            super('blessing_of_the_forge', '鍛冶場の祝福', '戦闘終了まで、手札のカードを全てアップグレードする。', 'common', 'none', true);
        }
        onUse(player: any, target: any, engine: any) {
            if (player.hand) {
                player.hand.forEach(card => {
                    if (!card.isUpgraded) card.upgrade();
                });
            }
        }
    },
    ATTACK_POTION: new class extends Potion {
        constructor() {
            super('attack_potion', 'アタックポーション', '3枚のランダムなアタックから1枚選び、手札に加える。このターン、そのコストは0。', 'common', 'none', true);
        }
        onUse(player: any, target: any, engine: any) {
            if (engine && engine.onCardSelectionRequest) {
                const cards = getRandomCardsForPotion('attack', 3);
                engine.onCardSelectionRequest('手札に加えるカードを選択', cards, (selectedCard: any) => {
                    if (selectedCard) {
                        selectedCard.temporaryCost = 0;
                        player.hand.push(selectedCard);
                        if (engine.uiUpdateCallback) engine.uiUpdateCallback();
                    }
                });
            }
        }
    },
    SKILL_POTION: new class extends Potion {
        constructor() {
            super('skill_potion', 'スキルポーション', '3枚のランダムなスキルから1枚選び、手札に加える。このターン、そのコストは0。', 'common', 'none', true);
        }
        onUse(player: any, target: any, engine: any) {
            if (engine && engine.onCardSelectionRequest) {
                const cards = getRandomCardsForPotion('skill', 3);
                engine.onCardSelectionRequest('手札に加えるカードを選択', cards, (selectedCard: any) => {
                    if (selectedCard) {
                        selectedCard.temporaryCost = 0;
                        player.hand.push(selectedCard);
                        if (engine.uiUpdateCallback) engine.uiUpdateCallback();
                    }
                });
            }
        }
    },
    POWER_POTION: new class extends Potion {
        constructor() {
            super('power_potion', 'パワーポーション', '3枚のランダムなパワーから1枚選び、手札に加える。このターン、そのコストは0。', 'common', 'none', true);
        }
        onUse(player: any, target: any, engine: any) {
            if (engine && engine.onCardSelectionRequest) {
                const cards = getRandomCardsForPotion('power', 3);
                engine.onCardSelectionRequest('手札に加えるカードを選択', cards, (selectedCard: any) => {
                    if (selectedCard) {
                        selectedCard.temporaryCost = 0;
                        player.hand.push(selectedCard);
                        if (engine.uiUpdateCallback) engine.uiUpdateCallback();
                    }
                });
            }
        }
    },
    COLORLESS_POTION: new class extends Potion {
        constructor() {
            super('colorless_potion', '無色のポーション', '3枚のランダムな無色のカードから1枚選び、手札に加える。このターン、そのコストは0。', 'common', 'none', true);
        }
        onUse(player: any, target: any, engine: any) {
            if (engine && engine.onCardSelectionRequest) {
                const cards = getRandomCardsForPotion('colorless', 3);
                engine.onCardSelectionRequest('手札に加えるカードを選択', cards, (selectedCard: any) => {
                    if (selectedCard) {
                        selectedCard.temporaryCost = 0;
                        player.hand.push(selectedCard);
                        if (engine.uiUpdateCallback) engine.uiUpdateCallback();
                    }
                });
            }
        }
    },
    // Uncommon Potions
    REGEN_POTION: new class extends Potion {
        constructor() {
            super('regen_potion', '再生ポーション', '再生5を得る。', 'uncommon', 'none', true);
        }
        onUse(player: any) {
            const amount = 5 * this.getMultiplier(player);
            player.addStatus('regeneration', amount);
        }
    },
    ANCIENT_POTION: new class extends Potion {
        constructor() {
            super('ancient_potion', '古代のポーション', 'アーティファクト1を得る。', 'uncommon', 'none', true);
        }
        onUse(player: any) {
            const amount = 1 * this.getMultiplier(player);
            player.addStatus('artifact', amount);
        }
    },
    LIQUID_BRONZE: new class extends Potion {
        constructor() {
            super('liquid_bronze', '液体ブロンズ', 'トゲ3を得る。', 'uncommon', 'none', true);
        }
        onUse(player: any) {
            const amount = 3 * this.getMultiplier(player);
            player.addStatus('thorns', amount);
        }
    },
    ESSENCE_OF_STEEL: new class extends Potion {
        constructor() {
            super('essence_of_steel', '鉄のエッセンス', 'プレートアーマー4を得る。', 'uncommon', 'none', true);
        }
        onUse(player: any) {
            const amount = 4 * this.getMultiplier(player);
            player.addStatus('plated_armor', amount);
        }
    },
    DUPLICATION_POTION: new class extends Potion {
        constructor() {
            super('duplication_potion', '複製ポーション', 'このターン、次にプレイするカードを2回発動する。', 'uncommon', 'none', true);
        }
        onUse(player: any) {
            const amount = 1 * this.getMultiplier(player);
            // double_tapを使うか、duplicationステータスを使うか
            // 今回は汎用なduplicationとして扱う
            player.addStatus('duplication', amount);
        }
    },
    DISTILLED_CHAOS: new class extends Potion {
        constructor() {
            super('distilled_chaos', '蒸留した混沌', '山札の上から3枚のカードをプレイする。', 'uncommon', 'none', true);
        }
        async onUse(player: any, target: any, engine: any) {
            if (engine) {
                const amount = 3 * this.getMultiplier(player);
                for (let i = 0; i < amount; i++) {
                    if (player.deck.length === 0) {
                        if (player.discard.length === 0) break;
                        player.deck = [...player.discard];
                        player.discard = [];
                        engine.shuffle(player.deck);
                    }
                    const card = player.deck.pop();
                    if (card) {
                        player.hand.push(card);
                        // EngineのplayCardを呼び出す
                        // target が null の場合、playCard 内部で適当な敵が選ばれる
                        let targetIdx = 0;
                        if (target) targetIdx = engine.enemies.indexOf(target);
                        if (targetIdx === -1) targetIdx = 0;
                        await engine.playCard(player.hand.length - 1, targetIdx);
                    }
                }
            }
        }
    },
    LIQUID_MEMORIES: new class extends Potion {
        constructor() {
            super('liquid_memories', '記憶リキッド', '捨て札のカードを1枚選び、手札に戻す。このターン、そのコストは0。', 'uncommon', 'none', true);
        }
        onUse(player: any, target: any, engine: any) {
            if (engine && engine.onCardSelectionRequest) {
                // 捨て札のコピーではなく、実際のカードを選択したい
                engine.onCardSelectionRequest('手札に戻すカードを選択', [...player.discard], (selectedCard: any, index: number) => {
                    if (selectedCard) {
                        // 捨て札から削除
                        player.discard.splice(index, 1);
                        selectedCard.temporaryCost = 0;
                        player.hand.push(selectedCard);
                        if (engine.uiUpdateCallback) engine.uiUpdateCallback();
                    }
                });
            }
        }
    },
    ELIXIR: new class extends Potion {
        constructor() {
            super('elixir', 'エリクサー', '手札から好きな枚数を廃棄する。', 'uncommon', 'none', true);
        }
        onUse(player: any, target: any, engine: any) {
            if (engine && engine.onCardSelectionRequest) {
                engine.onCardSelectionRequest('廃棄するカードを選択', [...player.hand], (selectedCards: any[], selectedIndices: number[]) => {
                    if (selectedCards && selectedCards.length > 0) {
                        const sortedIndices = [...selectedIndices].sort((a, b) => b - a);
                        sortedIndices.forEach(idx => {
                            const card = player.hand[idx];
                            if (card) {
                                player.hand.splice(idx, 1);
                                player.exhaustCard(card, engine);
                            }
                        });
                        if (engine.uiUpdateCallback) engine.uiUpdateCallback();
                    }
                }, { multiSelect: true });
            }
        }
    },
    GAMBLERS_BREW: new class extends Potion {
        constructor() {
            super('gamblers_brew', '賭博師の醸造酒', '好きな枚数のカードを捨て、同じ枚数のカードを引く。', 'uncommon', 'none', true);
        }
        onUse(player: any, target: any, engine: any) {
            if (engine && engine.onCardSelectionRequest) {
                engine.onCardSelectionRequest('捨てるカードを選択', [...player.hand], async (selectedCards: any[], selectedIndices: number[]) => {
                    if (selectedCards && selectedCards.length > 0) {
                        const sortedIndices = [...selectedIndices].sort((a, b) => b - a);
                        sortedIndices.forEach(idx => {
                            const card = player.hand[idx];
                            if (card) {
                                player.hand.splice(idx, 1);
                                player.discard.push(card);
                            }
                        });
                        await engine.drawCards(selectedCards.length);
                        if (engine.uiUpdateCallback) engine.uiUpdateCallback();
                    }
                }, { multiSelect: true });
            }
        }
    },
    // Rare Potions
    HEART_OF_IRON: new class extends Potion {
        constructor() {
            super('heart_of_iron', '鉄の心臓', '金属化6を得る。', 'rare', 'none', true);
        }
        onUse(player: any) {
            const amount = 6 * this.getMultiplier(player);
            player.addStatus('metallicize', amount);
        }
    },
    CULTIST_POTION: new class extends Potion {
        constructor() {
            super('cultist_potion', '狂信者のポーション', '儀式1を得る。', 'rare', 'none', true);
        }
        onUse(player: any) {
            const amount = 1 * this.getMultiplier(player);
            player.addStatus('ritual', amount);
        }
    },
    FRUIT_JUICE: new class extends Potion {
        constructor() {
            super('fruit_juice', 'フルーツジュース', '最大HP+5。', 'rare', 'none', false); // 戦闘外でも使用可能
        }
        onUse(player: any) {
            const amount = 5 * this.getMultiplier(player);
            player.increaseMaxHp(amount);
            console.log(`フルーツジュース使用: 最大HPが ${amount} 増加`);
        }
    },
    SNECKO_OIL: new class extends Potion {
        constructor() {
            super('snecko_oil', 'スネッコオイル', 'カードを5枚引く。手札のカードのコストがランダムに変化する。', 'rare', 'none', true);
        }
        async onUse(player: any, target: any, engine: any) {
            if (engine) {
                const amount = 5 * this.getMultiplier(player);
                await engine.drawCards(amount);
                // 手札の全カードのコストをランダム化 (0~3)
                player.hand.forEach(card => {
                    if (card.cost !== -1 && card.cost !== 'X') { // Xコストやプレイ不可は除外
                        card.temporaryCost = Math.floor(Math.random() * 4);
                    }
                });
            }
        }
    },
    FAIRY_POTION: new class extends Potion {
        constructor() {
            super('fairy_potion', '瓶詰の妖精', '戦闘不能時、最大HPの30%で復活し、このポーションを失う。（自動発動）', 'rare', 'none', true);
        }
        onUse(player: any) {
            // 手動では使用できない
            console.log('瓶詰の妖精は自動で発動します。');
        }
    },
    SMOKE_BOMB: new class extends Potion {
        constructor() {
            super('smoke_bomb', '煙玉', 'ボス以外の戦闘から逃げる。報酬は得られない。', 'rare', 'none', true);
        }
        onUse(player: any, target: any, engine: any) {
            if (engine) {
                if (engine.isBossBattle) {
                    alert('ボス戦からは逃げられない！'); // 本家同様、ボスには無効
                } else {
                    engine.escapeBattle();
                }
            }
        }
    },
    ENTROPIC_BREW: new class extends Potion {
        constructor() {
            super('entropic_brew', 'エントロピー醸造', 'すべての空きポーションスロットをランダムなポーションで満たす。', 'rare', 'none', false);
        }
        onUse(player: any, target: any, engine: any) {
            player.potions.forEach((potion, index) => {
                if (!potion) {
                    player.potions[index] = getRandomPotion();
                }
            });
            console.log('エントロピー醸造を使用: ポーションスロットを満たしました');
        }
    }
};

// ユーティリティ: ランダムなポーションを取得
export function getRandomPotion(rarityRoll?: number): Potion {
    const roll = rarityRoll ?? Math.random() * 100;
    let rarity: 'common' | 'uncommon' | 'rare' = 'common';

    if (roll < 10) rarity = 'rare';
    else if (roll < 35) rarity = 'uncommon'; // 10 + 25
    else rarity = 'common';

    const allPotions = Object.values(PotionLibrary);
    const eligible = allPotions.filter(p => p.rarity === rarity);

    // まだ全種類実装していないので、なければコモンから探す
    const targetList = eligible.length > 0 ? eligible : allPotions.filter(p => p.rarity === 'common');
    const template = targetList[Math.floor(Math.random() * targetList.length)];
    return template.clone();
}
