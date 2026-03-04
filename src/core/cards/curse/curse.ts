import { Card } from '../../card-class';

export const curseCards = {
    INJURY: new Card({
        id: 'injury',
        name: '怪我',
        cost: -1,
        type: 'curse',
        rarity: 'curse',
        description: '使用不可。',
        effect: (s, t) => {
            // 何もしない
        },
        targetType: 'self'
    }),
    DOUBT: new Card({
        id: 'doubt',
        name: '疑念',
        cost: -1,
        type: 'curse',
        rarity: 'curse',
        description: '使用不可。ターン終了時に脱力1を得る。',
        effect: (s, t) => {
            // 何もしない
        },
        onEndTurnInHand: async (s, e) => {
            console.log("疑念発動！脱力(1)を付与。");
            s.addStatus('weak', 1);
        },
        targetType: 'self'
    }),
    REGRET: new Card({
        id: 'regret',
        name: '後悔',
        cost: -1,
        type: 'curse',
        rarity: 'curse',
        description: '使用不可。ターン終了時に、手札のカード1枚につきHPが-1。',
        effect: (s, t) => {
            // 何もしない
        },
        onEndTurnInHand: async (s, e) => {
            const damage = s.hand.length;
            console.log(`後悔発動！手札枚数(${damage})に応じたHP減少。`);
            s.loseHP(damage);
        },
        targetType: 'self'
    }),
    PARASITE: new Card({
        id: 'parasite',
        name: '寄生',
        cost: -1,
        type: 'curse',
        rarity: 'curse',
        description: '使用不可。変化させたりデッキから削除すると最大HP-3',
        effect: (s, t) => {
            // 特殊処理: 削除不可
        },
        targetType: 'self'
    }),
    CURSE_OF_THE_BELL: new Card({
        id: 'curse_of_the_bell',
        name: '鐘の呪い',
        cost: -1,
        type: 'curse',
        rarity: 'curse',
        description: '使用できない。この呪いはデッキから削除できない。',
        effect: (s, t) => {
            // 使用不可
        },
        targetType: 'self'
    }),
    NECRONOMICURSE: new Card({
        id: 'necronomicurse',
        name: 'ネクロノミカーズ',
        cost: -1,
        type: 'curse',
        rarity: 'curse',
        description: '使用できない。この呪いは削除できず、廃棄されても手札に戻る。',
        effect: (s, t) => {
            // 使用不可
        },
        targetType: 'self'
    }),
    SHAME: new Card({
        id: 'shame',
        name: '羞恥',
        cost: -1,
        type: 'curse',
        rarity: 'curse',
        description: '使用不可。ターン終了時に脆弱1を得る。',
        effect: (s, t) => {
            // 使用不可
        },
        onEndTurnInHand: async (s, e) => {
            console.log("羞恥発動！脆弱(1)を付与。");
            s.addStatus('vulnerable', 1);
        },
        targetType: 'self'
    }),
    WRITHE: new Card({
        id: 'writhe',
        name: '苦悩',
        cost: -1,
        type: 'curse',
        rarity: 'curse',
        description: '天賦。使用不可。',
        isInnate: true,
        effect: (s, t) => {
            // 使用不可
        },
        targetType: 'self'
    }),
    DECAY: new Card({
        id: 'decay',
        name: '腐敗',
        cost: -1,
        type: 'curse',
        rarity: 'curse',
        description: '使用不可。ターン終了時にHPを2失う。',
        effect: (s, t) => {
            // 使用不可
        },
        onEndTurnInHand: async (s, e) => {
            console.log("腐敗発動！HPを2失う。");
            s.loseHP(2);
        },
        targetType: 'self'
    }),
    NORMALITY: new Card({
        id: 'normality',
        name: '凡庸',
        cost: -1,
        type: 'curse',
        rarity: 'curse',
        description: '使用不可。このカードが手札にある場合、1ターンにカードを3枚までしかプレイできない。',
        effect: (s, t) => {
            // 使用不可
        },
        targetType: 'self'
    }),
    PAIN: new Card({
        id: 'pain',
        name: '痛み',
        cost: -1,
        type: 'curse',
        rarity: 'curse',
        description: '使用不可。このカードが手札にある間、他のカードをプレイするたびにHPを1失う。',
        effect: (s, t) => {
            // 使用不可
        },
        targetType: 'self'
    }),
};
