import { Relic } from '../relic-class';
import { RoomType } from '../map-data';
import { CardLibrary } from '../card';

export const CommonRelics = {
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
        isUsedUp(owner) { return owner.relicCounters['omamori'] === 0; }
    },
    MEAL_TICKET: new class extends Relic {
        constructor() { super('meal_ticket', 'お食事券', 'ショップに来店するたび、HPを15回復。', 'common'); }
        onRoomEnter(owner, roomType) { if (roomType === RoomType.SHOP) owner.heal(15); }
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
            if (!owner.relicCounters['maw_bank_broken']) owner.gainGold(12);
        }
        onGoldSpend(owner, amount) { owner.relicCounters['maw_bank_broken'] = true; }
        isUsedUp(owner) { return !!owner.relicCounters['maw_bank_broken']; }
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
        onRoomEnter(owner, roomType) { if (roomType === RoomType.REST) owner.relicCounters['ancient_tea_set'] = 1; }
        onPlayerTurnStart(owner, engine) {
            if (engine.turn === 1 && owner.relicCounters['ancient_tea_set'] === 1) {
                owner.energy += 2;
                owner.relicCounters['ancient_tea_set'] = 0;
            }
        }
    },
    ART_OF_WAR: new class extends Relic {
        constructor() { super('art_of_war', '孫子兵法', 'このターン、「アタック」を1枚もプレイしなかった場合、次のターン開始時、●を得る。', 'common'); }
        onPlayerTurnStart(owner, engine) {
            if (owner.relicCounters['art_of_war_trigger']) {
                owner.energy += 1;
                owner.relicCounters['art_of_war_trigger'] = false;
                if (engine && engine.showEffectForPlayer) engine.showEffectForPlayer('skill');
                console.log('孫子兵法が発動！ エナジーが1増加しました。');
            }
            owner.relicCounters['art_of_war_played_attack'] = false;
        }
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
            if (engine.isEliteBattle) {
                console.log('昆虫標本発動！ エリートのHPを25%低下させます。');
                engine.enemies.forEach(e => {
                    const reduction = Math.floor(e.maxHp * 0.25);
                    // 最大HPはそのままに、現在HPのみを減らすことで視覚的に「ダメージを受けた」状態にする
                    e.hp -= reduction;
                    console.log(`Enemy ${e.name}: HP ${e.hp}/${e.maxHp} (Reduced by ${reduction})`);
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
    POTION_BELT: new class extends Relic {
        constructor() { super('potion_belt', 'ポーションベルト', '拾った時、ポーションスロットを2つ得る。', 'common'); }
        onObtain(owner) {
            owner.potionSlots += 2;
            owner.potions.push(null, null);
        }
    }
};
