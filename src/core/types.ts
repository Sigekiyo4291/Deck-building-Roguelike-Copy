export interface IChoice {
    text: string;
    action: (game: any, updateState: (newState: any) => void) => void;
    phase?: string;
}

export interface IEvent {
    id: string;
    name: string;
    image: string;
    choices?: IChoice[];
    getChoices?: (game: any, state?: any) => IChoice[];
}

export interface ICard {
    id: string;
    name: string;
    baseName: string;
    description: string;
    cost: number | string;
    temporaryCost?: number | string | null;
    costCalculator?: (player: IPlayer, card: ICard) => number | string;
    type: string;
    rarity: string;
    effect: (source: IEntity, target: IEntity | null, engine: IBattleEngine, card: ICard, xValue: number) => Promise<void> | void;
    isUpgraded: boolean;
    upgradeData: any;
    targetType: string;
    canPlayCheck?: (player: IPlayer, engine: IBattleEngine) => boolean;
    baseDamage: number;
    damageCalculator?: (source: IEntity, engine: IBattleEngine, card?: ICard) => number;
    baseBlock: number;
    blockCalculator?: (source: IEntity, engine: IBattleEngine, card?: ICard) => number;
    isEthereal: boolean;
    isExhaust: boolean;
    miscValue: number;
    image?: string;
    effectType?: string;
    onExhaust?: (player: IPlayer, engine: IBattleEngine) => void;
    onEndTurnInHand?: (player: IPlayer, engine: IBattleEngine) => Promise<void> | void;
    isInnate: boolean;
    isStatus: boolean;
    bottledId?: string;
    cardClass: string;
    play: (player: IPlayer, target: IEntity | null, engine: IBattleEngine, isCopy?: boolean) => Promise<boolean>;
    canPlay?: (player: IPlayer, engine: IBattleEngine) => boolean;
    getCost: (player: IPlayer) => number | string;
    getDamage?: (source: IEntity, engine: IBattleEngine) => number;
    getFinalDamage?: (source: IEntity, target: IEntity | null, engine: IBattleEngine) => number;
    getBlock?: (source: IEntity, engine: IBattleEngine) => number;
    upgrade: () => void;
    clone: () => ICard;
}

export interface IRelic {
    id: string;
    name: string;
    description: string;
    rarity: string;
    character?: string;
    counter?: number;
    onObtain?(owner: IPlayer, game?: any, engine?: IBattleEngine | null): void;
    onBattleStart?(owner: IPlayer, engine: IBattleEngine): void;
    onTurnStart?(owner: IPlayer, engine: IBattleEngine): void;
    onPlayerTurnStart?(owner: IPlayer, engine: IBattleEngine): void;
    onTurnEnd?(owner: IPlayer, engine: IBattleEngine): void;
    onVictory?(owner: IPlayer, engine: IBattleEngine): void;
    onCardPlay?(owner: IPlayer, engine: IBattleEngine, card: ICard): void;
    afterCardPlay?(owner: IPlayer, engine: IBattleEngine, card: ICard): void;
    onTakeDamage?(owner: IPlayer, engine: IBattleEngine, amount: number): void;
    onHPRecovery?(owner: IPlayer, engine: IBattleEngine, amount: number): void;
    onShuffle?(owner: IPlayer, engine: IBattleEngine): void;
    onCardDraw?(owner: IPlayer, engine: IBattleEngine, card: ICard): void;
    onCardExhaust?(owner: IPlayer, engine: IBattleEngine, card: ICard): void;
    onCardAdd?(owner: IPlayer, card: ICard): void;
    onPotionUse?(owner: IPlayer, potion: IPotion): void;
    onRoomEnter?(owner: IPlayer, roomType: string): void;
    onRoomRest?(owner: IPlayer): void;
    modifyDamageDealt?(owner: IPlayer, target: IEntity, damage: number, card?: ICard): number;
    modifyBlockGained?(owner: IPlayer, block: number, card?: ICard): number;
    modifyHealAmount?(owner: IPlayer, amount: number): number;
    onGoldSpend?(owner: IPlayer, amount: number): void;
    onApplyStatus?(owner: IPlayer, target: IEntity, type: string, value: number, engine: IBattleEngine | null): void;
    onBlockBroken?(owner: IPlayer, target: IEntity, engine: IBattleEngine | null): void;
    isUsedUp?(owner: IPlayer): boolean;
}

export interface IPotion {
    id: string;
    name: string;
    description: string;
    rarity: string;
    targetType: string;
    isCombatOnly: boolean;
    getMultiplier(player: IPlayer): number;
    onUse(player: IPlayer, target: IEntity | null, engine: IBattleEngine | null): Promise<void> | void;
    clone(): IPotion;
}

export interface IBattleEngine {
    player: IPlayer;
    enemies: IEnemy[];
    turn: number;
    gameState: string;
    phase: string;
    effectManager: any;
    audioManager: any;
    uiUpdateCallback?: () => void;
    onBattleEnd?: (result: string) => void;
    exhaustedThisTurn: number;
    isEliteBattle: boolean;
    isBossBattle: boolean;
    currentPlayingCard: ICard | null;

    startBattle(player: IPlayer, enemies: IEnemy[]): void;
    endTurn(): void;
    attackWithEffect(source: IEntity, target: IEntity, damage: number, targetIndex?: number | null): Promise<number>;
    dealDamageWithEffect(source: IEntity, target: IEntity, damage: number): Promise<number>;
    attackRandomEnemy(damage: number): Promise<void>;
    spawnEnemy(enemyClass: any, position?: number): void;
    removeEnemy(enemy: IEnemy): void;
    addCardToHand(card: ICard): void;
    addCardToDrawPile(card: ICard | any, shuffle?: boolean): void;
    addCardsToDrawPile(card: ICard | any, shuffle?: boolean): void;
    addCardsToDiscard(cardId: string, count?: number): void;
    drawCards(count: number): Promise<void>;
    getFinalDamage(source: IEntity, target: IEntity, damage: number): number;
    shuffle(array: any[]): void;
    getRandomAliveEnemy(): IEnemy | null;
    checkBattleEnd(): void;
    showEffectForPlayer(effectType: string, callback?: any): void;
    showEffectForTarget(targetIndex: number, card: ICard, callback?: any): void;
    onCardSelectionRequest?: (title: string, cards: ICard[], callback: (selected: ICard, index?: number) => void, options?: any) => void;
    usePotion(index: number, targetIndex: number): Promise<void>;
}

export interface IEntity {
    uuid: string;
    name: string;
    maxHp: number;
    hp: number;
    block: number;
    statusEffects: { [key: string]: number };
    image?: string;
    isEnemy: boolean;
    takeDamage: (amount: number, source?: IEntity | null, engine?: IBattleEngine) => number;
    heal: (amount: number) => void;
    addBlock: (amount: number) => void;
    addStatus: (type: string, value: number, source?: IEntity) => void;
    removeStatus: (type: string) => void;
    hasStatus: (type: string) => boolean;
    getStatusValue: (type: string) => number;
    loseHP: (amount: number) => number;
    isDead: () => boolean;
    calculateDamage(base: number): number;
    calculateBlock?: (base: number) => number;
    applyTargetModifiers?: (damage: number, source: IEntity | null) => number;
    resetBlock?(): void;
    resetStatus?(): void;
    updateStatus?(engine: IBattleEngine): void;
    updateStatusAtTurnStart?(engine?: IBattleEngine): void;
    onTurnStart?(): void;
    onTurnEnd?(): void;
    onDeath?(killer: IEntity | null, engine: IBattleEngine): void;
    onPlayerPlayCard?(card: ICard, player: IPlayer, engine: IBattleEngine): void;
    relics: IRelic[];
    relicCounters: Record<string, number>;
}

export type CanPlayCheck = (player: IPlayer, engine: IBattleEngine) => boolean;

export interface IEnemy extends IEntity {
    sprite: string;
    nextMove?: any; // EnemyMove
    lastMove?: any;
    decideNextMove: (player: IPlayer, engine: IBattleEngine) => void;
    setNextMove: (move: any) => void;
    increaseMaxHp?(amount: number): void;
    onBattleStart?(player: IEntity, engine: IBattleEngine): void;
}

export interface IPlayer extends IEntity {
    energy: number;
    maxEnergy: number;
    gold: number;
    deck: ICard[];
    hand: ICard[];
    discard: ICard[];
    exhaust: ICard[];
    masterDeck: ICard[];
    potions: (IPotion | null)[];
    hpLossCount: number;
    cardRemovalCount: number;
    isRemovalUsedThisShop: boolean;
    character: string;
    potionSlots: number;
    relics: IRelic[];
    relicCounters: Record<string, number>;

    resetBlock(): void;
    resetStatus(): void;
    updateStatus(engine: IBattleEngine): void;
    updateStatusAtTurnStart(engine?: IBattleEngine): void;
    onTurnStart(): void;

    gainGold(amount: number): void;
    spendGold(amount: number): boolean;
    addCard(card: ICard): boolean;
    obtainPotion(potion: IPotion): { success: boolean, reason?: string };
    canObtainPotion(): boolean;
    getEmptyPotionSlot(): number;
    exhaustCard(card: ICard, engine: IBattleEngine): void;
    addCardToDiscard(card: ICard): void;
    increaseMaxHp(amount: number): void;
    resetEnergy(): void;
}
