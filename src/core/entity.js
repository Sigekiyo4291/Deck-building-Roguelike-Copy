import { CardLibrary } from './card.js';
import { RelicLibrary } from './relic.js';

export class Entity {
  constructor(name, maxHp, sprite) {
    this.name = name;
    this.maxHp = maxHp;
    this.hp = maxHp;
    this.block = 0;
    this.sprite = sprite;
    this.statusEffects = [];
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

    // トゲ(Thorns)処理
    const thorns = this.getStatusValue('thorns');
    if (thorns > 0 && source && remainingDamage < amount && source !== this) {
      // ブロックで完全に防がれた場合はトゲ発動しない（Spireの仕様によるが、今回は「攻撃を受けたら」とするためブロック貫通でも発動とする）
      // Spire wiki: "When attacked, deals damage back to the attacker." (Attacked = attack card played against)
      // ここでは簡易的に「ダメージ計算が発生したら」返す
      source.takeDamage(thorns, null);
    } else if (thorns > 0 && source && source !== this) {
      // ダメージを受けた、またはブロックで防いだ
      source.takeDamage(thorns, null);
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

      // 儀式(ritual): ターン終了時に筋力を得る
      if (s.type === 'ritual') {
        this.addStatus('strength', s.value);
      }
    });
    // 値が0のものを削除
    this.statusEffects = this.statusEffects.filter(s => s.value !== 0);
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
  constructor() {
    super('Vanguard', 50, 'src/assets/player.png');
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

  resetEnergy() {
    this.energy = this.maxEnergy;
  }
}

export class Enemy extends Entity {
  constructor(name, hp, sprite) {
    super(name, hp, sprite);
    this.nextMove = null;
  }

  setNextMove(move) {
    this.nextMove = move;
  }

  decideNextMove() {
    // デフォルト行動（スライムなど）
    const damage = 5 + Math.floor(Math.random() * 5);
    this.setNextMove({ type: 'attack', value: damage });
  }
}

export class Louse extends Enemy {
  constructor(color) {
    const hp = 10 + Math.floor(Math.random() * 8); // 10-17
    const name = color === 'red' ? '赤の寄生虫' : '緑の寄生虫';
    super(name, hp, 'src/assets/Louse.png');
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
  constructor() {
    super('アシッドスライム(M)', 28 + Math.floor(Math.random() * 5), 'src/assets/AcidSlimeM.png');
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
  constructor() {
    super('スパイクスライム(M)', 28 + Math.floor(Math.random() * 5), 'src/assets/SpikeSlimeM.png');
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
  constructor() {
    super('アシッドスライム(S)', 8 + Math.floor(Math.random() * 5), 'src/assets/AcidSlimeS.png');
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
    super('スパイクスライム(S)', 10 + Math.floor(Math.random() * 5), 'src/assets/SpikeSlimeS.png');
  }

  decideNextMove() {
    this.setNextMove({ type: 'attack', value: 5, name: '体当たり' });
  }
}

export class FungiBeast extends Enemy {
  constructor() {
    super('キノコビースト', 22 + Math.floor(Math.random() * 7), 'src/assets/FungiBeast.png');
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
  constructor() {
    super('狂信者', 48 + Math.floor(Math.random() * 7), 'src/assets/Cultist.png');
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
  constructor() {
    super('あご虫', 40 + Math.floor(Math.random() * 5), 'src/assets/JawWorm.png');
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
  constructor() {
    super('大型酸性スライム', 65 + Math.floor(Math.random() * 5), 'src/assets/AcidSlimeL.png');
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
  constructor() {
    super('大型スパイクスライム', 64 + Math.floor(Math.random() * 7), 'src/assets/SpikeSlimeL.png');
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
  constructor() {
    super('スレイバー(青)', 46 + Math.floor(Math.random() * 5), 'src/assets/BlueSlaver.png');
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
  constructor() {
    super('スレイバー(赤)', 46 + Math.floor(Math.random() * 5), 'src/assets/RedSlaver.png');
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
  constructor() {
    super('略奪者', 44 + Math.floor(Math.random() * 5), 'src/assets/Looter.png');
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
  constructor() {
    super('グレムリンノブ', 82 + Math.floor(Math.random() * 5), 'src/assets/GremlinNob.png');
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
  constructor() {
    super('ラガヴーリン', 109 + Math.floor(Math.random() * 3), 'src/assets/Lagavulin.png');
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
  constructor(position) {
    super('センチネル', 38 + Math.floor(Math.random() * 5), 'src/assets/Sentry.png');
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
  constructor() {
    super('スライムボス', 140, 'src/assets/SlimeBoss.png');
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
  constructor() {
    super('ガーディアン', 240, 'src/assets/Guardian.png');
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
  constructor() {
    super('ヘキサゴースト', 250, 'src/assets/Hexaghost.png');
    this.history = [];
  }

  decideNextMove(player) {
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
