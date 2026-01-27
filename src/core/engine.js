export class BattleEngine {
    constructor(player, enemy, uiUpdateCallback, onBattleEnd) {
        this.player = player;
        this.enemy = enemy;
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

    playCard(cardIndex) {
        if (this.phase !== 'player') return;

        const card = this.player.hand[cardIndex];
        if (this.player.energy >= card.cost) {
            card.play(this.player, this.enemy);
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
        this.enemy.resetBlock();
        // 簡易的な敵の行動
        // TODO: 敵がステータス異常の影響を受ける場合（例: 弱体）のダメージ計算修正が必要だが、
        // takeDamage側で処理しているので、ここでは与えるダメージの管理
        // プレイヤーが「脆弱」なら敵の攻撃ダメージが増える処理も必要
        // 今回はとりあえず敵の行動後にステータス更新
        this.player.takeDamage(this.enemy.nextMove.value);

        this.enemy.updateStatus();

        this.turn++;
        this.checkBattleEnd();
        if (!this.player.isDead()) {
            this.startPlayerTurn();
        }
    }

    updateIntent() {
        // 次のターンのダメージをランダムに決定
        const damage = 5 + Math.floor(Math.random() * 5);
        this.enemy.setNextMove({ type: 'attack', value: damage });
    }

    checkBattleEnd() {
        if (this.enemy.isDead()) {
            if (this.onBattleEnd) this.onBattleEnd('win');
        } else if (this.player.isDead()) {
            if (this.onBattleEnd) this.onBattleEnd('lose');
        }
    }
}

import { CardLibrary } from './card.js';
