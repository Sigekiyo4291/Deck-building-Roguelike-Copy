import './style.css';
import { GameMap } from './core/map-data.js';
import { MapGenerator } from './core/map-generator.js';
import { SceneManager } from './core/scene-manager.js';
import { Player, Enemy, Louse } from './core/entity.js';
import { CardLibrary } from './core/card.js';
import { BattleEngine } from './core/engine.js';
import { RelicLibrary } from './core/relic.js';

class Game {
  constructor() {
    this.player = new Player();
    this.map = null;
    this.battleEngine = null;
    this.sceneManager = new SceneManager(this);
    this.selectedEnemyIndex = 0; // デフォルトターゲット初期化

    // UI Elements
    this.elDeckCount = document.getElementById('deck-count');
    this.elDiscardCount = document.getElementById('discard-count');
    this.elEndTurnBtn = document.getElementById('end-turn-btn');
    this.elHand = document.getElementById('hand');

    // 状態管理
    this.selectedCardIndex = -1; // カード選択状態

    // イベントリスナー設定
    this.elEndTurnBtn.onclick = () => {
      if (this.battleEngine) {
        this.deselectCard();
        this.battleEngine.endTurn();
      }
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
    this.sceneManager.renderMap(this.map, (node) => this.onNodeSelect(node));
  }

  onNodeSelect(node) {
    this.map.currentNode = node;
    node.isClear = true;

    if (node.type === 'enemy' || node.type === 'elite' || node.type === 'boss') {
      this.isEliteBattle = (node.type === 'elite' || node.type === 'boss'); // エリート/ボスの判定
      this.startBattle(node.type);
    } else {
      alert(`${node.type} ノードに到達しました（イベント未実装）`);
      this.map.updateAvailableNodes();
      this.renderMap();
    }
  }

  startBattle(type) {
    // 敵データ生成（複数体）
    let enemies = [];

    if (type === 'boss') {
      enemies.push(new Enemy('ボススライム', 100, '/src/assets/slime.png'));
    } else {
      // 1-3体の敵をランダム生成
      // 基本はLouse（寄生虫）またはSlime
      const count = 1 + Math.floor(Math.random() * 2); // 1-2体（最初は控えめに）

      for (let i = 0; i < count; i++) {
        const roll = Math.random();
        if (roll < 0.4) {
          enemies.push(new Louse('red'));
        } else if (roll < 0.8) {
          enemies.push(new Louse('green'));
        } else {
          enemies.push(new Enemy('スライム', 30 + Math.floor(Math.random() * 10), '/src/assets/slime.png'));
        }
      }
    }

    // バトルエンジン初期化
    if (this.battleEngine) {
      this.battleEngine = null; // 古いインスタンス破棄
    }
    this.battleEngine = new BattleEngine(
      this.player,
      enemies,
      () => this.updateBattleUI(),
      (result) => {
        if (result === 'win') {
          this.onBattleWin();
        } else {
          alert('Game Over...');
          location.reload();
        }
      }
    );

    // シーン切り替え
    this.sceneManager.showBattle();
    this.battleEngine.start();
    this.updateBattleUI();
    this.updateRelicUI(); // 初期表示
  }

  onBattleWin() {
    this.deselectCard();
    alert('Victory!');

    // リワード画面表示
    this.showRewardScene(this.isEliteBattle);
  }

  showRewardScene(isElite) {
    this.sceneManager.showReward();

    const listEl = document.getElementById('reward-list');
    listEl.innerHTML = '';

    // ランダム報酬生成
    const rewards = [];
    // ゴールド
    rewards.push({ type: 'gold', value: 10 + Math.floor(Math.random() * 20) + (isElite ? 20 : 0), taken: false });

    // カード
    rewards.push({ type: 'card', taken: false });

    // ポーション（30%）
    if (Math.random() < 0.3) {
      rewards.push({ type: 'potion', taken: false });
    }

    // レリック（エリート戦なら確定）
    if (isElite) {
      // 未所持のレリックからランダムに1つ選ぶ
      const ownedIds = this.player.relics.map(r => r.id);
      const candidates = Object.values(RelicLibrary).filter(r =>
        !ownedIds.includes(r.id) && r.rarity !== 'starter' && r.rarity !== 'boss'
      );

      if (candidates.length > 0) {
        const relic = candidates[Math.floor(Math.random() * candidates.length)];
        rewards.push({ type: 'relic', data: relic, taken: false });
      }
    }

    rewards.forEach((reward, index) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'reward-item';

      let text = '';
      if (reward.type === 'gold') text = `💰 ゴールド (${reward.value})`;
      if (reward.type === 'card') text = `🎴 カードを追加`;
      if (reward.type === 'potion') text = `🧪 ポーション`;
      if (reward.type === 'relic') text = `💍 レリック: ${reward.data.name}`;

      itemEl.textContent = text;
      itemEl.onclick = () => {
        if (!reward.taken) this.onRewardClick(reward, index, itemEl);
      };

      listEl.appendChild(itemEl);
    });

    // 次へボタンの設定
    const doneBtn = document.getElementById('reward-done-btn');
    doneBtn.onclick = () => {
      // マップに戻る
      this.map.updateAvailableNodes();
      this.renderMap();
      this.sceneManager.showMap();
    };
  }

  // onRewardClickの修正: itemElを受け取ってクリック後に無効化スタイル適用
  onRewardClick(reward, index, itemEl) {
    if (reward.type === 'gold') {
      this.player.gold += reward.value;
      alert(`${reward.value} ゴールドを獲得しました！ (所持金: ${this.player.gold}G)`);
      reward.taken = true;
      itemEl.style.opacity = '0.5';
      itemEl.style.textDecoration = 'line-through';
      this.updatePlayerStatsUI(); // 所持金表示更新
    } else if (reward.type === 'card') {
      this.showCardSelection(reward, itemEl);
    } else if (reward.type === 'potion') {
      alert('ポーションを獲得しました（未実装）');
      reward.taken = true;
      itemEl.style.opacity = '0.5';
      itemEl.style.textDecoration = 'line-through';
    } else if (reward.type === 'relic') {
      const relic = reward.data;
      this.player.relics.push(relic);
      if (relic.onObtain) relic.onObtain(this.player);

      alert(`${relic.name} を獲得しました！\n効果: ${relic.description}`);
      reward.taken = true;
      itemEl.style.opacity = '0.5';
      itemEl.style.textDecoration = 'line-through';
      this.updateRelicUI(); // UI更新
    }
  }

  updateRelicUI() {
    const container = document.getElementById('relic-container');
    if (!container) return;
    container.innerHTML = '';

    this.player.relics.forEach(relic => {
      const icon = document.createElement('div');
      icon.className = 'relic-icon';
      icon.textContent = relic.name.charAt(0);
      icon.setAttribute('data-tooltip', `${relic.name}\n${relic.rarity}\n\n${relic.description}`);
      container.appendChild(icon);
    });
  }

  showCardSelection(rewardItem, itemEl) {
    const overlay = document.getElementById('card-reward-overlay');
    const container = document.getElementById('card-choices');
    const skipBtn = document.getElementById('skip-card-btn');

    container.innerHTML = '';

    // ランダムなカード候補を3枚生成
    const keys = Object.keys(CardLibrary);
    for (let i = 0; i < 3; i++) {
      // 全カード配列からランダム取得
      // （レアリティ抽選ロジックは今回省略、完全ランダム）
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      const card = CardLibrary[randomKey].clone();

      const cardEl = this.createRewardCardElement(card);
      cardEl.onclick = () => {
        this.player.masterDeck.push(card);
        alert(`${card.name} をデッキに追加しました！`);
        rewardItem.taken = true;
        itemEl.style.opacity = '0.5';
        itemEl.style.textDecoration = 'line-through';
        overlay.style.display = 'none';
      };
      container.appendChild(cardEl);
    }

    overlay.style.display = 'flex';
    skipBtn.onclick = () => {
      overlay.style.display = 'none';
      rewardItem.taken = true; // スキップしたら取得済み扱い
      itemEl.style.opacity = '0.5';
      itemEl.style.textDecoration = 'line-through';
    };
  }

  createRewardCardElement(card) {
    const cardEl = document.createElement('div');
    cardEl.className = `card ${card.rarity}`;
    cardEl.innerHTML = `
            <div class="card-cost">${card.cost}</div>
            <div class="card-title">${card.name}</div>
            <div class="card-desc">${card.description}</div>
            <div class="card-type">${card.type}</div>
      `;
    return cardEl;
  }

  updatePlayerStatsUI() {
    // プレイヤーのHP/Block/Energy/Deckなどの更新
    // updateBattleUIの一部として呼ばれるが、単独でも呼べるように
    // 今回はupdateBattleUIに集約するので空でもいいが、リワード時のGold更新用にあると便利
    // しかしGold表示要素はまだないのでログのみ
  }

  updateBattleUI() {
    try {
      const player = this.player;

      // --- Player UI Update ---
      const playerHpFill = document.getElementById('player-hp-fill');
      const playerHpText = document.getElementById('player-hp-text');
      const playerBlock = document.getElementById('player-block');
      const playerBlockText = document.getElementById('player-block-text');

      const playerHpPercent = (player.hp / player.maxHp) * 100;
      playerHpFill.style.width = `${playerHpPercent}%`;
      playerHpText.textContent = `${player.hp} / ${player.maxHp}`;

      if (player.block > 0) {
        playerBlock.style.width = `${playerHpPercent}%`; // ブロックバーの表示ロジックは簡易的にHPバーと同じ幅に重ねる？
        // ブロックはHPの上に加算表示するUIが多いが、ここでは簡易実装
        // Slay the SpireではHPバーの左に盾アイコンが出る。
        playerBlock.style.width = '0%'; // バー表示はやめて数値のみにする
        playerBlockText.textContent = `🛡️${player.block}`;
        playerBlockText.style.display = 'inline';
      } else {
        playerBlock.style.width = '0%';
        playerBlockText.style.display = 'none';
      }

      // プレイヤーのステータス
      this.updateStatusUI(player, 'player-status-container');

      // --- Enemy UI Update ---
      const enemiesContainer = document.getElementById('enemies-container');
      enemiesContainer.innerHTML = '';

      this.battleEngine.enemies.forEach((enemy, index) => {
        if (enemy.isDead()) return; // 死んだ敵は表示しない（あるいは死体表示）

        const enemyEl = document.createElement('div');
        enemyEl.className = 'entity enemy';

        // 選択中の敵をハイライト
        if (this.selectedEnemyIndex === index) {
          enemyEl.classList.add('selected-target');
        }

        enemyEl.onclick = () => this.onEnemyClick(index);

        // 意図アイコン
        let intentHtml = '';
        if (enemy.nextMove) {
          if (enemy.nextMove.type === 'attack') {
            intentHtml = `<div class="intent-icon">🗡️${enemy.nextMove.value}</div>`;
          } else if (enemy.nextMove.type === 'buff') {
            intentHtml = `<div class="intent-icon">💪</div>`;
          }
        }

        // HPバー計算
        const hpPercent = (enemy.hp / enemy.maxHp) * 100;
        let blockHtml = '';
        if (enemy.block > 0) {
          blockHtml = `<span class="block-text">🛡️${enemy.block}</span>`;
        }

        // ステータス生成（innerHTMLでまとめて埋め込むのは難しいので後でappendする）

        enemyEl.innerHTML = `
            ${intentHtml}
            <img src="${enemy.sprite}" alt="${enemy.name}" class="entity-sprite" />
            <div class="entity-info">
                <div class="hp-bar-container">
                    <div class="hp-bar-fill" style="width: ${hpPercent}%;"></div>
                </div>
                <div class="status-text">
                    <span>${enemy.hp} / ${enemy.maxHp}</span>
                    ${blockHtml}
                </div>
                <div id="enemy-status-${index}" class="status-container"></div>
            </div>
        `;

        enemiesContainer.appendChild(enemyEl);

        // ステータスアイコン生成
        this.updateStatusUI(enemy, `enemy-status-${index}`);
      });

      // --- Deck / Energy ---
      document.getElementById('energy-value').textContent = player.energy;
      document.getElementById('deck-count').textContent = player.deck.length;
      document.getElementById('discard-count').textContent = player.discard.length;

      // --- Hand ---
      this.elHand.innerHTML = '';
      player.hand.forEach((card, index) => {
        const cardEl = this.createCardElement(card, index);
        this.elHand.appendChild(cardEl);
      });

      // ターン終了ボタン
      this.elEndTurnBtn.disabled = (this.battleEngine.phase !== 'player');
    } catch (e) {
      console.error('UpdateBattleUI Error:', e);
      alert('UI Error: ' + e.message);
    }
  }

  updateStatusUI(entity, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    entity.statusEffects.forEach(status => {
      const iconEl = document.createElement('div');
      iconEl.className = 'status-icon';

      let iconChar = '❓';
      if (status.type === 'vulnerable') iconChar = '💔';
      if (status.type === 'strength') iconChar = '💪';

      iconEl.textContent = iconChar;

      const valueEl = document.createElement('div');
      valueEl.className = 'status-value';
      valueEl.textContent = status.value;

      iconEl.appendChild(valueEl);
      container.appendChild(iconEl);
    });
  }

  createCardElement(card, index) {
    const cardEl = document.createElement('div');
    cardEl.className = `card ${card.rarity}`;

    cardEl.innerHTML = `
              <div class="card-cost">${card.cost}</div>
              <div class="card-title">${card.name}</div>
              <div class="card-desc">${card.description}</div>
              <div class="card-type">${card.type}</div>
      `;

    // ドラッグ処理変数の初期化
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    cardEl.onpointerdown = (e) => {
      if (this.battleEngine.phase !== 'player') return;
      e.preventDefault();
      e.stopPropagation();

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      cardEl.classList.add('dragging');
      cardEl.setPointerCapture(e.pointerId);
    };

    cardEl.onpointermove = (e) => {
      if (!isDragging) return;
      e.preventDefault();

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      cardEl.style.transform = `translate(${dx}px, ${dy}px) scale(1.1) rotate(0deg)`;
    };

    cardEl.onpointerup = (e) => {
      if (!isDragging) return;
      isDragging = false;
      cardEl.classList.remove('dragging');
      cardEl.releasePointerCapture(e.pointerId);

      const dy = e.clientY - startY;
      const threshold = -150;

      if (dy < threshold) {
        this.tryPlayCard(index);
      } else {
        cardEl.style.transform = '';
      }
    };

    cardEl.onclick = (e) => {
      e.stopPropagation();
    };

    return cardEl;
  }

  // ドラッグ完了時のカード使用処理
  tryPlayCard(index) {
    const card = this.player.hand[index];

    // エネルギーチェック
    if (this.player.energy < card.cost) {
      alert('エネルギーが足りません！');
      this.updateBattleUI(); // 位置リセットのために再描画
      return;
    }

    if (card.targetType === 'single') {
      // 選択中のターゲットを使用
      let targetIdx = this.selectedEnemyIndex;
      if (targetIdx === undefined || targetIdx === null) targetIdx = 0; // ガード
      const target = this.battleEngine.enemies[targetIdx];

      if (!target || target.isDead()) {
        // 念のため再検索
        const firstAlive = this.battleEngine.enemies.find(e => !e.isDead());
        if (!firstAlive) return; // 敵がいない
        // aliveな敵のインデックスを探す（findだけだとindex取れないので配列操作が必要だが、engine側でよしなにやってくれるならtarget objectを渡したいが、engineはindexベース）
        // 簡易的に現状のselectedEnemyIndexを信じる、ダメなら最初の生存敵
        if (this.battleEngine.enemies[targetIdx] && this.battleEngine.enemies[targetIdx].isDead()) {
          targetIdx = this.battleEngine.enemies.findIndex(e => !e.isDead());
        }
      }
      this.battleEngine.playCard(index, targetIdx);
    } else {
      // 全体・自己など
      this.battleEngine.playCard(index);
    }
    // UI更新はengineからのコールバックで行われる
  }

  // onHandCardClickは不要になるので削除またはコメントアウト
  onHandCardClick(index) {
    // no-op
  }

  onEnemyClick(enemyIndex) {
    // 敵を選択状態にするだけ（攻撃はしない）
    if (this.battleEngine.phase !== 'player') return;

    const enemy = this.battleEngine.enemies[enemyIndex];
    if (enemy && !enemy.isDead()) {
      console.log(`Enemy clicked: ${enemyIndex}`);
      this.selectedEnemyIndex = enemyIndex;
      this.updateBattleUI();
    }
  }

  // deselectCard は不要になったので削除するか、空にしておく
  deselectCard() {
    // no-op
  }
}

// ゲーム起動
const game = new Game();
window.game = game; // デバッグ用
game.start();
