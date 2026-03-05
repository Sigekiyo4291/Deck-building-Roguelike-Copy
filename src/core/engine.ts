import { IntentType } from './intent';
import { CardLibrary, Card } from './card';
import { StatusLibrary } from './status-effect';
import { IPlayer, IEntity, IBattleEngine, IEnemy } from './types';

export class BattleEngine implements IBattleEngine {
    player: IPlayer;
    enemies: IEntity[];
    uiUpdateCallback: () => void;
    onBattleEnd: (result: string) => void;
    onCardSelectionRequest: any;
    effectManager: any;
    audioManager: any;
    turn: number;
    gameState: string = 'battle';
    exhaustedThisTurn: number = 0;
    phase: string;
    isProcessing: boolean = false;
    isEnded: boolean = false;
    isEliteBattle: boolean = false;
    isBossBattle: boolean = false;
    currentPlayingCard: Card | null = null;
    playedTypesThisTurn: Set<string> = new Set(); // オレンジ色の丸薬用
    cardsPlayedThisTurn: number = 0;

    constructor(
        player: IPlayer,
        enemies: IEntity[],
        uiUpdateCallback: () => void,
        onBattleEnd: (result: string) => void,
        onCardSelectionRequest: any,
        isEliteBattle: boolean = false,
        isBossBattle: boolean = false,
        effectManager: any = null,
        audioManager: any = null
    ) {
        this.player = player;
        this.enemies = enemies; // 配列で保持
        this.uiUpdateCallback = uiUpdateCallback;
        this.onBattleEnd = onBattleEnd;
        this.onCardSelectionRequest = onCardSelectionRequest;
        this.isEliteBattle = isEliteBattle;
        this.isBossBattle = isBossBattle;
        this.effectManager = effectManager; // エフェクト管理クラス
        this.audioManager = audioManager;   // オーディオ管理クラス
        this.turn = 1;
        this.phase = 'player'; // 'player' or 'enemy'

        // ジャガーノート (Juggernaut) 等のためのフック設定
        if (this.player) {
            (this.player as any).onGainBlock = () => this.handlePlayerGainBlock();
        }
    }

    startBattle(player: any, enemies: IEntity[]) {
        this.player = player;
        this.enemies = enemies;
        this.start();
    }

    spawnEnemy(enemyClass: any, position?: number) {
        const enemy = new enemyClass();
        if (position !== undefined) {
            this.enemies.splice(position, 0, enemy);
        } else {
            this.enemies.push(enemy);
        }
        if (enemy.onBattleStart) enemy.onBattleStart(this.player, this);
        if (this.uiUpdateCallback) this.uiUpdateCallback();
    }

    start() {
        // 状態のリセット
        this.player.hand = [];
        this.player.discard = [];
        this.player.exhaust = []; // 廃棄札もリセット
        this.player.resetBlock?.(); // ブロックもリセット
        this.player.resetStatus?.(); // ステータスもリセット
        this.player.hpLossCount = 0; // 被ダメージ回数をリセット

        // デッキを準備（マスターデッキからコピー）
        this.player.deck = [];
        this.player.masterDeck.forEach((card: any) => {
            this.player.deck.push(card.clone());
        });

        // 天賦 (Innate) カードの処理
        const innateCards = this.player.deck.filter((card: any) => card.isInnate);
        const nonInnateCards = this.player.deck.filter((card: any) => !card.isInnate);

        this.shuffle(nonInnateCards);

        // 天賦カードをデッキの末尾（pop()で先に取り出される方向）に配置
        this.player.deck = [...nonInnateCards, ...innateCards];

        // レリック: onBattleStart
        console.log(`BattleEngine.start: isEliteBattle=${this.isEliteBattle}, isBossBattle=${this.isBossBattle}`);
        this.player.relics.forEach((relic: any) => {
            if (relic.onBattleStart) {
                console.log(`Calling onBattleStart for relic: ${relic.id}`);
                relic.onBattleStart(this.player, this);
            }
        });

        // 敵: onBattleStart
        this.enemies.forEach((enemy: any) => {
            if (enemy.onBattleStart) enemy.onBattleStart(this.player, this);
        });

        this.startPlayerTurn();
    }

    async startPlayerTurn() {
        this.phase = 'player';
        console.log(`--- Turn ${this.turn} ---`);

        // ステータス更新（ターン開始時：無形、悪魔化、残虐など）
        this.player.updateStatusAtTurnStart(this);

        this.player.onTurnStart();
        this.playedTypesThisTurn.clear();


        // レリック: アイスクリーム (Ice Cream) - エナジーをリセットしない
        const hasIceCream = this.player.relics.some(r => r.id === 'ice_cream');
        if (this.turn === 1 || !hasIceCream) {
            this.player.resetEnergy();
        } else {
            // ベース分だけ追加するのではなく、 StS風に「毎ターンのエナジー(3)」を加算する形にする
            // resetEnergy() は this.energy = this.maxEnergy なので
            // アイスクリーム時は this.energy += this.maxEnergy となる
            this.player.energy += this.player.maxEnergy;
            console.log(`アイスクリーム発動！ エナジーを持ち越し、現在のエナジー: ${this.player.energy}`);
        }

        // 狂戦士 (Berserk) などのエナジー増加は StatusEffect.onTurnStartUpdate で処理されるようになりました。

        if (!this.player.hasStatus('barricade')) {
            const hasCalipers = this.player.relics.some(r => r.id === 'calipers');
            if (hasCalipers) {
                this.player.block = Math.max(0, this.player.block - 15);
                console.log(`カリパス発動！ ブロックを15失い、残存: ${this.player.block}`);
            } else {
                this.player.resetBlock?.();
            }
        }

        // レリック: onPlayerTurnStart
        this.player.relics.forEach((relic: any) => {
            if (relic.onPlayerTurnStart) relic.onPlayerTurnStart(this.player, this);
        });

        let drawCount = 5;
        await this.drawCards(drawCount);

        // ギャンブルチップ (Gambling Chip) の処理
        if (this.turn === 1 && this.player.relics.some(r => r.id === 'gambling_chip')) {
            await this.handleGamblingChip();
        }

        this.updateIntent();
        this.uiUpdateCallback();
    }

    async drawCards(count: number) {
        if (this.player.hasStatus('no_draw')) {
            console.log("ドロー不可ステータスが付与されているため、ドローできません。");
            return;
        }

        for (let i = 0; i < count; i++) {
            if (this.player.deck.length === 0) {
                if (this.player.discard.length === 0) break;
                this.player.deck = [...this.player.discard];
                this.player.discard = [];
                this.shuffle(this.player.deck);

                // レリック: onShuffle
                (this.player.relics as any[]).forEach((relic: any) => {
                    if (relic.onShuffle) relic.onShuffle(this.player, this);
                });
            }
            const card: Card = this.player.deck.pop()!;
            if (!card) continue;

            // 混乱 (Confusion) の処理
            if (this.player.hasStatus('confusion')) {
                if (card.cost !== -1 && typeof card.cost === 'number') {
                    card.temporaryCost = Math.floor(Math.random() * 4);
                    console.log(`混乱により ${card.name} のコストが ${card.temporaryCost} になりました。`);
                }
            }

            this.player.hand.push(card);

            // レリック: onCardDraw
            (this.player.relics as any[]).forEach((relic: any) => {
                if (relic.onCardDraw) relic.onCardDraw(this.player, this, card);
            });

            // 炎の吐息 (Fire Breathing) の処理
            const fbDamage = this.player.getStatusValue('fire_breathing');
            if (fbDamage > 0 && (card.type === 'curse' || card.isStatus)) {
                console.log(`炎の吐息発動！ ${card.name} を引いたため ${fbDamage} ダメージ。`);
                for (const enemy of this.enemies) {
                    if (!enemy.isDead()) {
                        await this.attackWithEffect(this.player, enemy, fbDamage);
                    }
                }
            }

            // 進化 (Evolve) の処理
            const evolveCount = this.player.getStatusValue('evolve');
            if (evolveCount > 0 && card.isStatus) {
                console.log(`進化発動！ ステータスカード ${card.name} を引いたため ${evolveCount} 枚カードを引く。`);
                await this.drawCards(evolveCount);
            }
        }
        this.uiUpdateCallback();
    }

    async handleGamblingChip() {
        console.log('ギャンブルチップ発動！ 捨てるカードを選択してください。');
        return new Promise<void>(resolve => {
            this.onCardSelectionRequest(
                'ギャンブルチップ: 捨てるカードを選択 (完了で引き直し)',
                this.player.hand,
                async (selectedCards: Card[], selectedIndices: number[]) => {
                    if (selectedCards && selectedCards.length > 0) {
                        // 選択されたカードを捨て札に送り、その分引く
                        // インデックスは降順で削除
                        const sortedIndices = [...selectedIndices].sort((a, b) => b - a);
                        sortedIndices.forEach(idx => {
                            const card = this.player.hand.splice(idx, 1)[0];
                            this.player.discard.push(card);
                        });
                        console.log(`${selectedCards.length} 枚捨てました。同数ドローします。`);
                        await this.drawCards(selectedCards.length);
                    }
                    resolve();
                },
                { multiSelect: true }
            );
        });
    }

    addCardToHand(card: any) {
        if (this.player.hand.length >= 10) {
            console.log("手札がいっぱいです。カードは捨て札に送られます。");
            this.player.discard.push(card);
        } else {
            this.player.hand.push(card);
        }
        this.uiUpdateCallback();
    }

    addCardToDrawPile(card: any, shuffle: boolean = true) {
        this.addCardsToDrawPile(card, shuffle);
    }

    addCardsToDrawPile(card: any, shuffle: boolean = true) {
        if (Array.isArray(card)) {
            this.player.deck.push(...card);
        } else {
            this.player.deck.push(card);
        }
        if (shuffle) {
            this.shuffle(this.player.deck);
        }
    }

    shuffle(array: any[]) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // カードを捨て札に加える（状態異常など）
    addCardsToDiscard(cardId: string, count: number = 1, upgrade: boolean = false) {
        const key = cardId.toUpperCase();
        const template = (CardLibrary as any)[key];
        if (!template) {
            console.error(`Card template not found: ${cardId}`);
            return;
        }

        for (let i = 0; i < count; i++) {
            const card = template.clone();
            if (upgrade) card.upgrade();
            this.player.discard.push(card);
            console.log(`Added ${card.name} to discard pile.`);
        }
        this.uiUpdateCallback();
    }

    async playCard(cardIndex: number, targetIndex: number = 0) {
        if (this.phase !== 'player' || this.isProcessing || this.isEnded) return;

        // レリック: ベルベットチョーカー (Velvet Choker) 制限
        const chokerCount = this.player.relicCounters['velvet_choker'];
        if (chokerCount !== undefined && chokerCount >= 6) {
            alert('ベルベットチョーカーにより、このターンはこれ以上カードを使えません！');
            return;
        }

        console.log('BattleEngine: Processing started (isProcessing = true)');
        this.isProcessing = true;
        try {
            const card: Card = this.player.hand[cardIndex];
            if (!card) return;

            // レリック: 医療キット (Medical Kit) - 状態異常を使用可能にする
            const hasMedicalKit = (this.player.relics as any[]).some(r => r.id === 'medical_kit');
            const isStatusPlayable = card.isStatus && hasMedicalKit;
            // レリック: ブルーキャンドル (Blue Candle) - 呪いを使用可能にする
            const hasBlueCandle = (this.player.relics as any[]).some(r => r.id === 'blue_candle');
            const isCursePlayable = card.type === 'curse' && hasBlueCandle;

            let target: IEntity | null = this.enemies[targetIndex];
            if (!target || target.isDead()) {
                target = this.enemies.find((e: any) => !e.isDead()) || null;
            }
            if (!target) return;

            if (this.player.hasStatus('entangled') && card.type === 'attack') {
                alert("アタック不能！拘束されています。");
                console.log("アタック不能！拘束されています。");
                return;
            }

            // 凡庸 (Normality) のチェック: 手札にある場合、3枚までしかプレイできない
            const hasNormality = this.player.hand.some((c: any) => c.id === 'normality');
            if (hasNormality && this.cardsPlayedThisTurn >= 3) {
                alert("これ以上カードをプレイできません！（凡庸）");
                console.log("アタック不能！凡庸により3枚制限されています。");
                return;
            }

            const currentCost = card.getCost(this.player);
            if (currentCost === 'X' || isStatusPlayable || isCursePlayable || (typeof currentCost === 'number' && currentCost >= 0 && this.player.energy >= currentCost)) {
                if (!card.canPlay(this.player, this) && !isStatusPlayable && !isCursePlayable) {
                    console.log("使用条件を満たしていません！");
                    return;
                }

                // カードタイプに応じたエフェクトを表示
                if (card.type === 'skill') {
                    this.showEffectForPlayer('skill');
                    if (this.audioManager) this.audioManager.playSe('skill'); // スキルSE
                } else if (card.type === 'power') {
                    this.showEffectForPlayer('power', () => {
                        this.uiUpdateCallback(); // パワーエフェクト完了後にステータス更新
                    });
                    if (this.audioManager) this.audioManager.playSe('skill'); // パワーもスキルSE（または専用音）
                }

                const oldBlock = this.player.block;

                // 激怒 (Rage) の効果: アタック使用時にブロック獲得
                if (card.type === 'attack') {
                    const rageValue = this.player.getStatusValue('rage');
                    if (rageValue > 0) {
                        this.player.addBlock(rageValue);
                    }
                }

                this.player.hand.splice(cardIndex, 1);

                // ステータスの onCardPlay トリガー
                this.player.statusEffects.forEach(s => {
                    const effect = StatusLibrary.get(s.type);
                    if (effect && effect.onCardPlay) effect.onCardPlay(this.player, s.value, card, this);
                });

                // レリック: onCardPlay
                (this.player.relics as any[]).forEach((relic: any) => {
                    if (relic.onCardPlay) relic.onCardPlay(this.player, this, card);
                });

                this.currentPlayingCard = card;
                await card.play(this.player, target, this);
                this.currentPlayingCard = null;

                this.cardsPlayedThisTurn++;

                // 痛み (Pain) のチェック: 手札にある場合、カードをプレイするたびにHPを1失う
                const hasPain = this.player.hand.some((c: any) => c.id === 'pain');
                if (hasPain) {
                    console.log("痛み発動！HPを1失います。");
                    this.player.loseHP(1);
                    if (this.uiUpdateCallback) this.uiUpdateCallback();
                }

                // レリック: ブルーキャンドル - 呪い使用時にHP-1（ブロック無視）
                if (isCursePlayable) {
                    this.player.loseHP(1);
                    console.log('ブルーキャンドル：呪い使用でHP-1');
                    if (this.uiUpdateCallback) this.uiUpdateCallback();
                }

                // レリック: afterCardPlay
                (this.player.relics as any[]).forEach((relic: any) => {
                    if (relic.afterCardPlay) relic.afterCardPlay(this.player, this, card);
                });

                // レリック: オレンジ色の丸薬 (Orange Pellets) の判定
                const typeToLog = card.type;
                if (['attack', 'skill', 'power'].includes(typeToLog)) {
                    this.playedTypesThisTurn.add(typeToLog);
                    if (this.playedTypesThisTurn.has('attack') && this.playedTypesThisTurn.has('skill') && this.playedTypesThisTurn.has('power')) {
                        const pellets = (this.player.relics as any[]).find(r => r.id === 'orange_pellets');
                        if (pellets && pellets.clearDebuffs) {
                            pellets.clearDebuffs(this.player);
                            this.playedTypesThisTurn.clear(); // 発動後はリセット（ StSの仕様に準拠するなら1ターン1回）
                        }
                    }
                }

                // 敵にカードプレイを通知
                this.enemies.forEach((enemy: any) => {
                    if (!enemy.isDead()) {
                        enemy.onPlayerPlayCard(card, this.player, this);
                    }
                });

                // ブロックが増えたらエフェクトを表示
                if (this.player.block > oldBlock) {
                    this.showEffectForPlayer('block');
                    if (this.audioManager) this.audioManager.playSe('defense'); // ブロックSE
                }

                // 複製 (Duplication) および ダブルタップ (Double Tap) の処理
                const statusEffects = this.player.statusEffects;
                const duplicationStatus = statusEffects.find(s => s.type === 'duplication');
                const doubleTapStatus = statusEffects.find(s => s.type === 'double_tap');

                let shouldPlayAgain = false;

                if (duplicationStatus && duplicationStatus.value > 0) {
                    this.player.addStatus('duplication', -1);
                    console.log('Duplication triggered!');
                    shouldPlayAgain = true;
                } else if (card.type === 'attack' && doubleTapStatus && doubleTapStatus.value > 0) {
                    this.player.addStatus('double_tap', -1);
                    console.log('Double Tap triggered!');
                    shouldPlayAgain = true;
                } else if (card.type === 'attack' && (typeof currentCost === 'number' && currentCost >= 2) && (this.player.relics as any[]).some(r => r.id === 'necronomicon') && (this.player.relicCounters['necronomicon'] || 0) > 0) {
                    this.player.relicCounters['necronomicon'] = 0;
                    console.log('Necronomicon triggered!');
                    shouldPlayAgain = true;
                }

                if (shouldPlayAgain) {
                    // ターゲットの再取得（もし死んでいたら）
                    let newTarget: IEntity | null = target;
                    if (card.targetType === 'single' && (!newTarget || newTarget.isDead())) {
                        newTarget = this.enemies.find((e: any) => !e.isDead()) || null;
                    }

                    if (newTarget || card.targetType !== 'single') {
                        await new Promise(resolve => setTimeout(resolve, 300));
                        const oldBlockAgain = this.player.block;
                        this.currentPlayingCard = card;
                        await card.play(this.player, newTarget, this, true);
                        this.currentPlayingCard = null;
                        if (this.player.block > oldBlockAgain) {
                            this.showEffectForPlayer('block');
                            if (this.audioManager) this.audioManager.playSe('defense'); // ブロックSE
                        }
                    }
                }

                if (card.type === 'power') {
                    // パワーカードは戦闘から取り除かれる（どこにも追加しない）
                    console.log(`${card.name} は戦闘から取り除かれました。`);
                } else if (card.isExhaust || (this.player.hasStatus('corruption') && card.type === 'skill') || (isStatusPlayable)) {
                    // 医療キットによる状態異常の廃棄または元の廃棄属性
                    if (isStatusPlayable) {
                        console.log(`医療キット発動！ ${card.name} は廃棄されました。`);
                    }
                    this.player.exhaustCard(card, this);
                } else {
                    (this.player as any).addCardToDiscard(card);
                }

                // レリック: 永久コマ (Unceasing Top) - 手札が空ならドロー
                if (this.player.hand.length === 0) {
                    const hasTop = (this.player.relics as any[]).some(r => r.id === 'unceasing_top');
                    if (hasTop) {
                        console.log('永久コマ発動！ 手札が空のためカードを引きます。');
                        await this.drawCards(1);
                    }
                }

                this.checkBattleEnd();
                this.uiUpdateCallback();
            }
        } finally {
            this.isProcessing = false;
            console.log('BattleEngine: Processing finished (isProcessing = false)');
        }
    }

    // ポーションの使用
    async usePotion(potionIndex: number, targetIndex: number = 0) {
        if (this.isProcessing) return; // 二重実行防止
        this.isProcessing = true;

        try {
            const potion = this.player.potions[potionIndex];
            if (!potion || !potion.onUse) return;

            const target = this.enemies[targetIndex] || this.enemies[0];

            // ターゲットタイプに応じて演出を分岐
            if (potion.targetType === 'single' || potion.targetType === 'all') {
                // 投げる演出
                const playerEl = this.getEntityElement(this.player);
                const targetEl = this.getEntityElement(target);

                // ポーションの色を簡易的に決定（レアリティなどから推測、あるいはデフォルト）
                let color = 'white';
                if (potion.id.includes('fire')) color = 'orange';
                else if (potion.id.includes('explosive')) color = 'orange';
                else if (potion.id.includes('poison')) color = 'purple';
                else if (potion.id.includes('weak')) color = 'gray';
                else if (potion.id.includes('vulnerable')) color = 'magenta';

                if (this.effectManager && playerEl && targetEl) {
                    await new Promise<void>(resolve => {
                        this.effectManager.showProjectileEffect(playerEl, targetEl, color, resolve);
                    });
                }
            } else {
                // 飲む演出（音のみ、または既存のエフェクトがあれば）
                // 必要であればここでthis.playerに発光エフェクトなどを入れる
            }

            // 使用したのでスロットを空ける (ポーションの効果で再度スロットが使われる可能性を考慮し先に空ける)
            this.player.potions[potionIndex] = null;

            // バグ修正: 第3引数を this.enemies から this (BattleEngine) に変更
            await potion.onUse(this.player, target, this);

            // レリック: onPotionUse
            this.player.relics.forEach((relic: any) => {
                if (relic.onPotionUse) relic.onPotionUse(this.player, potion);
            });

            if (this.audioManager) {
                if (potion.targetType === 'single' || potion.targetType === 'all') {
                    // 着弾音（アタック音などで代用、あるいは専用SE）
                    // ここでは attackWithEffect 内などでSEが鳴る可能性があるので重複に注意するが
                    // Potion.onUseの実装次第。
                } else {
                    this.audioManager.playSe('click'); // 飲む音がないのでクリック音で代用... TODO: 飲むSE追加
                }
            }
            this.checkBattleEnd();
            this.uiUpdateCallback();
        } finally {
            this.isProcessing = false;
        }
    }

    // プレイヤーにエフェクトを表示
    showEffectForPlayer(effectType: any, callback: any = null) {
        if (!this.effectManager) {
            if (callback) callback();
            return;
        }

        const playerElement = document.getElementById('player');
        if (playerElement) {
            this.effectManager.showAttackEffect(playerElement, effectType, callback);
        } else if (callback) {
            callback();
        }
    }

    // エンティティに関連付けられたDOM要素を取得
    getEntityElement(entity: any) {
        if (entity === this.player) {
            return document.getElementById('player');
        }
        // 敵のUUIDから検索
        return document.querySelector(`.entity.enemy[data-id="${entity.uuid}"]`) as HTMLElement;
    }

    // ターゲットにエフェクトを表示
    showEffectForTarget(targetIndex: any, card: any, callback: any) {
        // targetIndexは使わず、enemies[targetIndex]からUUIDを取得してDOMを引く
        // もしtargetIndexがnullなら処理できないが、呼び出し側で解決済みとする
        const target = this.enemies[targetIndex];
        if (!target) {
            if (callback) callback();
            return;
        }

        const enemyElement = this.getEntityElement(target);
        if (enemyElement) {
            const effectType = card.effectType || 'slash';
            this.effectManager.showAttackEffect(enemyElement, effectType, callback);
        } else {
            // エフェクト表示に失敗した場合はコールバックを即座に実行
            callback();
        }
    }

    // 全ての敵にエフェクトを順次表示
    showEffectsForAllEnemies(card: any, callback: any) {
        const aliveEnemies = this.enemies.map((enemy, index) => ({ enemy, index })).filter((e: any) => !e.enemy.isDead());
        let effectCount = 0;
        const totalEffects = aliveEnemies.length;

        if (totalEffects === 0) {
            callback();
            return;
        }

        aliveEnemies.forEach(({ index }, i) => {
            setTimeout(() => {
                this.showEffectForTarget(index, card, () => {
                    effectCount++;
                    if (effectCount === totalEffects) {
                        callback();
                    }
                });
            }, i * 100); // 各エフェクトを100ms間隔で表示
        });
    }

    getFinalDamage(source: IEntity, target: IEntity, damage: number): number {
        let finalDamage = damage;
        // レリックによるダメージ補正
        if (source === this.player && source.relics) {
            source.relics.forEach((relic: any) => {
                if (relic.modifyDamageDealt) {
                    finalDamage = relic.modifyDamageDealt(source, target, finalDamage, this.currentPlayingCard);
                }
            });
        }
        // ターゲット側の補正（弱体など）は Entity.takeDamage 内で行われるが、
        // StSの getFinalDamage は全ての補正を適用した値を返すのが一般的。
        // ここでは source 側の補正のみを計算し、target 側の modifiers も適用する。
        if (target && target.applyTargetModifiers) {
            finalDamage = target.applyTargetModifiers(finalDamage, source);
        }
        return Math.floor(finalDamage);
    }

    // エフェクト表示付きで攻撃を実行（複数回攻撃用ヘルパー）
    async attackWithEffect(source: IEntity, target: IEntity, damage: number, targetIndex: number | null = null): Promise<number> {
        if (!target || target.isDead()) return 0;

        let finalDamage = damage;
        // レリックによるダメージ補正
        if (source === this.player && source.relics) {
            source.relics.forEach((relic: any) => {
                if (relic.modifyDamageDealt) {
                    finalDamage = relic.modifyDamageDealt(source, target, finalDamage, this.currentPlayingCard);
                }
            });
        }

        // ターゲットインデックスを取得
        if (targetIndex === null) {
            targetIndex = this.enemies.indexOf(target);
        }

        // 攻撃SE再生
        if (this.audioManager) {
            this.audioManager.playSe('attack');
        }

        // バンプアニメーションを表示（攻撃側が動く）
        if (this.effectManager) {
            const sourceElement = this.getEntityElement(source);
            if (sourceElement) {
                // プレイヤーなら右へ、敵なら左へ
                const direction = source === this.player ? 'right' : 'left';
                this.effectManager.showBumpAnimation(sourceElement, direction);
            }
        }

        // 斬撃などのエフェクトを表示
        if (this.effectManager) {
            const enemyElement = this.getEntityElement(target);
            if (enemyElement) {
                await this.effectManager.showAttackEffectAsync(enemyElement, 'slash');
            }
        }

        // ダメージを与える
        const dealtDamage = target.takeDamage(finalDamage, source, this);
        if (source) (source as any).lastDamageDealt = dealtDamage;

        if (target === this.player && target.isDead()) {
            this.triggerFairyPotionIfDead();
        }

        // 死亡判定と死亡時処理
        if (target.isDead()) {
            if (target.onDeath) target.onDeath(source, this);

            // レリック: 敵死亡時フック (グレムリンの角笛など)
            if (target !== this.player) {
                (this.player.relics as any[]).forEach((relic: any) => {
                    if (relic.onEnemyDeath) relic.onEnemyDeath(this.player, target, this);
                });
            }
        }
        return dealtDamage;
    }

    // プレイヤーがブロックを獲得した際の処理（ジャガーノート用）
    async handlePlayerGainBlock() {
        if (this.isEnded) return;
        const juggernautDamage = this.player.getStatusValue('juggernaut');
        if (juggernautDamage > 0) {
            console.log(`ジャガーノート発動！ ブロック獲得により ${juggernautDamage} ダメージ。`);
            await this.attackRandomEnemy(juggernautDamage);
            this.checkBattleEnd();
        }
    }

    // 生存している敵からランダムに1体取得
    getRandomAliveEnemy() {
        const aliveEnemies = this.enemies.filter((e: any) => !e.isDead());
        if (aliveEnemies.length === 0) return null;
        return aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
    }

    // ランダムな敵にダメージを与える
    async attackRandomEnemy(damage: number) {
        const target = this.getRandomAliveEnemy();
        if (!target) return;
        await this.attackWithEffect(this.player, target, damage);
        this.uiUpdateCallback();
    }

    // ダメージ処理をエフェクト付きで実行（単体攻撃用の簡易ヘルパー）
    async dealDamageWithEffect(source: IEntity, target: IEntity, damage: number): Promise<number> {
        const targetIndex = this.enemies.indexOf(target);
        return await this.attackWithEffect(source, target, damage, targetIndex);
    }

    async endTurn() {
        if (this.phase !== 'player' || this.isEnded) return;

        // 手札にあるカードのターン終了時効果を実行
        for (const card of this.player.hand) {
            if (card.onEndTurnInHand) {
                await card.onEndTurnInHand(this.player, this);
            }
        }

        if (this.player.isDead()) this.triggerFairyPotionIfDead();

        // 燃焼 (Combust) などのターン終了時処理は StatusEffect.onTurnEndUpdate で処理されるようになりました。


        // 手札を全て捨てる（エセリアルは廃棄）
        const hasRunicPyramid = this.player.relics.some(r => r.id === 'runic_pyramid');
        const etherealCards = this.player.hand.filter((c: any) => c.isEthereal);
        const nonEtherealCards = this.player.hand.filter((c: any) => !c.isEthereal);

        if (nonEtherealCards.length > 0) {
            if (!hasRunicPyramid) {
                this.player.discard.push(...nonEtherealCards);
                this.player.hand = [];
            } else {
                console.log('ルーニックピラミッド発動！ 手札を維持します。');
                // 手札はそのまま（ただしエセリアルは後で処理される）
                this.player.hand = [...nonEtherealCards];
            }
        } else {
            this.player.hand = [];
        }

        if (etherealCards.length > 0) {
            etherealCards.forEach((c: any) => {
                this.player.exhaustCard(c, this);
                console.log(`${c.name} (エセリアル) が廃棄されました。`);
            });
        }

        // レリック: onTurnEnd
        this.player.relics.forEach((relic: any) => {
            if (relic.onTurnEnd) relic.onTurnEnd(this.player, this);
        });

        // this.player.hand = []; // 既に上記で処理済み

        // 金属音 (metallicize) などのステータス更新（持続時間減少・効果発動）
        this.player.updateStatus(this);


        // 一時的なコスト変更をクリア
        const allCards = [...this.player.hand, ...this.player.deck, ...this.player.discard, ...this.player.exhaust];
        allCards.forEach((card: any) => {
            if (card && card.temporaryCost !== null && card.temporaryCost !== undefined) {
                card.temporaryCost = null;
            }
        });

        this.phase = 'enemy';

        // レリック: ニルリーのコーデックス (NILRY_CODEX)
        if (this.player.relics.some(r => r.id === 'nilry_codex')) {
            console.log('ニルリーのコーデックス発動！ 手札に加えるカードを選択してください。');
            const candidates: any[] = [];
            const allCards = Object.values(CardLibrary).filter((c: any) => c.type !== 'curse' && c.type !== 'status' && c.rarity !== 'basic');
            for (let i = 0; i < 3; i++) {
                candidates.push(allCards[Math.floor(Math.random() * allCards.length)].clone());
            }

            await new Promise<void>(resolve => {
                this.onCardSelectionRequest(
                    'ニルリーのコーデックス: 山札に加えるカードを選択',
                    candidates,
                    (selectedCard: any) => {
                        if (selectedCard) {
                            this.addCardsToDrawPile(selectedCard);
                            console.log(`ニルリーのコーデックスにより ${selectedCard.name} を山札に加えました。`);
                        }
                        resolve();
                    }
                );
            });
        }

        this.uiUpdateCallback();

        // 敵のターン実行
        setTimeout(() => this.enemyTurn(), 1000);
    }

    // 敵を削除（逃走など）
    removeEnemy(enemy: any) {
        const index = this.enemies.indexOf(enemy);
        if (index !== -1) {
            this.enemies.splice(index, 1);
            console.log(`${enemy.name} escaped!`);
            this.checkBattleEnd();
            this.uiUpdateCallback();
        }
    }

    // 敵を分裂させる
    splitEnemy(parent: IEntity, childClass1: any, childClass2?: any) {
        const index = this.enemies.indexOf(parent);
        if (index !== -1) {
            const hp = parent.hp;
            // 親の残りHPを引き継ぐ2体を生成
            const m1 = new childClass1();
            const m2 = childClass2 ? new childClass2() : new childClass1();
            m1.hp = m1.maxHp = hp;
            m2.hp = m2.maxHp = hp;

            // 親を削除し、同じ位置に2体挿入
            this.enemies.splice(index, 1, m1, m2);

            // 新しく生成された敵に初期化処理を実行
            if (m1.onBattleStart) m1.onBattleStart(this.player, this);
            if (m2.onBattleStart) m2.onBattleStart(this.player, this);

            console.log(`${parent.name} split into two!`);
            this.checkBattleEnd();
            this.uiUpdateCallback();
        }
    }

    async enemyTurn() {
        if (this.isEnded) return;

        this.isProcessing = true; // 敵の行動中も処理中フラグを立てる
        try {
            // 全ての生存している敵が行動
            for (const enemy of this.enemies) {
                if (!enemy.isDead() && !this.player.isDead()) {
                    (enemy as any).resetBlock ? (enemy as any).resetBlock() : (enemy.block = 0);
                    // ステータス更新（ターン開始時：無形など）
                    enemy.updateStatusAtTurnStart(this);

                    const enemyObj = enemy as any as IEnemy;
                    const move = enemyObj.nextMove;

                    // 敵の行動実行
                    if (move) {
                        // 攻撃処理（ダメージがある場合）
                        if (move.value > 0) {
                            const damage = enemy.calculateDamage(move.value);
                            const times = move.times || 1;
                            for (let i = 0; i < times; i++) {
                                if (this.player.isDead()) break;
                                // 攻撃エフェクト付きで実行
                                await this.attackWithEffect(enemy, this.player, damage);
                                this.uiUpdateCallback(); // 攻撃ごとにUI（HP/ブロック）を更新
                                if (times > 1) await new Promise(resolve => setTimeout(resolve, 200));
                            }
                        }

                        if (this.player.isDead()) break;

                        // 特殊効果（バフ、デバフ、ブロック、分裂など）
                        if (move.effect) {
                            // バフ・デバフ時のエフェクトを表示
                            let effectType = 'skill';
                            if (move.type === 'buff') {
                                const powerTraits = ['growth', 'ritual', 'enrage', 'bellow', '成長', '儀式', '激怒', '咆哮'];
                                if (powerTraits.some(trait =>
                                    (move.id && move.id.toLowerCase().includes(trait)) ||
                                    (move.name && move.name.includes(trait))
                                )) {
                                    effectType = 'power';
                                }
                            }

                            const enemyElement = this.getEntityElement(enemy);
                            if (enemyElement && this.effectManager) {
                                await new Promise<void>(resolve => {
                                    this.effectManager.showAttackEffect(enemyElement, effectType, resolve);
                                });
                            }

                            await move.effect(enemy, this.player, this);
                        }
                    }

                    enemy.updateStatus(this);
                    await new Promise(resolve => setTimeout(resolve, 500)); // 敵ごとの行動間隔
                }
            }

            this.turn++;
            this.checkBattleEnd();
            if (!this.isEnded && !this.player.isDead()) {
                this.startPlayerTurn();
            }
        } finally {
            this.isProcessing = false;
            this.uiUpdateCallback();
        }
    }

    updateIntent() {
        // 生存している全ての敵の意図を更新
        this.enemies.forEach((enemy: any) => {
            if (!enemy.isDead()) {
                const enemyObj = enemy as any as IEnemy;
                // Enemyクラスに decideNextMove メソッドがあればそれを使う
                if (enemyObj.decideNextMove) {
                    enemyObj.decideNextMove(this.player, this);
                } else {
                    // 旧ロジック互換
                    const damage = 5 + Math.floor(Math.random() * 5);
                    enemyObj.setNextMove({ type: IntentType.Attack, value: damage });
                }
            } else {
                (enemy as any).nextMove = null;
            }
        });
    }

    escapeBattle() {
        this.isEnded = true;
        console.log('戦闘から逃走しました！');
        if (this.onBattleEnd) this.onBattleEnd('escape');
    }

    triggerFairyPotionIfDead() {
        if (!this.player.isDead()) return false;

        // 妖精の瓶チェック
        const fairyIndex = this.player.potions.findIndex((p: any) => p && p.id === 'fairy_potion');
        if (fairyIndex !== -1) {
            const fairyPotion = this.player.potions[fairyIndex] as any;
            const multiplier = fairyPotion.getMultiplier ? fairyPotion.getMultiplier(this.player) : 1;
            const healAmount = Math.floor(this.player.maxHp * 0.3 * multiplier);

            this.player.potions[fairyIndex] = null;
            this.player.hp = healAmount; // 復活
            console.log(`瓶詰の妖精が発動！ HPが ${healAmount} 回復しました。`);

            if (this.effectManager) {
                const playerElement = document.getElementById('player');
                if (playerElement) {
                    this.effectManager.showHealEffect(playerElement, healAmount);
                }
            }
            this.uiUpdateCallback();
            return true;
        }
        return false;
    }

    checkBattleEnd() {
        if (this.isEnded) return;
        const allEnemiesDead = this.enemies.every((e: any) => e.isDead());

        if (allEnemiesDead) {
            this.isEnded = true;
            if (this.onBattleEnd) {
                // レリック: onVictory
                (this.player.relics as any[]).forEach((relic: any) => {
                    if (relic.onVictory) relic.onVictory(this.player, this);
                });
                this.onBattleEnd('win');
            }
        } else if (this.player.isDead()) {
            this.isEnded = true;
            if (this.onBattleEnd) this.onBattleEnd('lose');
        }
    }
}
