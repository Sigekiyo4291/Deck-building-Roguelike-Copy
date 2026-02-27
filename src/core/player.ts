import { CardLibrary } from './card';
import { RelicLibrary } from './relic';
import { Entity } from './entity';

/**
 * プレイヤークラス
 * entity.ts から分離
 */
export class Player extends Entity {
    energy: number;
    maxEnergy: number;
    hpLossCount: number;
    deck: any[];
    hand: any[];
    discard: any[];
    exhaust: any[];
    gold: number;
    potionSlots: number;
    potions: any[];
    masterDeck: any[];
    cardRemovalCount: number;
    isRemovalUsedThisShop: boolean;

    constructor() {
        super('Vanguard', 80, 'assets/player.png');
        this.energy = 3;
        this.maxEnergy = 3;
        this.hpLossCount = 0; // 今戦闘中にHPを失った回数
        this.deck = [];
        this.hand = [];
        this.discard = [];
        this.exhaust = [];
        this.gold = 100;
        this.potionSlots = 3;
        this.potions = new Array(3).fill(null); // 所持枠をnullで初期化
        this.relics = []; // レリック所持リスト
        this.relicCounters = {}; // レリックの汎用カウンター保管用
        this.cardRemovalCount = 0;
        this.isRemovalUsedThisShop = false;

        // マスターデッキ（所持カード）の初期化
        this.masterDeck = [];
        for (let i = 0; i < 5; i++) this.masterDeck.push(CardLibrary.STRIKE.clone());
        for (let i = 0; i < 4; i++) this.masterDeck.push(CardLibrary.DEFEND.clone());
        this.masterDeck.push(CardLibrary.BASH.clone());

        // 初期レリック
        this.relics.push(RelicLibrary.BURNING_BLOOD);
    }

    heal(amount) {
        const prevHp = this.hp;
        super.heal(amount);
        const actualHeal = this.hp - prevHp;
        if (actualHeal > 0 && this.relics) {
            this.relics.forEach(relic => {
                if (relic.onHPRecovery) relic.onHPRecovery(this, null, actualHeal);
            });
        }
    }

    takeDamage(amount, source, engine?) {
        const prevHp = this.hp;
        const remainingDamage = super.takeDamage(amount, source, engine);
        if (this.hp < prevHp && this.relics) {
            const lostHp = prevHp - this.hp;
            this.relics.forEach(relic => {
                if (relic.onTakeDamage) relic.onTakeDamage(this, engine, lostHp);
            });
        }
        return remainingDamage;
    }

    loseHP(amount) {
        const prevHp = this.hp;
        const lostAmount = super.loseHP(amount);
        if (this.hp < prevHp && this.relics) {
            const lostHp = prevHp - this.hp;
            this.relics.forEach(relic => {
                if (relic.onTakeDamage) relic.onTakeDamage(this, null, lostHp); // ダメージフックとして処理
            });
        }
        return lostAmount;
    }

    // Helper to add card to discard pile (needed for Strange Spoon)
    addCardToDiscard(card) {
        this.discard.push(card);
    }

    exhaustCard(card, engine) {
        // 奇妙なスプーン (Strange Spoon) の処理
        if (this.relics.some(r => r.id === 'strange_spoon') && Math.random() < 0.5) {
            console.log('奇妙なスプーン発動！ 廃棄せずに捨て札にします。');
            this.addCardToDiscard(card);
            if (card.onExhaust && engine) {
                card.onExhaust(this, engine);
            }
            return;
        }

        this.exhaust.push(card);
        console.log(`${card.name} が廃棄されました。`);
        // レリック: onCardExhaust
        if (this.relics) {
            this.relics.forEach(relic => {
                if (relic.onCardExhaust) relic.onCardExhaust(this, engine, card);
            });
        }

        // 無痛 (Feel No Pain) の処理
        const fnpBlock = this.getStatusValue('feel_no_pain');
        if (fnpBlock > 0) {
            console.log(`無痛発動！ ${card.name} が廃棄されたため ${fnpBlock} ブロック獲得。`);
            this.addBlock(fnpBlock);
            if (engine && engine.showEffectForPlayer) {
                engine.showEffectForPlayer('block');
            }
        }

        // 闇の抱擁 (Dark Embrace) の処理
        const deCount = this.getStatusValue('dark_embrace');
        if (deCount > 0 && engine) {
            console.log(`闇の抱擁発動！ ${card.name} が廃棄されたため ${deCount} 枚ドロー。`);
            engine.drawCards(deCount);
        }

        if (card.onExhaust && engine) {
            card.onExhaust(this, engine);
        }

        // 特殊カード: ネクロノミカーズ (NECRONOMICURSE) - 廃棄されても手札に戻る
        if (card.id === 'necronomicurse' && engine) {
            console.log('ネクロノミカーズの呪い！ 廃棄されても手札に戻ります。');
            // 廃棄パイルから削除して手札へ
            this.exhaust = this.exhaust.filter(c => c !== card);
            engine.addCardToHand(card);
        }
    }

    addCard(card) {
        // お守り (Omamori) の処理
        if (card.type === 'curse' && this.relics.some(r => r.id === 'omamori')) {
            const count = this.relicCounters['omamori'] || 0;
            if (count > 0) {
                this.relicCounters['omamori']--;
                console.log(`お守り発動！ 呪い ${card.name} を無効化しました。残り回数: ${this.relicCounters['omamori']}`);
                return false;
            }
        }

        this.masterDeck.push(card);
        if (this.relics) {
            this.relics.forEach(relic => {
                if (relic.onCardAdd) relic.onCardAdd(this, card);
            });
        }
        return true;
    }

    gainGold(amount) {
        if (this.relics.some(r => r.id === 'ectoplasm')) {
            console.log('エクトプラズムによりゴールドを獲得できません。');
            return;
        }
        // 偶像系レリックの補正を計算
        let finalAmount = amount;
        if (this.relics.some(r => r.id === 'golden_idol_relic')) {
            finalAmount = Math.floor(finalAmount * 1.25);
        }

        this.gold += finalAmount;
        alert(`${finalAmount} ゴールドを獲得しました！ (所持金: ${this.gold}G)`);

        // 血塗られた偶像 (Bloody Idol): ゴールド獲得時にHP5回復
        if (this.relics.some(r => r.id === 'bloody_idol')) {
            this.heal(5);
        }
    }

    spendGold(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            if (this.relics) {
                this.relics.forEach(relic => {
                    if (relic.onGoldSpend) relic.onGoldSpend(this, amount);
                });
            }
            return true;
        }
        return false;
    }

    resetEnergy() {
        this.energy = this.maxEnergy;
    }

    // ポーション獲得可能か判定（ししおどしチェック）
    canObtainPotion(): boolean {
        return !this.relics.some(r => r.id === 'sozu');
    }

    // 空きポーションスロットのインデックスを取得
    getEmptyPotionSlot(): number {
        return this.potions.indexOf(null);
    }

    // ポーションを獲得する（共通処理）
    obtainPotion(potion: any): { success: boolean, reason: 'sozu' | 'full' | 'success' } {
        if (!this.canObtainPotion()) {
            console.log('ししおどしによりポーションを獲得できません。');
            return { success: false, reason: 'sozu' };
        }

        const emptyIndex = this.getEmptyPotionSlot();
        if (emptyIndex !== -1) {
            this.potions[emptyIndex] = potion;
            return { success: true, reason: 'success' };
        }

        return { success: false, reason: 'full' };
    }
}
