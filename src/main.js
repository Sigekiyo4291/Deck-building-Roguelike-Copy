import './style.css';
import { Player, Enemy } from './core/entity.js';
import { BattleEngine } from './core/engine.js';
import { SceneManager } from './core/scene-manager.js';
import { MapGenerator } from './core/map-generator.js';

class Game {
  constructor() {
    this.player = new Player();
    this.sceneManager = new SceneManager(this);
    this.map = null;
    this.battleEngine = null;

    // UI要素
    this.elMapContainer = document.getElementById('map-container');

    // バトルUI要素
    this.elPlayerHpText = document.getElementById('player-hp-text');
    this.elPlayerHpFill = document.getElementById('player-hp-fill');
    this.elPlayerBlock = document.getElementById('player-block');
    this.elPlayerBlockText = document.getElementById('player-block-text');

    this.elEnemyHpText = document.getElementById('enemy-hp-text');
    this.elEnemyHpFill = document.getElementById('enemy-hp-fill');
    this.elEnemyBlock = document.getElementById('enemy-block');
    this.elEnemyBlockText = document.getElementById('enemy-block-text');
    this.elEnemyIntent = document.getElementById('enemy-intent');

    this.elHand = document.getElementById('hand');
    this.elEnergyValue = document.getElementById('energy-value');
    this.elDeckCount = document.getElementById('deck-count');
    this.elDiscardCount = document.getElementById('discard-count');
    this.elEndTurnBtn = document.getElementById('end-turn-btn');

    // イベントリスナー設定
    this.elEndTurnBtn.onclick = () => {
      if (this.battleEngine) this.battleEngine.endTurn();
    };
  }

  start() {
    // マップ生成（初回のみ）
    if (!this.map) {
      this.map = MapGenerator.generate();
      this.map.updateAvailableNodes();
    }

    // マップシーン表示
    this.renderMap();
    this.sceneManager.showMap();
  }

  renderMap() {
    this.elMapContainer.innerHTML = '';

    // パス描画用のSVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'map-paths-svg');
    this.elMapContainer.appendChild(svg);

    // ノード描画（下の階層から順に）
    this.map.layers.forEach((layer, layerIndex) => {
      const layerEl = document.createElement('div');
      layerEl.className = 'map-layer';

      layer.forEach(node => {
        const nodeEl = document.createElement('div');
        nodeEl.className = `map-node ${node.type}`;
        nodeEl.dataset.id = node.id;

        // アイコン設定
        let icon = '?';
        if (node.type === 'enemy') icon = '⚔️';
        else if (node.type === 'elite') icon = '👿';
        else if (node.type === 'rest') icon = '🔥';
        else if (node.type === 'shop') icon = '💰';
        else if (node.type === 'treasure') icon = '💎';
        else if (node.type === 'boss') icon = '👑';

        nodeEl.textContent = icon;

        // 状態クラス付与
        if (node.isClear) nodeEl.classList.add('cleared');
        else if (node.isAvailable) nodeEl.classList.add('available');
        else nodeEl.classList.add('locked');

        // クリックイベント
        nodeEl.onclick = () => {
          if (node.isAvailable && !node.isClear) {
            this.onNodeSelect(node);
          }
        };

        layerEl.appendChild(nodeEl);
      });
      this.elMapContainer.appendChild(layerEl);
    });

    // 簡易的なパス描画（座標計算が複雑なため、今回はモックとして線を表示しませんが、
    // 将来的にはここでSVG lineを追加します。DOM要素の位置を取得する必要があるため
    // requestAnimationFrameなどで描画後に実行する必要があります）
  }

  onNodeSelect(node) {
    this.map.currentNode = node;
    node.isClear = true; // バトル開始前にクリア扱い（仮）本来は勝利後

    if (node.type === 'enemy' || node.type === 'elite' || node.type === 'boss') {
      this.startBattle(node.type);
    } else {
      alert(`${node.type} ノードに到達しました（イベント未実装）`);
      this.map.updateAvailableNodes();
      this.renderMap();
    }
  }

  startBattle(type) {
    // 敵データ生成
    let enemyName = 'スライム';
    let enemyHp = 40;
    let enemyImg = '/src/assets/slime.png';

    if (type === 'boss') {
      enemyName = 'ボススライム';
      enemyHp = 100;
    } else if (type === 'elite') {
      enemyName = 'エリートスライム';
      enemyHp = 70;
    }

    const enemy = new Enemy(enemyName, enemyHp, enemyImg);

    // バトルエンジン初期化
    this.battleEngine = new BattleEngine(
      this.player,
      enemy,
      () => this.updateBattleUI(),
      (result) => {
        if (result === 'win') {
          this.onBattleWin();
        } else {
          alert('Game Over...');
          location.reload(); // 敗北時はリロードで最初から
        }
      }
    );

    // シーン切り替え
    this.sceneManager.showBattle();

    // バトル開始
    this.battleEngine.start();
    this.updateBattleUI();
  }

  onBattleWin() {
    alert('Victory!');
    // マップに戻る
    this.map.updateAvailableNodes();
    this.renderMap(); // マップを再描画して状態を反映
    this.sceneManager.showMap();
  }

  updateBattleUI() {
    if (!this.battleEngine) return;
    const player = this.battleEngine.player;
    const enemy = this.battleEngine.enemy;

    // プレイヤー情報更新
    this.elPlayerHpText.textContent = `${player.hp} / ${player.maxHp}`;
    this.elPlayerHpFill.style.width = `${(player.hp / player.maxHp) * 100}%`;
    this.elPlayerBlock.style.width = `${Math.min(100, (player.block / player.maxHp) * 100)}%`;

    if (player.block > 0) {
      this.elPlayerBlockText.textContent = `🛡️${player.block}`;
      this.elPlayerBlockText.style.display = 'flex';
    } else {
      this.elPlayerBlockText.style.display = 'none';
    }

    // 敵情報更新
    this.elEnemyHpText.textContent = `${enemy.hp} / ${enemy.maxHp}`;
    this.elEnemyHpFill.style.width = `${(enemy.hp / enemy.maxHp) * 100}%`;
    this.elEnemyBlock.style.width = `${Math.min(100, (enemy.block / enemy.maxHp) * 100)}%`;

    if (enemy.block > 0) {
      this.elEnemyBlockText.textContent = `🛡️${enemy.block}`;
      this.elEnemyBlockText.style.display = 'flex';
    } else {
      this.elEnemyBlockText.style.display = 'none';
    }

    // インテント更新
    if (enemy.nextMove) {
      this.elEnemyIntent.textContent = `🗡️${enemy.nextMove.value}`;
      this.elEnemyIntent.style.display = 'flex';
    } else {
      this.elEnemyIntent.style.display = 'none';
    }

    // エネルギー更新
    this.elEnergyValue.textContent = player.energy;

    // 山札・捨て札更新
    this.elDeckCount.textContent = player.deck.length;
    this.elDiscardCount.textContent = player.discard.length;

    // 手札更新
    this.elHand.innerHTML = '';
    player.hand.forEach((card, index) => {
      this.createCardElement(card, index);
    });

    // ターン終了ボタン
    this.elEndTurnBtn.disabled = (this.battleEngine.phase !== 'player');
  }

  createCardElement(card, index) {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    cardEl.innerHTML = `
            <div class="card-cost">${card.cost}</div>
            <div class="card-title">${card.name}</div>
            <div class="card-desc">${card.description}</div>
        `;

    // ドラッグ実装（簡易版: 以前のコードを統合）
    // ... (ドラッグロジックは長いので、ここではonClickなどに簡略化するか、以前のコードをそのまま持ってくる)
    // 今回は簡略化のため、クリックでプレイに変更（ドラッグロジックの移植が長くなるため）
    // いや、ユーザーはドラッグを気に入っているはずなので、ドラッグロジックも入れます。

    // ... (ドラッグロジック移植)
    let startY = 0;
    let isDragging = false;
    const threshold = -100;

    cardEl.style.touchAction = 'none';
    cardEl.style.cursor = 'grab';

    cardEl.onpointerdown = (e) => {
      if (this.battleEngine.phase !== 'player') return;
      startY = e.clientY;
      isDragging = true;
      cardEl.classList.add('dragging');
      cardEl.style.cursor = 'grabbing';
      cardEl.setPointerCapture(e.pointerId);
      e.preventDefault();
    };

    cardEl.onpointermove = (e) => {
      if (!isDragging) return;
      const deltaY = e.clientY - startY;
      const translateY = Math.max(-400, Math.min(100, deltaY));
      cardEl.style.transform = `translateY(${translateY}px) scale(1.1)`;

      if (translateY < threshold) {
        cardEl.style.filter = 'brightness(1.3) drop-shadow(0 0 15px gold)';
      } else {
        cardEl.style.filter = '';
      }
      e.preventDefault();
    };

    cardEl.onpointerup = (e) => {
      if (!isDragging) return;
      isDragging = false;
      cardEl.classList.remove('dragging');
      cardEl.style.cursor = 'grab';

      const deltaY = e.clientY - startY;
      if (deltaY < threshold) {
        cardEl.releasePointerCapture(e.pointerId);
        this.battleEngine.playCard(index);
      } else {
        cardEl.releasePointerCapture(e.pointerId);
        cardEl.style.transform = '';
        cardEl.style.filter = '';
      }
      e.preventDefault();
    };

    this.elHand.appendChild(cardEl);
  }
}

// ゲーム開始
const game = new Game();
game.start();
