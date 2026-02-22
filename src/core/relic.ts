import { CardLibrary } from './card';

export class Relic {
    id: string;
    name: string;
    description: string;
    rarity: string;
    character?: string; // 特定キャラ専用レリック用（例：'ironclad'）

    constructor(id, name, description, rarity, character?) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.rarity = rarity; // 'starter', 'common', 'uncommon', 'rare', 'boss'
        this.character = character;
    }

    // フックメソッド（デフォルトは何もしない）
    onObtain(owner, game?: any) { }
    onBattleStart(owner, engine) { }
    onTurnStart(owner, engine) { }
    onPlayerTurnStart(owner, engine) { }
    onTurnEnd(owner, engine) { }
    onVictory(owner, engine) { }
    onCardPlay(owner, engine, card) { }
    afterCardPlay(owner, engine, card) { }
    onTakeDamage(owner, engine, amount) { }
    onHPRecovery(owner, engine, amount) { }
    onShuffle(owner, engine) { }
    onCardDraw(owner, engine, card) { }
    onCardExhaust(owner, engine, card) { }
    onCardAdd(owner, card) { }
    onPotionUse(owner, potion) { }
    onRoomEnter(owner, roomType) { }
    onRoomRest(owner) { }
    modifyDamageDealt(owner, target, damage, card?) { return damage; }
    modifyBlockGained(owner, block, card?) { return block; }
    modifyHealAmount(owner, amount) { return amount; } // 回復量補正用
    onGoldSpend(owner, amount) { }
    onApplyStatus(owner, target, type, value, engine) { } // ステータス付与時のフック
}

export const RelicLibrary = {
    // Starter
    BURNING_BLOOD: new class extends Relic {
        constructor() { super('burning_blood', 'バーニングブラッド', '戦闘終了時、HPを6回復する。', 'starter'); }
        onVictory(owner, engine) {
            owner.heal(6);
        }
    },

    // Common
    VAJRA: new class extends Relic {
        constructor() { super('vajra', '金剛杵', '戦闘開始時、筋力を1得る。', 'common'); }
        onBattleStart(owner, engine) {
            owner.addStatus('strength', 1);
        }
    },
    ANCHOR: new class extends Relic {
        constructor() { super('anchor', 'アンカー', '1ターン目の開始時、10ブロックを得る。', 'common'); }
        onPlayerTurnStart(owner, engine) {
            if (engine.turn === 1) {
                owner.addBlock(10);
            }
        }
    },
    LANTERN: new class extends Relic {
        constructor() { super('lantern', 'ランタン', '1ターン目の開始時、エナジーを1得る。', 'common'); }
        onPlayerTurnStart(owner, engine) {
            if (engine.turn === 1) {
                owner.energy += 1;
            }
        }
    },
    BAG_OF_PREPARATION: new class extends Relic {
        constructor() { super('bag_of_preparation', '準備バッグ', '1ターン目の開始時、カードを2枚追加で引く。', 'common'); }
        onPlayerTurnStart(owner, engine) {
            if (engine.turn === 1) {
                engine.drawCards(2);
            }
        }
    },
    BLOOD_VIAL: new class extends Relic {
        constructor() { super('blood_vial', '血の小瓶', '戦闘開始時、HPを2回復する。', 'common'); }
        onBattleStart(owner, engine) {
            owner.heal(2);
        }
    },
    STRAWBERRY: new class extends Relic {
        constructor() { super('strawberry', 'イチゴ', '拾った時、最大HP+7を得る。', 'common'); }
        onObtain(owner) {
            owner.increaseMaxHp ? owner.increaseMaxHp(7) : (owner.maxHp += 7, owner.hp += 7);
        }
    },
    BRONZE_SCALES: new class extends Relic {
        constructor() { super('bronze_scales', '青銅のウロコ', '戦闘開始時、トゲ3を得る。', 'common'); }
        onBattleStart(owner, engine) {
            owner.addStatus('thorns', 3);
        }
    },
    ODDLY_SMOOTH_STONE: new class extends Relic {
        constructor() { super('oddly_smooth_stone', 'すべすべ石', '戦闘開始時、敏捷性1を得る。', 'common'); }
        onBattleStart(owner, engine) {
            owner.addStatus('dexterity', 1);
        }
    },
    ORICHALCUM: new class extends Relic {
        constructor() { super('orichalcum', 'オリハルコン', 'ターン終了時、ブロックが0なら6ブロックを得る。', 'common'); }
        onTurnEnd(owner, engine) {
            if (owner.block === 0) {
                owner.addBlock(6);
            }
        }
    },
    OMAMORI: new class extends Relic {
        constructor() { super('omamori', 'お守り', '次に受ける「呪い」を2回まで無効にする。', 'common'); }
        onObtain(owner) { owner.relicCounters['omamori'] = 2; }
        // 呪い無効化の判定はカード追加時にフック追加済
    },
    MEAL_TICKET: new class extends Relic {
        constructor() { super('meal_ticket', 'お食事券', 'ショップに来店するたび、HPを15回復。', 'common'); }
        onRoomEnter(owner, roomType) { if (roomType === 'shop') owner.heal(15); }
    },
    BOOT: new class extends Relic {
        constructor() { super('boot', 'ザ・ブーツ', '自分がアタックで与える、ブロックされなかった4以下のダメージを5ダメージに増加する。', 'common'); }
        modifyDamageDealt(owner, target, damage, card) {
            if (card && card.type === 'attack' && damage > 0 && damage <= 4) return 5;
            return damage;
        }
    },
    SMILING_MASK: new class extends Relic {
        constructor() { super('smiling_mask', 'スマイルマスク', '商人のカード削除サービスの費用が50ゴールドに固定される。', 'common'); }
    },
    DREAM_CATCHER: new class extends Relic {
        constructor() { super('dream_catcher', 'ドリームキャッチャー', '休憩時にカードを1枚獲得する。', 'common'); }
    },
    NUNCHAKU: new class extends Relic {
        constructor() { super('nunchaku', 'ヌンチャク', 'アタックを10枚プレイするたび、●を得る。', 'common'); }
        onCardPlay(owner, engine, card) {
            if (card.type === 'attack') {
                owner.relicCounters['nunchaku'] = (owner.relicCounters['nunchaku'] || 0) + 1;
                if (owner.relicCounters['nunchaku'] >= 10) {
                    owner.relicCounters['nunchaku'] = 0;
                    owner.energy += 1;
                    if (engine && engine.showEffectForPlayer) engine.showEffectForPlayer('skill');
                }
            }
        }
    },
    HAPPY_FLOWER: new class extends Relic {
        constructor() { super('happy_flower', 'ハッピーフラワー', '3ターンごとに、●を獲得。', 'common'); }
        onPlayerTurnStart(owner, engine) {
            owner.relicCounters['happy_flower'] = (owner.relicCounters['happy_flower'] || 0) + 1;
            if (owner.relicCounters['happy_flower'] >= 3) {
                owner.relicCounters['happy_flower'] = 0;
                owner.energy += 1;
            }
        }
    },
    BAG_OF_MARBLES: new class extends Relic {
        constructor() { super('bag_of_marbles', 'ビー玉袋', '戦闘開始時、敵全体に弱体1を与える。', 'common'); }
        onBattleStart(owner, engine) {
            engine.enemies.forEach(enemy => { if (!enemy.isDead()) enemy.addStatus('vulnerable', 1); });
        }
    },
    PEN_NIB: new class extends Relic {
        constructor() { super('pen_nib', 'ペン先', 'アタックの使用10回ごとにダメージが2倍になる。', 'common'); }
        onCardPlay(owner, engine, card) {
            if (card.type === 'attack') {
                if (owner.relicCounters['pen_nib_active']) return; // すでに発動中ならカウントしない
                owner.relicCounters['pen_nib'] = (owner.relicCounters['pen_nib'] || 0) + 1;
                if (owner.relicCounters['pen_nib'] >= 10) {
                    owner.relicCounters['pen_nib'] = 0;
                    owner.relicCounters['pen_nib_active'] = true;
                    owner.addStatus('pen_nib', 1);
                }
            }
        }
        modifyDamageDealt(owner, target, damage, card) {
            if (owner.relicCounters['pen_nib_active'] && card && card.type === 'attack') return damage * 2;
            return damage;
        }
        afterCardPlay(owner, engine, card) {
            if (owner.relicCounters['pen_nib_active'] && card && card.type === 'attack') {
                owner.relicCounters['pen_nib_active'] = false;
                owner.removeStatus('pen_nib');
            }
        }
    },
    MAW_BANK: new class extends Relic {
        constructor() { super('maw_bank', 'モーバンク', 'フロアを登るたび、12ゴールドを得る。ショップでゴールドを使ったとき、効果を失う。', 'common'); }
        onRoomEnter(owner, roomType) {
            if (!owner.relicCounters['maw_bank_broken']) owner.gold += 12;
        }
        onGoldSpend(owner, amount) { owner.relicCounters['maw_bank_broken'] = true; }
    },
    RED_SKULL: new class extends Relic {
        constructor() { super('red_skull', 'レッドスカル', 'HPが50％以下になると、筋力3を得る。', 'common'); }
        checkEffect(owner) {
            const isBelowHalf = owner.hp <= owner.maxHp / 2;
            const hadEffect = owner.relicCounters['red_skull_active'];
            if (isBelowHalf && !hadEffect) {
                owner.addStatus('strength', 3);
                owner.relicCounters['red_skull_active'] = true;
            } else if (!isBelowHalf && hadEffect) {
                owner.addStatus('strength', -3);
                owner.relicCounters['red_skull_active'] = false;
            }
        }
        onBattleStart(owner, engine) { this.checkEffect(owner); }
        onTakeDamage(owner, engine, amount) { this.checkEffect(owner); }
        onHPRecovery(owner, engine, amount) { this.checkEffect(owner); }
    },
    ANCIENT_TEA_SET: new class extends Relic {
        constructor() { super('ancient_tea_set', '古代のティーセット', '休憩場所を通過した次の戦闘において、●●を得た状態でスタートする。', 'common'); }
        onRoomEnter(owner, roomType) { if (roomType === 'rest') owner.relicCounters['ancient_tea_set'] = 1; }
        onPlayerTurnStart(owner, engine) {
            if (engine.turn === 1 && owner.relicCounters['ancient_tea_set'] === 1) {
                owner.energy += 2;
                owner.relicCounters['ancient_tea_set'] = 0;
            }
        }
    },
    ART_OF_WAR: new class extends Relic {
        constructor() { super('art_of_war', '孫子兵法', 'このターン、「アタック」を1枚もプレイしなかった場合、次のターン開始時、●を得る。', 'common'); }
        onPlayerTurnStart(owner, engine) { owner.relicCounters['art_of_war_played_attack'] = false; }
        onCardPlay(owner, engine, card) { if (card.type === 'attack') owner.relicCounters['art_of_war_played_attack'] = true; }
        onTurnEnd(owner, engine) { if (!owner.relicCounters['art_of_war_played_attack']) owner.relicCounters['art_of_war_trigger'] = true; }
    },
    TINY_CHEST: new class extends Relic {
        constructor() { super('tiny_chest', '小さな宝箱', '?部屋4部屋毎に財宝部屋が出現する。', 'common'); }
    },
    WAR_PAINT: new class extends Relic {
        constructor() { super('war_paint', '戦化粧', '獲得時に、ランダムな2枚の「スキル」をアップグレードする。', 'common'); }
        onObtain(owner) {
            const skills = owner.masterDeck.filter(c => c.type === 'skill' && !c.isUpgraded && c.upgradeData);
            this.shuffleArray(skills);
            if (skills[0]) skills[0].upgrade();
            if (skills[1]) skills[1].upgrade();
        }
        shuffleArray(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[array[i], array[j]] = [array[j], array[i]]; } }
    },
    JUZU_BRACELET: new class extends Relic {
        constructor() { super('juzu_bracelet', '数珠ブレスレット', '？の部屋で敵に遭遇しなくなる。', 'common'); }
    },
    PRESERVED_INSECT: new class extends Relic {
        constructor() { super('preserved_insect', '昆虫標本', 'エリート部屋にいる敵のHPが25%低下する。', 'common'); }
        onBattleStart(owner, engine) {
            if (engine.isElite) {
                engine.enemies.forEach(e => {
                    const reduction = Math.floor(e.maxHp * 0.25);
                    e.maxHp -= reduction;
                    e.hp -= reduction;
                });
            }
        }
    },
    REGAL_PILLOW: new class extends Relic {
        constructor() { super('regal_pillow', '王者の枕', '休憩時に追加で15HPが回復する。', 'common'); }
    },
    TOY_ORNITHOPTER: new class extends Relic {
        constructor() { super('toy_ornithopter', '玩具のオーニソプター', 'ポーションを使用するたび、HP5回復。', 'common'); }
        onPotionUse(owner, potion) { owner.heal(5); }
    },
    CENTENNIAL_PUZZLE: new class extends Relic {
        constructor() { super('centennial_puzzle', '百年パズル', '戦闘中初めてHPを失うと、カードを3枚引く。', 'common'); }
        onBattleStart(owner, engine) { owner.relicCounters['centennial_puzzle'] = false; }
        onTakeDamage(owner, engine, amount) {
            if (!owner.relicCounters['centennial_puzzle'] && amount > 0) {
                owner.relicCounters['centennial_puzzle'] = true;
                if (engine) engine.drawCards(3);
            }
        }
    },
    WHETSTONE: new class extends Relic {
        constructor() { super('whetstone', '砥石', '獲得時に、ランダムな2枚の「アタック」をアップグレードする。', 'common'); }
        onObtain(owner) {
            const attacks = owner.masterDeck.filter(c => c.type === 'attack' && !c.isUpgraded && c.upgradeData);
            this.shuffleArray(attacks);
            if (attacks[0]) attacks[0].upgrade();
            if (attacks[1]) attacks[1].upgrade();
        }
        shuffleArray(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[array[i], array[j]] = [array[j], array[i]]; } }
    },
    AKABEKO: new class extends Relic {
        constructor() { super('akabeko', '赤べこ', '戦闘中最初のアタックは追加で8ダメージを与える。', 'common'); }
        onBattleStart(owner, engine) { owner.relicCounters['akabeko'] = true; owner.addStatus('vigor', 8); } // vigor(活力)で表現
        modifyDamageDealt(owner, target, damage, card) {
            if (owner.relicCounters['akabeko'] && card && card.type === 'attack') return damage + 8;
            return damage;
        }
        afterCardPlay(owner, engine, card) {
            if (owner.relicCounters['akabeko'] && card && card.type === 'attack') {
                owner.relicCounters['akabeko'] = false;
                owner.removeStatus('vigor'); // 単純化のための処理
            }
        }
    },
    CERAMIC_FISH: new class extends Relic {
        constructor() { super('ceramic_fish', '陶器の魚', 'デッキにカードを追加するたび、9ゴールドを得る。', 'common'); }
        onCardAdd(owner, card) { owner.gold += 9; }
    },
    // ---- Uncommon Relics ----
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
            if (roomType === 'rest') {
                const healAmount = Math.floor(owner.masterDeck.length / 5) * 3;
                owner.heal(healAmount);
            }
        }
    },
    PANTAGRAPH: new class extends Relic {
        constructor() { super('pantagraph', 'パンタグラフ', 'ボスの戦闘開始時、HP25回復する。', 'uncommon'); }
        onBattleStart(owner, engine) {
            if (engine.isBoss) {
                owner.heal(25);
            }
        }
    },
    MEAT_ON_THE_BONE: new class extends Relic {
        constructor() { super('meat_on_the_bone', '骨付き肉', '戦闘終了時、HPが50%以下ならHP12回復。', 'uncommon'); }
        onBattleEnd(owner, engine, result) {
            if (result === 'victory' && owner.hp <= owner.maxHp / 2) {
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
        constructor() { super('the_courier', '配達人', '商人から20%の割引を受けられる。', 'uncommon'); }
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
    },

    // Potion Related
    POTION_BELT: new class extends Relic {
        constructor() { super('potion_belt', 'ポーションベルト', '拾った時、ポーションスロットを2つ得る。', 'common'); }
        onObtain(owner) {
            owner.potionSlots += 2;
            owner.potions.push(null, null);
        }
    },
    SACRED_BARK: new class extends Relic {
        constructor() { super('sacred_bark', '聖樹皮', 'ポーションの効果が2倍になる。', 'boss'); }
    },
    SOZU: new class extends Relic {
        constructor() { super('sozu', 'ししおどし', '毎ターンエナジーを1得る。ポーションを入手できなくなる。', 'boss'); }
        onPlayerTurnStart(owner) {
            owner.energy += 1;
        }
    },
    VELVET_CHOKER: new class extends Relic {
        constructor() { super('velvet_choker', 'ベルベットのチョーカー', '毎ターンエナジーを1得る。1ターンに6枚より多くのカードを使えない。', 'boss'); }
        onPlayerTurnStart(owner) {
            owner.energy += 1;
        }
        // カード使用制限はBattleEngine側でチェックする必要がある
    },
    CURSED_KEY: new class extends Relic {
        constructor() { super('cursed_key', '呪いの鍵', '毎ターンエナジーを1得る。宝箱を開けるたびに呪いを得る。', 'boss'); }
        onPlayerTurnStart(owner) {
            owner.energy += 1;
        }
    },
    SLAVERS_COLLAR: new class extends Relic {
        constructor() { super('slavers_collar', 'スレイヴの首輪', 'エリート、またはボスとの戦闘中、毎ターンエナジーを1得る。', 'boss'); }
        onPlayerTurnStart(owner, engine) {
            if (engine.isElite || engine.isBoss) {
                owner.energy += 1;
            }
        }
    },

    // Rare
    ICE_CREAM: new class extends Relic {
        constructor() { super('ice_cream', 'アイスクリーム', '使用しなかったエナジーが蓄積されていく。', 'rare'); }
    },
    POCKETWATCH: new class extends Relic {
        constructor() { super('pocketwatch', '懐中時計', '1ターンにプレイしたカードが3枚以下なら、次のターン開始時にカードを3枚引く。', 'rare'); }
        onCardPlay(owner, engine, card) {
            owner.relicCounters['pocketwatch'] = (owner.relicCounters['pocketwatch'] || 0) + 1;
        }
        onTurnEnd(owner, engine) {
            if ((owner.relicCounters['pocketwatch'] || 0) <= 3) {
                owner.relicCounters['pocketwatch_active'] = 1;
            } else {
                owner.relicCounters['pocketwatch_active'] = 0;
            }
            // カウンターはUI表示用なので、リセットタイミングはonPlayerTurnStartとする
        }
        onPlayerTurnStart(owner, engine) {
            if (owner.relicCounters['pocketwatch_active'] === 1) {
                engine.drawCards(3);
                console.log('懐中時計発動！ 3枚カードを引きます。');
            }
            owner.relicCounters['pocketwatch'] = 0;
            owner.relicCounters['pocketwatch_active'] = 0;
        }
    },
    UNCEASING_TOP: new class extends Relic {
        constructor() { super('unceasing_top', '永久コマ', '手札にカードが1枚もない時、カードを1枚引く。', 'rare'); }
    },
    TURNIP: new class extends Relic {
        constructor() { super('turnip', 'カブ', '「脆弱」にならなくなる。', 'rare'); }
    },
    GINGER: new class extends Relic {
        constructor() { super('ginger', '生姜', '「脱力」にならなくなる。', 'rare'); }
    },
    DU_VU_DOLL: new class extends Relic {
        constructor() { super('du_vu_doll', 'ドゥーヴー人形', '戦闘開始時、デッキの呪い1枚につき、筋力を1得る。', 'rare'); }
        onBattleStart(owner, engine) {
            const curses = owner.masterDeck.filter(c => c.type === 'curse').length;
            if (curses > 0) {
                owner.addStatus('strength', curses);
                console.log(`ドゥーヴー人形発動！ 呪い ${curses} 枚により筋力+${curses}。`);
            }
        }
    },
    CALIPERS: new class extends Relic {
        constructor() { super('calipers', 'カリパス', 'ターン開始時、ブロックをすべて失う代わりに15失う。', 'rare'); }
    },
    CHARONS_ASHES: new class extends Relic {
        constructor() { super('charons_ashes', 'カロンの遺灰', 'カードを廃棄するたび、敵全体に3ダメージを与える。', 'rare', 'ironclad'); }
        onCardExhaust(owner, engine, card) {
            if (!engine) return;
            engine.enemies.forEach(enemy => {
                if (!enemy.isDead()) {
                    // 非同期演出を待たない簡易ダメージ
                    enemy.takeDamage(3, owner);
                }
            });
            console.log('カロンの遺灰発動！ 廃棄により敵全体に3ダメージ。');
        }
    },
    TUNGSTEN_ROD: new class extends Relic {
        constructor() { super('tungsten_rod', 'タングステンの棒', 'HPを失う時、その値を1軽減する。', 'rare'); }
    },
    MAGIC_FLOWER: new class extends Relic {
        constructor() { super('magic_flower', 'マジックフラワー', '戦闘中、HPの回復量を50%増加させる。', 'rare', 'ironclad'); }
        modifyHealAmount(owner, amount) {
            // StSでは戦闘中のみだが、ここでは簡略化して常に適用するか判定
            return Math.floor(amount * 1.5);
        }
    },
    OLD_COIN: new class extends Relic {
        constructor() { super('old_coin', '古のコイン', '獲得時、300ゴールドを得る。', 'rare'); }
        onObtain(owner, game) {
            owner.gainGold(300);
            console.log('古のコイン獲得！ 300ゴールドを得ました。');
        }
    },
    MANGO: new class extends Relic {
        constructor() { super('mango', 'マンゴー', '獲得時、最大HP+14。', 'rare'); }
        onObtain(owner, game) {
            owner.increaseMaxHp(14);
            console.log('マンゴー獲得！ 最大HP+14。');
        }
    },
    STONE_CALENDAR: new class extends Relic {
        constructor() { super('stone_calendar', '暦石', '7ターン目の終了時、敵全体に52ダメージを与える。', 'rare'); }
        onTurnEnd(owner, engine) {
            if (engine.turn === 7) {
                console.log('暦石発動！ 7ターン目終了時に敵全体へ52ダメージ。');
                engine.enemies.forEach(enemy => {
                    if (!enemy.isDead()) {
                        enemy.takeDamage(52, owner);
                    }
                });
            }
        }
    },
    CAPTAINS_WHEEL: new class extends Relic {
        constructor() { super('captains_wheel', '船長の舵輪', '3ターン目の開始時に18ブロックを得る。', 'rare'); }
        onPlayerTurnStart(owner, engine) {
            if (engine.turn === 3) {
                console.log('船長の舵輪発動！ 3ターン目開始時に18ブロック獲得。');
                owner.addBlock(18);
                if (engine.showEffectForPlayer) engine.showEffectForPlayer('block');
                if (engine.audioManager) engine.audioManager.playSe('defense');
            }
        }
    },
    THREAD_AND_NEEDLE: new class extends Relic {
        constructor() { super('thread_and_needle', '針と糸', '戦闘開始時、プレートアーマー4を得る。', 'rare'); }
        onBattleStart(owner, engine) {
            owner.addStatus('plated_armor', 4);
        }
    },
    INCENSE_BURNER: new class extends Relic {
        constructor() { super('incense_burner', '香炉', '6ターン毎に無形1を得る。', 'rare'); }
        onPlayerTurnStart(owner, engine) {
            let count = owner.relicCounters['incense_burner'] || 0;
            count++;
            if (count >= 6) {
                console.log('香炉発動！ 無形を獲得します。');
                owner.addStatus('intangible', 1);
                count = 0;
            }
            owner.relicCounters['incense_burner'] = count;
        }
        onBattleStart(owner, engine) {
            if (owner.relicCounters['incense_burner'] === undefined) {
                owner.relicCounters['incense_burner'] = 0;
            }
        }
    },
    TORII: new class extends Relic {
        constructor() { super('torii', '鳥居', '5以下のダメージを1に軽減する。', 'rare'); }
        // Entity.takeDamage にて判定
    },
    BIRD_FACED_URN: new class extends Relic {
        constructor() { super('bird_faced_urn', '鳥頭壺', 'パワーを使用するたびにHPを2回復する。', 'rare'); }
        onCardPlay(owner, engine, card) {
            if (card.type === 'power') {
                console.log('鳥頭壺発動！ パワープレイによりHP回復。');
                owner.heal(2);
            }
        }
    },
    DEAD_BRANCH: new class extends Relic {
        constructor() { super('dead_branch', '古木の枝', 'カードを廃棄するたび、手札にランダムなカードを1枚加える。', 'rare'); }
        onCardExhaust(owner, engine, card) {
            if (!engine) return;
            const allCards = Object.values(CardLibrary).filter(c => c.type !== 'basic' && c.type !== 'curse' && c.type !== 'status');
            const randomCard = allCards[Math.floor(Math.random() * allCards.length)].clone();
            engine.addCardToHand(randomCard);
            console.log(`古木の枝発動！ ${randomCard.name} を手札に加えました。`);
        }
    },
    FOSSILIZED_HELIX: new class extends Relic {
        constructor() { super('fossilized_helix', '貝の化石', '各戦闘で最初に受けるダメージを0にする。', 'rare'); }
        onBattleStart(owner, engine) {
            owner.relicCounters['fossilized_helix'] = 1; // 1: 有効, 0: 使用済み
        }
    },
    CHAMPION_BELT: new class extends Relic {
        constructor() { super('champion_belt', 'チャンピオンベルト', '敵に「脆弱」を付与するたび、対象に「脱力」1を付与する。', 'rare'); }
        onApplyStatus(owner, target, type, value, engine) {
            if (type === 'vulnerable' && value > 0 && target !== owner) {
                console.log('チャンピオンベルト発動！ 対象に脱力を付与します。');
                target.addStatus('weak', 1);
            }
        }
    },
    LIZARD_TAIL: new class extends Relic {
        constructor() { super('lizard_tail', 'トカゲのしっぽ', 'HPが0になった時、一度だけ最大HPの50%で復活する。', 'rare'); }
        onBattleStart(owner, engine) {
            if (owner.relicCounters['lizard_tail'] === undefined) {
                owner.relicCounters['lizard_tail'] = 1; // 1: 未使用, 0: 使用済み
            }
        }
    }
};
