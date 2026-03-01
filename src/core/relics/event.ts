import { Relic } from '../relic-class';
import { RoomType } from '../map-data';
import { CardLibrary } from '../card';

export const EventRelics = {
    ODD_MUSHROOM: new class extends Relic {
        constructor() { super('odd_mushroom', 'おかしなマッシュルーム', '弱体の被ダメージ増加を50％ではなく、25％に軽減する。', 'event'); }
    },
    GREMLIN_VISAGE: new class extends Relic {
        constructor() { super('gremlin_visage', 'グレムリンの顔つき', '戦闘開始時、脱力1を得る。', 'event'); }
        onBattleStart(owner) { owner.addStatus('weak', 1); }
    },
    SSSERPENT_HEAD: new class extends Relic {
        constructor() { super('ssserpent_head', 'サ・サ・サーペントの頭部', '?部屋に入るたびに、50ゴールドを得る。', 'event'); }
        onRoomEnter(owner, roomType) {
            if (roomType === RoomType.EVENT) {
                owner.gainGold(50);
            }
        }
    },
    NILRY_CODEX: new class extends Relic {
        constructor() { super('nilry_codex', 'ニルリーのコーデックス', 'ターン終了時に、ランダムな3枚のカードから1枚選んで山札に加える。', 'event'); }
    },
    NLOTH_GIFT: new class extends Relic {
        constructor() { super('nloth_gift', 'ヌロスの贈り物', '敵がレアカードをドロップする確率が3倍になる。', 'event'); }
    },
    NLOTH_HUNGRY_FACE: new class extends Relic {
        constructor() { super('nloth_hungry_face', 'ヌロスの飢えた顔', '次に開く宝箱（ボスのものを除く）は空っぽ。', 'event'); }
    },
    NEOW_LAMENT: new class extends Relic {
        constructor() { super('neow_lament', 'ネオーの哀歌', '最初の3回の戦闘で、敵のHPを1にする。', 'event'); }
        onObtain(owner) { owner.relicCounters['neow_lament'] = 3; }
    },
    NECRONOMICON: new class extends Relic {
        constructor() { super('necronomicon', 'ネクロノミコン', 'ターンの最初にプレイする2コスト以上の「アタック」を2回プレイする。獲得時、呪いを獲得。', 'event'); }
        onObtain(owner) {
            const curse = CardLibrary.NECRONOMICURSE ? CardLibrary.NECRONOMICURSE.clone() : CardLibrary.REGRET.clone();
            owner.addCard(curse);
        }
        onPlayerTurnStart(owner) { owner.relicCounters['necronomicon'] = 1; }
    },
    RED_MASK: new class extends Relic {
        constructor() { super('red_mask', 'レッドマスク', '戦闘開始時、敵全体に1の脱力を与える。', 'event'); }
        onBattleStart(owner, engine) {
            engine.enemies.forEach(e => { if (!e.isDead()) e.addStatus('weak', 1); });
        }
    },
    TWISTED_TONGS: new class extends Relic {
        constructor() { super('twisted_tongs', '捻じれたトング', 'ターン開始時、あなたの手札のランダムなカードを1枚アップグレードする。', 'event'); }
        onPlayerTurnStart(owner, engine) {
            if (owner.hand.length > 0) {
                const upgradable = owner.hand.filter(c => !c.isUpgraded);
                if (upgradable.length > 0) {
                    const card = upgradable[Math.floor(Math.random() * upgradable.length)];
                    card.upgrade();
                    console.log(`捻じれたトング発動！ ${card.name} をアップグレード。`);
                }
            }
        }
    },
    ENCHIRIDION: new class extends Relic {
        constructor() { super('enchiridion', '教えの書', '戦闘開始時、手札にランダムな「パワー」を1枚加える。そのコストは0になる。', 'event'); }
        onBattleStart(owner, engine) {
            const powers = Object.values(CardLibrary).filter(c => c.type === 'power');
            if (powers.length > 0) {
                const card = powers[Math.floor(Math.random() * powers.length)].clone();
                card.cost = 0;
                engine.addCardToHand(card);
                console.log(`教えの書発動！ ${card.name} を手札に加えました。`);
            }
        }
    },
    CULTIST_HEADPIECE: new class extends Relic {
        constructor() { super('cultist_headpiece', '狂信者の被り物', 'なんだかおしゃべりしたい気分だ。（効果なし）', 'event'); }
    },
    MUTAGENIC_STRENGTH: new class extends Relic {
        constructor() { super('mutagenic_strength', '突然変異性筋肥大', '戦闘開始時、筋力3を得る。最初のターン終了時に筋力3を失う。', 'event'); }
        onBattleStart(owner) {
            owner.addStatus('strength', 3);
            owner.addStatus('strength_down', 3);
        }
    },
    SPIRIT_POOP: new class extends Relic {
        constructor() { super('spirit_poop', '精霊のふん', '不愉快だ。（効果なし）', 'event'); }
    },
    CLERIC_FACE: new class extends Relic {
        constructor() { super('cleric_face', '聖職者の顔', '戦闘を終えるたび、最大HP+1。', 'event'); }
    },
    MARK_OF_THE_BLOOM: new class extends Relic {
        constructor() { super('mark_of_the_bloom', '花の印', 'あなたは回復できなくなる。', 'event'); }
    },
    BLOODY_IDOL: new class extends Relic {
        constructor() { super('bloody_idol', '血塗られた偶像', 'ゴールドを得るたび、HP5回復。', 'event'); }
    },
    GOLDEN_IDOL_RELIC: new class extends Relic {
        constructor() { super('golden_idol_relic', '黄金の偶像', '敵が落とすゴールドが25％増。', 'event'); }
    }
};
