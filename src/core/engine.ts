import { CardLibrary } from './card';

export class BattleEngine {
    player: any;
    enemies: any[];
    uiUpdateCallback: any;
    onBattleEnd: any;
    onCardSelectionRequest: any;
    effectManager: any;
    turn: number;
    phase: string;
    isProcessing: boolean = false;
    isEnded: boolean = false;

    constructor(player, enemies, uiUpdateCallback, onBattleEnd, onCardSelectionRequest, effectManager = null) {
        this.player = player;
        this.enemies = enemies; // 配列で保持
        this.uiUpdateCallback = uiUpdateCallback;
        this.onBattleEnd = onBattleEnd;
        this.onCardSelectionRequest = onCardSelectionRequest;
        this.effectManager = effectManager; // エフェクト管理クラス
        this.turn = 1;
        this.phase = 'player'; // 'player' or 'enemy'
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

        this.shuffle(this.player.deck);

        // レリック: onBattleStart
        this.player.relics.forEach(relic => {
            if (relic.onBattleStart) relic.onBattleStart(this.player, this);
        });

        this.startPlayerTurn();
    }

    startPlayerTurn() {
        this.phase = 'player';

        // 悪魔化 (demon_form) の処理
        const dfCount = this.player.getStatusValue('demon_form');
        if (dfCount > 0) this.player.addStatus('strength', dfCount * 2);

        const dfPlusCount = this.player.getStatusValue('demon_form_plus');
        if (dfPlusCount > 0) this.player.addStatus('strength', dfPlusCount * 3);

        this.player.resetEnergy();
        this.player.resetBlock();
        this.drawCards(5);
        this.updateIntent();
        this.uiUpdateCallback();
    }

    drawCards(count) {
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
            this.player.hand.push(this.player.deck.pop());
        }
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    async playCard(cardIndex, targetIndex = 0) {
        if (this.phase !== 'player' || this.isProcessing || this.isEnded) return;

        console.log('BattleEngine: Processing started (isProcessing = true)');
        this.isProcessing = true;
        try {
            const card = this.player.hand[cardIndex];
            if (!card) return;

            let target = this.enemies[targetIndex];
            if (target && target.isDead()) {
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

                this.player.hand.splice(cardIndex, 1);
                await card.play(this.player, target, this);

                if (card.isExhaust) {
                    this.player.exhaust.push(card);
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

    // ターゲットにエフェクトを表示
    showEffectForTarget(targetIndex, card, callback) {
        // targetIndexは使わず、enemies[targetIndex]からUUIDを取得してDOMを引く
        // もしtargetIndexがnullなら処理できないが、呼び出し側で解決済みとする
        const target = this.enemies[targetIndex];
        if (!target) {
            if (callback) callback();
            return;
        }

        const enemyElement = document.querySelector(`.entity.enemy[data-id="${target.uuid}"]`);
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

        // エフェクトを表示
        if (this.effectManager) {
            const enemyElement = document.querySelector(`.entity.enemy[data-id="${target.uuid}"]`);
            if (enemyElement) {
                await this.effectManager.showAttackEffectAsync(enemyElement, 'slash');
            }
        }

        // ダメージを与える
        target.takeDamage(damage, source);
    }

    // ダメージ処理をエフェクト付きで実行（単体攻撃用の簡易ヘルパー）
    async dealDamageWithEffect(source, target, damage) {
        const targetIndex = this.enemies.indexOf(target);
        await this.attackWithEffect(source, target, damage, targetIndex);
    }

    endTurn() {
        if (this.phase !== 'player' || this.isEnded) return;

        // 手札にある火傷 (BURN) カードの枚数を確認
        const burnCount = this.player.hand.filter(c => c.id === 'burn').length;
        if (burnCount > 0) {
            console.log(`手札に火傷が ${burnCount} 枚あります。2x${burnCount} ダメージを受けます。`);
            for (let i = 0; i < burnCount; i++) {
                this.player.takeDamage(2, null); // 敵ではなくカードからのダメージ
            }
        }

        // 手札を全て捨てる（エセリアルは廃棄）
        const etherealCards = this.player.hand.filter(c => c.isEthereal);
        const nonEtherealCards = this.player.hand.filter(c => !c.isEthereal);

        if (nonEtherealCards.length > 0) {
            this.player.discard.push(...nonEtherealCards);
        }

        if (etherealCards.length > 0) {
            etherealCards.forEach(c => {
                this.player.exhaust.push(c);
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
        if (metCount > 0) this.player.addBlock(metCount);

        // ステータス更新（持続時間減少）
        this.player.updateStatus();

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

    enemyTurn() {
        if (this.isEnded) return;
        // 全ての生存している敵が行動
        this.enemies.forEach(enemy => {
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
                            this.player.takeDamage(damage, enemy);
                        }
                    }

                    // 特殊効果（バフ、デバフ、ブロック、分裂など）
                    if (enemy.nextMove.effect) {
                        enemy.nextMove.effect(enemy, this.player, this);
                    }
                }

                enemy.updateStatus();
            }
        });

        this.turn++;
        this.checkBattleEnd();
        if (!this.isEnded && !this.player.isDead()) {
            this.startPlayerTurn();
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
