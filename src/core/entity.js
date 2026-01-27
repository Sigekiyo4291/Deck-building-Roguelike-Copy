import { CardLibrary } from './card.js';

export class Entity {
  constructor(name, maxHp, sprite) {
    this.name = name;
    this.maxHp = maxHp;
    this.hp = maxHp;
    this.block = 0;
    this.sprite = sprite;
    this.statusEffects = [];
  }

  takeDamage(amount) {
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
    return remainingDamage;
  }

  addBlock(amount) {
    this.block += amount;
  }

  resetBlock() {
    this.block = 0;
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
    return this.statusEffects.some(s => s.type === type && s.value > 0);
  }

  updateStatus() {
    // ターン終了時に呼び出し（値を減らす）
    this.statusEffects.forEach(s => {
      if (s.value > 0) s.value--;
    });
    // 値が0以下のものを削除
    this.statusEffects = this.statusEffects.filter(s => s.value > 0);
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
    this.gold = 0;
    this.potions = [];

    // マスターデッキ（所持カード）の初期化
    this.masterDeck = [];
    for (let i = 0; i < 5; i++) this.masterDeck.push(CardLibrary.STRIKE.clone());
    for (let i = 0; i < 4; i++) this.masterDeck.push(CardLibrary.DEFEND.clone());
    this.masterDeck.push(CardLibrary.BASH.clone());
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
}
