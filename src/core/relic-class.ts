import { RoomType } from './map-data';

export class Relic {
    id: string;
    name: string;
    description: string;
    rarity: string;
    character?: string; // 特定キャラ専用レリック用（例：'ironclad'）

    constructor(id, name, description, rarity, character?) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.rarity = rarity; // 'starter', 'common', 'uncommon', 'rare', 'boss'
        this.character = character;
    }

    // フックメソッド（デフォルトは何もしない）
    onObtain(owner, game?: any) { }
    onBattleStart(owner, engine) { }
    onTurnStart(owner, engine) { }
    onPlayerTurnStart(owner, engine) { }
    onTurnEnd(owner, engine) { }
    onVictory(owner, engine) { }
    onCardPlay(owner, engine, card) { }
    afterCardPlay(owner, engine, card) { }
    onTakeDamage(owner, engine, amount) { }
    onHPRecovery(owner, engine, amount) { }
    onShuffle(owner, engine) { }
    onCardDraw(owner, engine, card) { }
    onCardExhaust(owner, engine, card) { }
    onCardAdd(owner, card) { }
    onPotionUse(owner, potion) { }
    onRoomEnter(owner, roomType: RoomType) { }
    onRoomRest(owner) { }
    modifyDamageDealt(owner, target, damage, card?) { return damage; }
    modifyBlockGained(owner, block, card?) { return block; }
    modifyHealAmount(owner, amount) { return amount; } // 回復量補正用
    onGoldSpend(owner, amount) { }
    onApplyStatus(owner, target, type, value, engine) { } // ステータス付与時のフック
    onBlockBroken(owner, target, engine) { } // 敵のブロックを破った時のフック

    // UI描写用：レリックが使用済み（効果を失った状態）かどうかを判定する
    isUsedUp(owner) { return false; }
}
