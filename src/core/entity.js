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

  takeDamage(amount, source) {
    let remainingDamage = amount;

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

    // 脆弱状態ならダメージ1.5倍
    if (this.hasStatus('vulnerable')) {
      remainingDamage = Math.ceil(remainingDamage * 1.5);
    }

    this.hp = Math.max(0, this.hp - remainingDamage);

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

  addBlock(amount) {
    const dexterity = this.getStatusValue('dexterity');
    let totalBlock = Math.max(0, amount + dexterity);

    // 虚弱(frail)状態ならブロック獲得量25%減少
    if (this.hasStatus('frail')) {
      totalBlock = Math.floor(totalBlock * 0.75);
    }

    this.block += totalBlock;
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

    return Math.max(0, damage); // 負のダメージにはならない
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

  updateStatus() {
    // ターン終了時の更新
    this.statusEffects.forEach(s => {
      // 筋力(strength)は自動減少しない
      // 脆弱(vulnerable)などはターン経過で減少
      if (['vulnerable', 'weak', 'frail'].includes(s.type)) {
        if (s.value > 0) s.value--;
      }
    });
    // 値が0のものを削除（負の値は筋力ダウンなどであり得るので残す）
    this.statusEffects = this.statusEffects.filter(s => s.value !== 0);
  }

  resetStatus() {
    this.statusEffects = [];
  }

  isDead() {
    return this.hp <= 0;
  }
}

export class Player extends Entity {
  constructor() {
    super('Vanguard', 50, '/src/assets/player.png');
    this.energy = 3;
    this.maxEnergy = 3;
    this.deck = [];
    this.hand = [];
    this.discard = [];
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
    const name = color === 'red' ? '赤の寄生虫' : '緑の寄生虫';
    const hp = 10 + Math.floor(Math.random() * 6); // HP 10-15
    super(name, hp, '/src/assets/slime.png');
    this.color = color;
  }

  decideNextMove() {
    const roll = Math.random();
    if (this.color === 'red') {
      // 攻撃 or 筋力（未実装のため攻撃のみ）
      // 簡易的に攻撃のダメージ幅を変える
      const dmg = 5 + Math.floor(Math.random() * 3); // 5-7
      this.setNextMove({ type: 'attack', value: dmg });
    } else {
      // 攻撃
      const dmg = 4 + Math.floor(Math.random() * 3); // 4-6
      this.setNextMove({ type: 'attack', value: dmg });
    }
  }
}
