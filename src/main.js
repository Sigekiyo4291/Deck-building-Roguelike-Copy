import './style.css';
import { Player, Enemy } from './core/entity.js';
import { BattleEngine } from './core/engine.js';

// DOM要素の取得
const elPlayerHpText = document.getElementById('player-hp-text');
const elPlayerHpFill = document.getElementById('player-hp-fill');
const elPlayerBlock = document.getElementById('player-block');

const elEnemyHpText = document.getElementById('enemy-hp-text');
const elEnemyHpFill = document.getElementById('enemy-hp-fill');
const elEnemyBlock = document.getElementById('enemy-block');
const elEnemyIntent = document.getElementById('enemy-intent');

const elHand = document.getElementById('hand');
const elEnergyValue = document.getElementById('energy-value');
const elDeckCount = document.getElementById('deck-count');
const elDiscardCount = document.getElementById('discard-count');
const elEndTurnBtn = document.getElementById('end-turn-btn');

// ゲームインスタンスの作成
const player = new Player();
const enemy = new Enemy('スライム', 40, '/src/assets/slime.png');

function updateUI() {
  // プレイヤー情報更新
  elPlayerHpText.textContent = `${player.hp} / ${player.maxHp}`;
  elPlayerHpFill.style.width = `${(player.hp / player.maxHp) * 100}%`;
  elPlayerBlock.style.width = `${Math.min(100, (player.block / player.maxHp) * 100)}%`;

  // 敵情報更新
  elEnemyHpText.textContent = `${enemy.hp} / ${enemy.maxHp}`;
  elEnemyHpFill.style.width = `${(enemy.hp / enemy.maxHp) * 100}%`;
  elEnemyBlock.style.width = `${Math.min(100, (enemy.block / enemy.maxHp) * 100)}%`;

  if (enemy.nextMove) {
    elEnemyIntent.textContent = `🗡️${enemy.nextMove.value}`;
    elEnemyIntent.style.display = 'flex';
  } else {
    elEnemyIntent.style.display = 'none';
  }

  // エネルギー更新
  elEnergyValue.textContent = player.energy;

  // 山札・捨て札の枚数更新
  elDeckCount.textContent = player.deck.length;
  elDiscardCount.textContent = player.discard.length;

  // 手札のリフレッシュ
  elHand.innerHTML = '';
  player.hand.forEach((card, index) => {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    cardEl.innerHTML = `
      <div class="card-cost">${card.cost}</div>
      <div class="card-title">${card.name}</div>
      <div class="card-desc">${card.description}</div>
    `;

    // ドラッグ&プレイの実装
    let startY = 0;
    let isDragging = false;
    const threshold = -100; // 100px以上上にドラッグでプレイ

    cardEl.style.touchAction = 'none'; // ブラウザのスクロールを防止
    cardEl.style.cursor = 'grab';

    cardEl.onpointerdown = (e) => {
      console.log('Pointer down on card:', card.name);
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

      // カードの移動をY軸方向に反映
      const translateY = Math.max(-400, Math.min(100, deltaY));
      cardEl.style.transform = `translateY(${translateY}px) scale(1.1)`;

      console.log('Moving:', deltaY, 'translateY:', translateY);

      // プレイ可能ラインを超えたら強調
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
      console.log('Pointer up, deltaY:', deltaY, 'threshold:', threshold);

      if (deltaY < threshold) {
        console.log('カードをプレイ:', card.name);
        cardEl.releasePointerCapture(e.pointerId);
        engine.playCard(index);
      } else {
        console.log('カードを元に戻す');
        // 元の位置に戻す
        cardEl.releasePointerCapture(e.pointerId);
        cardEl.style.transform = '';
        cardEl.style.filter = '';
      }
      e.preventDefault();
    };

    cardEl.onpointercancel = () => {
      console.log('Pointer cancel');
      isDragging = false;
      cardEl.classList.remove('dragging');
      cardEl.style.cursor = 'grab';
      cardEl.style.transform = '';
      cardEl.style.filter = '';
    };

    elHand.appendChild(cardEl);
  });

  // ターン終了ボタンの状態
  elEndTurnBtn.disabled = (engine.phase !== 'player');
}

const engine = new BattleEngine(player, enemy, updateUI);

// ターン終了ボタンの設定
elEndTurnBtn.onclick = () => {
  engine.endTurn();
};

// ゲーム開始
engine.start();
updateUI();
