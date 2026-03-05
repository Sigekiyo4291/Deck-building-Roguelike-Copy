import { IntentType, EnemyMove } from './intent';
import { StatusLibrary } from './status-effect';
import { IEntity, IBattleEngine, IRelic, IPlayer, ICard, IEnemy } from './types';

// DEBUFF_TYPES, BUFF_TYPES は削除され、StatusLibrary で管理されます。

export function isDebuff(type: string, value: number): boolean {
  return StatusLibrary.isDebuff(type, value);
}

export function isBuff(type: string, value: number): boolean {
  return StatusLibrary.isBuff(type, value);
}

export class Entity implements IEntity {
  name: string;
  maxHp: number;
  hp: number;
  block: number;
  image: string;
  statusEffects: { [key: string]: number };
  uuid: string;
  isEnemy: boolean = false;
  relics: IRelic[] = [];
  relicCounters: Record<string, number> = {};
  onGainBlock?: () => void;
  hpLossCount: number = 0;
  character: string = 'ironclad';
  isPlayer: boolean = false;
  cardRemovalCount: number = 0;
  isRemovalUsedThisShop: boolean = false;
  potionSlots: number = 3;

  constructor(name: string, maxHp: number, image: string) {
    this.name = name;
    this.maxHp = maxHp;
    this.hp = maxHp;
    this.block = 0;
    this.image = image;
    this.statusEffects = {};
    this.relicCounters = {};
    this.uuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  heal(amount: number) {
    if (this.relics && this.relics.some(r => r.id === 'mark_of_the_bloom')) {
      console.log('花の印により回復が無効化されました。');
      return;
    }
    let finalAmount = amount;
    if (this.relics && this.relics.length > 0) {
      this.relics.forEach(r => {
        if (r.modifyHealAmount && (this as any).isPlayer) finalAmount = r.modifyHealAmount(this as unknown as IPlayer, finalAmount);
      });
    }
    this.hp = Math.min(this.maxHp, this.hp + finalAmount);
  }

  increaseMaxHp(amount: number) {
    this.maxHp += amount;
    this.hp += amount;
  }

  loseHP(amount: number): number {
    const prevHp = this.hp;
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp < prevHp && 'hpLossCount' in this) {
      (this as any).hpLossCount = ((this as any).hpLossCount || 0) + 1;

      const ruptureVal = this.getStatusValue('rupture');
      if (ruptureVal > 0) {
        // console.log(`破裂発動！ HPを失ったため筋力を ${ruptureVal} 得る。`);
        this.addStatus('strength', ruptureVal);
      }
    }
    return amount;
  }

  takeDamage(amount: number, source?: IEntity | null, engine?: IBattleEngine) {
    let totalDamage = this.applyTargetModifiers ? this.applyTargetModifiers(amount, source || null) : amount;
    let remainingDamage = totalDamage;

    if (this.block > 0) {
      const oldBlock = this.block;
      if (this.block >= remainingDamage) {
        this.block -= remainingDamage;
        remainingDamage = 0;
      } else {
        remainingDamage -= this.block;
        this.block = 0;
      }

      if (oldBlock > 0 && this.block === 0 && source && source.relics) {
        source.relics.forEach((relic: any) => {
          if (relic.onBlockBroken) relic.onBlockBroken(source, this, engine || null);
        });
      }
    }

    if (remainingDamage > 0 && this.relics && this.relics.length > 0) {
      const hasTungsten = this.relics.some(r => r.id === 'tungsten_rod');
      if (hasTungsten) {
        remainingDamage = Math.max(0, remainingDamage - 1);
        // console.log(`タングステンの棒発動！ ダメージを1軽減。残りダメージ: ${remainingDamage}`);
      }
    }

    if (remainingDamage > 0 && remainingDamage <= 5 && this.relics && this.relics.length > 0) {
      if (this.relics.some(r => r.id === 'torii')) {
        remainingDamage = 1;
        // console.log(`鳥居発動！ 被ダメージを ${remainingDamage} に軽減。`);
      }
    }

    if (remainingDamage > 0 && this.relics && this.relics.length > 0) {
      // const helix = this.relics.find(r => r.id === 'fossilized_helix'); // helix is not used
      if ((this.relicCounters['fossilized_helix'] || 0) > 0) {
        remainingDamage = 0;
        this.relicCounters['fossilized_helix'] = 0;
        // console.log('貝の化石発動！ ダメージを無効化しました。');
      }
    }

    const prevHp = this.hp;
    this.hp = Math.max(0, this.hp - remainingDamage);

    if (remainingDamage > 0 || (source && (source as any) !== this)) {
      for (const type in this.statusEffects) {
        const effect = StatusLibrary.get(type);
        if (effect && effect.onReceiveDamage) {
          effect.onReceiveDamage(this, this.statusEffects[type], remainingDamage, source || null, engine);
        }
      }
    }

    if (this.hp === 0 && prevHp > 0 && this.relics && this.relics.length > 0) {
      // const tail = this.relics.find(r => r.id === 'lizard_tail'); // tail is not used
      if ((this.relicCounters['lizard_tail'] || 0) > 0) {
        this.hp = Math.floor(this.maxHp * 0.5);
        this.relicCounters['lizard_tail'] = 0;
        // console.log('トカゲのしっぽ発動！ 復活しました。');
      }
    }

    if (this.hp < prevHp) {
      const curlUpVal = this.getStatusValue('curl_up');
      if (curlUpVal > 0) {
        // console.log(`${this.name} の「まるくなる」発動！ ${curlUpVal} ブロック獲得。`);
        this.addBlock(curlUpVal);
        this.removeStatus('curl_up');
      }
    }

    if (remainingDamage > 0) {
      const angryVal = this.getStatusValue('angry');
      if (angryVal > 0) {
        // console.log(`${this.name} は怒りで筋力を ${angryVal} 得た！`);
        this.addStatus('strength', angryVal);
      }
    }

    if (remainingDamage > 0 && 'hpLossCount' in this) {
      (this as any).hpLossCount = ((this as any).hpLossCount || 0) + 1;
      if (source === null || source === undefined) {
        const ruptureVal = this.getStatusValue('rupture');
        if (ruptureVal > 0) {
          // console.log(`破裂発動！ カード起因のダメージでHPを失ったため筋力を ${ruptureVal} 得る。`);
          this.addStatus('strength', ruptureVal);
        }
      }
    }

    const thorns = this.getStatusValue('thorns');
    const flameBarrier = this.getStatusValue('flame_barrier');
    const totalReflect = thorns + flameBarrier;
    if (totalReflect > 0 && source && (source as any) !== this) {
      source.takeDamage(totalReflect, this);
    }

    if (remainingDamage > 0) {
      const platedArmor = this.getStatusValue('plated_armor');
      if (platedArmor > 0) {
        this.addStatus('plated_armor', -1);
      }
    }

    return remainingDamage;
  }

  calculateBlock(amount: number) {
    const dexterity = this.getStatusValue('dexterity');
    let totalBlock = Math.max(0, amount + dexterity);
    if (this.hasStatus('frail')) {
      totalBlock = Math.floor(totalBlock * 0.75);
    }
    return totalBlock;
  }

  addBlock(amount: number) {
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

  calculateDamage(baseDamage: number) {
    let damage = baseDamage;
    const strength = this.getStatusValue('strength');
    damage += strength;
    if (this.hasStatus('weak')) {
      damage = Math.floor(damage * 0.75);
    }
    return Math.max(0, damage);
  }

  applyTargetModifiers(damage: number, source: IEntity | null): number {
    let finalDamage = damage;
    for (const type in this.statusEffects) {
      const effect = StatusLibrary.get(type);
      if (effect && effect.modifyIncomingDamage) {
        finalDamage = effect.modifyIncomingDamage(this, this.statusEffects[type], finalDamage);
      }
    }

    if (this.hasStatus('intangible') && finalDamage > 0) {
      return 1;
    }

    if (this.hasStatus('vulnerable')) {
      let multiplier = 1.5;
      if (this.relics && this.relics.some(r => r.id === 'odd_mushroom')) {
        multiplier = 1.25;
      } else if (source && source.relics) {
        const hasPhrog = source.relics.find((r: any) => r.id === 'paper_phrog');
        if (hasPhrog) multiplier = 1.75;
      }
      finalDamage = Math.floor(finalDamage * multiplier);
    }
    return finalDamage;
  }

  removeStatus(type: string) {
    delete this.statusEffects[type];
  }

  addStatus(type: string, value: number, source?: IEntity) {
    if (this.relics && this.relics.length > 0) {
      if (type === 'vulnerable' && value > 0 && this.relics.some(r => r.id === 'turnip')) {
        // console.log(`${this.name} はカブによって脆弱化を防いだ！`);
        return;
      }
      if (type === 'weak' && value > 0 && this.relics.some(r => r.id === 'ginger')) {
        // console.log(`${this.name} は生姜によって脱力を防いだ！`);
        return;
      }
    }

    if (isDebuff(type, value)) {
      const artifactVal = this.getStatusValue('artifact');
      if (artifactVal > 0) {
        // console.log(`${this.name} はアーティファクトで ${type} を防いだ！`);
        this.addStatus('artifact', -1);
        return;
      }
    }

    if (this.statusEffects[type]) {
      this.statusEffects[type] += value;
      if (this.statusEffects[type] === 0) {
        delete this.statusEffects[type];
      }
    } else if (value !== 0) {
      this.statusEffects[type] = value;
    }

    if (this.relics && this.relics.length > 0) {
      this.relics.forEach(r => {
        if (r.onApplyStatus && (this as any).isPlayer) r.onApplyStatus(this as unknown as IPlayer, this, type, value, null);
      });
    }

    if (source && source.relics && source.relics.length > 0) {
      source.relics.forEach((r: any) => {
        if (r.onApplyStatus) r.onApplyStatus(source as unknown as IPlayer, this, type, value, null);
      });
    }
  }

  hasStatus(type: string) {
    return !!this.statusEffects[type] && this.statusEffects[type] !== 0;
  }

  getStatusValue(type: string) {
    return this.statusEffects[type] || 0;
  }

  onExhaust?: (player: IPlayer, engine: IBattleEngine) => void;
  onEndTurnInHand?: (player: IPlayer, engine: IBattleEngine) => Promise<void> | void;

  onPlayerPlayCard(card: ICard, player: IPlayer, engine: IBattleEngine) {
    if (this.hasStatus('slow')) {
      this.addStatus('slow', 1);
    }
    if (this.hasStatus('time_warp')) {
      const current = this.getStatusValue('time_warp');
      this.addStatus('time_warp', -1);
      if (current <= 1) { // 減らした結果が0以下
        this.addStatus('time_warp', 12);
        this.addStatus('strength', 2);
        engine.endTurn();
      }
    }
  }

  onTurnEnd() {
    // ターン終了時の処理
  }

  updateStatusAtTurnStart(engine?: IBattleEngine) {
    for (const type in this.statusEffects) {
      const effect = StatusLibrary.get(type);
      if (effect) {
        this.statusEffects[type] = effect.onTurnStartUpdate(this, this.statusEffects[type], engine);
        if (this.statusEffects[type] === 0) delete this.statusEffects[type];
      }
    }
  }

  updateStatus(engine?: IBattleEngine) {
    if (this.onTurnEnd) this.onTurnEnd();
    for (const type in this.statusEffects) {
      const effect = StatusLibrary.get(type);
      if (effect) {
        this.statusEffects[type] = effect.onTurnEndUpdate(this, this.statusEffects[type], engine);
        if (this.statusEffects[type] === 0) delete this.statusEffects[type];
      }
    }
  }

  onTurnStart() {
    this.removeStatus('flame_barrier');
  }

  resetStatus() {
    this.statusEffects = {};
  }

  clearDebuffs() {
    // const prevCount = Object.keys(this.statusEffects).length; // prevCount is not used
    for (const type in this.statusEffects) {
      if (isDebuff(type, this.statusEffects[type])) {
        delete this.statusEffects[type];
      }
    }
    // if (Object.keys(this.statusEffects).length < prevCount) { // prevCount is not used
    //   console.log(`${this.name} のデバフを全解除しました。`);
    // }
  }

  isDead() {
    return this.hp <= 0;
  }

  onDeath(killer: IEntity | null, engine: IBattleEngine) { }
  onBattleStart(player: IEntity, engine: IBattleEngine) {
    // 戦闘開始時に呼び出されるフック
  }
}

export class Enemy extends Entity implements IEnemy {
  sprite: string;
  nextMove: EnemyMove | null;

  constructor(name: string, hp: number, sprite: string) {
    super(name, hp, sprite);
    this.sprite = sprite;
    this.nextMove = null;
  }

  setNextMove(move: EnemyMove) {
    this.nextMove = move;
  }

  decideNextMove(player?: IPlayer, engine?: IBattleEngine) {
    // デフォルト行動
    const damage = 5 + Math.floor(Math.random() * 5);
    this.setNextMove({ type: IntentType.Attack, value: damage, name: '攻撃' });
  }
}


