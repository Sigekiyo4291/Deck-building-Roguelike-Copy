export type PotionRarity = 'common' | 'uncommon' | 'rare';
export type PotionTargetType = 'none' | 'single' | 'all';

export class Potion {
    id: string;
    name: string;
    description: string;
    rarity: PotionRarity;
    targetType: PotionTargetType;
    isCombatOnly: boolean;

    constructor(id: string, name: string, description: string, rarity: PotionRarity, targetType: PotionTargetType = 'none', isCombatOnly: boolean = true) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.rarity = rarity;
        this.targetType = targetType;
        this.isCombatOnly = isCombatOnly;
    }

    /**
     * ポーションの効果倍率を取得する（聖樹皮用）
     */
    getMultiplier(player: any): number {
        const hasSacredBark = player.relics.some((r: any) => r.id === 'sacred_bark');
        return hasSacredBark ? 2 : 1;
    }

    /**
     * ポーションを使用する際の実装
     * @param player プレイヤー
     * @param target ターゲット（敵またはnull）
     * @param engine バトルエンジン（非戦闘時はnullの場合がある）
     */
    onUse(player: any, target: any, engine: any): Promise<void> | void {
        // 各ポーションでオーバーライド
    }

    /**
     * ポーションを複製する
     */
    clone(): Potion {
        return new (this.constructor as any)();
    }
}
