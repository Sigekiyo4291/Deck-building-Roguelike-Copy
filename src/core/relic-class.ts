import { RoomType } from './map-data';
import { IEntity, IBattleEngine, ICard, IPotion, IRelic } from './types';

export class Relic implements IRelic {
    id: string;
    name: string;
    description: string;
    rarity: string;
    character?: string; // 特定キャラ専用レリック用（例：'ironclad'）
    counter?: number;

    constructor(id: string, name: string, description: string, rarity: string, character?: string) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.rarity = rarity; // 'starter', 'common', 'uncommon', 'rare', 'boss'
        this.character = character;
    }

    // フックメソッド（デフォルトは何もしない）
    onObtain(owner: IEntity, game?: any) { }
    onBattleStart(owner: IEntity, engine: IBattleEngine) { }
    onTurnStart(owner: IEntity, engine: IBattleEngine) { }
    onPlayerTurnStart(owner: IEntity, engine: IBattleEngine) { }
    onTurnEnd(owner: IEntity, engine: IBattleEngine) { }
    onVictory(owner: IEntity, engine: IBattleEngine) { }
    onCardPlay(owner: IEntity, engine: IBattleEngine, card: ICard) { }
    afterCardPlay(owner: IEntity, engine: IBattleEngine, card: ICard) { }
    onTakeDamage(owner: IEntity, engine: IBattleEngine, amount: number) { }
    onHPRecovery(owner: IEntity, engine: IBattleEngine, amount: number) { }
    onShuffle(owner: IEntity, engine: IBattleEngine) { }
    onCardDraw(owner: IEntity, engine: IBattleEngine, card: ICard) { }
    onCardExhaust(owner: IEntity, engine: IBattleEngine, card: ICard) { }
    onCardAdd(owner: IEntity, card: ICard) { }
    onPotionUse(owner: IEntity, potion: IPotion) { }
    onRoomEnter(owner: IEntity, roomType: RoomType | string) { }
    onRoomRest(owner: IEntity) { }
    modifyDamageDealt(owner: IEntity, target: IEntity, damage: number, card?: ICard) { return damage; }
    modifyBlockGained(owner: IEntity, block: number, card?: ICard) { return block; }
    modifyHealAmount(owner: IEntity, amount: number) { return amount; } // 回復量補正用
    onGoldSpend(owner: IEntity, amount: number) { }
    onApplyStatus(owner: IEntity, target: IEntity, type: string, value: number, engine: IBattleEngine) { } // ステータス付与時のフック
    onBlockBroken(owner: IEntity, target: IEntity, engine: IBattleEngine) { } // 敵のブロックを破った時のフック

    // UI描写用：レリックが使用済み（効果を失った状態）かどうかを判定する
    isUsedUp(owner: IEntity) { return false; }
}
