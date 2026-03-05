import { IEntity, IBattleEngine } from './types';

export type CardEffect = (source: IEntity, target: IEntity | null, engine: IBattleEngine, card: Card, xValue: number) => Promise<void> | void;
export type CardCalculator = (source: IEntity, engine: IBattleEngine, card?: Card) => number;
export type CanPlayCheck = (source: IEntity, engine: IBattleEngine) => boolean;

export interface CardInitParams {
    id: string;
    name: string;
    cost: number | string;
    type: string;
    rarity: string;
    description: string;
    effect?: CardEffect;
    targetType?: string;
    isUpgraded?: boolean;
    upgradeData?: any;
    canPlayCheck?: CanPlayCheck;
    baseDamage?: number;
    damageCalculator?: CardCalculator;
    baseBlock?: number;
    blockCalculator?: CardCalculator;
    isEthereal?: boolean;
    isExhaust?: boolean;
    costCalculator?: any;
    image?: string | null;
    effectType?: string;
    onExhaust?: (source: IEntity, engine: IBattleEngine) => void;
    isInnate?: boolean;
    isStatus?: boolean;
    onEndTurnInHand?: (source: IEntity, engine: IBattleEngine) => Promise<void> | void; // ターン終了時に手札にある場合の効果
    bottledId?: string;
    cardClass?: string; // ironclad, colorless, curse, status
}

export class Card {
    id: string;
    baseName: string;
    name: string;
    cost: number | string;
    costCalculator: any;
    type: string;
    rarity: string;
    description: string;
    effect: CardEffect;
    isUpgraded: boolean;
    upgradeData: any;
    targetType: string;
    canPlayCheck: CanPlayCheck | null;
    baseDamage: number;
    damageCalculator: CardCalculator | null;
    baseBlock: number;
    blockCalculator: CardCalculator | null;
    isEthereal: boolean;
    isExhaust: boolean;
    miscValue: number;
    image: string | null;
    effectType: string;
    onExhaust: ((source: IEntity, engine: IBattleEngine) => void) | null;
    onEndTurnInHand: ((source: IEntity, engine: IBattleEngine) => Promise<void> | void) | null;
    temporaryCost: number | null;
    isStatus: boolean;
    isInnate: boolean;
    bottledId?: string;
    cardClass: string;

    constructor(params: CardInitParams) {
        this.id = params.id;
        this.baseName = params.name;
        this.name = params.name + (params.isUpgraded ? '+' : '');
        this.cost = params.cost;
        this.costCalculator = params.costCalculator;
        this.type = params.type;
        this.rarity = params.rarity;
        this.description = params.description;
        this.effect = params.effect || (async () => { });
        this.isUpgraded = params.isUpgraded || false;
        this.upgradeData = params.upgradeData || null;

        if (params.targetType) {
            this.targetType = params.targetType;
        } else {
            this.targetType = (params.type === 'attack') ? 'single' : 'self';
        }
        this.canPlayCheck = params.canPlayCheck || null;
        this.baseDamage = params.baseDamage || 0;
        this.damageCalculator = params.damageCalculator || null;
        this.baseBlock = params.baseBlock || 0;
        this.blockCalculator = params.blockCalculator || null;
        this.isEthereal = params.isEthereal || false;
        this.isExhaust = params.isExhaust || false;
        this.miscValue = 0;
        this.image = params.image || null;
        this.effectType = params.effectType || 'slash';
        this.onExhaust = params.onExhaust || null;
        this.onEndTurnInHand = params.onEndTurnInHand || null;
        this.temporaryCost = null;
        this.isStatus = params.isStatus || false;
        this.isInnate = params.isInnate || false;
        this.bottledId = params.bottledId;
        this.cardClass = params.cardClass || (params.type === 'curse' ? 'curse' : (params.isStatus ? 'status' : 'ironclad'));
    }

    getCost(source: any) {
        // 堕落 (Corruption) の処理: スキルカードのコストを0にする
        if (source && source.hasStatus && source.hasStatus('corruption') && this.type === 'skill') {
            return 0;
        }

        // temporaryCost が設定されている場合は優先
        if (this.temporaryCost !== null && this.temporaryCost !== undefined) {
            return this.temporaryCost;
        }
        if (this.costCalculator) {
            return this.costCalculator(source, this);
        }
        return this.cost;
    }

    getDamage(source: IEntity, engine: IBattleEngine) {
        let base = this.baseDamage;
        if (this.damageCalculator) {
            base = this.damageCalculator(source, engine, this);
        }
        base += (this.miscValue || 0);

        if (base === 0 && this.type !== 'attack') return 0;
        return (source as any).calculateDamage(base);
    }

    getFinalDamage(source: IEntity, target: IEntity | null, engine: IBattleEngine) {
        const damage = this.getDamage(source, engine);
        if (target) {
            return (target as any).applyTargetModifiers(damage, source);
        }
        return damage;
    }

    getBlock(source: IEntity, engine: IBattleEngine) {
        let base = this.baseBlock;
        if (this.blockCalculator) {
            base = this.blockCalculator(source, engine);
        }
        if (base === 0) return 0;
        return (source as any).calculateBlock(base);
    }

    canPlay(source: IEntity, engine: IBattleEngine) {
        if (this.canPlayCheck) {
            return this.canPlayCheck(source, engine);
        }
        return true;
    }

    upgrade() {
        if (this.isUpgraded || !this.upgradeData) return;

        this.isUpgraded = true;
        this.name = this.baseName + '+';

        if (this.upgradeData.cost !== undefined) this.cost = this.upgradeData.cost;
        if (this.upgradeData.costCalculator) this.costCalculator = this.upgradeData.costCalculator;
        if (this.upgradeData.description) this.description = this.upgradeData.description;
        if (this.upgradeData.effect) this.effect = this.upgradeData.effect;
        if (this.upgradeData.name) this.name = this.upgradeData.name;
        if (this.upgradeData.baseDamage !== undefined) this.baseDamage = this.upgradeData.baseDamage;
        if (this.upgradeData.damageCalculator) this.damageCalculator = this.upgradeData.damageCalculator;
        if (this.upgradeData.baseBlock !== undefined) this.baseBlock = this.upgradeData.baseBlock;
        if (this.upgradeData.blockCalculator) this.blockCalculator = this.upgradeData.blockCalculator;
        if (this.upgradeData.onExhaust) this.onExhaust = this.upgradeData.onExhaust;
        if (this.upgradeData.onEndTurnInHand) this.onEndTurnInHand = this.upgradeData.onEndTurnInHand;
    }

    async play(source: any, target: IEntity | null, engine: IBattleEngine, freePlay = false) {
        // 呪いチェック（ブルーキャンドル所持時は許可）
        if (this.type === 'curse') {
            const hasBlueCandle = source.relics && source.relics.some((r: any) => r.id === 'blue_candle');
            if (!hasBlueCandle) return false;
        }

        const currentCost = this.getCost(source);

        let xValue = 0;
        if (currentCost === 'X') {
            xValue = source.energy;
            // レリック: ケミカルX
            if (source.relics && source.relics.some((r: any) => r.id === 'chemical_x')) {
                xValue += 2;
                console.log('ケミカルX発動！ X = ' + xValue);
            }
            if (!freePlay) source.energy = 0;
        } else if (typeof currentCost === 'number' && currentCost >= 0) {
            if (freePlay) {
                xValue = currentCost;
            } else if (source.energy >= currentCost) {
                source.energy -= currentCost;
                xValue = currentCost;
            } else {
                return false;
            }
        } else if (typeof currentCost === 'number' && currentCost < 0) {
            // 医療キット所持時はステータスカードをコスト0でプレイ可能
            const hasMedicalKit = source.relics && source.relics.some((r: any) => r.id === 'medical_kit');
            // ブルーキャンドル所持時は呪いカードをコスト0でプレイ可能
            const hasBlueCandle = source.relics && source.relics.some((r: any) => r.id === 'blue_candle');
            if (this.isStatus && hasMedicalKit) {
                xValue = 0; // エネルギー不消費でプレイ
            } else if (this.type === 'curse' && hasBlueCandle) {
                xValue = 0; // エネルギー不消費でプレイ
            } else {
                // その他の使用不可カード
                return false;
            }
        } else {
            return false;
        }

        if (this.targetType === 'all' && engine) {
            // 生存している全ての敵に効果を適用
            for (const enemy of engine.enemies) {
                if (!enemy.isDead()) {
                    await this.effect(source, enemy, engine, this, xValue);
                }
            }
        } else {
            await this.effect(source, target, engine, this, xValue);
        }
        return true;
    }

    clone() {
        const c = new Card({
            id: this.id,
            name: this.baseName,
            cost: this.cost,
            type: this.type,
            rarity: this.rarity,
            description: this.description,
            effect: this.effect,
            targetType: this.targetType,
            isUpgraded: this.isUpgraded,
            upgradeData: this.upgradeData,
            canPlayCheck: this.canPlayCheck as CanPlayCheck,
            baseDamage: this.baseDamage,
            damageCalculator: this.damageCalculator as CardCalculator,
            baseBlock: this.baseBlock,
            blockCalculator: this.blockCalculator as CardCalculator,
            isEthereal: this.isEthereal,
            isExhaust: this.isExhaust,
            costCalculator: this.costCalculator,
            image: this.image,
            effectType: this.effectType,
            onExhaust: this.onExhaust as (source: IEntity, engine: IBattleEngine) => void,
            onEndTurnInHand: this.onEndTurnInHand as (source: IEntity, engine: IBattleEngine) => Promise<void> | void,
            isInnate: this.isInnate,
            isStatus: this.isStatus,
            bottledId: this.bottledId,
            cardClass: this.cardClass
        });
        c.miscValue = this.miscValue;
        return c;
    }
}

