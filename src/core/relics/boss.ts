import { Relic } from '../relic-class';
import { RoomType } from '../map-data';
import { CardLibrary } from '../card';
import { IEntity, IBattleEngine, IPlayer } from '../types';

export const BossRelics = {
    SOZU: new class extends Relic {
        constructor() { super('sozu', 'ししおどし', '最大エナジーを1増やす。今後ポーションを獲得できなくなる。', 'boss'); }
        onObtain(owner: any) { owner.maxEnergy++; }
    },
    ECTOPLASM: new class extends Relic {
        constructor() { super('ectoplasm', 'エクトプラズム', '最大エナジーを1増やす。今後ゴールドを獲得できなくなる。', 'boss'); }
        onObtain(owner: any) { owner.maxEnergy++; }
    },
    COFFEE_DRIPPER: new class extends Relic {
        constructor() { super('coffee_dripper', 'コーヒードリッパー', '最大エナジーを1増やす。休憩所で休息（HP回復）ができなくなる。', 'boss'); }
        onObtain(owner: any) { owner.maxEnergy++; }
    },
    FUSION_HAMMER: new class extends Relic {
        constructor() { super('fusion_hammer', '融合ハンマー', '最大エナジーを1増やす。休憩所で鍛冶（カード強化）ができなくなる。', 'boss'); }
        onObtain(owner: any) { owner.maxEnergy++; }
    },
    BROKEN_CROWN: new class extends Relic {
        constructor() { super('broken_crown', '壊れた王冠', '最大エナジーを1増やす。カード報酬の選択肢が2つ減る。', 'boss'); }
        onObtain(owner: any) { owner.maxEnergy++; }
    },
    CURSED_KEY: new class extends Relic {
        constructor() { super('cursed_key', '呪いの鍵', '最大エナジーを1増やす。宝箱を開けるたびに呪いを獲得する。', 'boss'); }
        onObtain(owner: any) { owner.maxEnergy++; }
    },
    PHILOSOPHERS_STONE: new class extends Relic {
        constructor() { super('philosophers_stone', '賢者の石', '最大エナジーを1増やす。戦闘開始時、全ての敵は筋力1を得る。', 'boss'); }
        onObtain(owner: any) { owner.maxEnergy++; }
        onBattleStart(owner: IEntity, engine: IBattleEngine) {
            engine.enemies.forEach(enemy => {
                if (!enemy.isDead()) enemy.addStatus('strength', 1);
            });
        }
    },
    VELVET_CHOKER: new class extends Relic {
        constructor() { super('velvet_choker', 'ベルベットチョーカー', '最大エナジーを1増やす。1ターンに6枚までしかカードを使えない。', 'boss'); }
        onObtain(owner: any) { owner.maxEnergy++; }
        onPlayerTurnStart(owner: IEntity, engine: IBattleEngine) {
            owner.relicCounters['velvet_choker'] = 0;
        }
        onCardPlay(owner: IEntity, engine: IBattleEngine, card: any) {
            owner.relicCounters['velvet_choker'] = (owner.relicCounters['velvet_choker'] || 0) + 1;
        }
    },
    RUNIC_DOME: new class extends Relic {
        constructor() { super('runic_dome', 'ルーニックドーム', '最大エナジーを1増やす。敵の意図が見えなくなる。', 'boss'); }
        onObtain(owner: any) { owner.maxEnergy++; }
    },
    SLAVERS_COLLAR: new class extends Relic {
        constructor() { super('slavers_collar', 'スレイバーの首輪', 'ボスとエリートとの戦闘において、ターン開始時にエナジーを1得る。', 'boss'); }
        onPlayerTurnStart(owner: IEntity, engine: IBattleEngine) {
            if (engine.isEliteBattle || engine.isBossBattle) {
                (owner as IPlayer).energy += 1;
                console.log('スレイバーの首輪発動！ エナジーを1得ました。');
            }
        }
    },
    MARK_OF_PAIN: new class extends Relic {
        constructor() { super('mark_of_pain', '苦痛の印', '最大エナジーを1増やす。戦闘開始時、「負傷」を2枚山札に加える。', 'boss', 'ironclad'); }
        onObtain(owner: any) { owner.maxEnergy++; }
        onBattleStart(owner: IEntity, engine: IBattleEngine) {
            // 「負傷」カード（Wound）は CardLibrary にある前提
            const wound1 = (CardLibrary as any).WOUND ? (CardLibrary as any).WOUND.clone() : null;
            const wound2 = (CardLibrary as any).WOUND ? (CardLibrary as any).WOUND.clone() : null;
            if (wound1) engine.addCardsToDrawPile(wound1);
            if (wound2) engine.addCardsToDrawPile(wound2);
            console.log('苦痛の印発動！ 山札に負傷を2枚追加しました。');
        }
    },
    ASTROLABE: new class extends Relic {
        constructor() { super('astrolabe', 'アストロラーベ', '拾った時、カード3枚を選択して変化させ、それらをアップグレードする。', 'boss'); }
        onObtain(owner: any, game?: any) {
            if (game && game.showCardTransformSelection) {
                game.showCardTransformSelection(() => {
                    game.showCardTransformSelection(() => {
                        game.showCardTransformSelection(null, true);
                    }, true);
                }, true);
            }
        }
    },
    PANDORAS_BOX: new class extends Relic {
        constructor() { super('pandoras_box', 'パンドラの箱', '拾った時、全ての初期カード（ストライク・防御）をランダムなカードに変化させる。', 'boss'); }
        onObtain(owner: any, game?: any) {
            if (game && game.transformAllBasicCards) {
                game.transformAllBasicCards();
            }
        }
    },
    EMPTY_CAGE: new class extends Relic {
        constructor() { super('empty_cage', '空っぽの檻', '拾った時、デッキからカードを2枚削除する。', 'boss'); }
        onObtain(owner: any, game?: any) {
            if (game && game.showCardRemovalSelection) {
                game.showCardRemovalSelection(() => {
                    game.showCardRemovalSelection(null);
                });
            }
        }
    },
    CALLING_BELL: new class extends Relic {
        constructor() { super('calling_bell', '呼びよせる鐘', '拾った時、固有の呪い1枚とランダムなレリック3個（コモン、アンコモン、レアを各1個）を獲得する。', 'boss'); }
        onObtain(owner: any, game?: any) {
            if (game) {
                // 呪い獲得
                const bellCurse = CardLibrary.CURSE_OF_THE_BELL ? CardLibrary.CURSE_OF_THE_BELL.clone() : CardLibrary.REGRET.clone();
                owner.addCard(bellCurse);
                // レリック獲得はgame側に任せるかここで抽選
                game.gainRandomRelicByRarity('common');
                game.gainRandomRelicByRarity('uncommon');
                game.gainRandomRelicByRarity('rare');
            }
        }
    },
    TINY_HOUSE: new class extends Relic {
        constructor() { super('tiny_house', '小さな家', '拾った時、最大HP+5、ゴールド+50、ポーション1個、ランダムなカード報酬1個を獲得し、ランダムなカード1枚をアップグレードする。', 'boss'); }
        onObtain(owner: any, game?: any) {
            owner.increaseMaxHp(5);
            owner.gainGold(50);
            if (game) {
                game.gainRandomPotion();
                game.showCardRewardOnly();
                game.upgradeRandomCard();
            }
        }
    },
    BLACK_BLOOD: new class extends Relic {
        constructor() { super('black_blood', 'ブラックブラッド', '燃焼の血液のアップグレード。戦闘終了時にHPを12回復する。', 'boss', 'ironclad'); }
        onObtain(owner: any) {
            // 燃焼の血液を削除
            owner.relics = owner.relics.filter((r: any) => r.id !== 'burning_blood');
        }
        onBattleWin(owner: any) {
            owner.heal(12);
            console.log('ブラックブラッド発動！ HPが12回復しました。');
        }
    },
    SNECKO_EYE: new class extends Relic {
        constructor() { super('snecko_eye', 'スネッコアイ', '毎ターンのドロー枚数が2枚増える。戦闘開始時、混乱状態（カードを引くたびにコストがランダムに変化）になる。', 'boss'); }
        onBattleStart(owner: IEntity, engine: IBattleEngine) { owner.addStatus('confusion', 99); }
        onPlayerTurnStart(owner: IEntity, engine: IBattleEngine) { engine.drawCards(2); }
    },
    RUNIC_CUBE: new class extends Relic {
        constructor() { super('runic_cube', 'ルーニック・キューブ', 'ダメージを受けるたびにカードを1枚引く。', 'boss'); }
        onTakeDamage(owner: IEntity, engine: IBattleEngine, amount: number) {
            if (amount > 0 && engine && typeof engine.drawCards === 'function') {
                engine.drawCards(1);
            }
        }
    },
    RUNIC_PYRAMID: new class extends Relic {
        constructor() { super('runic_pyramid', 'ルーニックピラミッド', 'ターン終了時に手札を捨てなくなる。', 'boss'); }
        // engine.ts の endTurn でチェックする
    },
    SACRED_BARK: new class extends Relic {
        constructor() { super('sacred_bark', '聖樹皮', 'ポーションの効果が2倍になる。', 'boss'); }
        // ポーション使用ロジックでチェックする
    },
    BLACK_STAR: new class extends Relic {
        constructor() { super('black_star', 'ブラックスター', 'エリート戦闘で勝利したとき、レリックを2個ドロップする。', 'boss'); }
        // main.ts の showRewardScene でチェックする
    }
};
