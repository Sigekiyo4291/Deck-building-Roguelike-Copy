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

    this.hp = Math.max(0, this.hp - remainingDamage);
    return remainingDamage;
  }

  addBlock(amount) {
    this.block += amount;
  }

  resetBlock() {
    this.block = 0;
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
