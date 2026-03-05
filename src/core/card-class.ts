import { RoomType } from './map-data';
import { IEntity, IBattleEngine, ICard, IPlayer } from './types';

export type CardEffect = (source: IEntity, target: IEntity | null, engine: IBattleEngine, card: ICard, xValue: number) => Promise<void> | void;
export type CardCalculator = (source: IEntity, engine: IBattleEngine, card?: ICard) => number;
export type CanPlayCheck = (player: IPlayer, engine: IBattleEngine) => boolean;

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
    onExhaust?: (player: IPlayer, engine: IBattleEngine) => void;
    isInnate?: boolean;
    isStatus?: boolean;
    onEndTurnInHand?: (player: IPlayer, engine: IBattleEngine) => Promise<void> | void; // ターン終了時に手札にある場合の効果
    bottledId?: string;
    cardClass?: string; // ironclad, colorless, curse, status
}

export class Card implements ICard {
    id: string;
    baseName: string;
    name: string;
    cost: number | string;
    costCalculator?: (player: IPlayer, card: ICard) => number | string;
    type: string;
    rarity: string;
    description: string;
    effect: (source: IEntity, target: IEntity | null, engine: IBattleEngine, card: ICard, xValue: number) => Promise<void> | void;
    isUpgraded: boolean;
    upgradeData: any;
    targetType: string;
    canPlayCheck?: (player: IPlayer, engine: IBattleEngine) => boolean;
    baseDamage: number;
    damageCalculator?: CardCalculator;
    baseBlock: number;
    blockCalculator?: CardCalculator;
    isEthereal: boolean = false;
    isExhaust: boolean = false;
    miscValue: number = 0;
    image?: string;
    effectType?: string;
    onExhaust?: (player: IPlayer, engine: IBattleEngine) => void;
    onEndTurnInHand?: (player: IPlayer, engine: IBattleEngine) => Promise<void> | void;
    isInnate: boolean = false;
    isStatus: boolean = false;
    bottledId?: string;
    cardClass: string;
    temporaryCost?: number | string | null = null;

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
        this.canPlayCheck = params.canPlayCheck;
        this.baseDamage = params.baseDamage || 0;
        this.damageCalculator = params.damageCalculator;
        this.baseBlock = params.baseBlock || 0;
        this.blockCalculator = params.blockCalculator;
        this.isEthereal = params.isEthereal || false;
        this.isExhaust = params.isExhaust || false;
        this.miscValue = 0;
        this.image = params.image || undefined;
        this.effectType = params.effectType || 'slash';
        this.onExhaust = params.onExhaust;
        this.isInnate = params.isInnate || false;
        this.isStatus = params.isStatus || false;
        this.onEndTurnInHand = params.onEndTurnInHand;
        this.bottledId = params.bottledId;
        this.cardClass = params.cardClass || (params.type === 'curse' ? 'curse' : (params.isStatus ? 'status' : 'ironclad'));
    }

    getCost(player: IPlayer): number | string {
        // 堕落 (Corruption) の処理: スキルカードのコストを0にする
        if (player && player.hasStatus && player.hasStatus('corruption') && this.type === 'skill') {
            return 0;
        }

        if (typeof this.cost === 'string') return this.cost;
        if (this.temporaryCost !== null && this.temporaryCost !== undefined) return this.temporaryCost;

        let finalCost = this.cost;
        if (this.costCalculator) {
            finalCost = (this.costCalculator(player, this) as any);
        }
        return finalCost;
    }

    getDamage(source: IEntity, engine: IBattleEngine): number {
        let base = this.baseDamage;
        if (this.damageCalculator) {
            base = this.damageCalculator(source, engine, this);
        }
        base += (this.miscValue || 0);

        if (base === 0 && this.type !== 'attack') return 0;
        return source.calculateDamage ? source.calculateDamage(base) : base;
    }

    getFinalDamage(source: IEntity, target: IEntity | null, engine: IBattleEngine): number {
        const damage = this.getDamage(source, engine);
        if (target && target.applyTargetModifiers) {
            return target.applyTargetModifiers(damage, source);
        }
        return damage;
    }

    getBlock(source: IEntity, engine: IBattleEngine): number {
        let base = this.baseBlock;
        if (this.blockCalculator) {
            base = this.blockCalculator(source, engine, this);
        }
        if (base === 0) return 0;
        // EntityにcalculateBlockがない場合はそのまま返す（必要ならtypes.tsでIEntityに追加）
        return (source as any).calculateBlock ? (source as any).calculateBlock(base) : base;
    }

    canPlay(player: IPlayer, engine: IBattleEngine): boolean {
        if (this.canPlayCheck) {
            return this.canPlayCheck(player, engine);
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

    async play(player: IPlayer, target: IEntity | null, engine: IBattleEngine, isCopy: boolean = false): Promise<boolean> {
        // 呪いチェック（ブルーキャンドル所持時は許可）
        if (this.type === 'curse') {
            const hasBlueCandle = player.relics && player.relics.some((r: any) => r.id === 'blue_candle');
            if (!hasBlueCandle) return false;
        }

        const currentCost = this.getCost(player);
        let xValue = 0;

        if (currentCost === 'X') {
            xValue = player.energy;
            // レリック: ケミカルX
            if (player.relics && player.relics.some((r: any) => r.id === 'chemical_x')) {
                xValue += 2;
                console.log('ケミカルX発動！ X = ' + xValue);
            }
            if (!isCopy) player.energy = 0;
        } else if (typeof currentCost === 'number' && currentCost >= 0) {
            if (isCopy) {
                xValue = currentCost;
            } else if (player.energy >= currentCost) {
                player.energy -= currentCost;
                xValue = currentCost;
            } else {
                return false;
            }
        } else if (typeof currentCost === 'number' && currentCost < 0) {
            // 医療キット所持時はステータスカードをコスト0でプレイ可能
            const hasMedicalKit = player.relics && player.relics.some((r: any) => r.id === 'medical_kit');
            // ブルーキャンドル所持時は呪いカードをコスト0でプレイ可能
            const hasBlueCandle = player.relics && player.relics.some((r: any) => r.id === 'blue_candle');
            if (this.isStatus && hasMedicalKit) {
                xValue = 0;
            } else if (this.type === 'curse' && hasBlueCandle) {
                xValue = 0;
            } else {
                return false;
            }
        } else {
            return false;
        }

        if (this.targetType === 'all' && engine) {
            for (const enemy of engine.enemies) {
                if (!enemy.isDead()) {
                    await this.effect(player, enemy, engine, this, xValue);
                }
            }
        } else {
            await this.effect(player, target, engine, this, xValue);
        }
        return true;
    }

    clone(): ICard {
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
            canPlayCheck: this.canPlayCheck,
            baseDamage: this.baseDamage,
            damageCalculator: this.damageCalculator,
            baseBlock: this.baseBlock,
            blockCalculator: this.blockCalculator,
            isEthereal: this.isEthereal,
            isExhaust: this.isExhaust,
            costCalculator: this.costCalculator,
            image: this.image,
            effectType: this.effectType,
            onExhaust: this.onExhaust,
            onEndTurnInHand: this.onEndTurnInHand,
            isInnate: this.isInnate,
            isStatus: this.isStatus,
            bottledId: this.bottledId,
            cardClass: this.cardClass
        });
        c.miscValue = this.miscValue;
        c.temporaryCost = this.temporaryCost;
        return c;
    }
}

