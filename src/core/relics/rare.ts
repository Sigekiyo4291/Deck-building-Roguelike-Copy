import { Relic } from '../relic-class';
import { RoomType } from '../map-data';
import { CardLibrary } from '../card';

export const RareRelics = {
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
        onPlayerTurnStart(owner, engine) {
            let count = owner.relicCounters['stone_calendar'] || 0;
            if (engine.turn <= 7) {
                count++;
                owner.relicCounters['stone_calendar'] = count;
            }
        }
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
            let count = owner.relicCounters['captains_wheel'] || 0;
            if (engine.turn <= 3) {
                count++;
                owner.relicCounters['captains_wheel'] = count;
            }
            if (engine.turn === 3) {
                console.log('船長の舵輪発動！ 3ターン目開始時に18ブロック獲得。');
                owner.addBlock(18);
                if (engine.showEffectForPlayer) engine.showEffectForPlayer('block');
                if (engine.audioManager) engine.audioManager.playSe('defense');
            }
        }
        isUsedUp(owner) { return owner.relicCounters['captains_wheel'] === 3; }
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
        isUsedUp(owner) { return owner.relicCounters['fossilized_helix'] === 0; }
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
        isUsedUp(owner) { return owner.relicCounters['lizard_tail'] === 0; }
    },
    GAMBLING_CHIP: new class extends Relic {
        constructor() { super('gambling_chip', 'ギャンブルチップ', '戦闘開始時、手札を好きな枚数捨てて引き直すことができる。', 'rare'); }
        // engine.ts の startPlayerTurn 内で明示的に呼び出す
    },
    SHOVEL: new class extends Relic {
        constructor() { super('shovel', 'ショベル', '休息所で「掘る」アクションができるようになる。', 'rare'); }
    },
    GIRYA: new class extends Relic {
        constructor() { super('girya', 'ケトルベル', '休息所で「持ち上げる」アクションができるようになる（最大3回まで）。', 'rare'); }
        onObtain(owner, game) {
            owner.relicCounters['girya'] = 0;
        }
        onBattleStart(owner, engine) {
            const count = owner.relicCounters['girya'] || 0;
            if (count > 0) {
                owner.addStatus('strength', count);
                console.log(`ケトルベル発動！ 筋力+${count}。`);
            }
        }
    },
    PEACE_PIPE: new class extends Relic {
        constructor() { super('peace_pipe', '安らぎのパイプ', '休息所で「削除」アクションができるようになる。', 'rare'); }
    },
    PRAYER_WHEEL: new class extends Relic {
        constructor() { super('prayer_wheel', '祈りのルーレット', '通常の敵が追加でカードをドロップするようになる。', 'rare'); }
    },
    WING_BOOTS: new class extends Relic {
        constructor() { super('wing_boots', '空飛ぶ靴', '次の部屋を選択する時、3回まで道を無視して飛ぶことが出来る。', 'rare'); }
        onObtain(owner, game) {
            owner.relicCounters['wing_boots'] = 3;
        }
    }
};
