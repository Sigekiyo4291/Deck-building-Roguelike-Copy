import { Relic } from '../relic-class';
import { RoomType } from '../map-data';
import { CardLibrary } from '../card';

export const UncommonRelics = {
    INK_BOTTLE: new class extends Relic {
        constructor() { super('ink_bottle', 'インク瓶', 'カードを10枚プレイするごとに、カードを1枚引く。', 'uncommon'); }
        onCardPlay(owner, engine, card) {
            owner.relicCounters['ink_bottle'] = (owner.relicCounters['ink_bottle'] || 0) + 1;
            if (owner.relicCounters['ink_bottle'] >= 10) {
                owner.relicCounters['ink_bottle'] = 0;
                engine.drawCards(1);
            }
        }
    },
    KUNAI: new class extends Relic {
        constructor() { super('kunai', 'クナイ', '1ターンに「アタック」を3枚プレイするたび、敏捷性1を得る。', 'uncommon'); }
        onPlayerTurnStart(owner, engine) { owner.relicCounters['kunai'] = 0; }
        onCardPlay(owner, engine, card) {
            if (card.type === 'attack') {
                owner.relicCounters['kunai'] = (owner.relicCounters['kunai'] || 0) + 1;
                if (owner.relicCounters['kunai'] === 3) {
                    owner.relicCounters['kunai'] = 0;
                    owner.addStatus('dexterity', 1);
                }
            }
        }
    },
    SHURIKEN: new class extends Relic {
        constructor() { super('shuriken', '手裏剣', '1ターンに「アタック」を3枚プレイするたび、筋力1を得る。', 'uncommon'); }
        onPlayerTurnStart(owner, engine) { owner.relicCounters['shuriken'] = 0; }
        onCardPlay(owner, engine, card) {
            if (card.type === 'attack') {
                owner.relicCounters['shuriken'] = (owner.relicCounters['shuriken'] || 0) + 1;
                if (owner.relicCounters['shuriken'] === 3) {
                    owner.relicCounters['shuriken'] = 0;
                    owner.addStatus('strength', 1);
                }
            }
        }
    },
    ORNAMENTAL_FAN: new class extends Relic {
        constructor() { super('ornamental_fan', '扇子', '1ターンに「アタック」を3枚プレイするたび、4ブロックを得る。', 'uncommon'); }
        onPlayerTurnStart(owner, engine) { owner.relicCounters['ornamental_fan'] = 0; }
        onCardPlay(owner, engine, card) {
            if (card.type === 'attack') {
                owner.relicCounters['ornamental_fan'] = (owner.relicCounters['ornamental_fan'] || 0) + 1;
                if (owner.relicCounters['ornamental_fan'] === 3) {
                    owner.relicCounters['ornamental_fan'] = 0;
                    owner.addBlock(4);
                }
            }
        }
    },
    LETTER_OPENER: new class extends Relic {
        constructor() { super('letter_opener', 'レターオープナー', '1ターンに「スキル」を3枚プレイするたび、敵全体に5ダメージ与える。', 'uncommon'); }
        onPlayerTurnStart(owner, engine) { owner.relicCounters['letter_opener'] = 0; }
        onCardPlay(owner, engine, card) {
            if (card.type === 'skill') {
                owner.relicCounters['letter_opener'] = (owner.relicCounters['letter_opener'] || 0) + 1;
                if (owner.relicCounters['letter_opener'] === 3) {
                    owner.relicCounters['letter_opener'] = 0;
                    engine.enemies.forEach(enemy => {
                        if (!enemy.isDead()) {
                            enemy.takeDamage(5, owner);
                        }
                    });
                }
            }
        }
    },
    SUNDIAL: new class extends Relic {
        constructor() { super('sundial', '日時計', 'デッキを3回シャッフルするたび、エナジーを2得る。', 'uncommon'); }
        onShuffle(owner, engine) {
            owner.relicCounters['sundial'] = (owner.relicCounters['sundial'] || 0) + 1;
            if (owner.relicCounters['sundial'] >= 3) {
                owner.relicCounters['sundial'] = 0;
                owner.energy += 2;
            }
        }
    },
    ETERNAL_FEATHER: new class extends Relic {
        constructor() { super('eternal_feather', 'エターナルフェザー', '休憩場所に入るたび、デッキのカード5枚につきHPを3回復する。', 'uncommon'); }
        onRoomEnter(owner, roomType) {
            if (roomType === RoomType.REST) {
                const healAmount = Math.floor(owner.masterDeck.length / 5) * 3;
                owner.heal(healAmount);
            }
        }
    },
    PANTAGRAPH: new class extends Relic {
        constructor() { super('pantagraph', 'パンタグラフ', 'ボスの戦闘開始時、HP25回復する。', 'uncommon'); }
        onBattleStart(owner, engine) {
            if (engine.isBossBattle) {
                owner.heal(25);
            }
        }
    },
    MEAT_ON_THE_BONE: new class extends Relic {
        constructor() { super('meat_on_the_bone', '骨付き肉', '戦闘終了時、HPが50%以下ならHP12回復。', 'uncommon'); }
        onVictory(owner, engine) {
            if (owner.hp <= owner.maxHp / 2) {
                owner.heal(12);
            }
        }
    },
    PEAR: new class extends Relic {
        constructor() { super('pear', '洋ナシ', '拾った時、最大HP+10。', 'uncommon'); }
        onObtain(owner) {
            owner.increaseMaxHp(10);
        }
    },
    DARKSTONE_PERIAPT: new class extends Relic {
        constructor() { super('darkstone_periapt', 'ダークストーンの護符', '「呪い」を得るたび、最大HP+6。', 'uncommon'); }
        onCardAdd(owner, card) {
            if (card.type === 'curse') {
                owner.increaseMaxHp(6);
            }
        }
    },
    STRIKE_DUMMY: new class extends Relic {
        constructor() { super('strike_dummy', 'ストライクダミー', '名前に「ストライク」が含まれるカードのダメージ+3。', 'uncommon'); }
        modifyDamageDealt(owner, target, damage, card) {
            if (card && card.name.includes('ストライク')) {
                return damage + 3;
            }
            return damage;
        }
    },
    MUMMIFIED_HAND: new class extends Relic {
        constructor() { super('mummified_hand', 'ミイラの手', '「パワー」をプレイするたび、このターンの間ランダムなカードのコストが0になる。', 'uncommon'); }
        onCardPlay(owner, engine, card) {
            if (card.type === 'power') {
                const validCards = owner.hand.filter(c => c.cost > 0 && !c.isCostOverriddenForTurn);
                if (validCards.length > 0) {
                    const randomCard = validCards[Math.floor(Math.random() * validCards.length)];
                    randomCard.originalCostBeforeOverride = randomCard.cost;
                    randomCard.cost = 0;
                    randomCard.isCostOverriddenForTurn = true;
                    if (!owner.turnEndCostResets) owner.turnEndCostResets = [];
                    owner.turnEndCostResets.push(randomCard);
                }
            }
        }
        onTurnEnd(owner, engine) {
            if (owner.turnEndCostResets) {
                owner.turnEndCostResets.forEach(c => {
                    if (c.isCostOverriddenForTurn) {
                        c.cost = c.originalCostBeforeOverride;
                        c.isCostOverriddenForTurn = false;
                    }
                });
                owner.turnEndCostResets = [];
            }
        }
    },
    MATRYOSHKA: new class extends Relic {
        constructor() { super('matryoshka', 'マトリョーシカ', '次に開ける2つの宝箱から、レリックが2つ出現する。', 'uncommon'); }
        onObtain(owner) {
            owner.relicCounters['matryoshka'] = 2; // 残り回数
        }
    },
    FROZEN_EGG: new class extends Relic {
        constructor() { super('frozen_egg', '凍った卵', '今後カードの報酬で得られる「パワー」がアップグレードされる。', 'uncommon'); }
        onCardAdd(owner, card) {
            if (card.type === 'power' && !card.isUpgraded && card.upgradeData) {
                card.upgrade();
            }
        }
    },
    TOXIC_EGG: new class extends Relic {
        constructor() { super('toxic_egg', '毒の卵', '今後カードの報酬で得られる「スキル」がアップグレードされる。', 'uncommon'); }
        onCardAdd(owner, card) {
            if (card.type === 'skill' && !card.isUpgraded && card.upgradeData) {
                card.upgrade();
            }
        }
    },
    MOLTEN_EGG: new class extends Relic {
        constructor() { super('molten_egg', '溶融した卵', '今後カードの報酬で得られる「アタック」がアップグレードされる。', 'uncommon'); }
        onCardAdd(owner, card) {
            if (card.type === 'attack' && !card.isUpgraded && card.upgradeData) {
                card.upgrade();
            }
        }
    },
    MERCURY_HOURGLASS: new class extends Relic {
        constructor() { super('mercury_hourglass', '水銀の砂時計', 'ターン開始時、敵全体に3ダメージを与える。', 'uncommon'); }
        onPlayerTurnStart(owner, engine) {
            engine.enemies.forEach(enemy => {
                if (!enemy.isDead()) {
                    enemy.takeDamage(3, owner);
                }
            });
        }
    },
    SELF_FORMING_CLAY: new class extends Relic {
        constructor() { super('self_forming_clay', '自己形成粘土', '戦闘中HPを失うたび、次のターンに3ブロックを得る。', 'uncommon'); }
        onTakeDamage(owner, engine, amount) {
            if (amount > 0) {
                owner.relicCounters['self_forming_clay'] = (owner.relicCounters['self_forming_clay'] || 0) + 3;
            }
        }
        onPlayerTurnStart(owner, engine) {
            const blockToGain = owner.relicCounters['self_forming_clay'] || 0;
            if (blockToGain > 0) {
                owner.addBlock(blockToGain);
                owner.relicCounters['self_forming_clay'] = 0;
            }
        }
    },
    GREMLIN_HORN: new class extends Relic {
        constructor() { super('gremlin_horn', 'グレムリンの角笛', '敵が死ぬたび、エナジーを1得て、カードを1枚引く。', 'uncommon'); }
        onEnemyDeath(owner, enemy, engine) {
            owner.energy += 1;
            engine.drawCards(1);
        }
    },
    QUESTION_CARD: new class extends Relic {
        constructor() { super('question_card', '質問カード', 'カードの報酬画面で、選択肢が1つ増える。', 'uncommon'); }
    },
    THE_COURIER: new class extends Relic {
        constructor() { super('the_courier', '配達人', '商人が販売するカード、レリック、ポーションは売り切れにならず、価格は20％割引される。', 'uncommon'); }
    },
    WHITE_BEAST_STATUE: new class extends Relic {
        constructor() { super('white_beast_statue', '白き獣の像', '戦闘後、必ずポーションがドロップする。', 'uncommon'); }
    },
    BOTTLED_FLAME: new class extends Relic {
        constructor() { super('bottled_flame', '瓶詰の炎', '獲得時、アタックを1枚選ぶ。そのカードは各戦闘の開始時に手札にある状態になる。', 'uncommon'); }
        onObtain(owner, game) {
            if (game) {
                const attacks = owner.masterDeck.filter(c => c.type === 'attack' && !c.isInnate);
                if (attacks.length > 0) {
                    game.showCardSelectionFromPile('瓶詰の炎: アタックを選択', attacks, (card) => {
                        card.isInnate = true;
                        card.bottledId = 'bottled_flame';
                    });
                }
            }
        }
    },
    BOTTLED_TORNADO: new class extends Relic {
        constructor() { super('bottled_tornado', '瓶詰の竜巻', '獲得時、パワーを1枚選ぶ。そのカードは各戦闘の開始時に手札にある状態になる。', 'uncommon'); }
        onObtain(owner, game) {
            if (game) {
                const powers = owner.masterDeck.filter(c => c.type === 'power' && !c.isInnate);
                if (powers.length > 0) {
                    game.showCardSelectionFromPile('瓶詰の竜巻: パワーを選択', powers, (card) => {
                        card.isInnate = true;
                        card.bottledId = 'bottled_tornado';
                    });
                }
            }
        }
    },
    BOTTLED_LIGHTNING: new class extends Relic {
        constructor() { super('bottled_lightning', '瓶詰の雷', '獲得時、スキルを1枚選ぶ。そのカードは各戦闘の開始時に手札にある状態になる。', 'uncommon'); }
        onObtain(owner, game) {
            if (game) {
                const skills = owner.masterDeck.filter(c => c.type === 'skill' && !c.isInnate);
                if (skills.length > 0) {
                    game.showCardSelectionFromPile('瓶詰の雷: スキルを選択', skills, (card) => {
                        card.isInnate = true;
                        card.bottledId = 'bottled_lightning';
                    });
                }
            }
        }
    },
    SINGING_BOWL: new class extends Relic {
        constructor() { super('singing_bowl', '歌うボウル', 'カードの報酬をスキップしたとき、最大HP+2。', 'uncommon'); }
    },
    BLUE_CANDLE: new class extends Relic {
        constructor() { super('blue_candle', 'ブルーキャンドル', 'プレイ不可の「呪い」がプレイ可能になる。呪いをプレイするとHPを1失い、そのカードは廃棄される。', 'uncommon'); }
    },
    HORN_CLEAT: new class extends Relic {
        constructor() { super('horn_cleat', 'ホーンクリート', '2ターン目の開始時に14ブロックを得る。', 'uncommon'); }
        onPlayerTurnStart(owner, engine) {
            if (engine.turn === 2) {
                owner.addBlock(14);
                if (engine.showEffectForPlayer) engine.showEffectForPlayer('block');
                if (engine.audioManager) engine.audioManager.playSe('defense');
            }
        }
    },
    PAPER_PHROG: new class extends Relic {
        constructor() { super('paper_phrog', '折り紙キャエル', '弱体を持つ敵へのダメージが50％ではなく、75％増加する。', 'uncommon', 'ironclad'); }
    }
};
