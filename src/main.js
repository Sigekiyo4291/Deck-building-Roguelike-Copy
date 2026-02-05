// import './style.css'; // 静的配信でのMIMEタイプエラー回避のためHTML側で読み込み
import { GameMap } from './core/map-data.js';
import { MapGenerator } from './core/map-generator.js';
import { SceneManager } from './core/scene-manager.js';
import { Player, Enemy, Louse, Cultist, JawWorm, AcidSlimeM, SpikeSlimeM, AcidSlimeS, SpikeSlimeS, FungiBeast, AcidSlimeL, SpikeSlimeL, BlueSlaver, RedSlaver, Looter, GremlinNob, Lagavulin, Sentry, SlimeBoss, Guardian, Hexaghost } from './core/entity.js';
import { CardLibrary } from './core/card.js';
import { BattleEngine } from './core/engine.js';
import { RelicLibrary } from './core/relic.js';
import { getRandomEvent } from './core/event-data.js';
import { DebugManager } from './core/debug-manager.js';

const STATUS_INFO = {
  vulnerable: { name: '脆弱', desc: '受けるダメージが50%増加する。' },
  strength: { name: '筋力', desc: 'アタックのダメージが増加する。' },
  weak: { name: '脱力', desc: 'アタックで与えるダメージが25%減少する。' },
  frail: { name: '崩壊', desc: 'ブロックの効果が25%減少する。' },
  dexterity: { name: '敏捷性', desc: 'ブロックの獲得量が増加する。' },
  thorns: { name: '棘', desc: '攻撃を受けると、攻撃者にその数値分のダメージを与える。' },
  metallicize: { name: '金属化', desc: 'ターン終了時、その数値分のブロックを得る。' },
  demon_form: { name: '悪魔化', desc: 'ターン開始時、筋力を得る。' },
  demon_form_plus: { name: '悪魔化+', desc: 'ターン開始時、筋力を得る。' },
  ritual: { name: '儀式', desc: 'ターン終了時、筋力を得る。' },
  entangled: { name: '絡みつき', desc: 'このターン、アタックカードを使用できない。' },
  curl_up: { name: '丸まり', desc: '攻撃を受けた際、ブロックを得る。' },
  malleable: { name: '柔軟', desc: '攻撃を受けるたび、ブロックを得る。' },
};


class Game {
  constructor() {
    this.player = new Player();
    this.map = null;
    this.battleEngine = null;
    this.sceneManager = new SceneManager(this);
    this.selectedEnemyIndex = 0; // デフォルトターゲット初期化
    this.battleCount = 0; // 通常戦闘の回数をカウント

    // Debug Manager
    this.debugManager = new DebugManager(this);

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

  createRewardCardElement(card) {
    // 既存のメソッドは変更なし、場所が変わるだけ
    const cardEl = document.createElement('div');
    cardEl.className = `card ${card.rarity}`;
    const currentCost = card.getCost(this.player);
    const displayCost = currentCost === 'X' ? 'X' : (currentCost < 0 ? '' : currentCost);
    cardEl.innerHTML = `
            <div class="card-cost">${displayCost}</div>
            <div class="card-title">${card.name}</div>
            <div class="card-desc">${card.description}</div>
            <div class="card-type">${card.type}</div>
      `;
    return cardEl;
  }

  showDeckView() {
    const overlay = document.getElementById('deck-view-overlay');
    const container = document.getElementById('deck-view-content');
    const closeBtn = document.getElementById('close-deck-btn');

    if (!overlay || !container) return;

    container.innerHTML = '';

    // マスターデッキの内容を表示（ソート済みが望ましいが、今回は登録順）
    // 必要に応じてソートロジックを追加可能
    const sortedDeck = [...this.player.masterDeck].sort((a, b) => {
      // 種類順 (Attack > Skill > Power > Curse) などの簡易ソート
      const typeOrder = { 'attack': 1, 'skill': 2, 'power': 3, 'curse': 4 };
      if (typeOrder[a.type] !== typeOrder[b.type]) {
        return (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
      }
      return a.cost - b.cost;
    });

    sortedDeck.forEach(card => {
      // 報酬カード生成メソッドを再利用（クリックイベントなし）
      // クリックイベントを上書きして無効化、あるいは詳細表示などに利用可能
      const cardEl = this.createRewardCardElement(card);
      cardEl.style.cursor = 'default'; // クリックできないことを示す
      cardEl.onclick = null; // クリックしても何も起きない

      // ツールチップなどで詳細を出しても良いが、現状はカード自体に情報が載っている

      container.appendChild(cardEl);
    });

    overlay.style.display = 'flex';

    closeBtn.onclick = () => {
      overlay.style.display = 'none';
    };
  }

  renderMap() {
    // ゴールド表示の更新
    const goldEl = document.getElementById('map-gold-value');
    if (goldEl) goldEl.textContent = this.player.gold;

    // デッキボタンの設定
    const deckBtn = document.getElementById('map-deck-btn');
    if (deckBtn) {
      deckBtn.onclick = () => this.showDeckView();
    }

    this.sceneManager.renderMap(this.map, (node) => this.onNodeSelect(node));
  }

  onNodeSelect(node) {
    this.map.currentNode = node;
    node.isClear = true;

    if (node.type === 'enemy' || node.type === 'elite' || node.type === 'boss') {
      this.isEliteBattle = (node.type === 'elite' || node.type === 'boss'); // エリート/ボスの判定
      this.startBattle(node.type);
    } else if (node.type === 'treasure') {
      this.showTreasureScene();
    } else if (node.type === 'shop') {
      this.showShopScene();
    } else if (node.type === 'rest') {
      this.showRestScene();
    } else if (node.type === 'event') {
      this.showEventScene();
    } else {
      alert(`${node.type} ノードに到達しました（未実装）`);
      this.map.updateAvailableNodes();
      this.renderMap();
    }
  }


  showRestScene() {
    this.sceneManager.showRest();

    // 休む (HP回復)
    document.getElementById('rest-heal-btn').onclick = () => {
      const healAmount = Math.floor(this.player.maxHp * 0.3);
      this.player.heal(healAmount);
      alert(`HPが ${healAmount} 回復しました！`);
      this.finishRest();
    };

    // 鍛える (カード強化)
    document.getElementById('rest-upgrade-btn').onclick = () => {
      this.showUpgradeSelection();
    };
  }

  showUpgradeSelection(onComplete) {
    const overlay = document.getElementById('deck-selection-overlay');
    const listEl = document.getElementById('deck-selection-list');
    const titleEl = document.getElementById('deck-selection-title');
    const closeBtn = document.getElementById('close-deck-selection-btn');

    titleEl.textContent = '強化するカードを選択';
    listEl.innerHTML = '';
    overlay.style.display = 'flex';
    closeBtn.style.display = 'block';

    // アップグレード可能なカードのみ表示（既にアップグレード済みのものは除く）
    this.player.masterDeck.forEach((card, index) => {
      const cardEl = this.createRewardCardElement(card);
      if (card.isUpgraded) {
        cardEl.style.opacity = '0.5';
        cardEl.style.cursor = 'default';
      } else {
        cardEl.onclick = () => {
          card.upgrade();
          alert(`${card.name} を強化しました！`);
          overlay.style.display = 'none';
          if (onComplete) {
            onComplete();
          } else {
            this.finishRest();
          }
        };
      }
      listEl.appendChild(cardEl);
    });

    closeBtn.onclick = () => {
      overlay.style.display = 'none';
      if (onComplete) {
        onComplete();
      }
    };
  }


  finishRest() {
    this.map.updateAvailableNodes();
    this.renderMap();
    this.sceneManager.showMap();
  }

  // ===== イベント関連メソッド =====

  showEventScene() {
    // ランダムなイベントを選択
    const event = getRandomEvent();
    this.currentEvent = event;
    this.currentEventState = {};

    this.sceneManager.showEvent();

    // イベント情報のUI更新
    document.getElementById('event-image').textContent = event.image;
    document.getElementById('event-name').textContent = event.name;
    document.getElementById('event-description').textContent = '';

    this.updateEventChoices(event, this.currentEventState);
  }

  updateEventChoices(event, state) {
    const optionsContainer = document.getElementById('event-options');
    optionsContainer.innerHTML = '';

    // 選択肢がサブ選択肢（phase: 'trap'など）の場合
    if (state.choices) {
      state.choices.forEach((choice) => {
        const button = document.createElement('button');
        button.className = 'end-turn-btn';
        button.textContent = choice.text;
        button.onclick = () => {
          choice.action(this, (newState) => {
            this.currentEventState = { ...this.currentEventState, ...newState };
            this.updateEventChoices(event, this.currentEventState);
          });
        };
        optionsContainer.appendChild(button);
      });
    } else {
      // 通常の選択肢
      const choices = event.getChoices(this, state);
      choices.forEach((choice) => {
        const button = document.createElement('button');
        button.className = 'end-turn-btn';
        button.textContent = choice.text;
        button.onclick = () => {
          choice.action(this, (newState) => {
            this.currentEventState = { ...this.currentEventState, ...newState };
            this.updateEventChoices(event, this.currentEventState);
          });
        };
        optionsContainer.appendChild(button);
      });
    }
  }

  finishEvent() {
    this.currentEvent = null;
    this.currentEventState = null;
    this.map.updateAvailableNodes();
    this.renderMap();
    this.sceneManager.showMap();
  }

  // カード削除選択UI
  showCardRemovalSelection(onComplete) {
    const overlay = document.getElementById('deck-selection-overlay');
    const listEl = document.getElementById('deck-selection-list');
    const titleEl = document.getElementById('deck-selection-title');
    const closeBtn = document.getElementById('close-deck-selection-btn');

    titleEl.textContent = '削除するカードを選択';
    listEl.innerHTML = '';
    overlay.style.display = 'flex';
    closeBtn.style.display = 'block';

    this.player.masterDeck.forEach((card, index) => {
      const cardEl = this.createRewardCardElement(card);
      cardEl.onclick = () => {
        // 削除確認
        if (confirm(`${card.name} を削除しますか？`)) {
          this.player.masterDeck.splice(index, 1);
          alert(`${card.name} をデッキから削除しました！`);
          overlay.style.display = 'none';
          if (onComplete) onComplete();
        }
      };
      listEl.appendChild(cardEl);
    });

    closeBtn.onclick = () => {
      overlay.style.display = 'none';
      if (onComplete) onComplete();
    };
  }

  // カード変化選択UI
  showCardTransformSelection(onComplete) {
    const overlay = document.getElementById('deck-selection-overlay');
    const listEl = document.getElementById('deck-selection-list');
    const titleEl = document.getElementById('deck-selection-title');
    const closeBtn = document.getElementById('close-deck-selection-btn');

    titleEl.textContent = '変化させるカードを選択';
    listEl.innerHTML = '';
    overlay.style.display = 'flex';
    closeBtn.style.display = 'block';

    this.player.masterDeck.forEach((card, index) => {
      const cardEl = this.createRewardCardElement(card);
      cardEl.onclick = () => {
        // ランダムなカードに変化 (呪い以外)
        const keys = Object.keys(CardLibrary).filter(k => CardLibrary[k].type !== 'curse');
        const randomKey = keys[Math.floor(Math.random() * keys.length)];

        const newCard = CardLibrary[randomKey].clone();

        this.player.masterDeck[index] = newCard;
        alert(`${card.name} が ${newCard.name} に変化しました！`);
        overlay.style.display = 'none';
        if (onComplete) onComplete();
      };
      listEl.appendChild(cardEl);
    });

    closeBtn.onclick = () => {
      overlay.style.display = 'none';
      if (onComplete) onComplete();
    };
  }


  showShopScene() {
    this.sceneManager.showShop();
    document.getElementById('shop-gold-value').textContent = this.player.gold;

    const cardsContainer = document.getElementById('shop-cards');
    const relicsContainer = document.getElementById('shop-relics');
    cardsContainer.innerHTML = '';
    relicsContainer.innerHTML = '';

    // カード商品の生成 (5枚)
    const cardKeys = Object.keys(CardLibrary);
    for (let i = 0; i < 5; i++) {
      const card = CardLibrary[cardKeys[Math.floor(Math.random() * cardKeys.length)]].clone();
      const price = 50 + Math.floor(Math.random() * 30);

      const wrapper = document.createElement('div');
      wrapper.className = 'shop-item-wrapper';

      const cardEl = this.createRewardCardElement(card);
      const priceEl = document.createElement('div');
      priceEl.className = 'shop-price';
      priceEl.textContent = `${price}G`;

      cardEl.onclick = () => {
        if (this.player.gold >= price) {
          this.player.gold -= price;
          this.player.masterDeck.push(card);
          document.getElementById('shop-gold-value').textContent = this.player.gold;
          wrapper.classList.add('sold-out');
          alert(`${card.name} を購入しました！`);
        } else {
          alert('ゴールドが足りません！');
        }
      };

      wrapper.appendChild(cardEl);
      wrapper.appendChild(priceEl);
      cardsContainer.appendChild(wrapper);
    }

    // レリック商品の生成 (2個)
    const ownedIds = this.player.relics.map(r => r.id);
    const candidateRelics = Object.values(RelicLibrary).filter(r =>
      !ownedIds.includes(r.id) && r.rarity !== 'starter' && r.rarity !== 'boss'
    );

    for (let i = 0; i < 2; i++) {
      if (candidateRelics.length === 0) break;
      const idx = Math.floor(Math.random() * candidateRelics.length);
      const relic = candidateRelics.splice(idx, 1)[0];
      const price = 150 + Math.floor(Math.random() * 100);

      const wrapper = document.createElement('div');
      wrapper.className = 'shop-item-wrapper';

      const relicEl = document.createElement('div');
      relicEl.className = 'relic-icon';
      relicEl.textContent = relic.name.charAt(0);
      relicEl.setAttribute('data-tooltip', `${relic.name}\n${relic.rarity}\n\n${relic.description}`);

      const priceEl = document.createElement('div');
      priceEl.className = 'shop-price';
      priceEl.textContent = `${price}G`;

      relicEl.onclick = () => {
        if (this.player.gold >= price) {
          this.player.gold -= price;
          this.player.relics.push(relic);
          if (relic.onObtain) relic.onObtain(this.player);
          document.getElementById('shop-gold-value').textContent = this.player.gold;
          this.updateRelicUI();
          wrapper.classList.add('sold-out');
          alert(`${relic.name} を購入しました！`);
        } else {
          alert('ゴールドが足りません！');
        }
      };

      wrapper.appendChild(relicEl);
      wrapper.appendChild(priceEl);
      relicsContainer.appendChild(wrapper);
    }

    document.getElementById('shop-leave-btn').onclick = () => {
      this.map.updateAvailableNodes();
      this.renderMap();
      this.sceneManager.showMap();
    };
  }

  showTreasureScene() {
    this.sceneManager.showTreasure();
    const openBtn = document.getElementById('open-treasure-btn');
    const icon = document.getElementById('treasure-icon');

    icon.textContent = '🎁';
    openBtn.style.display = 'block';
    openBtn.textContent = '開ける';

    const handleOpen = () => {
      icon.textContent = '🔓';
      openBtn.textContent = '中身を確認';

      openBtn.onclick = () => {
        // 報酬画面を流用して中身を表示（レリック確定 + ゴールド）
        this.showRewardScene(true); // エリート戦と同様の報酬（レリック確定）を付与
      };
    };

    openBtn.onclick = handleOpen;
    icon.onclick = handleOpen;
  }

  startDebugBattle(enemies) {
    if (this.battleEngine) {
      this.battleEngine = null;
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
      },
      (title, pile, callback) => this.showCardSelectionFromPile(title, pile, callback)
    );
    this.sceneManager.showBattle();
    this.battleEngine.start();
    this.updateBattleUI();
    this.updateRelicUI();
  }

  startDebugEvent(event) {
    this.currentEvent = event;
    this.currentEventState = {};
    this.sceneManager.showEvent();
    document.getElementById('event-image').textContent = event.image;
    document.getElementById('event-name').textContent = event.name;
    document.getElementById('event-description').textContent = '';
    this.updateEventChoices(event, this.currentEventState);
  }

  startBattle(type) {
    // 敵データ生成
    let enemies = [];
    this.isEliteBattle = (type === 'elite');

    if (type === 'boss') {
      // Act 1 ボスプール (Wiki準拠: 3パターン)
      const bossEncounters = [
        () => [new SlimeBoss()],
        () => [new Guardian()],
        () => [new Hexaghost()]
      ];
      const index = Math.floor(Math.random() * bossEncounters.length);
      enemies = bossEncounters[index]();
    } else if (type === 'elite') {
      // Act 1 エリートプール (Wiki準拠: 3パターン)
      const elites = [
        () => [new GremlinNob()],
        () => [new Lagavulin()],
        () => [new Sentry(0), new Sentry(1), new Sentry(2)]
      ];
      const index = Math.floor(Math.random() * elites.length);
      enemies = elites[index]();
    } else {
      // 通常戦闘（弱プール vs 強プール）
      if (this.battleCount < 3) {
        // 弱プール (1-3戦目, Wiki準拠: 5パターン)
        const encounters = [
          () => [new Cultist()],
          () => [new JawWorm()],
          () => [new Louse('red'), new Louse('green')],
          () => [new AcidSlimeM(), new SpikeSlimeM()],
          () => [new AcidSlimeS(), new SpikeSlimeS(), new SpikeSlimeS()]
        ];
        const index = Math.floor(Math.random() * encounters.length);
        enemies = encounters[index]();
      } else {
        // 強プール (4戦目以降, Wiki準拠から主要なものを抜粋)
        const encounters = [
          () => [new AcidSlimeL()],
          () => [new SpikeSlimeL()],
          () => [new BlueSlaver()],
          () => [new Looter()],
          () => [new Louse('red'), new Louse('green'), new Louse('red')],
          () => [new FungiBeast(), new FungiBeast()],
          () => [new BlueSlaver(), new RedSlaver()],
          () => [new Looter(), new Cultist()],
          () => [new FungiBeast(), new JawWorm()],
          () => [new Louse('green'), new AcidSlimeM(), new SpikeSlimeM()]
        ];
        const index = Math.floor(Math.random() * encounters.length);
        enemies = encounters[index]();
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
      },
      (title, pile, callback) => this.showCardSelectionFromPile(title, pile, callback)
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

    // 通常戦闘の場合、カウントアップ
    if (!this.isEliteBattle && this.map.currentNode && this.map.currentNode.type === 'enemy') {
      this.battleCount++;
      console.log(`Normal Battle Count: ${this.battleCount}`);
    }

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

  showCardSelectionFromPile(title, pile, callback) {
    const overlay = document.getElementById('deck-selection-overlay');
    const container = document.getElementById('deck-selection-list');
    const titleEl = document.getElementById('deck-selection-title');
    const closeBtn = document.getElementById('close-deck-selection-btn');

    if (!overlay || !container) return;

    titleEl.textContent = title;
    container.innerHTML = '';
    overlay.style.display = 'flex';
    closeBtn.style.display = 'none'; // 効果中は閉じられないようにする

    if (pile.length === 0) {
      setTimeout(() => {
        overlay.style.display = 'none';
        if (callback) callback(null);
      }, 1000);
      container.innerHTML = '<div style="color: white; font-size: 1.5em; text-align: center; width: 100%;">対象となるカードがありません</div>';
      return;
    }

    pile.forEach((card, index) => {
      const cardEl = this.createRewardCardElement(card);
      cardEl.onclick = () => {
        overlay.style.display = 'none';
        if (callback) callback(card, index);
      };
      container.appendChild(cardEl);
    });
  }

  showCardSelection(rewardItem, itemEl) {
    const overlay = document.getElementById('card-reward-overlay');
    const container = document.getElementById('card-choices');
    const skipBtn = document.getElementById('skip-card-btn');

    container.innerHTML = '';

    // ランダムなカード候補を3枚生成
    const keys = Object.keys(CardLibrary).filter(k => CardLibrary[k].type !== 'curse');

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
          const move = enemy.nextMove;
          let icons = [];

          if (move.type === 'attack') {
            const damage = enemy.calculateDamage(move.value);
            const times = move.times ? `x${move.times}` : '';
            icons.push(`<span class="intent-attack">🗡️${damage}${times}</span>`);
          }

          if (move.type === 'buff' || (move.type === 'attack' && move.effect && !(move.id?.includes('rake')) && !(move.id?.includes('scrape')))) {
            // 純粋なバフ、または攻撃後の自身の強化
            icons.push('💪');
          }

          if (move.type === 'debuff' || (move.effect && (move.id?.includes('rake') || move.id?.includes('scrape') || move.name?.includes('舐める')))) {
            icons.push('📉');
          }

          if (move.type === 'special') {
            const name = move.name || '✨';
            icons.push(`<span class="intent-special">${name}</span>`);
          }

          if (icons.length > 0) {
            intentHtml = `<div class="intent-icon">${icons.join('')}</div>`;
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
      if (status.type === 'weak') iconChar = '📉';
      if (status.type === 'frail') iconChar = '🥀';
      if (status.type === 'dexterity') iconChar = '👟';
      if (status.type === 'thorns') iconChar = '🌵';
      if (status.type === 'metallicize') iconChar = '🔩';
      if (status.type === 'demon_form') iconChar = '😈';
      if (status.type === 'demon_form_plus') iconChar = '👹';
      if (status.type === 'ritual') iconChar = '🐦';
      if (status.type === 'entangled') iconChar = '🕸️';

      // ツールチップ設定
      const info = STATUS_INFO[status.type];
      if (info) {
        iconEl.setAttribute('data-tooltip', `${info.name}\n${info.desc}`);
      } else {
        iconEl.setAttribute('data-tooltip', `${status.type}\nUnknown Effect`);
      }

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

    let description = card.description;
    if (this.battleEngine) {
      // ダメージ表示の更新
      if (card.type === 'attack' || card.baseDamage > 0) {
        const target = this.battleEngine.enemies[this.selectedEnemyIndex];
        const finalDamage = card.getFinalDamage(this.player, target, this.battleEngine);

        let colorClass = '';
        const baseVal = (card.isUpgraded && card.upgradeData && card.upgradeData.baseDamage !== undefined)
          ? card.upgradeData.baseDamage
          : card.baseDamage;

        if (finalDamage > baseVal) colorClass = 'damage-plus';
        else if (finalDamage < baseVal) colorClass = 'damage-minus';

        // descriptionの中の「数字 + ダメージ」のパターンを置換
        description = description.replace(/(\d+)(ダメージ)/, `<span class="dynamic-value ${colorClass}">$1</span>$2`);
        // 数値部分のみを最終ダメージに置換
        description = description.replace(card.baseDamage.toString(), finalDamage.toString());
        // 置換後の数値にクラス適用
        description = description.replace(finalDamage.toString(), `<span class="dynamic-value ${colorClass}">${finalDamage}</span>`);
      }

      // ブブロック表示の更新
      if (card.type === 'skill' || card.baseBlock > 0) {
        const finalBlock = card.getBlock(this.player, this.battleEngine);

        let colorClass = '';
        const baseVal = (card.isUpgraded && card.upgradeData && card.upgradeData.baseBlock !== undefined)
          ? card.upgradeData.baseBlock
          : card.baseBlock;

        if (finalBlock > baseVal) colorClass = 'damage-plus'; // 緑 (汎用利用)
        else if (finalBlock < baseVal) colorClass = 'damage-minus'; // 赤 (汎用利用)

        // descriptionの中の「数字 + ブロック」のパターンを置換
        description = description.replace(/(\d+)(ブロック)/, `<span class="dynamic-value ${colorClass}">${finalBlock}</span>$2`);
      }
    }

    const currentCost = card.getCost(this.player);
    const displayCost = currentCost === 'X' ? 'X' : (currentCost < 0 ? '' : currentCost);
    cardEl.innerHTML = `
              <div class="card-cost">${displayCost}</div>
              <div class="card-title">${card.name}</div>
              <div class="card-desc">${description}</div>
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

    // 呪いカードチェック
    if (card.type === 'curse') {
      alert('このカードは使用できません！');
      this.updateBattleUI(); // 位置リセット
      return;
    }

    // エネルギーチェック
    const currentCost = card.getCost(this.player);
    const requiredEnergy = typeof currentCost === 'number' ? currentCost : 0;
    if (currentCost !== 'X' && this.player.energy < requiredEnergy) {

      alert('エネルギーが足りません！');
      this.updateBattleUI(); // 位置リセットのために再描画
      return;
    }

    // 使用条件チェック (クラッシュなど)
    if (!card.canPlay(this.player, this.battleEngine)) {
      alert('このカードの使用条件を満たしていません！');
      this.updateBattleUI();
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
