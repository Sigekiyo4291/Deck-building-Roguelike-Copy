export class BattleEngine {
    constructor(player, enemy, uiUpdateCallback) {
        this.player = player;
        this.enemy = enemy;
        this.uiUpdateCallback = uiUpdateCallback;
        this.turn = 1;
        this.phase = 'player'; // 'player' or 'enemy'
    }

    start() {
        // デッキを準備（ストライクx5, ディフェンドx4, 強打x1）
        this.player.deck = [];
        for (let i = 0; i < 5; i++) this.player.deck.push(CardLibrary.STRIKE.clone());
        for (let i = 0; i < 4; i++) this.player.deck.push(CardLibrary.DEFEND.clone());
        this.player.deck.push(CardLibrary.BASH.clone());

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

        this.phase = 'enemy';
        this.uiUpdateCallback();

        // 敵のターン実行
        setTimeout(() => this.enemyTurn(), 1000);
    }

    enemyTurn() {
        this.enemy.resetBlock();
        // 簡易的な敵の行動
        this.player.takeDamage(this.enemy.nextMove.value);

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
            alert('Victory!');
            location.reload();
        } else if (this.player.isDead()) {
            alert('Game Over...');
            location.reload();
        }
    }
}

import { CardLibrary } from './card.js';
