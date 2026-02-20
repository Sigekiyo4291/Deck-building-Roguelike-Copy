import { CardLibrary } from './card';
import { RelicLibrary } from './relic';

export const DEBUFF_TYPES = [
  'vulnerable', 'weak', 'frail', 'entangled', 'no_draw',
  'strength_down', 'dexterity_down'
];

export const BUFF_TYPES = [
  'strength', 'dexterity', 'thorns', 'metallicize', 'demon_form',
  'demon_form_plus', 'ritual', 'double_tap', 'fire_breathing',
  'feel_no_pain', 'combust', 'rupture', 'evolve', 'dark_embrace',
  'juggernaut', 'barricade', 'corruption', 'brutality', 'berserk',
  'curl_up', 'malleable', 'artifact', 'rage', 'enrage_enemy',
  'split', 'spore_cloud', 'thievery', 'mode_shift', 'sharp_hide',
  'plated_armor', 'regeneration', 'duplication', 'pen_nib', 'vigor'
];

export function isDebuff(type: string, value: number): boolean {
  if (DEBUFF_TYPES.includes(type)) return value > 0;
  if (type === 'strength' || type === 'dexterity') return value < 0;
  return false;
}

export function isBuff(type: string, value: number): boolean {
  if (BUFF_TYPES.includes(type)) {
    if (type === 'strength' || type === 'dexterity') return value > 0;
    return value > 0;
  }
  return false;
}

export class Entity {
  name: string;
  maxHp: number;
  hp: number;
  block: number;
  sprite: string;
  statusEffects: { type: string, value: number }[];
  uuid: string;
  onGainBlock?: () => void;

  constructor(name, maxHp, sprite) {
    this.name = name;
    this.maxHp = maxHp;
    this.hp = maxHp;
    this.block = 0;
    this.sprite = sprite;
    this.statusEffects = [];
    this.uuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  // 最大HPを増やし、現在HPも同量回復させる（捕食など）
  increaseMaxHp(amount) {
    this.maxHp += amount;
    this.hp += amount;
  }

  // ブロック無視のHP減少（自傷や毒など）
  loseHP(amount) {
    const prevHp = this.hp;
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp < prevHp && this instanceof Player) {
      this.hpLossCount = (this.hpLossCount || 0) + 1;

      // 破裂 (Rupture) の処理
      const ruptureVal = this.getStatusValue('rupture');
      if (ruptureVal > 0) {
        console.log(`破裂発動！ HPを失ったため筋力を ${ruptureVal} 得る。`);
        this.addStatus('strength', ruptureVal);
      }
    }
    return amount;
  }

  takeDamage(amount, source) {
    // ターゲット側の補正（脆弱など）を適用
    let totalDamage = this.applyTargetModifiers(amount);
    let remainingDamage = totalDamage;

    // ブロックでダメージを軽減
    if (this.block > 0) {
      if (this.block >= remainingDamage) {
        this.block -= remainingDamage;
        remainingDamage = 0;
      } else {
        remainingDamage -= this.block;
        this.block = 0;
      }
    }

    const prevHp = this.hp;
    this.hp = Math.max(0, this.hp - remainingDamage);

    // まるくなる (Curl Up) の処理: ダメージを受けた時に一度だけブロック獲得
    // HPが減少した場合に判定
    if (this.hp < prevHp) {
      const curlUpVal = this.getStatusValue('curl_up');
      if (curlUpVal > 0) {
        console.log(`${this.name} の「まるくなる」発動！ ${curlUpVal} ブロック獲得。`);
        this.addBlock(curlUpVal);
        this.removeStatus('curl_up');
      }
    }

    // 被ダメージ回数のカウントアップ（血には血を用）
    if (remainingDamage > 0 && this instanceof Player) {
      this.hpLossCount = (this.hpLossCount || 0) + 1;

      // 破裂 (Rupture) の処理 (カード起因のダメージ: sourceがnullの場合)
      if (source === null || source === undefined) {
        const ruptureVal = this.getStatusValue('rupture');
        if (ruptureVal > 0) {
          console.log(`破裂発動！ カード起因のダメージでHPを失ったため筋力を ${ruptureVal} 得る。`);
          this.addStatus('strength', ruptureVal);
        }
      }
    }

    // トゲ(Thorns) & 炎の障壁(Flame Barrier) 処理
    const thorns = this.getStatusValue('thorns');
    const flameBarrier = this.getStatusValue('flame_barrier');
    const totalReflect = thorns + flameBarrier;

    if (totalReflect > 0 && source && source !== this) {
      // 攻撃者に反射ダメージを与える
      source.takeDamage(totalReflect, null);
    }

    // プレートアーマー (Plated Armor) の処理: ダメージを受けた場合に減少
    if (remainingDamage > 0) {
      const platedArmor = this.getStatusValue('plated_armor');
      if (platedArmor > 0) {
        this.addStatus('plated_armor', -1);
      }
    }

    return remainingDamage;
  }

  calculateBlock(amount) {
    const dexterity = this.getStatusValue('dexterity');
    let totalBlock = Math.max(0, amount + dexterity);

    // 虚弱(frail)状態ならブロック獲得量25%減少
    if (this.hasStatus('frail')) {
      totalBlock = Math.floor(totalBlock * 0.75);
    }
    return totalBlock;
  }

  addBlock(amount) {
    const blockGained = this.calculateBlock(amount);
    if (blockGained > 0) {
      this.block += blockGained;
      if (this.onGainBlock) {
        this.onGainBlock();
      }
    }
  }

  resetBlock() {
    this.block = 0;
  }

  // ダメージ計算（筋力補正 + 脱力）
  calculateDamage(baseDamage) {
    let damage = baseDamage;
    const strength = this.getStatusValue('strength');
    damage += strength;

    // 脱力(weak)状態ならダメージ25%減少
    if (this.hasStatus('weak')) {
      damage = Math.floor(damage * 0.75);
    }

    return Math.max(0, damage);
  }

  // ターゲット側の補正（脆弱など）を適用
  applyTargetModifiers(damage) {
    let finalDamage = damage;
    if (this.hasStatus('vulnerable')) {
      finalDamage = Math.floor(finalDamage * 1.5);
    }
    return finalDamage;
  }

  // 特定のステータスの種類を削除（例：デバフ解除）
  removeStatus(type) {
    this.statusEffects = this.statusEffects.filter(s => s.type !== type);
  }

  // ステータス操作
  addStatus(type, value) {
    // アーティファクトの処理
    if (isDebuff(type, value)) {
      const artifactVal = this.getStatusValue('artifact');
      if (artifactVal > 0) {
        console.log(`${this.name} はアーティファクトで ${type} を防いだ！`);
        this.addStatus('artifact', -1);
        return;
      }
    }

    const existing = this.statusEffects.find(s => s.type === type);
    if (existing) {
      existing.value += value;
    } else {
      this.statusEffects.push({ type, value });
    }
  }

  hasStatus(type) {
    return this.statusEffects.some(s => s.type === type && s.value !== 0);
  }

  getStatusValue(type) {
    const status = this.statusEffects.find(s => s.type === type);
    return status ? status.value : 0;
  }

  onPlayerPlayCard(card, player, engine) {
    // プレイヤーがカードを使った時のフック
  }

  onTurnEnd() {
    // ターン終了時の処理
  }

  updateStatus() {
    this.onTurnEnd();
    // ターン終了時の更新
    this.statusEffects.forEach(s => {
      // 筋力(strength)は自動減少しない
      // 脆弱(vulnerable)などはターン経過で減少
      if (['vulnerable', 'weak', 'frail', 'entangled'].includes(s.type)) {
        if (s.value > 0) s.value--;
      }

      // ドロー不可(no_draw): ターン終了時に解除（スタックしない）
      if (s.type === 'no_draw') {
        s.value = 0;
      }

      // 激怒(rage): ターン終了時に解除
      if (s.type === 'rage') {
        s.value = 0;
      }

      // フレックス(strength_down): ターン終了時に筋力を失う
      if (s.type === 'strength_down') {
        this.addStatus('strength', -s.value);
        s.value = 0; // 値を0にして削除対象にする
      }

      // スピード(dexterity_down): ターン終了時に敏捷性を失う
      if (s.type === 'dexterity_down') {
        this.addStatus('dexterity', -s.value);
        s.value = 0; // 値を0にして削除対象にする
      }

      /* 既存のforEach内に追加 */
      // 儀式(ritual): ターン終了時に筋力を得る
      if (s.type === 'ritual') {
        this.addStatus('strength', s.value);
      }

      // 再生(regeneration): ターン終了時に回復し、値を1減らす
      if (s.type === 'regeneration') {
        this.heal(s.value);
        s.value--; // 再生自体はターン経過で減少
      }

      // 金属化(metallicize): ターン終了時にブロック獲得
      if (s.type === 'metallicize') {
        this.addBlock(s.value);
      }

      // プレートアーマー(plated_armor): ターン終了時にブロック獲得
      if (s.type === 'plated_armor') {
        this.addBlock(s.value);
      }
    });
    // 値が0のものを削除
    this.statusEffects = this.statusEffects.filter(s => s.value !== 0);
  }

  onTurnStart() {
    // ターン開始時に解除されるステータス
    this.removeStatus('flame_barrier');
  }

  resetStatus() {
    this.statusEffects = [];
  }

  isDead() {
    return this.hp <= 0;
  }

  onDeath(killer, engine) {
    // 死亡時に呼び出されるフック
  }

  onBattleStart(player, engine) {
    // 戦闘開始時に呼び出されるフック
  }
}

export class Player extends Entity {
  energy: number;
  maxEnergy: number;
  hpLossCount: number;
  deck: any[];
  hand: any[];
  discard: any[];
  exhaust: any[];
  gold: number;
  potionSlots: number;
  potions: any[];
  relics: any[];
  relicCounters: { [key: string]: number };
  masterDeck: any[];
  cardRemovalCount: number;

  constructor() {
    super('Vanguard', 80, 'assets/player.png');
    this.energy = 3;
    this.maxEnergy = 3;
    this.hpLossCount = 0; // 今戦闘中にHPを失った回数
    this.deck = [];
    this.hand = [];
    this.discard = [];
    this.exhaust = [];
    this.gold = 100;
    this.potionSlots = 3;
    this.potions = new Array(3).fill(null); // 所持枠をnullで初期化
    this.relics = []; // レリック所持リスト
    this.relicCounters = {}; // レリックの汎用カウンター保管用
    this.cardRemovalCount = 0;

    // マスターデッキ（所持カード）の初期化
    this.masterDeck = [];
    for (let i = 0; i < 5; i++) this.masterDeck.push(CardLibrary.STRIKE.clone());
    for (let i = 0; i < 4; i++) this.masterDeck.push(CardLibrary.DEFEND.clone());
    this.masterDeck.push(CardLibrary.BASH.clone());

    // 初期レリック
    this.relics.push(RelicLibrary.BURNING_BLOOD);
  }

  heal(amount) {
    const prevHp = this.hp;
    super.heal(amount);
    const actualHeal = this.hp - prevHp;
    if (actualHeal > 0 && this.relics) {
      this.relics.forEach(relic => {
        if (relic.onHPRecovery) relic.onHPRecovery(this, null, actualHeal);
      });
    }
  }

  takeDamage(amount, source) {
    const prevHp = this.hp;
    const remainingDamage = super.takeDamage(amount, source);
    if (this.hp < prevHp && this.relics) {
      const lostHp = prevHp - this.hp;
      this.relics.forEach(relic => {
        if (relic.onTakeDamage) relic.onTakeDamage(this, null, lostHp);
      });
    }
    return remainingDamage;
  }

  loseHP(amount) {
    const prevHp = this.hp;
    const lostAmount = super.loseHP(amount);
    if (this.hp < prevHp && this.relics) {
      const lostHp = prevHp - this.hp;
      this.relics.forEach(relic => {
        if (relic.onTakeDamage) relic.onTakeDamage(this, null, lostHp); // ダメージフックとして処理
      });
    }
    return lostAmount;
  }

  exhaustCard(card, engine) {
    this.exhaust.push(card);

    // レリック: onCardExhaust
    if (this.relics) {
      this.relics.forEach(relic => {
        if (relic.onCardExhaust) relic.onCardExhaust(this, engine, card);
      });
    }

    // 無痛 (Feel No Pain) の処理
    const fnpBlock = this.getStatusValue('feel_no_pain');
    if (fnpBlock > 0) {
      console.log(`無痛発動！ ${card.name} が廃棄されたため ${fnpBlock} ブロック獲得。`);
      this.addBlock(fnpBlock);
      if (engine && engine.showEffectForPlayer) {
        engine.showEffectForPlayer('block');
      }
    }

    // 闇の抱擁 (Dark Embrace) の処理
    const deCount = this.getStatusValue('dark_embrace');
    if (deCount > 0 && engine) {
      console.log(`闇の抱擁発動！ ${card.name} が廃棄されたため ${deCount} 枚ドロー。`);
      engine.drawCards(deCount);
    }

    if (card.onExhaust && engine) {
      card.onExhaust(this, engine);
    }
  }

  addCard(card) {
    this.masterDeck.push(card);
    if (this.relics) {
      this.relics.forEach(relic => {
        if (relic.onCardAdd) relic.onCardAdd(this, card);
      });
    }
  }

  gainGold(amount) {
    this.gold += amount;
  }

  spendGold(amount) {
    if (this.gold >= amount) {
      this.gold -= amount;
      if (this.relics) {
        this.relics.forEach(relic => {
          if (relic.onGoldSpend) relic.onGoldSpend(this, amount);
        });
      }
      return true;
    }
    return false;
  }

  resetEnergy() {
    this.energy = this.maxEnergy;
  }
}

export class Enemy extends Entity {
  nextMove: any;

  constructor(name, hp, sprite) {
    super(name, hp, sprite);
    this.nextMove = null;
  }

  setNextMove(move) {
    this.nextMove = move;
  }

  decideNextMove(player?: any) {
    // デフォルト行動（スライムなど）
    const damage = 5 + Math.floor(Math.random() * 5);
    this.setNextMove({ type: 'attack', value: damage });
  }
}

export class Louse extends Enemy {
  color: string;
  curlUpValue: number;
  hasCurledUp: boolean;
  fixedDamage: number;
  history: any[];

  constructor(color) {
    const hp = 10 + Math.floor(Math.random() * 8); // 10-17
    const name = color === 'red' ? '赤の寄生虫' : '緑の寄生虫';
    super(name, hp, 'assets/images/enemies/Louse.png');
    this.color = color;
    this.curlUpValue = 3 + Math.floor(Math.random() * 5); // 3-7
    this.hasCurledUp = false;
    this.fixedDamage = 5 + Math.floor(Math.random() * 3); // 5-7 (個体ごとに固定)
    this.history = [];
  }

  onBattleStart(player, engine) {
    super.onBattleStart(player, engine);
    this.addStatus('curl_up', this.curlUpValue);
    console.log(`${this.name} will curl up for ${this.curlUpValue} block.`);
  }

  takeDamage(amount, source) {
    return super.takeDamage(amount, source);
  }

  decideNextMove() {
    const roll = Math.random() * 100;
    if (roll < 75) {
      // 攻撃 (75%)
      this.setNextMove({ type: 'attack', value: this.fixedDamage, name: 'バイト' });
    } else {
      // 戦略 (25%)
      if (this.color === 'red') {
        this.setNextMove({
          type: 'buff',
          name: '成長',
          statusEffects: [{ type: 'strength', value: 3 }],
          effect: (self) => self.addStatus('strength', 3)
        });
      } else {
        this.setNextMove({
          type: 'debuff',
          name: 'スパイトウェブ',
          statusEffects: [{ type: 'weak', value: 2 }],
          effect: (self, player) => player.addStatus('weak', 2)
        });
      }
    }
  }
}

export class AcidSlimeM extends Enemy {
  history: any[];

  constructor() {
    super('アシッドスライム(M)', 28 + Math.floor(Math.random() * 5), 'assets/images/enemies/AcidSlimeM.png');
    this.history = [];
  }

  decideNextMove() {
    const roll = Math.random() * 100;
    const lastMove = this.history[this.history.length - 1];

    // 舐める (30%): 脱力1, 連続不可
    if (roll < 30 && lastMove !== 'lick') {
      this.setNextMove({
        id: 'lick',
        type: 'debuff',
        name: '舐める',
        statusEffects: [{ type: 'weak', value: 1 }],
        effect: (self, player) => player.addStatus('weak', 1)
      });
    } else if (roll < 60) {
      // 膿んだ一撃 (30%): 7ダメ + 粘液(TODO)
      this.setNextMove({
        id: 'tackle',
        type: 'attack',
        value: 7,
        name: '膿んだ一撃',
        effect: (self, player) => console.log('Slimed!') // 本来はカード追加
      });
    } else {
      // 攻撃 (40%)
      this.setNextMove({ id: 'attack', type: 'attack', value: 10, name: '体当たり' });
    }
    this.history.push(this.nextMove.id);
  }
}

export class SpikeSlimeM extends Enemy {
  history: any[];

  constructor() {
    super('スパイクスライム(M)', 28 + Math.floor(Math.random() * 5), 'assets/images/enemies/SpikeSlimeM.png');
    this.history = [];
  }

  decideNextMove() {
    const roll = Math.random() * 100;
    const lastMove = this.history[this.history.length - 1];

    // 舐める (70%): 脆弱化1
    if (roll < 70 && lastMove !== 'lick') {
      this.setNextMove({
        id: 'lick',
        type: 'debuff',
        name: '舐める',
        effect: (self, player) => player.addStatus('vulnerable', 1)
      });
    } else {
      // 炎の体当たり (30%): 8ダメ + 粘液(TODO)
      this.setNextMove({
        id: 'tackle',
        type: 'attack',
        value: 8,
        name: '炎の体当たり'
      });
    }
    this.history.push(this.nextMove.id);
  }
}

export class AcidSlimeS extends Enemy {
  isFirstTurn: boolean;

  constructor() {
    super('アシッドスライム(S)', 8 + Math.floor(Math.random() * 5), 'assets/images/enemies/AcidSlimeS.png');
    this.isFirstTurn = true;
  }

  decideNextMove() {
    if (this.isFirstTurn) {
      this.setNextMove({
        type: 'debuff',
        name: '舐める',
        effect: (self, player) => player.addStatus('weak', 1)
      });
      this.isFirstTurn = false;
    } else {
      this.setNextMove({ type: 'attack', value: 3, name: '体当たり' });
    }
  }
}

export class SpikeSlimeS extends Enemy {
  constructor() {
    super('スパイクスライム(S)', 10 + Math.floor(Math.random() * 5), 'assets/images/enemies/SpikeSlimeS.png');
  }

  decideNextMove() {
    this.setNextMove({ type: 'attack', value: 5, name: '体当たり' });
  }
}

export class FungiBeast extends Enemy {
  history: any[];

  constructor() {
    super('キノコビースト', 22 + Math.floor(Math.random() * 7), 'assets/images/enemies/FungiBeast.png');
    this.history = [];
  }

  onBattleStart(player, engine) {
    super.onBattleStart(player, engine);
    this.addStatus('spore_cloud', 2);
  }

  onDeath(player, engine) {
    player.addStatus('vulnerable', 2);
    console.log(`${this.name} released a Spore Cloud! Player is Vulnerable!`);
  }

  decideNextMove() {
    const roll = Math.random() * 100;
    const lastMove = this.history[this.history.length - 1];

    // 成長 (40%): 筋力3, 連続不可
    if (roll < 40 && lastMove !== 'grow') {
      this.setNextMove({
        id: 'grow',
        type: 'buff',
        name: '成長',
        effect: (self) => self.addStatus('strength', 3)
      });
    } else {
      // 攻撃 (60%): 6ダメージ
      this.setNextMove({ id: 'attack', type: 'attack', value: 6, name: '咬みつき' });
    }
    this.history.push(this.nextMove.id);
  }
}

export class Cultist extends Enemy {
  isFirstTurn: boolean;

  constructor() {
    super('狂信者', 48 + Math.floor(Math.random() * 7), 'assets/images/enemies/Cultist.png');
    this.isFirstTurn = true;
  }

  decideNextMove() {
    if (this.isFirstTurn) {
      this.setNextMove({
        type: 'buff',
        name: '儀式',
        effect: (self) => {
          self.addStatus('ritual', 3);
          console.log('Cultist uses Incantation! Thine end is near!');
        }
      });
      this.isFirstTurn = false;
    } else {
      this.setNextMove({ type: 'attack', value: 6, name: 'ダークストライク' });
    }
  }
}

export class JawWorm extends Enemy {
  history: any[];

  constructor() {
    super('あご虫', 40 + Math.floor(Math.random() * 5), 'assets/images/enemies/JawWorm.png');
    this.history = [];
  }

  decideNextMove() {
    const turn = this.history.length + 1;
    let move;

    if (turn === 1) {
      // 1ターン目は必ず「体当たり」
      move = this.getChompMove();
    } else {
      // 行動の選択（確率と制限）
      // Wiki: 咆哮(45%), 吸血(30%), 体当たり(25%)
      // 制限: 咆哮(2回連続不可), 体当たり(2回連続不可), 吸血(3回連続不可)

      const lastMove = this.history[this.history.length - 1];
      const secondLastMove = this.history[this.history.length - 2];

      const canBellow = lastMove !== 'bellow';
      const canChomp = lastMove !== 'chomp';
      const canThrash = !(lastMove === 'thrash' && secondLastMove === 'thrash');

      // 確率ロール
      const roll = Math.random() * 100;

      if (roll < 45) {
        move = canBellow ? this.getBellowMove() : (Math.random() < 0.5 ? this.getChompMove() : this.getThrashMove());
      } else if (roll < 45 + 30) {
        move = canThrash ? this.getThrashMove() : (Math.random() < 0.5 ? this.getBellowMove() : this.getChompMove());
      } else {
        move = canChomp ? this.getChompMove() : (Math.random() < 0.5 ? this.getBellowMove() : this.getChompMove());
      }

      // 制限に引っかかった場合の最終調整（2重チェック）
      if (move.id === 'bellow' && !canBellow) move = Math.random() < 0.5 ? this.getChompMove() : this.getThrashMove();
      if (move.id === 'chomp' && !canChomp) move = Math.random() < 0.5 ? this.getBellowMove() : this.getThrashMove();
      if (move.id === 'thrash' && !canThrash) move = Math.random() < 0.5 ? this.getBellowMove() : this.getChompMove();
    }

    this.history.push(move.id);
    this.setNextMove(move);
  }

  getChompMove() {
    return { id: 'chomp', type: 'attack', value: 11, name: '体当たり' };
  }

  getThrashMove() {
    return {
      id: 'thrash',
      type: 'attack',
      value: 7,
      name: '吸血', // Wiki名称に合わせる
      effect: (self) => self.addBlock(5)
    };
  }

  getBellowMove() {
    return {
      id: 'bellow',
      type: 'buff',
      name: '咆哮',
      effect: (self) => {
        self.addStatus('strength', 3);
        self.addBlock(6);
      }
    };
  }
}

export class AcidSlimeL extends Enemy {
  history: any[];

  constructor() {
    super('大型酸性スライム', 65 + Math.floor(Math.random() * 5), 'assets/images/enemies/AcidSlimeL.png');
    this.history = [];
  }

  onBattleStart(player, engine) {
    super.onBattleStart(player, engine);
    this.addStatus('split', 1);
  }

  takeDamage(amount, source) {
    const remainingDamage = super.takeDamage(amount, source);
    // HPが50%以下になった時に即座に分裂をセット
    if (this.hp > 0 && this.hp <= this.maxHp / 2 && (!this.nextMove || this.nextMove.id !== 'split')) {
      this.setNextMove({
        id: 'split',
        type: 'special',
        name: '分裂',
        effect: (self, player, engine) => engine.splitEnemy(self, AcidSlimeM)
      });
    }
    return remainingDamage;
  }

  decideNextMove() {
    // すでにHP50%以下なら常に分裂
    if (this.hp <= this.maxHp / 2) {
      this.setNextMove({
        id: 'split',
        type: 'special',
        name: '分裂',
        effect: (self, player, engine) => engine.splitEnemy(self, AcidSlimeM)
      });
      return;
    }

    const roll = Math.random() * 100;
    const lastMove = this.history[this.history.length - 1];

    // 舐める (30%): 脱力2
    if (roll < 30) {
      this.setNextMove({
        id: 'lick',
        type: 'debuff',
        name: '舐める',
        effect: (self, player) => player.addStatus('weak', 2)
      });
    } else if (roll < 60) {
      // 腐食性の粘液 (30%): 11ダメ + 粘液2枚
      this.setNextMove({
        id: 'tackle',
        type: 'attack',
        value: 11,
        name: '腐食性の粘液',
        effect: (self, player, engine) => {
          if (engine && engine.addCardsToDiscard) {
            engine.addCardsToDiscard('slimed', 2);
          }
        }
      });
    } else {
      // 体当たり (40%): 16ダメ
      this.setNextMove({ id: 'attack', type: 'attack', value: 16, name: '体当たり' });
    }
    this.history.push(this.nextMove.id);
  }
}

export class SpikeSlimeL extends Enemy {
  history: any[];

  constructor() {
    super('大型スパイクスライム', 64 + Math.floor(Math.random() * 7), 'assets/images/enemies/SpikeSlimeL.png');
    this.history = [];
  }

  onBattleStart(player, engine) {
    super.onBattleStart(player, engine);
    this.addStatus('split', 1);
  }

  takeDamage(amount, source) {
    const remainingDamage = super.takeDamage(amount, source);
    // HPが50%以下になった時に即座に分裂をセット
    if (this.hp > 0 && this.hp <= this.maxHp / 2 && (!this.nextMove || this.nextMove.id !== 'split')) {
      this.setNextMove({
        id: 'split',
        type: 'special',
        name: '分裂',
        effect: (self, player, engine) => engine.splitEnemy(self, SpikeSlimeM)
      });
    }
    return remainingDamage;
  }

  decideNextMove() {
    // すでにHP50%以下なら常に分裂
    if (this.hp <= this.maxHp / 2) {
      this.setNextMove({
        id: 'split',
        type: 'special',
        name: '分裂',
        effect: (self, player, engine) => engine.splitEnemy(self, SpikeSlimeM)
      });
      return;
    }

    const roll = Math.random() * 100;
    const lastMove = this.history[this.history.length - 1];

    // 舐める (70%): 脆弱2
    if (roll < 70) {
      this.setNextMove({
        id: 'lick',
        type: 'debuff',
        name: '舐める',
        statusEffects: [{ type: 'vulnerable', value: 2 }],
        effect: (self, player) => player.addStatus('vulnerable', 2)
      });
    } else {
      // 炎の体当たり (30%): 16ダメ + 粘液2枚
      this.setNextMove({
        id: 'tackle',
        type: 'attack',
        value: 16,
        name: '炎の体当たり',
        effect: (self, player, engine) => {
          if (engine && engine.addCardsToDiscard) {
            engine.addCardsToDiscard('slimed', 2);
          }
        }
      });
    }
    this.history.push(this.nextMove.id);
  }
}

export class BlueSlaver extends Enemy {
  history: any[];

  constructor() {
    super('スレイバー(青)', 46 + Math.floor(Math.random() * 5), 'assets/images/enemies/BlueSlaver.png');
    this.history = [];
  }

  decideNextMove() {
    const roll = Math.random() * 100;
    const lastMove = this.history[this.history.length - 1];

    if (roll < 40 && lastMove !== 'rake') {
      this.setNextMove({ id: 'rake', type: 'attack', value: 7, name: 'レーキ', statusEffects: [{ type: 'weak', value: 1 }], effect: (self, player) => player.addStatus('weak', 1) });
    } else {
      this.setNextMove({ id: 'stab', type: 'attack', value: 12, name: '突き' });
    }
    this.history.push(this.nextMove.id);
  }
}

export class RedSlaver extends Enemy {
  history: any[];
  hasEntangled: boolean;

  constructor() {
    super('スレイバー(赤)', 46 + Math.floor(Math.random() * 5), 'assets/images/enemies/RedSlaver.png');
    this.history = [];
    this.hasEntangled = false;
  }

  decideNextMove() {
    const turn = this.history.length + 1;
    const roll = Math.random() * 100;
    const lastMove = this.history[this.history.length - 1];

    if (turn > 1 && !this.hasEntangled && roll < 25) {
      this.setNextMove({
        id: 'entangle',
        type: 'debuff',
        name: '絡めとる',
        statusEffects: [{ type: 'entangled', value: 1 }],
        effect: (self, player) => {
          player.addStatus('entangled', 1);
          this.hasEntangled = true;
        }
      });
    } else if (roll < 50 && lastMove !== 'scrape') {
      this.setNextMove({ id: 'scrape', type: 'attack', value: 8, name: '引っ掻き', statusEffects: [{ type: 'vulnerable', value: 1 }], effect: (self, player) => player.addStatus('vulnerable', 1) });
    } else {
      this.setNextMove({ id: 'stab', type: 'attack', value: 13, name: '突き' });
    }
    this.history.push(this.nextMove.id);
  }
}

export class Looter extends Enemy {
  history: any[];
  stolenGold: number;

  constructor() {
    super('略奪者', 44 + Math.floor(Math.random() * 5), 'assets/images/enemies/Looter.png');
    this.history = [];
    this.stolenGold = 0;
  }

  onBattleStart(player, engine) {
    super.onBattleStart(player, engine);
    this.addStatus('thievery', 15);
  }

  decideNextMove() {
    const turn = this.history.length + 1;
    const lastMove = this.history[this.history.length - 1];

    if (turn <= 2) {
      // コソ泥 (1-2ターン目): 10ダメ + ゴールド強奪
      this.setNextMove({
        id: 'mug',
        type: 'attack',
        value: 10,
        name: 'コソ泥',
        effect: (self, player) => {
          const stealAmount = self.getStatusValue('thievery') || 15;
          const amount = Math.min(player.gold, stealAmount);
          player.gold -= amount;
          this.stolenGold += amount;
          console.log(`Looter stole ${amount} gold! Total: ${this.stolenGold}`);
        }
      });
    } else if (turn === 3) {
      // 3ターン目: 50%で突き、50%で煙玉
      if (Math.random() < 0.5) {
        this.setNextMove({
          id: 'lunge',
          type: 'attack',
          value: 12,
          name: '突き',
          effect: (self, player) => {
            const stealAmount = self.getStatusValue('thievery') || 15;
            const amount = Math.min(player.gold, stealAmount);
            player.gold -= amount;
            this.stolenGold += amount;
            console.log(`Looter stole ${amount} gold! Total: ${this.stolenGold}`);
          }
        });
      } else {
        this.setNextMove({
          id: 'smoke',
          type: 'buff',
          name: '煙玉',
          effect: (self) => self.addBlock(6)
        });
      }
    } else if (lastMove === 'lunge') {
      // 突き（T3）の次は煙玉（T4）
      this.setNextMove({
        id: 'smoke',
        type: 'buff',
        name: '煙玉',
        effect: (self) => self.addBlock(6)
      });
    } else if (lastMove === 'smoke') {
      // 煙玉の次は逃走
      this.setNextMove({
        id: 'escape',
        type: 'special',
        name: '逃走',
        effect: (self, player, engine) => engine.removeEnemy(self)
      });
    } else {
      // 前に煙玉を使っていた場合は逃走（念のため）
      this.setNextMove({
        id: 'escape',
        type: 'special',
        name: '逃走',
        effect: (self, player, engine) => engine.removeEnemy(self)
      });
    }
    this.history.push(this.nextMove.id);
  }

  onDeath(player, engine) {
    if (this.stolenGold > 0) {
      player.gold += this.stolenGold;
      console.log(`Recovered ${this.stolenGold} gold from Looter!`);
    }
  }
}

export class GremlinNob extends Enemy {
  history: any[];

  constructor() {
    super('グレムリンノブ', 82 + Math.floor(Math.random() * 5), 'assets/images/enemies/GremlinNob.png');
    this.history = [];
  }

  decideNextMove() {
    const turn = this.history.length + 1;
    if (turn === 1) {
      this.setNextMove({
        id: 'enrage',
        type: 'buff',
        name: '激怒',
        statusEffects: [{ type: 'enrage_enemy', value: 2 }],
        effect: (self) => {
          this.addStatus('enrage_enemy', 2);
          console.log('Gremlin Nob is enraged! Skill play will buff him!');
        }
      });
    } else {
      const roll = Math.random() * 100;
      if (roll < 33) {
        this.setNextMove({ id: 'bash', type: 'attack', value: 6, name: 'スカルバッシュ', statusEffects: [{ type: 'weak', value: 2 }], effect: (self, player) => player.addStatus('weak', 2) });
      } else {
        this.setNextMove({ id: 'rush', type: 'attack', value: 14, name: 'ラッシュ' });
      }
    }
    this.history.push(this.nextMove.id);
  }

  onPlayerPlayCard(card) {
    const enrageValue = this.getStatusValue('enrage_enemy');
    if (enrageValue > 0 && card.type === 'skill') {
      this.addStatus('strength', enrageValue);
      console.log(`Nob gets stronger from your skill! (+${enrageValue} Strength)`);
    }
  }
}

export class Lagavulin extends Enemy {
  isSleeping: boolean;
  idleTurns: number;
  attackCycle: number;

  constructor() {
    super('ラガヴーリン', 109 + Math.floor(Math.random() * 3), 'assets/images/enemies/Lagavulin.png');
    this.addStatus('metallicize', 8);
    this.isSleeping = true;
    this.idleTurns = 0;
    this.attackCycle = 0;
  }

  takeDamage(amount, source) {
    const prevHp = this.hp;
    const damage = super.takeDamage(amount, source);
    if (this.isSleeping && this.hp < prevHp) {
      this.wakeUp(true);
    }
    return damage;
  }

  wakeUp(byDamage) {
    this.isSleeping = false;
    this.removeStatus('metallicize');
    if (byDamage) {
      this.setNextMove({ id: 'stun', type: 'special', name: 'スタン', effect: () => console.log('Lagavulin is stunned!') });
    }
    console.log('Lagavulin has awoken!');
  }

  decideNextMove() {
    if (this.isSleeping) {
      this.idleTurns++;
      if (this.idleTurns >= 3) {
        this.setNextMove({ id: 'wake', type: 'special', name: '覚醒', effect: () => this.wakeUp(false) });
      } else {
        this.setNextMove({ id: 'sleep', type: 'special', name: '睡眠中' });
      }
      return;
    }

    if (this.nextMove && this.nextMove.id === 'stun') {
      // スタンの次は攻撃サイクルの最初から
      this.attackCycle = 0;
    }

    const m = this.attackCycle % 3;
    if (m === 0 || m === 1) {
      this.setNextMove({ id: 'attack', type: 'attack', value: 18, name: '攻撃' });
    } else {
      this.setNextMove({
        id: 'siphon', type: 'debuff', name: '魂抽出', statusEffects: [{ type: 'strength', value: -1 }, { type: 'dexterity', value: -1 }], effect: (self, player) => {
          player.addStatus('strength', -1);
          player.addStatus('dexterity', -1);
        }
      });
    }
    this.attackCycle++;
  }
}

export class Sentry extends Enemy {
  position: number;
  turnCount: number;

  constructor(position) {
    super('センチネル', 38 + Math.floor(Math.random() * 5), 'assets/images/enemies/Sentry.png');
    this.addStatus('artifact', 1);
    this.position = position; // 0: left, 1: middle, 2: right
    this.turnCount = 0;
  }

  decideNextMove() {
    // 左右：めまい -> ビーム。 中央：ビーム -> めまい。
    const isBeamTurn = (this.position === 1) ? (this.turnCount % 2 === 0) : (this.turnCount % 2 === 1);

    if (isBeamTurn) {
      this.setNextMove({ id: 'beam', type: 'attack', value: 9, name: 'ビーム' });
    } else {
      this.setNextMove({
        id: 'dazed', type: 'debuff', name: 'めまい', effect: (self, player, engine) => {
          if (engine && engine.addCardsToDiscard) {
            engine.addCardsToDiscard('DAZED', 3);
          }
          console.log("3x Dazed added to discard!");
        }
      });
    }
    this.turnCount++;
  }
}

export class SlimeBoss extends Enemy {
  history: any[];

  constructor() {
    super('スライムボス', 140, 'assets/images/enemies/SlimeBoss.png');
    this.history = [];
  }

  decideNextMove() {
    if (this.hp <= this.maxHp / 2) {
      this.setNextMove({
        id: 'split',
        type: 'special',
        name: '分裂',
        effect: (self, player, engine) => engine.splitEnemy(self, AcidSlimeL, SpikeSlimeL)
      });
      return;
    }

    const turn = this.history.length + 1;
    const m = turn % 3;
    if (m === 1) {
      this.setNextMove({
        id: 'spray',
        type: 'debuff',
        name: '汚物スプレー',
        effect: (self, player, engine) => {
          if (engine && engine.addCardsToDiscard) {
            engine.addCardsToDiscard('SLIMED', 3);
          }
        }
      });
    } else if (m === 2) {
      this.setNextMove({ id: 'prepare', type: 'special', name: '準備' });
    } else {
      this.setNextMove({ id: 'crush', type: 'attack', value: 35, name: 'スライムクラッシュ' });
    }
    this.history.push(this.nextMove.id);
  }
}

export class Guardian extends Enemy {
  mode: string;             // 'offensive' | 'defensive'
  modeShiftThreshold: number;  // 次のモードシフト発動に必要なダメージ閾値
  defensiveTurns: number;   // 防御態勢中のターン数
  offensiveMoveIndex: number; // 攻撃態勢の行動インデックス（0=チャージからスタート）
  offensiveSprite: string;  // 攻撃態勢用スプライト
  defensiveSprite: string;  // 防御態勢用スプライト

  constructor() {
    super('ガーディアン', 240, 'assets/images/enemies/Guardian.png');
    this.mode = 'offensive';
    this.modeShiftThreshold = 30;
    this.defensiveTurns = 0;
    this.offensiveMoveIndex = 0;
    this.offensiveSprite = 'assets/images/enemies/Guardian.png';
    this.defensiveSprite = 'assets/images/enemies/GuardianDefense.png';
  }

  // 戦闘開始時: チャージを使用し、モードシフトを付与
  onBattleStart(player, engine) {
    super.onBattleStart(player, engine);
    // モードシフト初期付与（値=閾値）
    this.addStatus('mode_shift', this.modeShiftThreshold);
    // 最初の行動インデックスはチャージ（index=1）に設定
    // decideNextMoveで0=旋風刃のためcharg=1から始める
    this.offensiveMoveIndex = 1; // チャージからスタート
  }

  // ダメージを受けるたびにモードシフト値を減少
  takeDamage(amount, source) {
    const prevHp = this.hp;
    const damage = super.takeDamage(amount, source);
    const actualLoss = prevHp - this.hp;

    if (this.mode === 'offensive' && actualLoss > 0) {
      // mode_shift ステータスの値を減少（プレイヤーに残り量を可視化）
      const current = this.getStatusValue('mode_shift');
      const newVal = current - actualLoss;
      // ステータスを上書き（removeしてaddし直す）
      this.removeStatus('mode_shift');
      if (newVal <= 0) {
        // 閾値到達: 防御態勢へ移行
        this.changeMode('defensive');
      } else {
        this.addStatus('mode_shift', newVal);
      }
    }
    return damage;
  }

  // 態勢変更処理
  changeMode(newMode) {
    this.mode = newMode;
    if (newMode === 'defensive') {
      // 20ブロック獲得
      this.addBlock(20);
      this.defensiveTurns = 0;
      // 防御態勢の画像に切り替え
      this.sprite = this.defensiveSprite;

      // 行動を「モードシフト」に差し替え
      this.setNextMove({
        id: 'mode_shift_action',
        type: 'buff',
        name: 'モードシフト',
        effect: (self) => {
          self.addStatus('sharp_hide', 3);
        }
      });

      console.log('Guardian shifted to Defensive Mode!');
    } else {
      // 攻撃態勢へ戻る: シャープハイドを解除
      this.removeStatus('sharp_hide');
      // 閾値を10増やしてモードシフトを再付与
      this.modeShiftThreshold += 10;
      this.addStatus('mode_shift', this.modeShiftThreshold);
      // 攻撃態勢の画像に戻す
      this.sprite = this.offensiveSprite;
      // 攻撃態勢の行動順を最初（旋風刃）にリセット
      this.offensiveMoveIndex = 0;
      console.log(`Guardian shifted to Offensive Mode! Next threshold: ${this.modeShiftThreshold}`);
    }
  }

  // プレイヤーがアタックカードを使用した際のシャープハイドダメージ
  onPlayerPlayCard(card, player, engine) {
    if (this.mode === 'defensive' && card.type === 'attack') {
      const sharpHideVal = this.getStatusValue('sharp_hide');
      if (sharpHideVal > 0) {
        console.log(`シャープハイド発動！ プレイヤーに ${sharpHideVal} ダメージ。`);
        // プレイヤーのブロックで防げるように takeDamage を使用
        player.takeDamage(sharpHideVal, this);
      }
    }
  }

  decideNextMove() {
    if (this.mode === 'defensive') {
      this.defensiveTurns++;
      if (this.defensiveTurns === 1) {
        // 防御態勢1ターン目: シャープハイド3付与 + 通常攻撃9ダメージ
        this.setNextMove({
          id: 'normal_attack',
          type: 'attack',
          value: 9,
          name: '攻撃',
          effect: (self) => {
            // シャープハイドを付与（まだ付与されていない場合）
            if (!self.hasStatus('sharp_hide')) {
              self.addStatus('sharp_hide', 3);
            }
          }
        });
      } else {
        // 防御態勢2ターン目: ツインスラム → 攻撃態勢へ移行
        this.setNextMove({
          id: 'twin_slam',
          type: 'attack',
          value: 8,
          times: 2,
          name: 'ツインスラム',
          effect: (self) => {
            // シャープハイド解除 → 攻撃態勢へ
            self.changeMode('offensive');
          }
        });
      }
      return;
    }

    // 攻撃態勢ループ: 旋風刃(0) → チャージ(1) → フィアースバッシュ(2) → 蒸気解放(3)
    const m = this.offensiveMoveIndex % 4;
    this.offensiveMoveIndex++;

    if (m === 0) {
      this.setNextMove({ id: 'whirl', type: 'attack', value: 5, times: 4, name: '旋風刃' });
    } else if (m === 1) {
      this.setNextMove({ id: 'charge', type: 'buff', name: 'チャージ', effect: (self) => self.addBlock(9) });
    } else if (m === 2) {
      this.setNextMove({ id: 'bash', type: 'attack', value: 32, name: 'フィアースバッシュ' });
    } else {
      this.setNextMove({
        id: 'vent',
        type: 'debuff',
        name: '蒸気解放',
        statusEffects: [{ type: 'weak', value: 2 }, { type: 'vulnerable', value: 2 }],
        effect: (self, player) => {
          player.addStatus('weak', 2);
          player.addStatus('vulnerable', 2);
        }
      });
    }
  }
}

export class Hexaghost extends Enemy {
  history: any[];
  isFirstTurn: boolean = true;
  isInfernoUsed: boolean = false;

  constructor() {
    super('ヘキサゴースト', 250, 'assets/images/enemies/Hexaghost.png');
    this.history = [];
  }

  decideNextMove(player?: any) {
    const turn = this.history.length + 1;
    let move;

    if (turn === 1) {
      move = { id: 'idle', type: 'special', name: '活性化中' };
    } else if (turn === 2) {
      // プレイヤーの現在HPに依存: (HP/12 + 1)x6
      const p = player ? player.hp : 72;
      const dmg = Math.floor(p / 12) + 1;
      move = { id: 'divider', type: 'attack', value: dmg, times: 6, name: 'ディバイダー' };
    } else {
      const loopTurn = (turn - 3) % 7;
      switch (loopTurn) {
        case 0: // シアー
        case 2:
        case 5:
          move = {
            id: 'sear',
            type: 'attack',
            value: 6,
            name: 'シアー',
            statusEffects: [{ type: 'burn', value: 1 }],
            effect: (self, p, engine) => {
              if (engine && engine.addCardsToDiscard) {
                engine.addCardsToDiscard('BURN', 1, this.isInfernoUsed);
              }
            }
          };
          break;
        case 1: // 二連撃
        case 4:
          move = { id: 'tackle', type: 'attack', value: 5, times: 2, name: '二連撃' };
          break;
        case 3: // 発火
          move = {
            id: 'ignite',
            type: 'buff',
            name: '発火',
            effect: (self) => {
              self.addStatus('strength', 2);
              self.addBlock(12);
            }
          };
          break;
        case 6: // インフェルノ
          move = {
            id: 'inferno',
            type: 'attack',
            value: 2,
            times: 6,
            name: 'インフェルノ',
            statusEffects: [{ type: 'burn', value: 3 }],
            effect: (self, p, engine) => {
              // 1. 強化済み火傷3枚を捨て札に追加
              if (engine && engine.addCardsToDiscard) {
                engine.addCardsToDiscard('BURN', 3, true);
              }
              // 2. 手札・山札・捨て札にある全ての「火傷」カードを強化
              const upgradeBurnsInList = (list) => {
                list.forEach(card => {
                  if (card.id === 'burn') card.upgrade();
                });
              };
              if (engine && engine.player) {
                upgradeBurnsInList(engine.player.hand);
                upgradeBurnsInList(engine.player.deck);
                upgradeBurnsInList(engine.player.discard);
              }
              // 3. 以降のシアーを強化
              this.isInfernoUsed = true;
            }
          };
          break;
      }
    }
    this.setNextMove(move);
    this.history.push(move.id);
  }
}
