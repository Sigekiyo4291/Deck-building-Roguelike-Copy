import { CardLibrary } from './card';

export class BattleEngine {
    player: any;
    enemies: any[];
    uiUpdateCallback: any;
    onBattleEnd: any;
    onCardSelectionRequest: any;
    effectManager: any;
    audioManager: any;
    turn: number;
    phase: string;
    isProcessing: boolean = false;
    isEnded: boolean = false;

    constructor(player, enemies, uiUpdateCallback, onBattleEnd, onCardSelectionRequest, effectManager = null, audioManager = null) {
        this.player = player;
        this.enemies = enemies; // 配列で保持
        this.uiUpdateCallback = uiUpdateCallback;
        this.onBattleEnd = onBattleEnd;
        this.onCardSelectionRequest = onCardSelectionRequest;
        this.effectManager = effectManager; // エフェクト管理クラス
        this.audioManager = audioManager;   // オーディオ管理クラス
        this.turn = 1;
        this.phase = 'player'; // 'player' or 'enemy'

        // ジャガーノート (Juggernaut) 等のためのフック設定
        if (this.player) {
            this.player.onGainBlock = () => this.handlePlayerGainBlock();
        }
    }

    start() {
        // 状態のリセット
        this.player.hand = [];
        this.player.discard = [];
        this.player.exhaust = []; // 廃棄札もリセット
        this.player.resetBlock(); // ブロックもリセット
        this.player.resetStatus(); // ステータスもリセット
        this.player.hpLossCount = 0; // 被ダメージ回数をリセット

        // デッキを準備（マスターデッキからコピー）
        this.player.deck = [];
        this.player.masterDeck.forEach(card => {
            this.player.deck.push(card.clone());
        });

        // 天賦 (Innate) カードの処理
        const innateCards = this.player.deck.filter(card => card.isInnate);
        const nonInnateCards = this.player.deck.filter(card => !card.isInnate);

        this.shuffle(nonInnateCards);

        // 天賦カードをデッキの末尾（pop()で先に取り出される方向）に配置
        this.player.deck = [...nonInnateCards, ...innateCards];

        // レリック: onBattleStart
        this.player.relics.forEach(relic => {
            if (relic.onBattleStart) relic.onBattleStart(this.player, this);
        });

        // 敵: onBattleStart
        this.enemies.forEach(enemy => {
            if (enemy.onBattleStart) enemy.onBattleStart(this.player, this);
        });

        this.startPlayerTurn();
    }

    async startPlayerTurn() {
        this.phase = 'player';
        this.player.onTurnStart();

        // 残虐 (Brutality) の処理
        const brutalityCount = this.player.getStatusValue('brutality');
        if (brutalityCount > 0) {
            console.log(`残虐発動！ 1HPを失い ${brutalityCount} 枚ドロー。`);
            this.player.loseHP(1);
            await this.drawCards(brutalityCount);
        }

        // 悪魔化 (demon_form) の処理
        const dfCount = this.player.getStatusValue('demon_form');
        if (dfCount > 0) this.player.addStatus('strength', dfCount * 2);

        const dfPlusCount = this.player.getStatusValue('demon_form_plus');
        if (dfPlusCount > 0) this.player.addStatus('strength', dfPlusCount * 3);

        this.player.resetEnergy();
        if (this.player.getStatusValue('berserk') > 0) {
            this.player.energy += this.player.getStatusValue('berserk');
        }
        if (!this.player.hasStatus('barricade')) {
            this.player.resetBlock();
        }
        this.drawCards(5);
        this.updateIntent();
        this.uiUpdateCallback();
    }

    async drawCards(count) {
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
            }
            const card = this.player.deck.pop();
            if (!card) continue;
            this.player.hand.push(card);

            // 炎の吐息 (Fire Breathing) の処理
            const fbDamage = this.player.getStatusValue('fire_breathing');
            if (fbDamage > 0 && (card.type === 'curse' || card.isStatus)) {
                console.log(`炎の吐息発動！ ${card.name} を引いたため ${fbDamage} ダメージ。`);
                for (const enemy of this.enemies) {
                    if (!enemy.isDead()) {
                        await this.attackWithEffect(this.player, enemy, fbDamage);
                    }
                }
                this.uiUpdateCallback();
            }

            // 進化 (Evolve) の処理
            const evolveCount = this.player.getStatusValue('evolve');
            if (evolveCount > 0 && card.isStatus) {
                console.log(`進化発動！ ステータスカード ${card.name} を引いたため ${evolveCount} 枚カードを引く。`);
                await this.drawCards(evolveCount);
            }
        }
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // カードを捨て札に加える（状態異常など）
    addCardsToDiscard(cardId, count = 1) {
        const key = cardId.toUpperCase();
        const template = CardLibrary[key];
        if (!template) {
            console.error(`Card template not found: ${cardId}`);
            return;
        }

        for (let i = 0; i < count; i++) {
            const card = template.clone();
            this.player.discard.push(card);
            console.log(`Added ${card.name} to discard pile.`);
        }
        this.uiUpdateCallback();
    }

    async playCard(cardIndex, targetIndex = 0) {
        if (this.phase !== 'player' || this.isProcessing || this.isEnded) return;

        console.log('BattleEngine: Processing started (isProcessing = true)');
        this.isProcessing = true;
        try {
            const card = this.player.hand[cardIndex];
            if (!card) return;

            let target = this.enemies[targetIndex];
            if (!target || target.isDead()) {
                target = this.enemies.find(e => !e.isDead());
            }
            if (!target) return;

            if (this.player.hasStatus('entangled') && card.type === 'attack') {
                console.log("アタック不能！拘束されています。");
                return;
            }

            const currentCost = card.getCost(this.player);
            if (currentCost === 'X' || (typeof currentCost === 'number' && currentCost >= 0 && this.player.energy >= currentCost)) {
                if (!card.canPlay(this.player, this)) {
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
                await card.play(this.player, target, this);

                // ブロックが増えたらエフェクトを表示
                if (this.player.block > oldBlock) {
                    this.showEffectForPlayer('block');
                    if (this.audioManager) this.audioManager.playSe('defense'); // ブロックSE
                }

                // ダブルタップ (Double Tap) の処理
                if (card.type === 'attack') {
                    const doubleTapStatus = this.player.statusEffects.find(s => s.type === 'double_tap');
                    if (doubleTapStatus && doubleTapStatus.value > 0) {
                        this.player.addStatus('double_tap', -1);
                        console.log('Double Tap triggered!');

                        // ターゲットの再取得（もし死んでいたら）
                        let newTarget = target;
                        if (card.targetType === 'single' && (!newTarget || newTarget.isDead())) {
                            newTarget = this.enemies.find(e => !e.isDead());
                        }

                        if (newTarget || card.targetType !== 'single') {
                            await new Promise(resolve => setTimeout(resolve, 300));
                            const oldBlockDT = this.player.block;
                            await card.play(this.player, newTarget, this, true);
                            if (this.player.block > oldBlockDT) {
                                if (this.player.block > oldBlockDT) {
                                    this.showEffectForPlayer('block');
                                    if (this.audioManager) this.audioManager.playSe('defense'); // ブロックSE
                                }
                            }
                        }
                    }
                }

                if (card.type === 'power') {
                    // パワーカードは戦闘から取り除かれる（どこにも追加しない）
                    console.log(`${card.name} は戦闘から取り除かれました。`);
                } else if (card.isExhaust || (this.player.hasStatus('corruption') && card.type === 'skill')) {
                    // 堕落 (Corruption) または元々の廃棄属性
                    if (this.player.hasStatus('corruption') && card.type === 'skill') {
                        console.log(`堕落発動！ ${card.name} は廃棄されました。`);
                    }
                    this.player.exhaustCard(card, this);
                } else {
                    this.player.discard.push(card);
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

            // バグ修正: 第3引数を this.enemies から this (BattleEngine) に変更
            await potion.onUse(this.player, target, this);

            // 使用したのでスロットを空ける
            this.player.potions[potionIndex] = null;

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
    showEffectForPlayer(effectType, callback = null) {
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
    getEntityElement(entity) {
        if (entity === this.player) {
            return document.getElementById('player');
        }
        // 敵のUUIDから検索
        return document.querySelector(`.entity.enemy[data-id="${entity.uuid}"]`) as HTMLElement;
    }

    // ターゲットにエフェクトを表示
    showEffectForTarget(targetIndex, card, callback) {
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
    showEffectsForAllEnemies(card, callback) {
        const aliveEnemies = this.enemies.map((enemy, index) => ({ enemy, index })).filter(e => !e.enemy.isDead());
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

    // エフェクト表示付きで攻撃を実行（複数回攻撃用ヘルパー）
    async attackWithEffect(source, target, damage, targetIndex = null) {
        if (!target || target.isDead()) return;

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
        target.takeDamage(damage, source);
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
        const aliveEnemies = this.enemies.filter(e => !e.isDead());
        if (aliveEnemies.length === 0) return null;
        return aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
    }

    // ランダムな敵にダメージを与える
    async attackRandomEnemy(damage) {
        const target = this.getRandomAliveEnemy();
        if (!target) return;
        await this.attackWithEffect(this.player, target, damage);
        this.uiUpdateCallback();
    }

    // ダメージ処理をエフェクト付きで実行（単体攻撃用の簡易ヘルパー）
    async dealDamageWithEffect(source, target, damage) {
        const targetIndex = this.enemies.indexOf(target);
        await this.attackWithEffect(source, target, damage, targetIndex);
    }

    async endTurn() {
        if (this.phase !== 'player' || this.isEnded) return;

        // 手札にある火傷 (BURN) カードの枚数を確認
        const burnCount = this.player.hand.filter(c => c.id === 'burn').length;
        if (burnCount > 0) {
            console.log(`手札に火傷が ${burnCount} 枚あります。2x${burnCount} ダメージを受けます。`);
            for (let i = 0; i < burnCount; i++) {
                this.player.takeDamage(2, null); // 敵ではなくカードからのダメージ
            }
        }

        // 燃焼 (Combust) の処理
        const combustDamage = this.player.getStatusValue('combust');
        if (combustDamage > 0) {
            console.log(`燃焼発動！ 1 HPを失い、全体に ${combustDamage} ダメージ。`);
            this.player.loseHP(1);
            for (const enemy of this.enemies) {
                if (!enemy.isDead()) {
                    await this.attackWithEffect(this.player, enemy, combustDamage);
                }
            }
            this.checkBattleEnd();
        }

        // 手札を全て捨てる（エセリアルは廃棄）
        const etherealCards = this.player.hand.filter(c => c.isEthereal);
        const nonEtherealCards = this.player.hand.filter(c => !c.isEthereal);

        if (nonEtherealCards.length > 0) {
            this.player.discard.push(...nonEtherealCards);
        }

        if (etherealCards.length > 0) {
            etherealCards.forEach(c => {
                this.player.exhaustCard(c, this);
                console.log(`${c.name} (エセリアル) が廃棄されました。`);
            });
        }

        // レリック: onTurnEnd
        this.player.relics.forEach(relic => {
            if (relic.onTurnEnd) relic.onTurnEnd(this.player, this);
        });

        this.player.hand = [];

        // 金属音 (metallicize) の処理
        const metCount = this.player.getStatusValue('metallicize');
        if (metCount > 0) {
            this.player.addBlock(metCount);
            this.showEffectForPlayer('block');
        }

        // ステータス更新（持続時間減少）
        this.player.updateStatus();

        // 一時的なコスト変更をクリア
        const allCards = [...this.player.hand, ...this.player.deck, ...this.player.discard, ...this.player.exhaust];
        allCards.forEach(card => {
            if (card && card.temporaryCost !== null && card.temporaryCost !== undefined) {
                card.temporaryCost = null;
            }
        });

        this.phase = 'enemy';
        this.uiUpdateCallback();

        // 敵のターン実行
        setTimeout(() => this.enemyTurn(), 1000);
    }

    // 敵を削除（逃走など）
    removeEnemy(enemy) {
        const index = this.enemies.indexOf(enemy);
        if (index !== -1) {
            this.enemies.splice(index, 1);
            console.log(`${enemy.name} escaped!`);
            this.checkBattleEnd();
            this.uiUpdateCallback();
        }
    }

    // 敵を分裂させる
    splitEnemy(parent, childClass1, childClass2) {
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
                if (!enemy.isDead()) {
                    enemy.resetBlock();

                    // 敵の行動実行
                    if (enemy.nextMove) {
                        // 特殊アクション（分裂、逃走など）の場合は engine を渡す
                        // 攻撃処理（ダメージがある場合）
                        if (enemy.nextMove.value > 0) {
                            const damage = enemy.calculateDamage(enemy.nextMove.value);
                            const times = enemy.nextMove.times || 1;
                            for (let i = 0; i < times; i++) {
                                // 攻撃エフェクト付きで実行
                                await this.attackWithEffect(enemy, this.player, damage);
                                this.uiUpdateCallback(); // 攻撃ごとにUI（HP/ブロック）を更新
                                if (times > 1) await new Promise(resolve => setTimeout(resolve, 200));
                            }
                        }

                        // 特殊効果（バフ、デバフ、ブロック、分裂など）
                        if (enemy.nextMove.effect) {
                            // バフ・デバフ時のエフェクトを表示
                            let effectType = 'skill';
                            if (enemy.nextMove.type === 'buff') {
                                const powerTraits = ['growth', 'ritual', 'enrage', 'bellow', '成長', '儀式', '激怒', '咆哮'];
                                if (powerTraits.some(trait =>
                                    (enemy.nextMove.id && enemy.nextMove.id.toLowerCase().includes(trait)) ||
                                    (enemy.nextMove.name && enemy.nextMove.name.includes(trait))
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

                            enemy.nextMove.effect(enemy, this.player, this);
                        }
                    }

                    enemy.updateStatus();
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
        this.enemies.forEach(enemy => {
            if (!enemy.isDead()) {
                // Enemyクラスに decideNextMove メソッドがあればそれを使う
                if (enemy.decideNextMove) {
                    enemy.decideNextMove(this.player);
                } else {
                    // 旧ロジック互換
                    const damage = 5 + Math.floor(Math.random() * 5);
                    enemy.setNextMove({ type: 'attack', value: damage });
                }
            } else {
                enemy.nextMove = null;
            }
        });
    }

    checkBattleEnd() {
        if (this.isEnded) return;
        const allEnemiesDead = this.enemies.every(e => e.isDead());

        if (allEnemiesDead) {
            this.isEnded = true;
            if (this.onBattleEnd) {
                // レリック: onVictory
                this.player.relics.forEach(relic => {
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
