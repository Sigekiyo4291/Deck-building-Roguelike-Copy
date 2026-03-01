import { Card } from '../../card-class';
import { CardLibrary } from '../../card';

export const ironcladPowerCards = {
    INFLAME: new Card({
        id: 'inflame',
        name: '炎症',
        cost: 1,
        type: 'power',
        rarity: 'uncommon',
        description: '筋力を2得る',
        effect: (s, t) => {
            s.addStatus('strength', 2);
        },
        targetType: 'self',
        upgradeData: {
            description: '筋力を3得る',
            effect: (s, t) => { s.addStatus('strength', 3); }
        },
        image: 'assets/images/cards/Inflame.png'
    }),
    METALLICIZE: new Card({
        id: 'metallicize',
        name: '金属音',
        cost: 1,
        type: 'power',
        rarity: 'uncommon',
        description: 'ターン終了時に3ブロックを得る',
        effect: (s, t) => {
            s.addStatus('metallicize', 3);
        },
        targetType: 'self',
        upgradeData: {
            description: 'ターン終了時に4ブロックを得る',
            effect: (s, t) => { s.addStatus('metallicize', 4); }
        }
    }),
    FIRE_BREATHING: new Card({
        id: 'fire_breathing',
        name: '炎の吐息',
        cost: 1,
        type: 'power',
        rarity: 'uncommon',
        description: 'ステータスか呪いカードを引くたび、全ての敵に6ダメージを与える',
        effect: (s, t) => {
            s.addStatus('fire_breathing', 6);
        },
        targetType: 'self',
        upgradeData: {
            description: 'ステータスか呪いカードを引くたび、全ての敵に10ダメージを与える',
            effect: (s, t) => { s.addStatus('fire_breathing', 10); }
        }
    }),
    FEEL_NO_PAIN: new Card({
        id: 'feel_no_pain',
        name: '無痛',
        cost: 1,
        type: 'power',
        rarity: 'uncommon',
        description: 'カードが廃棄されるたび、3ブロックを得る',
        effect: (s, t) => {
            s.addStatus('feel_no_pain', 3);
        },
        targetType: 'self',
        upgradeData: {
            description: 'カードが廃棄されるたび、4ブロックを得る',
            effect: (s, t) => { s.addStatus('feel_no_pain', 4); }
        }
    }),
    COMBUST: new Card({
        id: 'combust',
        name: '燃焼',
        cost: 1,
        type: 'power',
        rarity: 'uncommon',
        description: 'ターン終了時、1HPを失い、全ての敵に5ダメージを与える',
        effect: (s, t) => {
            s.addStatus('combust', 5);
        },
        targetType: 'self',
        upgradeData: {
            description: 'ターン終了時、1HPを失い、全ての敵に7ダメージを与える',
            effect: (s, t) => { s.addStatus('combust', 7); }
        }
    }),
    RUPTURE: new Card({
        id: 'rupture',
        name: '破裂',
        cost: 1,
        type: 'power',
        rarity: 'uncommon',
        description: 'カードによってHPを失うたび、筋力を1得る',
        effect: (s, t) => {
            s.addStatus('rupture', 1);
        },
        targetType: 'self',
        upgradeData: {
            description: 'カードによってHPを失うたび、筋力を2得る',
            effect: (s, t) => { s.addStatus('rupture', 2); }
        }
    }),
    EVOLVE: new Card({
        id: 'evolve',
        name: '進化',
        cost: 1,
        type: 'power',
        rarity: 'uncommon',
        description: 'ステータスカードを引くたび、1枚カードを引く',
        effect: (s, t) => {
            s.addStatus('evolve', 1);
        },
        targetType: 'self',
        upgradeData: {
            description: 'ステータスカードを引くたび、2枚カードを引く',
            effect: (s, t) => { s.addStatus('evolve', 2); }
        }
    }),
    DARK_EMBRACE: new Card({
        id: 'dark_embrace',
        name: '闇の抱擁',
        cost: 2,
        type: 'power',
        rarity: 'uncommon',
        description: 'カードが廃棄されるたび、1枚カードを引く',
        effect: (s, t) => {
            s.addStatus('dark_embrace', 1);
        },
        targetType: 'self',
        upgradeData: {
            cost: 1,
            description: 'カードが廃棄されるたび、1枚カードを引く',
            effect: (s, t) => { s.addStatus('dark_embrace', 1); }
        }
    }),
    JUGGERNAUT: new Card({
        id: 'juggernaut',
        name: 'ジャガーノート',
        cost: 2,
        type: 'power',
        rarity: 'rare',
        description: 'ブロックを獲得するたび、ランダムな敵に5ダメージを与える',
        effect: (s, t) => {
            s.addStatus('juggernaut', 5);
        },
        targetType: 'self',
        upgradeData: {
            description: 'ブロックを獲得するたび、ランダムな敵に7ダメージを与える',
            effect: (s, t) => { s.addStatus('juggernaut', 7); }
        }
    }),
    BARRICADE: new Card({
        id: 'barricade',
        name: 'バリケード',
        cost: 3,
        type: 'power',
        rarity: 'rare',
        description: 'ターン開始時にブロックが失われなくなる',
        effect: (s, t) => {
            s.addStatus('barricade', 1);
        },
        targetType: 'self',
        upgradeData: {
            cost: 2,
            description: 'ターン開始時にブロックが失われなくなる',
            effect: (s, t) => { s.addStatus('barricade', 1); }
        }
    }),
    CORRUPTION: new Card({
        id: 'corruption',
        name: '堕落',
        cost: 3,
        type: 'power',
        rarity: 'rare',
        description: 'スキルカードのコストを0にする。スキルを使用するたび、廃棄する。',
        effect: (s, t) => {
            s.addStatus('corruption', 1);
        },
        targetType: 'self',
        upgradeData: {
            cost: 2,
            description: 'スキルカードのコストを0にする。スキルを使用するたび、廃棄する。',
            effect: (s, t) => { s.addStatus('corruption', 1); }
        }
    }),
    BRUTALITY: new Card({
        id: 'brutality',
        name: '残虐',
        cost: 0,
        type: 'power',
        rarity: 'rare',
        description: 'ターン開始時、1HPを失いカードを1枚引く',
        effect: (s, t) => {
            s.addStatus('brutality', 1);
        },
        targetType: 'self',
        upgradeData: {
            isInnate: true,
            description: '天賦。ターン開始時、1HPを失いカードを1枚引く',
            effect: (s, t) => { s.addStatus('brutality', 1); }
        }
    }),
    BERSERK: new Card({
        id: 'berserk',
        name: '狂戦士',
        cost: 0,
        type: 'power',
        rarity: 'rare',
        description: '自身に脆弱を2付与する。ターン開始時、エナジーを1得る',
        effect: (s, t) => {
            s.addStatus('vulnerable', 2);
            s.addStatus('berserk', 1);
        },
        targetType: 'self',
        upgradeData: {
            description: '自身に脆弱を1付与する。ターン開始時、エナジーを1得る',
            effect: (s, t) => {
                s.addStatus('vulnerable', 1);
                s.addStatus('berserk', 1);
            }
        }
    }),
    DEMON_FORM: new Card({
        id: 'demon_form',
        name: '悪魔化',
        cost: 3,
        type: 'power',
        rarity: 'rare',
        description: 'ターン開始時に筋力を2得る',
        effect: (s, t) => {
            s.addStatus('demon_form', 1); // 1スタック = 2筋力/ターンとする既存ロジック用
        },
        targetType: 'self',
        upgradeData: {
            description: 'ターン開始時に筋力を3得る',
            effect: (s, t) => { s.addStatus('demon_form_plus', 1); } // 強化版用フラグ
        }
    }),
};
