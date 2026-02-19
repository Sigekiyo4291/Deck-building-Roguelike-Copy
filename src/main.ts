// import './style.css'; // 静的配信でのMIMEタイプエラー回避のためHTML側で読み込み
import { GameMap } from './core/map-data';
import { MapGenerator } from './core/map-generator';
import { SceneManager } from './core/scene-manager';
import { BOSS_DATA } from './core/boss-data';
import { Player, Enemy, Louse, Cultist, JawWorm, AcidSlimeM, SpikeSlimeM, AcidSlimeS, SpikeSlimeS, FungiBeast, AcidSlimeL, SpikeSlimeL, BlueSlaver, RedSlaver, Looter, GremlinNob, Lagavulin, Sentry, SlimeBoss, Guardian, Hexaghost, DEBUFF_TYPES, BUFF_TYPES, isDebuff, isBuff } from './core/entity';
import { CardLibrary } from './core/card';
import { BattleEngine } from './core/engine';
import { RelicLibrary } from './core/relic';
import { getRandomEvent } from './core/event-data';
import { DebugManager } from './core/debug-manager';
import { EffectManager } from './core/effect-manager';
import { AudioManager } from './core/audio-manager';
import { getRandomPotion, PotionLibrary } from './core/potion-data';
import { ENCOUNTER_POOLS } from './core/encounter-data';

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
  thievery: { name: 'コソ泥', desc: 'この敵が攻撃するたび、ゴールドを強奪する。' },
  split: { name: '分裂', desc: 'HPが半分以下になると分裂する。' },
  spore_cloud: { name: '胞子の雲', desc: '死亡時、相手に脆弱を付与する。' },
  malleable: { name: '柔軟', desc: '攻撃を受けるたび、ブロックを得る。' },
  strength_down: { name: '筋力消失', desc: 'ターン終了時、筋力を失う。' },
  dexterity_down: { name: '俊敏性消失', desc: 'ターン終了時、俊敏性を失う。' },
  no_draw: { name: 'ドロー不可', desc: 'カードを引くことができない。' },
  rage: { name: '激怒', desc: 'アタックカードをプレイするたび、ブロックを得る。' },
  double_tap: { name: 'ダブルタップ', desc: '次にプレイするアタックカードが2回発動する。' },
  fire_breathing: { name: '炎の吐息', desc: '状態異常や呪いカードを引くたび、敵全体にダメージを与える。' },
  feel_no_pain: { name: '無痛', desc: 'カードを廃棄するたび、ブロックを得る。' },
  combust: { name: '燃焼', desc: 'ターン終了時、HPを1失い敵全体にダメージを与える。' },
  rupture: { name: '破裂', desc: 'カードの効果でHPを失うたび、筋力を得る。' },
  evolve: { name: '進化', desc: '状態異常カードを引くたび、追加でカードを引く。' },
  dark_embrace: { name: '闇の抱擁', desc: 'カードが廃棄されるたび、カードを1枚引く。' },
  juggernaut: { name: 'ジャガーノート', desc: 'ブロックを獲得するたび、ランダムな敵にダメージを与える。' },
  barricade: { name: 'バリケード', desc: 'ターン開始時にブロックが失われない。' },
  corruption: { name: '堕落', desc: 'スキルカードのコストが0になる。使用したスキルは廃棄される。' },
  brutality: { name: '残虐', desc: 'ターン開始時、HPを1失いカードを1枚引く。' },
  berserk: { name: '狂戦士', desc: 'ターン開始時、エナジーを1得る。' },
  enrage_enemy: { name: '激怒', desc: 'スキルを1枚プレイするたび、筋力を得ます。' },
  artifact: { name: 'アーティファクト', desc: '次に受けるデバフを無効化します。' },
};


class Game {
  player: Player;
  map: GameMap | null;
  battleEngine: BattleEngine | null;
  sceneManager: SceneManager;
  selectedEnemyIndex: number;
  battleCount: number;
  debugManager: DebugManager;
  effectManager: EffectManager;
  audioManager: AudioManager;
  elDeckCount: HTMLElement | null;
  elDiscardCount: HTMLElement | null;
  elExhaustCount: HTMLElement | null;
  elEndTurnBtn: HTMLElement | null;
  elHand: HTMLElement | null;
  selectedCardIndex: number;
  isEliteBattle: boolean = false;
  isBossBattle: boolean = false;
  potionDropChance: number = 40; // ポーションドロップ率 (%)
  currentAct: number = 1; // 現在のAct
  currentFloor: number = 0; // 現在の階層
  currentEvent: any;
  currentEventState: any;
  private currentPotionPopup: HTMLElement | null = null;

  constructor() {
    this.player = new Player();
    this.map = null;
    this.battleEngine = null;
    this.sceneManager = new SceneManager(this);
    this.selectedEnemyIndex = 0; // デフォルトターゲット初期化
    this.battleCount = 0; // 通常戦闘の回数をカウント
    this.audioManager = new AudioManager(); // オーディオマネージャー初期化
    this.effectManager = new EffectManager(); // エフェクトマネージャー初期化

    // Debug Manager
    this.debugManager = new DebugManager(this);

    // UI Event Listeners
    // this.setupUI(); // 既存メソッドがないため削除
    this.setupSettingsUI(); // 設定画面UIのセットアップ

    // URLパラメータのデバッグモード確認
    const urlParams = new URLSearchParams(window.location.search);

    // UI Elements
    this.elDeckCount = document.getElementById('deck-count');
    this.elDiscardCount = document.getElementById('discard-count');
    this.elExhaustCount = document.getElementById('exhaust-count');
    this.elEndTurnBtn = document.getElementById('end-turn-btn');
    this.elHand = document.getElementById('hand');

    // 状態管理
    this.selectedCardIndex = -1; // カード選択状態

    // イベントリスナー設定
    if (this.elEndTurnBtn) {
      this.elEndTurnBtn.onclick = () => {
        if (this.battleEngine && !this.battleEngine.isProcessing) {
          this.deselectCard();
          this.battleEngine.endTurn();
        }
      };
    }

    // 廃棄パイルのクリックイベント
    const exhaustPile = document.getElementById('exhaust-pile');
    if (exhaustPile) {
      exhaustPile.onclick = () => {
        if (this.player.exhaust.length > 0) {
          const overlay = document.getElementById('deck-selection-overlay');
          this.showCardSelectionFromPile('廃棄カード一覧', this.player.exhaust, null);
          const closeBtn = document.getElementById('close-deck-selection-btn');
          if (closeBtn && overlay) {
            closeBtn.style.display = 'block'; // 一覧を見るだけなので閉じるボタンを出す
            closeBtn.onclick = () => {
              overlay.style.display = 'none';
            };
          }
        }
      };
    }

    // 捨て札パイルのクリックイベント
    const discardPile = document.getElementById('discard-pile');
    if (discardPile) {
      discardPile.onclick = () => {
        if (this.player.discard.length > 0) {
          const overlay = document.getElementById('deck-selection-overlay');
          this.showCardSelectionFromPile('捨て札一覧', this.player.discard, null);
          const closeBtn = document.getElementById('close-deck-selection-btn');
          if (closeBtn && overlay) {
            closeBtn.style.display = 'block';
            closeBtn.onclick = () => {
              overlay.style.display = 'none';
            };
          }
        }
      };
    }

    // 山札パイルのクリックイベント
    const deckPile = document.getElementById('deck-pile');
    if (deckPile) {
      deckPile.onclick = () => {
        if (this.battleEngine) {
          // 戦闘中は山札を表示 (順番がバレないようにソートして表示)
          const sortedDeck = [...this.player.deck].sort((a, b) => {
            if (a.type !== b.type) return a.type.localeCompare(b.type);
            return a.name.localeCompare(b.name);
          });
          this.showCardSelectionFromPile('山札', sortedDeck, () => { });
        } else {
          // 非戦闘時はデッキ全体を表示
          this.showDeckView();
        }
      };
    }

    // ヘッダーボタン（StSスタイルUI）
    const headerDeckBtn = document.getElementById('header-deck-btn');
    if (headerDeckBtn) headerDeckBtn.onclick = () => this.showDeckView();

    const headerSettingsBtn = document.getElementById('header-settings-btn');
    if (headerSettingsBtn) {
      headerSettingsBtn.onclick = () => {
        const overlay = document.getElementById('settings-overlay');
        if (overlay) overlay.style.display = 'flex';
        this.updateSettingsUI();
      };
    }

    // タイトル画面のスタートボタン
    const startBtn = document.getElementById('game-start-btn');
    if (startBtn) {
      startBtn.onclick = () => {
        this.onGameStart();
      };
    }

    // 初期UI表示
    this.updateGlobalStatusUI();
  }

  start() {
    this.audioManager.playBgm('title'); // タイトルBGMがあれば再生（なければマップなど）
    this.sceneManager.showTitle();
  }

  async onGameStart() {
    // マップ生成（初回のみ、あるいはリセット）
    if (!this.map) {
      this.map = MapGenerator.generate(this.currentAct);
      this.map.updateAvailableNodes();
    }

    // マップシーン表示（クロスフェード開始）
    const transition = this.sceneManager.showMap();
    this.renderMap(); // フェード中にレンダリングを済ませる
    await transition;
    this.audioManager.playBgm('map');
  }

  deselectCard() {
    this.selectedCardIndex = -1;
    this.updateBattleUI();
  }

  showDeckView() {
    const overlay = document.getElementById('deck-view-overlay');
    const container = document.getElementById('deck-view-content');
    const closeBtn = document.getElementById('close-deck-btn');

    if (!overlay || !container || !closeBtn) return;

    container.innerHTML = '';

    const sortedDeck = [...this.player.masterDeck].sort((a, b) => {
      const typeOrder = { 'attack': 1, 'skill': 2, 'power': 3, 'curse': 4 };
      if (typeOrder[a.type] !== typeOrder[b.type]) {
        return (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
      }
      return Number(a.cost || 0) - Number(b.cost || 0);
    });

    sortedDeck.forEach(card => {
      const cardEl = this.createRewardCardElement(card);
      cardEl.style.cursor = 'default';
      cardEl.onclick = null;
      container.appendChild(cardEl);
    });

    overlay.style.display = 'flex';

    closeBtn.onclick = () => {
      overlay.style.display = 'none';
    };
  }

  renderMap() {
    if (this.map && this.sceneManager) {
      this.sceneManager.renderMap(this.map, (node) => this.onNodeSelect(node));
      this.updateGlobalStatusUI(); // グローバルステータスを更新（金貨等）
      this.audioManager.playBgm('map'); // マップBGM再生
    }
  }

  onNodeSelect(node) {
    this.currentFloor++; // 階層を進める
    this.updateGlobalStatusUI(); // UI更新
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
    this.audioManager.playBgm('map'); // 休憩中もマップBGM

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

  showUpgradeSelection(onComplete?: () => void) {
    const overlay = document.getElementById('deck-selection-overlay');
    const listEl = document.getElementById('deck-selection-list');
    const titleEl = document.getElementById('deck-selection-title');
    const closeBtn = document.getElementById('close-deck-selection-btn');

    if (!overlay || !listEl || !titleEl || !closeBtn) return;

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


  async finishRest() {
    this.map.updateAvailableNodes();
    const transition = this.sceneManager.showMap();
    this.renderMap();
    await transition;
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

  async finishEvent() {
    this.currentEvent = null;
    this.currentEventState = null;
    this.map.updateAvailableNodes();
    const transition = this.sceneManager.showMap();
    this.renderMap();
    await transition;
  }

  // カード削除選択UI
  showCardRemovalSelection(onComplete) {
    const overlay = document.getElementById('deck-selection-overlay');
    const listEl = document.getElementById('deck-selection-list');
    const titleEl = document.getElementById('deck-selection-title');
    const closeBtn = document.getElementById('close-deck-selection-btn');

    if (!overlay || !listEl || !titleEl || !closeBtn) return;

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

    if (!overlay || !listEl || !titleEl || !closeBtn) return;

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
    this.audioManager.playBgm('map'); // ショップ中もマップBGM

    const cardsTopContainer = document.getElementById('shop-cards-top');
    const cardsBottomLeftContainer = document.getElementById('shop-cards-bottom-left');
    const relicsCenterContainer = document.getElementById('shop-relics-center');
    const potionsCenterContainer = document.getElementById('shop-potions-center');
    const removalServiceContainer = document.getElementById('shop-removal-service');

    // コンテナのクリア
    [cardsTopContainer, cardsBottomLeftContainer, relicsCenterContainer, potionsCenterContainer, removalServiceContainer].forEach(c => {
      if (c) c.innerHTML = '';
    });

    // 価格計算ヘルパー (±10%の変動)
    const getPrice = (base: number) => {
      const variation = base * 0.1;
      const offset = (Math.random() * 2 - 1) * variation;
      return Math.floor(base + offset);
    };

    // カードの収集
    const allCards = Object.values(CardLibrary).filter(c => c.rarity !== 'basic' && c.rarity !== 'curse' && c.rarity !== 'status');
    const attacks = allCards.filter(c => c.type === 'attack');
    const skills = allCards.filter(c => c.type === 'skill');
    const powers = allCards.filter(c => c.type === 'power');

    const getCardPrice = (card) => {
      if (card.rarity === 'common') return getPrice(50);
      if (card.rarity === 'uncommon') return getPrice(75);
      if (card.rarity === 'rare') return getPrice(150);
      return getPrice(50);
    };

    const getRandomCards = (list, count) => {
      const result = [];
      const temp = [...list];
      for (let i = 0; i < count; i++) {
        if (temp.length === 0) break;
        const idx = Math.floor(Math.random() * temp.length);
        result.push(temp.splice(idx, 1)[0].clone());
      }
      return result;
    };

    // 1. 上段カード商品の生成 (アタック2, スキル2, パワー1)
    const topCards = [
      ...getRandomCards(attacks, 2),
      ...getRandomCards(skills, 2),
      ...getRandomCards(powers, 1)
    ];

    // セール対象の決定 (上列からランダムに1枚)
    const saleIdx = Math.floor(Math.random() * topCards.length);

    topCards.forEach((card, i) => {
      let price = getCardPrice(card);
      const isSale = i === saleIdx;
      if (isSale) price = Math.floor(price / 2);

      const wrapper = document.createElement('div');
      wrapper.className = 'shop-item-wrapper';

      if (isSale) {
        const saleTag = document.createElement('div');
        saleTag.className = 'sale-tag';
        saleTag.textContent = '特売';
        wrapper.appendChild(saleTag);
      }

      const cardEl = this.createRewardCardElement(card);
      const priceEl = document.createElement('div');
      priceEl.className = 'shop-price';
      priceEl.textContent = `${price}`;

      cardEl.onclick = () => {
        if (wrapper.classList.contains('sold-out')) return;
        if (this.player.gold >= price) {
          this.player.gold -= price;
          this.player.masterDeck.push(card);
          this.updateGlobalStatusUI();
          wrapper.classList.add('sold-out');
        } else {
          alert('ゴールドが足りません！');
        }
      };

      wrapper.appendChild(cardEl);
      wrapper.appendChild(priceEl);
      cardsTopContainer.appendChild(wrapper);
    });

    // 2. 下段左: 無色カード (アンコモン1, レア1)
    // 現在は無色カードライブラリがないため、クラスカードのアンコモン/レアで代用 (TODO: 無色カード実装時に差し替え)
    const uncommonCards = allCards.filter(c => c.rarity === 'uncommon');
    const rareCards = allCards.filter(c => c.rarity === 'rare');

    const colorlessPrice_Uncommon = getPrice(100);
    const colorlessPrice_Rare = getPrice(200);

    const bottomCards = [
      { card: getRandomCards(uncommonCards, 1)[0], price: colorlessPrice_Uncommon },
      { card: getRandomCards(rareCards, 1)[0], price: colorlessPrice_Rare }
    ];

    bottomCards.forEach(item => {
      if (!item.card) return;
      const card = item.card;
      const price = item.price;

      const wrapper = document.createElement('div');
      wrapper.className = 'shop-item-wrapper';
      const cardEl = this.createRewardCardElement(card);
      const priceEl = document.createElement('div');
      priceEl.className = 'shop-price';
      priceEl.textContent = `${price}`;

      cardEl.onclick = () => {
        if (wrapper.classList.contains('sold-out')) return;
        if (this.player.gold >= price) {
          this.player.gold -= price;
          this.player.masterDeck.push(card);
          this.updateGlobalStatusUI();
          wrapper.classList.add('sold-out');
        } else {
          alert('ゴールドが足りません！');
        }
      };

      wrapper.appendChild(cardEl);
      wrapper.appendChild(priceEl);
      cardsBottomLeftContainer.appendChild(wrapper);
    });

    // 3. 下段中央: レリック (3個)
    const ownedRelicIds = this.player.relics.map(r => r.id);
    const candidateRelics = Object.values(RelicLibrary).filter(r =>
      !ownedRelicIds.includes(r.id) && r.rarity !== 'starter' && r.rarity !== 'boss'
    );

    const getRelicPrice = (rarity) => {
      if (rarity === 'common') return getPrice(150);
      if (rarity === 'uncommon') return getPrice(250);
      if (rarity === 'rare') return getPrice(300);
      if (rarity === 'shop') return getPrice(150);
      return getPrice(150);
    };

    // 3つ選出。一番右は「ショップレリック」枠とするが、現在は通常レリックから選ぶ
    for (let i = 0; i < 3; i++) {
      if (candidateRelics.length === 0) break;
      const idx = Math.floor(Math.random() * candidateRelics.length);
      const relic = candidateRelics.splice(idx, 1)[0];

      // 一番右(i=2)はショップレリック価格を想定（今回は実装しないためレアリティに応じた価格）
      const price = getRelicPrice(relic.rarity);

      const wrapper = document.createElement('div');
      wrapper.className = 'shop-item-wrapper';

      const relicEl = document.createElement('div');
      relicEl.className = 'relic-icon';
      relicEl.textContent = relic.name.charAt(0);
      relicEl.setAttribute('data-tooltip', `${relic.name}\n${relic.rarity}\n\n${relic.description}`);

      const priceEl = document.createElement('div');
      priceEl.className = 'shop-price';
      priceEl.textContent = `${price}`;

      relicEl.onclick = () => {
        if (wrapper.classList.contains('sold-out')) return;
        if (this.player.gold >= price) {
          this.player.gold -= price;
          this.player.relics.push(relic);
          if (relic.onObtain) relic.onObtain(this.player);
          this.updateGlobalStatusUI();
          wrapper.classList.add('sold-out');
        } else {
          alert('ゴールドが足りません！');
        }
      };

      wrapper.appendChild(relicEl);
      wrapper.appendChild(priceEl);
      relicsCenterContainer.appendChild(wrapper);
    }

    // 4. 下段中央: ポーション (3個)
    const potionLibrary = (window as any).PotionLibrary || PotionLibrary;
    const allPotions = Object.values(potionLibrary) as any[];

    const getPotionPrice = (rarity) => {
      if (rarity === 'common') return getPrice(50);
      if (rarity === 'uncommon') return getPrice(75);
      if (rarity === 'rare') return getPrice(100);
      return getPrice(50);
    };

    for (let i = 0; i < 3; i++) {
      if (allPotions.length === 0) break;
      const potion = allPotions[Math.floor(Math.random() * allPotions.length)].clone();
      const price = getPotionPrice(potion.rarity);

      const wrapper = document.createElement('div');
      wrapper.className = 'shop-item-wrapper';

      const potionEl = document.createElement('div');
      potionEl.className = 'potion-slot has-potion';
      potionEl.textContent = '🧪';
      potionEl.setAttribute('data-tooltip', `${potion.name}\n${potion.rarity}\n\n${potion.description}`);

      const priceEl = document.createElement('div');
      priceEl.className = 'shop-price';
      priceEl.textContent = `${price}`;

      potionEl.onclick = () => {
        if (wrapper.classList.contains('sold-out')) return;
        if (this.player.gold >= price) {
          const emptySlot = this.player.potions.indexOf(null);
          if (emptySlot !== -1) {
            this.player.gold -= price;
            this.player.potions[emptySlot] = potion;
            this.updateGlobalStatusUI();
            wrapper.classList.add('sold-out');
          } else {
            alert('ポーションのスロットがいっぱいです！');
          }
        } else {
          alert('ゴールドが足りません！');
        }
      };

      wrapper.appendChild(potionEl);
      wrapper.appendChild(priceEl);
      potionsCenterContainer.appendChild(wrapper);
    }

    // 5. 下段右: カード削除サービス
    const removalPrice = 75 + (this.player.cardRemovalCount || 0) * 25;
    const removalWrapper = document.createElement('div');
    removalWrapper.className = 'shop-item-wrapper';

    const removalBtn = document.createElement('div');
    removalBtn.className = 'card-removal-btn';
    removalBtn.innerHTML = `
      <div class="title">カード除去</div>
      <div class="desc">デッキからカードを1枚取り除きます</div>
    `;

    const removalPriceEl = document.createElement('div');
    removalPriceEl.className = 'shop-price';
    removalPriceEl.textContent = `${removalPrice}`;

    removalBtn.onclick = () => {
      if (removalWrapper.classList.contains('sold-out')) return;
      if (this.player.gold >= removalPrice) {
        this.showCardRemovalUI(removalPrice, removalWrapper);
      } else {
        alert('ゴールドが足りません！');
      }
    };

    removalWrapper.appendChild(removalBtn);
    removalWrapper.appendChild(removalPriceEl);
    removalServiceContainer.appendChild(removalWrapper);

    const shopContainer = document.querySelector('.shop-container') as HTMLElement;
    if (shopContainer) {
      shopContainer.style.paddingBottom = '120px';
      shopContainer.style.position = 'relative';
    }

    document.getElementById('shop-leave-btn').onclick = async () => {
      this.map.updateAvailableNodes();
      const transition = this.sceneManager.showMap();
      this.renderMap();
      await transition;
    };
  }

  // カード削除UIの表示
  showCardRemovalUI(price: number, wrapper: HTMLElement) {
    const overlay = document.createElement('div');
    overlay.className = 'deck-overlay';

    const content = document.createElement('div');
    content.className = 'deck-content';

    const title = document.createElement('h2');
    title.textContent = '削除するカードを選択してください';
    title.style.color = '#fff';
    content.appendChild(title);

    const list = document.createElement('div');
    list.className = 'deck-list';

    this.player.masterDeck.forEach((card, idx) => {
      // createCardElementはドラッグ等の複雑なイベントを持つため、シンプルな表示用のcreateRewardCardElementを使用
      const cardEl = this.createRewardCardElement(card);
      cardEl.style.cursor = 'pointer';

      cardEl.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        console.log(`Card removal start: ${card.name}, idx: ${idx}, price: ${price}`);

        if (confirm(`${(card as any).name} を削除しますか？`)) {
          // デッキから削除
          this.player.masterDeck.splice(idx, 1);
          this.player.gold -= price;
          this.player.cardRemovalCount = (this.player.cardRemovalCount || 0) + 1;

          console.log(`Card removed. New gold: ${this.player.gold}, Count: ${this.player.cardRemovalCount}`);

          this.updateGlobalStatusUI();

          // ショップ側の表示を「売切」にする
          wrapper.classList.add('sold-out');

          // UIを閉じる
          if (overlay.parentNode) {
            document.body.removeChild(overlay);
          }
        }
      };
      list.appendChild(cardEl);
    });

    content.appendChild(list);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'end-turn-btn';
    closeBtn.textContent = 'キャンセル';
    closeBtn.style.marginTop = '20px';
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      if (overlay.parentNode) {
        document.body.removeChild(overlay);
      }
    };
    content.appendChild(closeBtn);

    overlay.appendChild(content);
    document.body.appendChild(overlay);
  }

  showTreasureScene() {
    this.sceneManager.showTreasure();
    this.audioManager.playBgm('map'); // 宝箱画面もマップBGM
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
      (title, pile, callback) => this.showCardSelectionFromPile(title, pile, callback),
      this.effectManager, // エフェクトマネージャーを渡す
      this.audioManager   // オーディオマネージャーを渡す
    );
    this.sceneManager.showBattle();
    this.battleEngine.start();
    this.updateBattleUI();
    this.updateRelicUI();
    this.audioManager.playBgm('battle'); // デバッグバトルBGM
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
    this.isBossBattle = (type === 'boss');
    this.selectedEnemyIndex = 0; // ターゲットインデックスをリセット

    if (type === 'boss') {
      // マップ生成時に抽選されたボスを使用
      const bossId = this.map.bossId;
      const bossData = bossId ? BOSS_DATA[bossId] : null;

      if (bossData) {
        enemies = bossData.createEnemies();
      } else {
        // フォールバック
        enemies = [new SlimeBoss()];
      }
    } else if (type === 'elite') {
      const pool = ENCOUNTER_POOLS[this.currentAct]?.elite || ENCOUNTER_POOLS[1].elite;
      const index = Math.floor(Math.random() * pool.length);
      enemies = pool[index]();
    } else {
      // 通常戦闘
      const pools = ENCOUNTER_POOLS[this.currentAct] || ENCOUNTER_POOLS[1];
      if (this.battleCount < 3) {
        const index = Math.floor(Math.random() * pools.weak.length);
        enemies = pools.weak[index]();
      } else {
        const index = Math.floor(Math.random() * pools.strong.length);
        enemies = pools.strong[index]();
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
      (title, pile, callback) => this.showCardSelectionFromPile(title, pile, callback),
      this.effectManager, // エフェクトマネージャーを渡す
      this.audioManager   // オーディオマネージャーを渡す
    );

    // シーン切り替え
    this.sceneManager.showBattle();
    this.battleEngine.start();
    this.updateBattleUI();
    this.updateGlobalStatusUI(); // 初期表示（レリック、ポーション等含む）

    // BGM再生
    if (type === 'boss') {
      this.audioManager.playBgm('boss');
    } else {
      this.audioManager.playBgm('battle');
    }
  }

  onBattleWin() {
    console.log('Game: onBattleWin triggered');
    try {
      this.deselectCard();

      // 通常戦闘の場合、カウントアップ
      if (!this.isEliteBattle && this.map.currentNode && this.map.currentNode.type === 'enemy') {
        this.battleCount++;
      }

      console.log('Game: Calling showRewardScene, isElite: ' + this.isEliteBattle + ', isBoss: ' + this.isBossBattle);
      // リワード画面表示
      this.showRewardScene(this.isEliteBattle, this.isBossBattle);
    } catch (e) {
      console.error('onBattleWin Error:', e);
    }
  }

  showRewardScene(isElite, isBoss = false) {
    console.log('Game: showRewardScene called, isElite:', isElite, 'isBoss:', isBoss);
    this.audioManager.playBgm('map'); // リワード画面でマップBGMに戻す（勝利ファンファーレ実装まではこれで）
    try {
      this.sceneManager.showReward();
      console.log('Game: SceneManager.showReward finished, filling reward list...');

      const listEl = document.getElementById('reward-list');
      if (!listEl) {
        console.error('Reward list element not found!');
        return;
      }
      listEl.innerHTML = '';

      // ランダム報酬生成
      const rewards = [];
      // ゴールド
      let goldValue = 10 + Math.floor(Math.random() * 20);
      if (isElite) goldValue += 20;
      if (isBoss) goldValue += 100;
      rewards.push({ type: 'gold', value: goldValue, taken: false });

      // カード
      rewards.push({ type: 'card', isRare: isBoss, taken: false });

      // ポーション（ドロップ率チェック）
      const hasSozu = this.player.relics.some(r => r.id === 'sozu');
      if (!hasSozu) {
        if (Math.random() * 100 < this.potionDropChance) {
          // ドロップ成功
          const potion = getRandomPotion();
          rewards.push({ type: 'potion', data: potion, taken: false });
          // ドロップ率は10%減少
          this.potionDropChance = Math.max(0, this.potionDropChance - 10);
          console.log(`Potion dropped! Next chance: ${this.potionDropChance}%`);
        } else {
          // ドロップ失敗時は10%増加
          this.potionDropChance = Math.min(100, this.potionDropChance + 10);
          console.log(`Potion NOT dropped. Next chance: ${this.potionDropChance}%`);
        }
      } else {
        console.log('Sozu equipped. No potion for you!');
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
        if (reward.type === 'potion') text = `🧪 ポーション: ${reward.data.name}`;
        if (reward.type === 'relic') text = `💍 レリック: ${reward.data.name}`;

        itemEl.textContent = text;
        itemEl.onclick = () => {
          if (!reward.taken) this.onRewardClick(reward, index, itemEl);
        };

        listEl.appendChild(itemEl);
      });

      const doneBtn = document.getElementById('reward-done-btn');
      if (doneBtn) {
        doneBtn.onclick = async () => {
          if (isBoss) {
            // ボスレリック選択へ
            this.showBossRelicSelection();
          } else {
            // マップに戻る
            if (this.map) {
              this.map.updateAvailableNodes();
            }
            const transition = this.sceneManager.showMap();
            this.renderMap();
            await transition;
          }
        };
      }
    } catch (e) {
      console.error('showRewardScene Error:', e);
      alert('Reward Scene Error: ' + e.message);
    }
  }

  // onRewardClickの修正: itemElを受け取ってクリック後に無効化スタイル適用
  onRewardClick(reward, index, itemEl) {
    if (reward.type === 'gold') {
      this.player.gold += reward.value;
      alert(`${reward.value} ゴールドを獲得しました！ (所持金: ${this.player.gold}G)`);
      reward.taken = true;
      itemEl.style.opacity = '0.5';
      itemEl.style.textDecoration = 'line-through';
      this.updateGlobalStatusUI(); // 所持金表示更新
    }
    else if (reward.type === 'card') {
      this.showCardSelection(reward, itemEl);
    } else if (reward.type === 'potion') {
      // 空きスロットを探す
      const emptySlotIndex = this.player.potions.indexOf(null);
      if (emptySlotIndex !== -1) {
        this.player.potions[emptySlotIndex] = reward.data;
        alert(`ポーション「${reward.data.name}」を獲得しました！`);
        reward.taken = true;
        itemEl.style.opacity = '0.5';
        itemEl.style.textDecoration = 'line-through';
        this.updateGlobalStatusUI(); // UI更新
      } else {
        alert('ポーションスロットがいっぱいです！');
      }
    } else if (reward.type === 'relic') {
      const relic = reward.data;
      this.player.relics.push(relic);
      if (relic.onObtain) relic.onObtain(this.player);

      alert(`${relic.name} を獲得しました！\n効果: ${relic.description}`);
      reward.taken = true;
      itemEl.style.opacity = '0.5';
      itemEl.style.textDecoration = 'line-through';
      this.updateGlobalStatusUI(); // 全体UIも更新（レリック含む）
    }
  }

  updatePotionUI() {
    const container = document.getElementById('potion-container');
    if (!container) return;
    container.innerHTML = '';

    this.player.potions.forEach((potion, index) => {
      const slot = document.createElement('div');
      slot.className = 'potion-slot';

      if (potion) {
        slot.classList.add('has-potion');
        slot.textContent = '🧪'; // 代替アイコン
        slot.setAttribute('data-tooltip', `${potion.name}\n\n${potion.description}\n\n[クリックで使用 / 右クリックで廃棄]`);

        slot.onclick = (e) => {
          e.stopPropagation();
          this.showPotionPopup(index, e.clientX, e.clientY);
        };

        // 右クリックでのデフォルト動作を阻止（左クリックメニューに統合するため）
        slot.oncontextmenu = (e) => {
          e.preventDefault();
          this.showPotionPopup(index, e.clientX, e.clientY);
        };
      } else {
        slot.classList.add('empty');
      }
      container.appendChild(slot);
    });
  }

  showPotionPopup(index, x, y) {
    this.closePotionPopup();

    const potion = this.player.potions[index];
    if (!potion) return;

    const popup = document.createElement('div');
    popup.className = 'potion-popup';
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;

    // 飲む/投げるボタン
    const drinkBtn = document.createElement('button');
    drinkBtn.className = 'potion-popup-btn';

    // ターゲットタイプに応じてテキストを変更
    if (potion.targetType === 'single' || potion.targetType === 'all') {
      drinkBtn.textContent = '🍺 投げる'; // アイコンは🍺のままだが、テキストを投げるに変更
    } else {
      drinkBtn.textContent = '🍺 飲む';
    }

    const isCombat = !!this.battleEngine;
    const canUse = !potion.isCombatOnly || isCombat;

    if (!canUse) {
      drinkBtn.disabled = true;
      drinkBtn.title = '戦闘中のみ使用可能です';
    }

    drinkBtn.onclick = async () => {
      this.closePotionPopup(); // 先に閉じる
      await this.handlePotionUse(index);
    };

    // 捨てるボタン
    const discardBtn = document.createElement('button');
    discardBtn.className = 'potion-popup-btn';
    discardBtn.textContent = '🗑️ 捨てる';
    discardBtn.onclick = () => {
      if (confirm(`${potion.name} を捨てますか？`)) {
        this.player.potions[index] = null;
        this.updatePotionUI();
        this.updateGlobalStatusUI();
      }
      this.closePotionPopup();
    };

    popup.appendChild(drinkBtn);
    popup.appendChild(discardBtn);
    document.body.appendChild(popup);
    this.currentPotionPopup = popup;

    // クリックイベントが即座に document に伝わって閉じないように
    popup.onclick = (e) => e.stopPropagation();

    // 画面外クリックでポップアップを閉じる (少し遅延させて、このクリックで即閉じないようにする)
    setTimeout(() => {
      document.addEventListener('click', () => this.closePotionPopup(), { once: true });
    }, 0);
  }

  closePotionPopup() {
    if (this.currentPotionPopup) {
      this.currentPotionPopup.remove();
      this.currentPotionPopup = null;
    }
  }

  async handlePotionUse(index) {
    const potion = this.player.potions[index];
    if (!potion) return;

    if (this.battleEngine) {
      // 戦闘中: ターゲットが必要な場合は現在の選択または先頭の敵を使用
      let targetIdx = this.selectedEnemyIndex;
      if (targetIdx === undefined || targetIdx === null || targetIdx < 0) {
        targetIdx = 0;
      }
      await this.battleEngine.usePotion(index, targetIdx);
    } else if (!potion.isCombatOnly) {
      // 非戦闘中
      await potion.onUse(this.player, null, null);
      this.player.potions[index] = null;
      this.updateGlobalStatusUI(); // ポーションUI更新も含まれる
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

    if (!overlay || !container || !titleEl || !closeBtn) return;

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
    let keys = Object.keys(CardLibrary).filter(k => CardLibrary[k].type !== 'curse');
    if (rewardItem.isRare) {
      keys = keys.filter(k => CardLibrary[k].rarity === 'rare');
    }

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

    if (!overlay || !container || !skipBtn) return;

    overlay.style.display = 'flex';
    skipBtn.onclick = () => {
      overlay.style.display = 'none';
      rewardItem.taken = true; // スキップしたら取得済み扱い
      itemEl.style.opacity = '0.5';
      itemEl.style.textDecoration = 'line-through';
    };
  }

  showBossRelicSelection() {
    const overlay = document.getElementById('boss-relic-overlay');
    const container = document.getElementById('boss-relic-choices');
    if (!overlay || !container) return;

    container.innerHTML = '';
    overlay.style.display = 'flex';

    // ボスレリックを3つ抽選
    const ownedIds = this.player.relics.map(r => r.id);
    const candidates = Object.values(RelicLibrary).filter(r =>
      r.rarity === 'boss' && !ownedIds.includes(r.id)
    );

    // シャッフル
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    const choices = candidates.slice(0, 3);
    choices.forEach(relic => {
      const relicEl = document.createElement('div');
      relicEl.className = 'relic-choice';
      relicEl.innerHTML = `
        <div class="relic-choice-icon">${relic.name.charAt(0)}</div>
        <div class="relic-choice-name">${relic.name}</div>
        <div class="relic-choice-desc">${relic.description}</div>
      `;
      relicEl.onclick = () => {
        this.player.relics.push(relic);
        if (relic.onObtain) relic.onObtain(this.player);
        overlay.style.display = 'none';
        alert(`ボスレリック「${relic.name}」を獲得しました！`);
        this.proceedToNextAct();
      };
      container.appendChild(relicEl);
    });
  }

  proceedToNextAct() {
    if (this.currentAct >= 3) {
      alert('🎉 GAME CLEAR! 🎉\nおめでとうございます！あなたは3つのActを制覇しました！');
      location.reload();
      return;
    }

    this.currentAct++;
    this.battleCount = 0;
    // HP全快
    this.player.heal(this.player.maxHp);

    // 次のActのマップ生成
    this.map = MapGenerator.generate(this.currentAct);
    this.map.updateAvailableNodes();
    this.renderMap();
    this.sceneManager.showMap();
    this.updateGlobalStatusUI();

    alert(`Act ${this.currentAct} に到達しました。HPが全快しました。`);
  }

  createRewardCardElement(card) {
    const cardEl = document.createElement('div');
    const charClass = (card.type === 'curse' || card.isStatus) ? 'curse' : 'ironclad';
    const upgradedClass = card.isUpgraded ? 'upgraded' : '';
    cardEl.className = `card ${card.rarity} card-${card.type} ${charClass} ${upgradedClass}`;
    const imagePath = card.image || 'assets/images/cards/NoImage.png';
    const typeNames = { attack: 'アタック', skill: 'スキル', power: 'パワー', curse: '呪い', status: '状態異常' };
    const typeName = typeNames[card.type] || card.type;

    cardEl.innerHTML = `
      <div class="card-frame"></div>
      <div class="card-illustration-container">
        <img src="${imagePath}" class="card-illustration" />
        <div class="inner-frame"></div>
        <div class="card-type-label">${typeName}</div>
      </div>
      <div class="card-banner">
        <div class="card-title">${card.name}</div>
      </div>
      <div class="card-cost-icon">${card.cost}</div>
      <div class="card-description-container">
        <div class="card-desc">${card.description}</div>
      </div>
    `;

    // カードタイトルの文字数に応じてフォントサイズを調整
    const titleEl = cardEl.querySelector('.card-title') as HTMLElement;
    if (titleEl) {
      const nameLength = card.name.length;
      if (nameLength <= 4) {
        titleEl.style.fontSize = '1.1em';
      } else if (nameLength <= 6) {
        titleEl.style.fontSize = '1em';
      } else if (nameLength <= 8) {
        titleEl.style.fontSize = '0.9em';
      } else {
        titleEl.style.fontSize = '0.8em';
      }
    }

    return cardEl;
  }

  updatePlayerStatsUI() {
    // プレイヤーのHP/Block/Energy/Deckなどの更新
    // updateBattleUIの一部として呼ばれるが、単独でも呼べるように
    // 今回はupdateBattleUIに集約するので空でもいいが、リワード時のGold更新用にあると便利
    // しかしGold表示要素はまだないのでログのみ
  }

  updateBattleUI() {
    console.log('Game: updateBattleUI called');
    try {
      const player = this.player;

      // グローバルステータス（トップバーのHP含む）を更新
      this.updateGlobalStatusUI();

      // --- Player UI Update ---
      const playerBlock = document.getElementById('player-block');
      const playerBlockText = document.getElementById('player-block-text');

      if (player.block > 0) {
        if (playerBlock) playerBlock.style.width = '0%'; // バー表示はやめて数値のみにする
        if (playerBlockText) {
          playerBlockText.textContent = `🛡️${player.block}`;
          playerBlockText.style.display = 'inline';
        }
      } else {
        if (playerBlock) playerBlock.style.width = '0%';
        if (playerBlockText) playerBlockText.style.display = 'none';
      }

      // プレイヤーのステータス
      this.updateStatusUI(player, 'player-status-container');

      // --- Enemy UI Update ---
      const enemiesContainer = document.getElementById('enemies-container');
      enemiesContainer.innerHTML = '';

      // 自動ターゲット変更: 現在のターゲットが死んでいるか無効な場合、生きている最初の敵を選択
      const currentTarget = this.battleEngine.enemies[this.selectedEnemyIndex];
      if (!currentTarget || currentTarget.isDead()) {
        const firstAliveIndex = this.battleEngine.enemies.findIndex(e => !e.isDead());
        if (firstAliveIndex !== -1) {
          this.selectedEnemyIndex = firstAliveIndex;
        }
      }

      this.battleEngine.enemies.forEach((enemy, index) => {
        if (enemy.isDead()) return; // 死んだ敵は表示しない（あるいは死体表示）

        const enemyEl = document.createElement('div');
        enemyEl.className = 'entity enemy';
        enemyEl.setAttribute('data-id', enemy.uuid);

        // 選択中の敵をハイライト
        if (this.selectedEnemyIndex === index) {
          enemyEl.classList.add('selected-target');
        }

        enemyEl.onclick = () => this.onEnemyClick(index);

        // 意図アイコン
        let intentHtml = '';
        let intentText = ''; // ホバー時に表示するテキスト
        if (enemy.nextMove) {
          const move = enemy.nextMove;
          let icons = [];
          let hasAttack = false;
          let hasBuff = false;
          let hasDebuff = false;
          let hasSpecial = false;

          if (move.type === 'attack') {
            const damage = enemy.calculateDamage(move.value);
            const times = move.times ? `x${move.times}` : '';
            icons.push(`<span class="intent-attack">🗡️${damage}${times}</span>`);
            hasAttack = true;
          }

          if (move.type === 'buff' || (move.type === 'attack' && move.effect && !(move.id?.includes('rake')) && !(move.id?.includes('scrape')))) {
            // 純粋なバフ、または攻撃後の自身の強化
            icons.push('💪');
            hasBuff = true;
          }

          if (move.type === 'debuff' || (move.effect && (move.id?.includes('rake') || move.id?.includes('scrape') || move.name?.includes('舐める')))) {
            icons.push('📉');
            hasDebuff = true;
          }

          if (move.type === 'special') {
            const name = move.name || '✨';
            icons.push(`<span class="intent-special">${name}</span>`);
            hasSpecial = true;
          }

          // 行動内容のテキストを判定
          if (hasSpecial) {
            intentText = '敵は特殊な行動予定';
          } else if (hasAttack && hasBuff && hasDebuff) {
            intentText = '敵はバフ・デバフと攻撃予定';
          } else if (hasAttack && hasBuff) {
            intentText = '敵はバフと攻撃予定';
          } else if (hasAttack && hasDebuff) {
            intentText = '敵はデバフと攻撃予定';
          } else if (hasAttack) {
            intentText = '敵は攻撃予定';
          } else if (hasBuff && hasDebuff) {
            intentText = '敵はバフ・デバフ予定';
          } else if (hasBuff) {
            intentText = '敵は強化行動予定';
          } else if (hasDebuff) {
            intentText = '敵は妨害行動予定';
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

        // インテントアイコンにホバーイベントリスナーを追加
        if (intentText) {
          const intentIcon = enemyEl.querySelector('.intent-icon');
          if (intentIcon) {
            intentIcon.addEventListener('mouseenter', () => {
              const tooltip = document.createElement('div');
              tooltip.className = 'intent-tooltip';
              tooltip.textContent = intentText;
              intentIcon.appendChild(tooltip);
            });

            intentIcon.addEventListener('mouseleave', () => {
              const tooltip = intentIcon.querySelector('.intent-tooltip');
              if (tooltip) {
                tooltip.remove();
              }
            });
          }
        }

        // ホバー時に敵の名前を表示（HPバーの上に配置）
        enemyEl.addEventListener('mouseenter', () => {
          const entityInfo = enemyEl.querySelector('.entity-info');
          if (entityInfo) {
            const tooltip = document.createElement('div');
            tooltip.className = 'enemy-name-tooltip';
            tooltip.textContent = enemy.name;
            tooltip.setAttribute('data-tooltip-id', enemy.uuid);
            entityInfo.appendChild(tooltip);
          }
        });

        enemyEl.addEventListener('mouseleave', () => {
          const tooltip = enemyEl.querySelector('.enemy-name-tooltip');
          if (tooltip) {
            tooltip.remove();
          }
        });

        // ステータスアイコン生成
        this.updateStatusUI(enemy, `enemy-status-${index}`);
      });

      // --- Deck / Energy ---
      document.getElementById('energy-value').textContent = String(player.energy);
      document.getElementById('deck-count').textContent = String(player.deck.length);
      document.getElementById('discard-count').textContent = String(player.discard.length);
      if (this.elExhaustCount) {
        this.elExhaustCount.textContent = String(player.exhaust.length);
      }

      // --- Hand ---
      this.elHand.innerHTML = '';
      player.hand.forEach((card, index) => {
        const cardEl = this.createCardElement(card, index);
        this.elHand.appendChild(cardEl);
      });

      // ターン終了ボタン
      if (this.elEndTurnBtn) {
        (this.elEndTurnBtn as HTMLButtonElement).disabled = (this.battleEngine.phase !== 'player');
      }
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
      if (status.type === 'strength_down') iconChar = '🥱';
      if (status.type === 'dexterity_down') iconChar = '🐢';
      if (status.type === 'weak') iconChar = '📉';
      if (status.type === 'frail') iconChar = '🥀';
      if (status.type === 'dexterity') iconChar = '👟';
      if (status.type === 'thorns') iconChar = '🌵';
      if (status.type === 'metallicize') iconChar = '🔩';
      if (status.type === 'demon_form') iconChar = '😈';
      if (status.type === 'demon_form_plus') iconChar = '👹';
      if (status.type === 'ritual') iconChar = '🐦';
      if (status.type === 'entangled') iconChar = '🕸️';
      if (status.type === 'no_draw') iconChar = '🚫';
      if (status.type === 'rage') iconChar = '💢';
      if (status.type === 'double_tap') iconChar = '⚔️';
      if (status.type === 'fire_breathing') iconChar = '🔥';
      if (status.type === 'feel_no_pain') iconChar = '🦴';
      if (status.type === 'combust') iconChar = '🧨';
      if (status.type === 'rupture') iconChar = '⤴️';
      if (status.type === 'evolve') iconChar = '🧬';
      if (status.type === 'dark_embrace') iconChar = '👐';
      if (status.type === 'juggernaut') iconChar = '💥';
      if (status.type === 'barricade') iconChar = '🏰';
      if (status.type === 'corruption') iconChar = '🔮';
      if (status.type === 'brutality') iconChar = '🩸';
      if (status.type === 'berserk') iconChar = '💢';
      if (status.type === 'curl_up') iconChar = '🐚';
      if (status.type === 'malleable') iconChar = '💠';
      if (status.type === 'split') iconChar = '💖';
      if (status.type === 'spore_cloud') iconChar = '🍄';
      if (status.type === 'thievery') iconChar = '💰';
      if (status.type === 'enrage_enemy') iconChar = '💢';
      if (status.type === 'artifact') iconChar = '💎';

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
    const charClass = (card.type === 'curse' || card.isStatus) ? 'curse' : 'ironclad';
    const upgradedClass = card.isUpgraded ? 'upgraded' : '';
    cardEl.className = `card ${card.rarity} card-${card.type} ${charClass} ${upgradedClass}`;

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

      // ブロック表示の更新
      if (card.type === 'skill' || card.baseBlock > 0) {
        const finalBlock = card.getBlock(this.player, this.battleEngine);

        let colorClass = '';
        const baseVal = (card.isUpgraded && card.upgradeData && card.upgradeData.baseBlock !== undefined)
          ? card.upgradeData.baseBlock
          : card.baseBlock;

        if (finalBlock > baseVal) colorClass = 'damage-plus';
        else if (finalBlock < baseVal) colorClass = 'damage-minus';

        description = description.replace(/(\d+)(ブロック)/, `<span class="dynamic-value ${colorClass}">${finalBlock}</span>$2`);
      }
    }

    const currentCost = card.getCost(this.player);
    const displayCost = currentCost === 'X' ? 'X' : (currentCost < 0 ? '' : currentCost);
    const imagePath = card.image || 'assets/images/cards/NoImage.png';

    // タイプ名表示用
    const typeNames = { attack: 'アタック', skill: 'スキル', power: 'パワー', curse: '呪い', status: '状態異常' };
    const typeName = typeNames[card.type] || card.type;

    cardEl.innerHTML = `
      <div class="card-frame"></div>
      <div class="card-illustration-container">
        <img src="${imagePath}" class="card-illustration" />
        <div class="inner-frame"></div>
        <div class="card-type-label">${typeName}</div>
      </div>
      <div class="card-banner">
        <div class="card-title">${card.name}</div>
      </div>
      <div class="card-cost-icon">${displayCost}</div>
      <div class="card-description-container">
        <div class="card-desc">${description}</div>
      </div>
    `;

    // カードタイトルの文字数に応じてフォントサイズを調整
    const titleEl = cardEl.querySelector('.card-title') as HTMLElement;
    if (titleEl) {
      const nameLength = card.name.length;
      if (nameLength <= 4) {
        titleEl.style.fontSize = '1.1em';
      } else if (nameLength <= 6) {
        titleEl.style.fontSize = '1em';
      } else if (nameLength <= 8) {
        titleEl.style.fontSize = '0.9em';
      } else {
        titleEl.style.fontSize = '0.8em';
      }
    }


    // ドラッグ処理変数の初期化
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    cardEl.onpointerdown = (e) => {
      if (this.battleEngine.phase !== 'player') return;

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      cardEl.classList.add('dragging');
      cardEl.setPointerCapture(e.pointerId);

      // preventDefaultは最後に配置（または必要な場合のみ）
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
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
      // 画面サイズに応じてスワイプ閾値を調整（モバイルでは感度を上げる）
      const isMobile = window.innerWidth <= 768;
      const threshold = isMobile ? -100 : -150;

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
    if (!card) return;

    console.log('Game: tryPlayCard for', card.name, 'at index', index);

    // 1. 呪いカードチェック（ステータスカードは許可するように変更）
    if (card.type === 'curse') {
      alert('このカードは使用できません！');
      this.updateBattleUI();
      return;
    }

    // 2. エネルギーチェック
    const currentCost = card.getCost(this.player);
    const requiredEnergy = (currentCost === 'X') ? 0 : Number(currentCost);

    if (currentCost !== 'X' && this.player.energy < requiredEnergy) {
      alert('エネルギーが足りません！');
      this.updateBattleUI();
      return;
    }

    // 3. 使用条件チェック (クラッシュなど)
    if (!card.canPlay(this.player, this.battleEngine)) {
      alert('このカードの使用条件を満たしていません！');
      this.updateBattleUI();
      return;
    }

    // --- ここから先は「実際にプレイ可能」な場合のみ ---

    // 処理中は操作不能（アラート確認後にチェックすることで、ボタン連打によるデッドロックを防ぐ）
    if (this.battleEngine && this.battleEngine.isProcessing) {
      console.warn('Game: Action ignored because battleEngine is still processing previous effects.');
      return;
    }

    if (card.targetType === 'single') {
      // 選択中のターゲットを使用
      let targetIdx = this.selectedEnemyIndex;
      if (targetIdx === undefined || targetIdx === null) targetIdx = 0; // ガード
      const target = this.battleEngine.enemies[targetIdx];

      if (!target || target.isDead()) {
        // 現在のターゲットが無効な場合、最初の生存している敵を探す
        targetIdx = this.battleEngine.enemies.findIndex(e => !e.isDead());
        if (targetIdx === -1) return; // 生存している敵がいない場合は何もしない
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

  // グローバルステータスバー（HP, Gold, Floor）の更新
  updateGlobalStatusUI() {
    const hpText = document.getElementById('header-hp-text');
    if (hpText) hpText.textContent = `${this.player.hp}/${this.player.maxHp}`;

    // HPバーのシンクロ（必要なら）
    const hpFill = document.getElementById('player-hp-fill');
    if (hpFill) hpFill.style.width = `${(this.player.hp / this.player.maxHp) * 100}%`;
    const hpTextBattle = document.getElementById('player-hp-text');
    if (hpTextBattle) hpTextBattle.textContent = `${this.player.hp} / ${this.player.maxHp}`;

    const goldText = document.getElementById('header-gold-text');
    if (goldText) goldText.textContent = String(this.player.gold);

    const floorText = document.getElementById('header-floor-text');
    if (floorText) floorText.textContent = String(this.currentFloor);

    // ポーションとレリックのUIも更新
    this.updatePotionUI();
    this.updateRelicUI();
  }

  onEnemyClick(enemyIndex) {
    // 敵を選択状態にするだけ（攻撃はしない）
    if (this.battleEngine.phase !== 'player' || this.battleEngine.isProcessing) return;

    const enemy = this.battleEngine.enemies[enemyIndex];
    if (enemy && !enemy.isDead()) {
      console.log(`Enemy clicked: ${enemyIndex}`);
      this.selectedEnemyIndex = enemyIndex;
      this.updateBattleUI();
    }
  }

  updateSettingsUI() {
    const bgmMuteCheck = document.getElementById('bgm-mute-check') as HTMLInputElement;
    const bgmSlider = document.getElementById('bgm-volume-slider') as HTMLInputElement;
    const seMuteCheck = document.getElementById('se-mute-check') as HTMLInputElement;
    const seSlider = document.getElementById('se-volume-slider') as HTMLInputElement;

    if (bgmMuteCheck) bgmMuteCheck.checked = this.audioManager.bgmMuted;
    if (bgmSlider) bgmSlider.value = String(this.audioManager.bgmVolume);
    if (seMuteCheck) seMuteCheck.checked = this.audioManager.seMuted;
    if (seSlider) seSlider.value = String(this.audioManager.seVolume);
  }

  setupSettingsUI() {
    const overlay = document.getElementById('settings-overlay');
    const closeBtn = document.getElementById('close-settings-btn');
    const bgmMuteCheck = document.getElementById('bgm-mute-check') as HTMLInputElement;
    const bgmSlider = document.getElementById('bgm-volume-slider') as HTMLInputElement;
    const seMuteCheck = document.getElementById('se-mute-check') as HTMLInputElement;
    const seSlider = document.getElementById('se-volume-slider') as HTMLInputElement;

    if (closeBtn && overlay) {
      closeBtn.onclick = () => {
        overlay.style.display = 'none';
      };
    }

    if (bgmMuteCheck) {
      bgmMuteCheck.onchange = (e: any) => {
        this.audioManager.setBgmMute(e.target.checked);
      };
    }

    if (bgmSlider) {
      bgmSlider.oninput = (e: any) => {
        this.audioManager.setBgmVolume(Number(e.target.value));
      };
    }

    if (seMuteCheck) {
      seMuteCheck.onchange = (e: any) => {
        this.audioManager.setSeMute(e.target.checked);
      };
    }

    if (seSlider) {
      seSlider.oninput = (e: any) => {
        this.audioManager.setSeVolume(Number(e.target.value));
      };

      seSlider.onchange = () => { // マウス離した時などに確認音
        if (!this.audioManager.seMuted) {
          this.audioManager.playSe('click');
        }
      };
    }
  }

}

declare global {
  interface Window {
    game: Game;
  }
}

try {
  const game = new Game();
  (window as any).game = game; // デバッグ用
  game.start();
} catch (e) {
  console.error('Core app start error:', e);
  // alertが動く状態なら表示する
  if (typeof alert !== 'undefined') {
    alert('ゲームの起動に失敗しました。詳細はコンソールを確認してください。');
  }
}
