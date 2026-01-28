import { CardLibrary } from './card.js';

export class BattleEngine {
    constructor(player, enemies, uiUpdateCallback, onBattleEnd) {
        this.player = player;
        this.enemies = enemies; // 配列で保持
        this.uiUpdateCallback = uiUpdateCallback;
        this.onBattleEnd = onBattleEnd;
        this.turn = 1;
        this.phase = 'player'; // 'player' or 'enemy'
    }

    start() {
        // 状態のリセット
        this.player.hand = [];
        this.player.discard = [];
        this.player.resetBlock(); // ブロックもリセット

        // デッキを準備（マスターデッキからコピー）
        this.player.deck = [];
        this.player.masterDeck.forEach(card => {
            this.player.deck.push(card.clone());
        });

        this.shuffle(this.player.deck);
        this.startPlayerTurn();
    }

    startPlayerTurn() {
        this.phase = 'player';
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

        // ターゲット取得
        let target = this.enemies[targetIndex];

        // もしターゲットが死んでいたら、生存している別の敵を探す
        if (target && target.isDead()) {
            target = this.enemies.find(e => !e.isDead());
        }

        // 敵がいない、またはカードがターゲットを必要としない場合（全体攻撃など）の制御も将来必要
        // ここではターゲット必須とする
        if (!target) return;

        if (this.player.energy >= card.cost) {
            // カード効果発動
            card.play(this.player, target, this);
            this.player.hand.splice(cardIndex, 1);
            this.player.discard.push(card); // 捨て札に追加

            this.checkBattleEnd();
            this.uiUpdateCallback();
        }
    }

    endTurn() {
        if (this.phase !== 'player') return;

        // 手札を全て捨てる
        this.player.discard.push(...this.player.hand);
        this.player.hand = [];

        // ステータス更新（持続時間減少）
        this.player.updateStatus();

        this.phase = 'enemy';
        this.uiUpdateCallback();

        // 敵のターン実行
        setTimeout(() => this.enemyTurn(), 1000);
    }

    enemyTurn() {
        // 全ての生存している敵が行動
        this.enemies.forEach(enemy => {
            if (!enemy.isDead()) {
                enemy.resetBlock();

                // 敵の行動実行
                if (enemy.nextMove) {
                    // TODO: Enemyクラスにact()メソッドを持たせて委譲するのが良い
                    // 今回は簡易的にここで処理、あるいはnextMoveの内容に基づいて分岐
                    if (enemy.nextMove.type === 'attack') {
                        this.player.takeDamage(enemy.nextMove.value);
                    } else if (enemy.nextMove.type === 'buff') {
                        // バフ行動の場合の処理（例: 筋力アップ）
                        // 現状はログだけだが、実装するなら enemy.addStatus...
                        if (enemy.nextMove.effect) {
                            enemy.nextMove.effect(enemy, this.player);
                        }
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
                    enemy.decideNextMove();
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
            if (this.onBattleEnd) this.onBattleEnd('win');
        } else if (this.player.isDead()) {
            if (this.onBattleEnd) this.onBattleEnd('lose');
        }
    }
}
