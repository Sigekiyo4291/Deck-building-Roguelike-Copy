import { CardLibrary } from './card';
import { RelicLibrary } from './relic';

export class Entity {
  name: string;
  maxHp: number;
  hp: number;
  block: number;
  sprite: string;
  statusEffects: { type: string, value: number }[];
  uuid: string;

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

    this.hp = Math.max(0, this.hp - remainingDamage);

    // 被ダメージ回数のカウントアップ（血には血を用）
    if (remainingDamage > 0 && this instanceof Player) {
      this.hpLossCount = (this.hpLossCount || 0) + 1;
    }

    // トゲ(Thorns) & 炎の障壁(Flame Barrier) 処理
    const thorns = this.getStatusValue('thorns');
    const flameBarrier = this.getStatusValue('flame_barrier');
    const totalReflect = thorns + flameBarrier;

    if (totalReflect > 0 && source && source !== this) {
      // 攻撃者に反射ダメージを与える
      source.takeDamage(totalReflect, null);
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
    this.block += this.calculateBlock(amount);
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
    const metal = this.getStatusValue('metallicize');
    if (metal > 0) {
      this.addBlock(metal);
    }
  }

  updateStatus() {
    this.onTurnEnd();
    // ターン終了時の更新
    this.statusEffects.forEach(s => {
      // 筋力(strength)は自動減少しない
      // 脆弱(vulnerable)などはターン経過で減少
      if (['vulnerable', 'weak', 'frail'].includes(s.type)) {
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

      // 儀式(ritual): ターン終了時に筋力を得る
      if (s.type === 'ritual') {
        this.addStatus('strength', s.value);
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
  potions: any[];
  relics: any[];
  masterDeck: any[];

  constructor() {
    super('Vanguard', 50, 'assets/player.png');
    this.energy = 3;
    this.maxEnergy = 3;
    this.hpLossCount = 0; // 今戦闘中にHPを失った回数
    this.deck = [];
    this.hand = [];
    this.discard = [];
    this.exhaust = [];
    this.gold = 100;
    this.potions = [];
    this.relics = []; // レリック所持リスト

    // マスターデッキ（所持カード）の初期化
    this.masterDeck = [];
    for (let i = 0; i < 5; i++) this.masterDeck.push(CardLibrary.STRIKE.clone());
    for (let i = 0; i < 4; i++) this.masterDeck.push(CardLibrary.DEFEND.clone());
    this.masterDeck.push(CardLibrary.BASH.clone());

    // 初期レリック
    this.relics.push(RelicLibrary.BURNING_BLOOD);
  }

  exhaustCard(card, engine) {
    this.exhaust.push(card);
    if (card.onExhaust && engine) {
      card.onExhaust(this, engine);
    }
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

  takeDamage(amount, source) {
    const prevHp = this.hp;
    const remainingDamage = super.takeDamage(amount, source);

    // まるくなる (Curl Up): 最初にダメージを受けた時に一度だけブロック獲得
    if (!this.hasCurledUp && this.hp < prevHp) {
      this.addBlock(this.curlUpValue);
      this.hasCurledUp = true;
      console.log(`${this.name} curled up for ${this.curlUpValue} block!`);
    }
    return remainingDamage;
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
          effect: (self) => self.addStatus('strength', 3)
        });
      } else {
        this.setNextMove({
          type: 'debuff',
          name: 'スパイトウェブ',
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
      // 攻撃 (60%)
      this.setNextMove({ id: 'attack', type: 'attack', value: 6, name: '体当たり' });
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

  decideNextMove() {
    const roll = Math.random() * 100;
    const lastMove = this.history[this.history.length - 1];

    if (this.hp <= this.maxHp / 2) {
      this.setNextMove({
        id: 'split',
        type: 'special',
        name: '分裂',
        effect: (self, player, engine) => engine.splitEnemy(self, AcidSlimeM)
      });
      return;
    }

    if (roll < 30 && lastMove !== 'lick') {
      this.setNextMove({ id: 'lick', type: 'debuff', name: '舐める', effect: (self, player) => player.addStatus('weak', 2) });
    } else if (roll < 70) {
      this.setNextMove({ id: 'tackle', type: 'attack', value: 11, name: '膿んだ一撃' });
    } else {
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

  decideNextMove() {
    const roll = Math.random() * 100;
    const lastMove = this.history[this.history.length - 1];

    if (this.hp <= this.maxHp / 2) {
      this.setNextMove({
        id: 'split',
        type: 'special',
        name: '分裂',
        effect: (self, player, engine) => engine.splitEnemy(self, SpikeSlimeM)
      });
      return;
    }

    if (roll < 30 && lastMove !== 'lick') {
      this.setNextMove({ id: 'lick', type: 'debuff', name: '舐める', effect: (self, player) => player.addStatus('vulnerable', 2) });
    } else {
      this.setNextMove({ id: 'tackle', type: 'attack', value: 16, name: '炎の体当たり' });
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
      this.setNextMove({ id: 'rake', type: 'attack', value: 7, name: 'レーキ', effect: (self, player) => player.addStatus('weak', 1) });
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
        effect: (self, player) => {
          player.addStatus('entangled', 1);
          this.hasEntangled = true;
        }
      });
    } else if (roll < 50 && lastMove !== 'scrape') {
      this.setNextMove({ id: 'scrape', type: 'attack', value: 8, name: '引っ掻き', effect: (self, player) => player.addStatus('vulnerable', 1) });
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

  decideNextMove() {
    const turn = this.history.length + 1;
    const lastMove = this.history[this.history.length - 1];

    if (turn <= 2) {
      this.setNextMove({
        id: 'mug',
        type: 'attack',
        value: 10,
        name: 'コソ泥',
        effect: (self, player) => {
          const amount = Math.min(player.gold, 15);
          player.gold -= amount;
          this.stolenGold += amount;
          console.log(`Looter stole ${amount} gold! Total: ${this.stolenGold}`);
        }
      });
    } else if (turn === 3) {
      if (Math.random() < 0.5) {
        this.setNextMove({ id: 'lunge', type: 'attack', value: 12, name: '突き' });
      } else {
        this.setNextMove({ id: 'smoke', type: 'buff', name: '煙玉', effect: (self) => self.addBlock(6) });
      }
    } else if (lastMove === 'lunge') {
      this.setNextMove({ id: 'smoke', type: 'buff', name: '煙玉', effect: (self) => self.addBlock(6) });
    } else {
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
  isEnraged: boolean;

  constructor() {
    super('グレムリンノブ', 82 + Math.floor(Math.random() * 5), 'assets/images/enemies/GremlinNob.png');
    this.history = [];
    this.isEnraged = false;
  }

  decideNextMove() {
    const turn = this.history.length + 1;
    if (turn === 1) {
      this.setNextMove({
        id: 'enrage',
        type: 'buff',
        name: '激怒',
        effect: (self) => {
          this.isEnraged = true;
          console.log('Gremlin Nob is enraged! Skill play will buff him!');
        }
      });
    } else {
      const roll = Math.random() * 100;
      if (roll < 33) {
        this.setNextMove({ id: 'bash', type: 'attack', value: 6, name: 'スカルバッシュ', effect: (self, player) => player.addStatus('weak', 2) });
      } else {
        this.setNextMove({ id: 'rush', type: 'attack', value: 14, name: 'ラッシュ' });
      }
    }
    this.history.push(this.nextMove.id);
  }

  onPlayerPlayCard(card) {
    if (this.isEnraged && card.type === 'skill') {
      this.addStatus('strength', 2);
      console.log('Nob gets stronger from your skill!');
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
        id: 'siphon', type: 'debuff', name: '魂抽出', effect: (self, player) => {
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
          console.log("Dazed added to discard!"); // 本来はカード追加
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
      this.setNextMove({ id: 'spray', type: 'debuff', name: '汚物スプレー', effect: () => console.log('Slimed!') });
    } else if (m === 2) {
      this.setNextMove({ id: 'prepare', type: 'special', name: '準備' });
    } else {
      this.setNextMove({ id: 'crush', type: 'attack', value: 35, name: 'スライムクラッシュ' });
    }
    this.history.push(this.nextMove.id);
  }
}

export class Guardian extends Enemy {
  mode: string;
  damageTakenInMode: number;
  modeShiftThreshold: number;
  defensiveTurns: number;
  history: any[];

  constructor() {
    super('ガーディアン', 240, 'assets/images/enemies/Guardian.png');
    this.mode = 'offensive'; // offensive or defensive
    this.damageTakenInMode = 0;
    this.modeShiftThreshold = 30;
    this.defensiveTurns = 0;
    this.history = [];
  }

  takeDamage(amount, source) {
    const prevHp = this.hp;
    const damage = super.takeDamage(amount, source);
    const actualLoss = prevHp - this.hp;

    if (this.mode === 'offensive') {
      this.damageTakenInMode += actualLoss;
      if (this.damageTakenInMode >= this.modeShiftThreshold) {
        this.changeMode('defensive');
      }
    }
    return damage;
  }

  changeMode(newMode) {
    this.mode = newMode;
    if (newMode === 'defensive') {
      this.addStatus('thorns', 3);
      this.addBlock(20);
      this.defensiveTurns = 0;
      console.log('Guardian shifted to Defensive Mode!');
    } else {
      this.removeStatus('thorns');
      this.damageTakenInMode = 0;
      this.modeShiftThreshold += 10;
      console.log('Guardian shifted to Offensive Mode!');
    }
  }

  decideNextMove() {
    if (this.mode === 'defensive') {
      this.defensiveTurns++;
      if (this.defensiveTurns >= 2) {
        this.setNextMove({ id: 'shift', type: 'special', name: '形態変化', effect: () => this.changeMode('offensive') });
      } else {
        this.setNextMove({ id: 'slam', type: 'attack', value: 8, times: 2, name: 'ツインスラム' });
      }
      return;
    }

    const turn = this.history.length + 1;
    const m = turn % 4;
    if (m === 1) {
      this.setNextMove({ id: 'whirl', type: 'attack', value: 5, times: 4, name: '旋風刃' });
    } else if (m === 2) {
      this.setNextMove({ id: 'charge', type: 'buff', name: 'チャージ', effect: (self) => self.addBlock(9) });
    } else if (m === 3) {
      this.setNextMove({ id: 'bash', type: 'attack', value: 32, name: 'フィアースバッシュ' });
    } else {
      this.setNextMove({
        id: 'vent', type: 'debuff', name: '蒸気解放', effect: (self, player) => {
          player.addStatus('weak', 2);
          player.addStatus('vulnerable', 2);
        }
      });
    }
    this.history.push(this.nextMove.id);
  }
}

export class Hexaghost extends Enemy {
  history: any[];
  activated: boolean;
  turnCount: number;

  constructor() {
    super('ヘキサゴースト', 250, 'assets/images/enemies/Hexaghost.png');
    this.history = [];
  }

  decideNextMove(player?: any) {
    const turn = this.history.length + 1;
    if (turn === 1) {
      this.setNextMove({ id: 'idle', type: 'special', name: '活性化中' });
    } else if (turn === 2) {
      // プレイヤーの現在HPに依存: (HP/12 + 1)x6
      const p = player ? player.hp : 72; // フォールバック
      const dmg = Math.floor(p / 12) + 1;
      this.setNextMove({ id: 'divider', type: 'attack', value: dmg, times: 6, name: 'ディバイダー' });
    } else {
      const loopTurn = (turn - 3) % 7;
      const patterns = [
        { id: 'sear', type: 'attack', value: 6, name: 'シアー' },
        { id: 'tackle', type: 'attack', value: 5, times: 2, name: '二連撃' },
        { id: 'sear', type: 'attack', value: 6, name: 'シアー' },
        { id: 'ignite', type: 'buff', name: '発火', effect: (self) => { self.addStatus('strength', 2); self.addBlock(12); } },
        { id: 'tackle', type: 'attack', value: 5, times: 2, name: '二連撃' },
        { id: 'sear', type: 'attack', value: 6, name: 'シアー' },
        { id: 'inferno', type: 'attack', value: 3, times: 6, name: 'インフェルノ' }
      ];
      this.setNextMove(patterns[loopTurn]);
    }
    this.history.push(this.nextMove.id);
  }
}
