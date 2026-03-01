import { Card } from '../../card-class';
import { CardLibrary } from '../../card';

export const statusCards = {
    WOUND: new Card({
        id: 'wound',
        name: '負傷',
        cost: -1,
        type: 'status',
        rarity: 'common',
        description: '使用できないカード。',
        isStatus: true,
        effect: (s, t) => {
            // 使用不可
        },
        targetType: 'self'
    }),
    DAZED: new Card({
        id: 'dazed',
        name: 'めまい',
        cost: -1,
        type: 'status',
        rarity: 'common',
        description: '使用できない。エセリアル。',
        isStatus: true,
        effect: (s, t) => {
            // 使用不可
        },
        targetType: 'self',
        isEthereal: true
    }),
    BURN: new Card({
        id: 'burn',
        name: '火傷',
        cost: -1,
        type: 'status',
        rarity: 'common',
        description: '使用できない。ターン終了時に手札にあると2ダメージ。',
        isStatus: true,
        effect: (s, t) => {
            // 使用不可
        },
        onEndTurnInHand: async (s, e) => {
            console.log("火傷発動！手札にあるため2ダメージ。");
            s.takeDamage(2, null);
        },
        targetType: 'self',
        upgradeData: {
            description: '使用できない。ターン終了時に手札にあると4ダメージ。',
            onEndTurnInHand: async (s, e) => {
                console.log("火傷+発動！手札にあるため4ダメージ。");
                s.takeDamage(4, null);
            }
        }
    }),
    SLIMED: new Card({
        id: 'slimed',
        name: '粘液',
        cost: 1,
        type: 'status',
        rarity: 'common',
        description: '使用すると廃棄される。',
        isStatus: true,
        isExhaust: true,
        effect: (s, t) => {
            // 使用すると廃棄される（Card.playの共通処理でexhaustされる）
        },
        targetType: 'self'
    }),
};
