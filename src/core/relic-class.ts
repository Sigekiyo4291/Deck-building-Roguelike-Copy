import { RoomType } from './map-data';

export class Relic {
    id: string;
    name: string;
    description: string;
    rarity: string;
    character?: string; // 特定キャラ専用レリック用（例：'ironclad'）

    constructor(id: any, name: any, description: any, rarity: any, character?: any) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.rarity = rarity; // 'starter', 'common', 'uncommon', 'rare', 'boss'
        this.character = character;
    }

    // フックメソッド（デフォルトは何もしない）
    onObtain(owner: any, game?: any) { }
    onBattleStart(owner: any, engine: any) { }
    onTurnStart(owner: any, engine: any) { }
    onPlayerTurnStart(owner: any, engine: any) { }
    onTurnEnd(owner: any, engine: any) { }
    onVictory(owner: any, engine: any) { }
    onCardPlay(owner: any, engine: any, card: any) { }
    afterCardPlay(owner: any, engine: any, card: any) { }
    onTakeDamage(owner: any, engine: any, amount: any) { }
    onHPRecovery(owner: any, engine: any, amount: any) { }
    onShuffle(owner: any, engine: any) { }
    onCardDraw(owner: any, engine: any, card: any) { }
    onCardExhaust(owner: any, engine: any, card: any) { }
    onCardAdd(owner: any, card: any) { }
    onPotionUse(owner: any, potion: any) { }
    onRoomEnter(owner: any, roomType: RoomType) { }
    onRoomRest(owner: any) { }
    modifyDamageDealt(owner: any, target: any, damage: any, card?: any) { return damage; }
    modifyBlockGained(owner: any, block: any, card?: any) { return block; }
    modifyHealAmount(owner: any, amount: any) { return amount; } // 回復量補正用
    onGoldSpend(owner: any, amount: any) { }
    onApplyStatus(owner: any, target: any, type: any, value: any, engine: any) { } // ステータス付与時のフック
    onBlockBroken(owner: any, target: any, engine: any) { } // 敵のブロックを破った時のフック

    // UI描写用：レリックが使用済み（効果を失った状態）かどうかを判定する
    isUsedUp(owner: any) { return false; }
}
