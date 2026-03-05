export interface IBattleEngine {
    player: any; // IPlayerのインポートを避けるためany
    enemies: IEntity[];
    turn: number;
    gameState: string;
    effectManager: any;
    audioManager: any;
    uiUpdateCallback?: () => void;
    onBattleEnd?: (result: string) => void;
    exhaustedThisTurn: number; // 旋風刃などで使用
    isEliteBattle: boolean;
    isBossBattle: boolean;
    attackRandomEnemy(damage: number): Promise<void>;

    startBattle(player: any, enemies: IEntity[]): void;
    endTurn(): void;
    attackWithEffect(source: IEntity, target: IEntity, damage: number, targetIndex?: number | null): Promise<number>;
    dealDamageWithEffect(source: IEntity, target: IEntity, damage: number): Promise<number>;
    spawnEnemy(enemyClass: any, position?: number): void;
    removeEnemy(enemy: IEntity): void;
    addCardToHand(card: any): void;
    addCardsToDiscard(cardId: string, count?: number): void;
    drawCards(count: number): Promise<void>;
    getFinalDamage(source: IEntity, target: IEntity, damage: number): number;
    shuffle(array: any[]): void;
    getRandomAliveEnemy(): IEntity | null;
    checkBattleEnd(): void;
    showEffectForPlayer(effectType: string, callback?: any): void;
    showEffectForTarget(targetIndex: number, card: any, callback?: any): void;
    addCardToDrawPile(card: any, shuffle?: boolean): void;
    addCardsToDrawPile(card: any, shuffle?: boolean): void;
    onCardSelectionRequest?: (title: string, cards: any[], callback: (selected: any, index?: any) => void, options?: any) => void;
}

export interface IEntity {
    name: string;
    maxHp: number;
    hp: number;
    block: number;
    sprite: string;
    statusEffects: { type: string, value: number }[];
    relics: any[];
    relicCounters: { [key: string]: number };

    // 敵専用プロパティ（EnemyMoveを避けるためany）
    nextMove?: any;
    lastMove?: any;
    isPlayer?: boolean;
    character?: string;
    uuid: string;

    takeDamage(amount: number, source: IEntity | null, engine?: IBattleEngine): number;
    loseHP(amount: number): void;
    addBlock(amount: number): void;
    addStatus(type: string, value: number, source?: IEntity): void;
    hasStatus(type: string): boolean;
    getStatusValue(type: string): number;
    removeStatus(type: string): void;
    heal(amount: number): void;
    isDead(): boolean;
    calculateDamage(baseDamage: number): number;
    calculateBlock(baseBlock: number): number;
    applyTargetModifiers(damage: number, source?: IEntity | null): number;
    increaseMaxHp(amount: number): void;
    updateStatus(engine?: IBattleEngine): void;
    onTurnStart(): void;
    onTurnEnd(): void;
    updateStatusAtTurnStart(engine?: IBattleEngine): void;
    onPlayerPlayCard(card: any, player: IEntity, engine: IBattleEngine): void;
    onDeath(killer: IEntity | null, engine: IBattleEngine): void;
    onBattleStart(player: IEntity, engine: IBattleEngine): void;
    clearDebuffs(): void;
    resetBlock?(): void;
}

export interface IEnemy extends IEntity {
    nextMove: any | null;
    setNextMove(move: any): void;
    decideNextMove(player?: IEntity, engine?: IBattleEngine): void;
}

export interface IPlayer extends IEntity {
    energy: number;
    maxEnergy: number;
    hand: any[];
    deck: any[];
    discard: any[];
    exhaust: any[];
    masterDeck: any[];
    gold: number;
    potions: (any | null)[];
    hpLossCount: number;
    exhaustCard(card: any, engine: IBattleEngine): void;
    resetStatus(): void;
    resetEnergy(): void;
    addCardToDiscard(card: any): void;
}
