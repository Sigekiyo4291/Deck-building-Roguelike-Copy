import { Card } from '../../card-class';

export const starterCards = {
    STRIKE: new Card({
        id: 'strike',
        name: 'ストライク',
        cost: 1,
        type: 'attack',
        rarity: 'basic',
        description: '6ダメージを与える',
        effect: async (s, t, e) => {
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(6));
            } else {
                t.takeDamage(s.calculateDamage(6), s);
            }
        },
        targetType: 'single',
        upgradeData: {
            description: '9ダメージを与える',
            baseDamage: 9,
            effect: async (s, t, e) => {
                if (e && e.dealDamageWithEffect) {
                    await e.dealDamageWithEffect(s, t, s.calculateDamage(9));
                } else {
                    t.takeDamage(s.calculateDamage(9), s);
                }
            }
        },
        baseDamage: 6,
        image: 'assets/images/cards/Strike.png'
    }),
    DEFEND: new Card({
        id: 'defend',
        name: 'ディフェンド',
        cost: 1,
        type: 'skill',
        rarity: 'basic',
        description: '5ブロックを得る',
        effect: (s, t) => {
            s.addBlock(5);
        },
        targetType: 'self',
        upgradeData: {
            description: '8ブロックを得る',
            baseBlock: 8,
            effect: (s, t) => { s.addBlock(8); }
        },
        baseBlock: 5,
        image: 'assets/images/cards/Defend.png'
    }),
    BASH: new Card({
        id: 'bash',
        name: '強打',
        cost: 2,
        type: 'attack',
        rarity: 'basic',
        description: '8ダメージを与え、脆弱(2)を付与',
        effect: async (s, t, e) => {
            if (e && e.dealDamageWithEffect) {
                await e.dealDamageWithEffect(s, t, s.calculateDamage(8));
            } else {
                t.takeDamage(s.calculateDamage(8), s);
            }
            t.addStatus('vulnerable', 2, s);
        },
        targetType: 'single',
        upgradeData: {
            description: '10ダメージを与え、脆弱(3)を付与',
            baseDamage: 10,
            effect: async (s, t, e) => {
                if (e && e.dealDamageWithEffect) {
                    await e.dealDamageWithEffect(s, t, s.calculateDamage(10));
                } else {
                    t.takeDamage(s.calculateDamage(10), s);
                }
                t.addStatus('vulnerable', 3, s);
            }
        },
        baseDamage: 8,
        image: 'assets/images/cards/Bash.png'
    })
};
