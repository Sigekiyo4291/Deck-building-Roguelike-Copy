import { Relic } from '../relic-class';
import { RoomType } from '../map-data';
import { CardLibrary } from '../card';

export const ShopRelics = {
    THE_ABACUS: new class extends Relic {
        constructor() { super('the_abacus', 'そろばん', 'デッキをシャッフルするたび、6ブロックを得る。', 'shop'); }
        onShuffle(owner) {
            owner.addBlock(6);
            console.log('そろばん発動！ 6ブロック獲得。');
        }
    },
    ORANGE_PELLETS: new class extends Relic {
        constructor() { super('orange_pellets', 'オレンジ色の丸薬', '同じターン内で「パワー」「アタック」「スキル」を1枚ずつプレイした時、自分にかかっているすべてのデバフを取り除く。', 'shop'); }
        // 判定はBattleEngine側で行う
        clearDebuffs(owner) {
            if (owner.clearDebuffs) {
                owner.clearDebuffs();
            }
        }
    },
    CHEMICAL_X: new class extends Relic {
        constructor() { super('chemical_x', 'ケミカルX', '消費エナジーがXのカードをプレイしたとき、その効果はX+2。', 'shop'); }
        // 判定はCard.play側で行う
    },
    DOLLYS_MIRROR: new class extends Relic {
        constructor() { super('dollys_mirror', 'ドリーの鏡', '獲得時、あなたのデッキのカード1枚を複製する。', 'shop'); }
        onObtain(owner, game) {
            if (game && game.showCardSelectionFromPile) {
                game.showCardSelectionFromPile('ドリーの鏡: 複製するカードを選択', owner.masterDeck, (selectedCard) => {
                    if (selectedCard) {
                        owner.addCard(selectedCard.clone());
                        console.log(`ドリーの鏡により ${selectedCard.name} を複製しました。`);
                    }
                });
            }
        }
    },
    HAND_DRILL: new class extends Relic {
        constructor() { super('hand_drill', 'ハンドドリル', '敵のブロックを破るたび、弱体化2を与える。', 'shop'); }
        onBlockBroken(owner, target, engine) {
            if (target && !target.isDead()) {
                target.addStatus('vulnerable', 2);
                console.log(`ハンドドリル発動！ ${target.name} に脆弱2を付与。`);
            }
        }
    },
    BRIMSTONE: new class extends Relic {
        constructor() { super('brimstone', 'ブリムストーン', 'ターン開始時、自分は筋力2を得て、すべての敵は筋力1を得る。アイアンクラッド専用', 'shop', 'ironclad'); }
        onPlayerTurnStart(owner, engine) {
            owner.addStatus('strength', 2);
            engine.enemies.forEach(e => { if (!e.isDead()) e.addStatus('strength', 1); });
            console.log('ブリムストーン発動！');
        }
    },
    PRISMATIC_SHARD: new class extends Relic {
        constructor() { super('prismatic_shard', 'プリズムの破片', '戦闘後の報酬に、無色と他の色のカードが提示されるようになる。', 'shop'); }
        // 判定はmain.ts側で行う
    },
    LEES_WAFFLE: new class extends Relic {
        constructor() { super('lees_waffle', 'リーのワッフル', '最大HP+7。HP全回復。', 'shop'); }
        onObtain(owner) {
            owner.increaseMaxHp ? owner.increaseMaxHp(7) : (owner.maxHp += 7);
            owner.heal(owner.maxHp);
            console.log('リーのワッフル発動！ 最大HPが上昇し、全快しました。');
        }
    },
    MEMBERSHIP_CARD: new class extends Relic {
        constructor() { super('membership_card', '会員カード', '全商品50％割引！', 'shop'); }
        // 判定はmain.ts側で行う
    },
    FROZEN_EYE: new class extends Relic {
        constructor() { super('frozen_eye', '凍った目', '山札を見た時、カードの並び順通りに表示される。', 'shop'); }
        // 判定はmain.ts側で行う
    },
    SLING_OF_COURAGE: new class extends Relic {
        constructor() { super('sling_of_courage', '勇気のスリング', 'エリートとの戦闘開始時、筋力2を得る。', 'shop'); }
        onBattleStart(owner, engine) {
            if (engine.isEliteBattle) {
                owner.addStatus('strength', 2);
                console.log('勇気のスリング発動！ 筋力2獲得。');
            }
        }
    },
    MEDICAL_KIT: new class extends Relic {
        constructor() { super('medical_kit', '医療キット', '使用不可の「状態異常」がプレイできるようになる。「状態異常」はプレイすると廃棄する。', 'shop'); }
        // 判定はBattleEngine側で行う
    },
    CAULDRON: new class extends Relic {
        constructor() { super('cauldron', '大釜', '獲得時にポーションx5を調合する。', 'shop'); }
        onObtain(owner, game) {
            if (game && game.gainRandomPotion) {
                for (let i = 0; i < 5; i++) {
                    game.gainRandomPotion();
                }
                console.log('大釜発動！ ポーションを5個生成しました。');
            }
        }
    },
    ORRERY: new class extends Relic {
        constructor() { super('orrery', '太陽系儀', 'カードを5枚選んでデッキに追加する。', 'shop'); }
        onObtain(owner, game) {
            if (game && game.showCardSelection) {
                game.pendingOrreryCards = 4; // 最初の一枚を含めて合計5枚
                game.showCardSelection({ isRare: false, taken: false }, null);
                console.log('太陽系儀発動！ カードを5回選択してください。');
            }
        }
    },
    STRANGE_SPOON: new class extends Relic {
        constructor() { super('strange_spoon', '奇妙なスプーン', 'カードを廃棄した時、50％の確率で廃棄ではなく捨て札にする。', 'shop'); }
        // 判定はEntity.exhaustCard側で行う
    },
    CLOCKWORK_SOUVENIR: new class extends Relic {
        constructor() { super('clockwork_souvenir', '時計仕掛けの記念品', '戦闘開始時、アーティファクト1を得る。', 'shop'); }
        onBattleStart(owner) {
            owner.addStatus('artifact', 1);
            console.log('時計仕掛けの記念品発動！ アーティファクト1獲得。');
        }
    },
    TOOLBOX: new class extends Relic {
        constructor() { super('toolbox', '道具箱', '戦闘開始時、3枚のランダムなランダムな無色のカードから1枚選び、手札に加える。', 'shop'); }
        onBattleStart(owner, engine) {
            if (engine && engine.onCardSelectionRequest) {
                const colorlessCards = Object.values(CardLibrary).filter(c => c.cardClass === 'colorless');
                const candidates = [];
                for (let i = 0; i < 3; i++) {
                    if (colorlessCards.length > 0) {
                        candidates.push(colorlessCards[Math.floor(Math.random() * colorlessCards.length)].clone());
                    }
                }
                if (candidates.length > 0) {
                    engine.onCardSelectionRequest('道具箱: 手札に加えるカードを選択', candidates, (card) => {
                        if (card) {
                            card.cost = 0; // StSでは戦闘中のみ0コストで手札に加わる
                            engine.addCardToHand(card);
                            console.log(`道具箱により ${card.name} を手札に加えました。`);
                        }
                    });
                }
            }
        }
    }
};
