import { Card } from '../../card-class';

export const eventCards = {
    BITE: new Card({
        id: 'bite',
        name: '噛みつき',
        cost: 1,
        type: 'attack',
        rarity: 'special',
        cardClass: 'event',
        description: '7ダメージ。HPを2回復する。',
        baseDamage: 7,
        effect: async (s, t, e) => {
            const damage = await e.attackWithEffect(s, t, 7);
            s.heal(2);
        },
        upgradeData: {
            baseDamage: 8,
            description: '8ダメージ。HPを3回復する。',
            effect: async (s, t, e) => {
                const damage = await e.attackWithEffect(s, t, 8);
                s.heal(3);
            }
        }
    }),
    APPARITION: new Card({
        id: 'apparition',
        name: '幻姿',
        cost: 1,
        type: 'skill',
        rarity: 'special',
        cardClass: 'event',
        description: '無形1を得る。エセリアル。廃棄。',
        isEthereal: true,
        isExhaust: true,
        effect: async (s, t, e) => {
            s.addStatus('intangible', 1);
        },
        upgradeData: {
            cost: 1,
            description: '無形1を得る。廃棄。',
            isEthereal: false,
        }
    }),
    JAX: new Card({
        id: 'jax',
        name: 'J.A.X.',
        cost: 0,
        type: 'skill',
        rarity: 'special',
        cardClass: 'event',
        description: '筋力2を得る。3ダメージを受ける。',
        effect: async (s, t, e) => {
            s.addStatus('strength', 2);
            s.takeDamage(3, s);
        },
        upgradeData: {
            description: '筋力3を得る。3ダメージを受ける。',
            effect: async (s, t, e) => {
                s.addStatus('strength', 3);
                s.takeDamage(3, s);
            }
        }
    }),
    RITUAL_DAGGER: new Card({
        id: 'ritual_dagger',
        name: '儀式の短剣',
        cost: 1,
        type: 'attack',
        rarity: 'special',
        cardClass: 'event',
        description: '15ダメージ。このカードでトドメを刺すと、永続的にダメージが3増加する。廃棄。',
        baseDamage: 15,
        isExhaust: true,
        effect: async (s, t, e, card) => {
            const damage = await e.getFinalDamage(s, t, e);
            const isFatal = t.hp <= damage;
            await e.attackWithEffect(s, t, 15);
            if (isFatal) {
                // 永続的な強化
                card.miscValue += 3;
                // マスターデッキ内の同名カードも探して強化（StSの仕様に近い）
                const masterCard = s.masterDeck.find(c => c.id === card.id);
                if (masterCard) {
                    masterCard.miscValue += 3;
                    masterCard.description = masterCard.description.replace(/\d+ダメージ/, `${15 + masterCard.miscValue}ダメージ`);
                }
                card.description = card.description.replace(/\d+ダメージ/, `${15 + card.miscValue}ダメージ`);
                console.log(`儀式の短剣強化！ 現在のボーナス: ${card.miscValue}`);
            }
        },
        upgradeData: {
            baseDamage: 15, // 基礎ダメージは変わらないが、増加量が5になる
            description: '15ダメージ。このカードでトドメを刺すと、永続的にダメージが5増加する。廃棄。',
            effect: async (s, t, e, card) => {
                const damage = await e.getFinalDamage(s, t, e);
                const isFatal = t.hp <= damage;
                await e.attackWithEffect(s, t, 15);
                if (isFatal) {
                    card.miscValue += 5;
                    const masterCard = s.masterDeck.find(c => c.id === card.id);
                    if (masterCard) {
                        masterCard.miscValue += 5;
                        masterCard.description = masterCard.description.replace(/\d+ダメージ/, `${15 + masterCard.miscValue}ダメージ`);
                    }
                    card.description = card.description.replace(/\d+ダメージ/, `${15 + card.miscValue}ダメージ`);
                }
            }
        }
    }),
    MADNESS: new Card({
        id: 'madness',
        name: '狂気',
        cost: 1,
        type: 'skill',
        rarity: 'special',
        cardClass: 'event',
        description: '手札のランダムなカード1枚のコストを、この戦闘の間0にする。廃棄。',
        isExhaust: true,
        effect: async (s, t, e) => {
            const hand = s.hand.filter(c => c.id !== 'madness');
            if (hand.length > 0) {
                const card = hand[Math.floor(Math.random() * hand.length)];
                card.cost = 0;
                console.log(`狂気発動！ ${card.name} のコストを0にしました。`);
            }
        },
        upgradeData: {
            cost: 0,
            description: '手札のランダムなカード1枚のコストを、この戦闘の間0にする。廃棄。',
        }
    })
};
