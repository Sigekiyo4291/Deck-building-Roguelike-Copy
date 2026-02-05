import { CardLibrary } from './card.js';

export class BattleEngine {
    constructor(player, enemies, uiUpdateCallback, onBattleEnd, onCardSelectionRequest) {
        this.player = player;
        this.enemies = enemies; // 配列で保持
        this.uiUpdateCallback = uiUpdateCallback;
        this.onBattleEnd = onBattleEnd;
        this.onCardSelectionRequest = onCardSelectionRequest;
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

    playCard(cardIndex, targetIndex = 0) {
        if (this.phase !== 'player') return;

        const card = this.player.hand[cardIndex];

        // 呪いカードは使用できない
        if (card.type === 'curse') return;

        // ターゲット取得

        let target = this.enemies[targetIndex];

        // もしターゲットが死んでいたら、生存している別の敵を探す
        if (target && target.isDead()) {
            target = this.enemies.find(e => !e.isDead());
        }

        // 敵がいない、またはカードがターゲットを必要としない場合（全体攻撃など）の制御も将来必要
        // ここではターゲット必須とする
        if (!target) return;

        // 拘束(entangled)状態ならアタックカードを使用できない
        if (this.player.hasStatus('entangled') && card.type === 'attack') {
            console.log("アタック不能！拘束されています。");
            return;
        }

        const currentCost = card.getCost(this.player);
        if (currentCost === 'X' || (typeof currentCost === 'number' && currentCost >= 0 && this.player.energy >= currentCost)) {
            // 使用条件チェック (クラッシュの手札制限など)
            if (!card.canPlay(this.player, this)) {
                console.log("使用条件を満たしていません！");
                return;
            }

            // カード効果発動
            card.play(this.player, target, this);
            this.player.hand.splice(cardIndex, 1);

            if (card.isExhaust) {
                this.player.exhaust.push(card);
                console.log(`${card.name} は廃棄されました。`);
            } else {
                this.player.discard.push(card); // 捨て札に追加
            }

            this.checkBattleEnd();
            this.uiUpdateCallback();
        }
    }

    endTurn() {
        if (this.phase !== 'player') return;

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
        if (!this.player.isDead()) {
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
        const allEnemiesDead = this.enemies.every(e => e.isDead());

        if (allEnemiesDead) {
            if (this.onBattleEnd) {
                // レリック: onVictory
                this.player.relics.forEach(relic => {
                    if (relic.onVictory) relic.onVictory(this.player, this);
                });
                this.onBattleEnd('win');
            }
        } else if (this.player.isDead()) {
            if (this.onBattleEnd) this.onBattleEnd('lose');
        }
    }
}
