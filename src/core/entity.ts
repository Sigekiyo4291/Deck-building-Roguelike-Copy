import { IntentType, EnemyMove } from './intent';
import { StatusLibrary } from './status-effect';
import { IEntity, IBattleEngine } from './types';

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
  sprite: string;
  statusEffects: { type: string, value: number }[];
  uuid: string;
  relics: any[] = []; // レリックによる補正チェック用
  relicCounters: { [key: string]: number } = {}; // レリックの状態保持用
  onGainBlock?: () => void;

  constructor(name: string, maxHp: number, sprite: string) {
    this.name = name;
    this.maxHp = maxHp;
    this.hp = maxHp;
    this.block = 0;
    this.sprite = sprite;
    this.statusEffects = [];
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
        if (r.modifyHealAmount) finalAmount = r.modifyHealAmount(this, finalAmount);
      });
    }
    this.hp = Math.min(this.maxHp, this.hp + finalAmount);
  }

  // 最大HPを増やし、現在HPも同量回復させる（捕食など）
  increaseMaxHp(amount: number) {
    this.maxHp += amount;
    this.hp += amount;
  }

  // ブロック無視のHP減少（自傷や毒など）
  loseHP(amount: number) {
    const prevHp = this.hp;
    this.hp = Math.max(0, this.hp - amount);
    // hpLossCount を持つエンティティ（Player）のみ処理
    if (this.hp < prevHp && 'hpLossCount' in this) {
      (this as any).hpLossCount = ((this as any).hpLossCount || 0) + 1;

      // 破裂 (Rupture) の処理
      const ruptureVal = this.getStatusValue('rupture');
      if (ruptureVal > 0) {
        console.log(`破裂発動！ HPを失ったため筋力を ${ruptureVal} 得る。`);
        this.addStatus('strength', ruptureVal);
      }
    }
    return amount;
  }

  takeDamage(amount: number, source: IEntity | null, engine?: IBattleEngine) {
    // ターゲット側の補正（脆弱など）を適用
    let totalDamage = this.applyTargetModifiers(amount, source);
    let remainingDamage = totalDamage;

    // ブロックでダメージを軽減
    if (this.block > 0) {
      const oldBlock = this.block;
      if (this.block >= remainingDamage) {
        this.block -= remainingDamage;
        remainingDamage = 0;
      } else {
        remainingDamage -= this.block;
        this.block = 0;
      }

      // ブロックが破られた判定 (Hand Drill用)
      if (oldBlock > 0 && this.block === 0 && source && source.relics) {
        source.relics.forEach((relic: any) => {
          if (relic.onBlockBroken) relic.onBlockBroken(source, this, null);
        });
      }
    }

    if (remainingDamage > 0 && this.relics && this.relics.length > 0) {
      const hasTungsten = this.relics.some(r => r.id === 'tungsten_rod');
      if (hasTungsten) {
        remainingDamage = Math.max(0, remainingDamage - 1);
        console.log(`タングステンの棒発動！ ダメージを1軽減。残りダメージ: ${remainingDamage}`);
      }
    }

    if (remainingDamage > 0 && remainingDamage <= 5 && this.relics && this.relics.length > 0) {
      if (this.relics.some(r => r.id === 'torii')) {
        remainingDamage = 1;
        console.log(`鳥居発動！ 被ダメージを ${remainingDamage} に軽減。`);
      }
    }

    // 貝の化石 (Fossilized Helix)
    if (remainingDamage > 0 && this.relics && this.relics.length > 0) {
      const helix = this.relics.find(r => r.id === 'fossilized_helix');
      if (helix && (this.relicCounters['fossilized_helix'] || 0) > 0) {
        remainingDamage = 0;
        this.relicCounters['fossilized_helix'] = 0;
        console.log('貝の化石発動！ ダメージを無効化しました。');
      }
    }

    const prevHp = this.hp;
    this.hp = Math.max(0, this.hp - remainingDamage);

    // トリガー: onReceiveDamage
    if (remainingDamage > 0 || (source && (source as any) !== this)) {
      this.statusEffects.forEach(s => {
        const effect = StatusLibrary.get(s.type);
        if (effect && effect.onReceiveDamage) {
          effect.onReceiveDamage(this, s.value, remainingDamage, source, engine);
        }
      });
    }

    // トカゲのしっぽ (Lizard Tail)
    if (this.hp === 0 && prevHp > 0 && this.relics && this.relics.length > 0) {
      const tail = this.relics.find(r => r.id === 'lizard_tail');
      if (tail && (this.relicCounters['lizard_tail'] || 0) > 0) {
        this.hp = Math.floor(this.maxHp * 0.5);
        this.relicCounters['lizard_tail'] = 0;
        console.log('トカゲのしっぽ発動！ 復活しました。');
      }
    }

    // まるくなる (Curl Up) の処理: ダメージを受けた時に一度だけブロック獲得
    if (this.hp < prevHp) {
      const curlUpVal = this.getStatusValue('curl_up');
      if (curlUpVal > 0) {
        console.log(`${this.name} の「まるくなる」発動！ ${curlUpVal} ブロック獲得。`);
        this.addBlock(curlUpVal);
        this.removeStatus('curl_up');
      }
    }

    if (remainingDamage > 0) {
      const angryVal = this.getStatusValue('angry');
      if (angryVal > 0) {
        console.log(`${this.name} は怒りで筋力を ${angryVal} 得た！`);
        this.addStatus('strength', angryVal);
      }
    }

    // 被ダメージ回数のカウントアップ（血には血を用）
    if (remainingDamage > 0 && 'hpLossCount' in this) {
      (this as any).hpLossCount = ((this as any).hpLossCount || 0) + 1;

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

    if (totalReflect > 0 && source && (source as any) !== this) {
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

  calculateBlock(amount: number) {
    const dexterity = this.getStatusValue('dexterity');
    let totalBlock = Math.max(0, amount + dexterity);

    // 虚弱(frail)状態ならブロック獲得量25%減少
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

  // ダメージ計算（筋力補正 + 脱力）
  calculateDamage(baseDamage: number) {
    let damage = baseDamage;
    const strength = this.getStatusValue('strength');
    damage += strength;

    // 脱力(weak)状態ならダメージ減少
    if (this.hasStatus('weak')) {
      damage = Math.floor(damage * 0.75);
    }

    return Math.max(0, damage);
  }

  // ターゲット側の補正（脆弱など）を適用
  applyTargetModifiers(damage: number, source?: IEntity | null) {
    let finalDamage = damage;

    // StatusLibraryのmodifyIncomingDamageを適用
    this.statusEffects.forEach(s => {
      const effect = StatusLibrary.get(s.type);
      if (effect && effect.modifyIncomingDamage) {
        finalDamage = effect.modifyIncomingDamage(this, s.value, finalDamage);
      }
    });

    // 無形(intangible)
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

  // 特定のステータスの種類を削除（例：デバフ解除）
  removeStatus(type: string) {
    this.statusEffects = this.statusEffects.filter(s => s.type !== type);
  }

  // ステータス操作
  addStatus(type: string, value: number, source?: IEntity) {
    // レリックによるデバフ無効化
    if (this.relics && this.relics.length > 0) {
      if (type === 'vulnerable' && value > 0 && this.relics.some(r => r.id === 'turnip')) {
        console.log(`${this.name} はカブによって脆弱化を防いだ！`);
        return;
      }
      if (type === 'weak' && value > 0 && this.relics.some(r => r.id === 'ginger')) {
        console.log(`${this.name} は生姜によって脱力を防いだ！`);
        return;
      }
    }

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

    // レリック: onApplyStatus (自身または他者への付与時にトリガー)
    if (this.relics && this.relics.length > 0) {
      this.relics.forEach(r => {
        if (r.onApplyStatus) r.onApplyStatus(this, this, type, value, null);
      });
    }

    if (source && source.relics && source.relics.length > 0) {
      source.relics.forEach((r: any) => {
        if (r.onApplyStatus) r.onApplyStatus(source, this, type, value, null);
      });
    }
  }

  hasStatus(type: string) {
    return this.statusEffects.some(s => s.type === type && s.value !== 0);
  }

  getStatusValue(type: string) {
    const status = this.statusEffects.find(s => s.type === type);
    return status ? status.value : 0;
  }

  onPlayerPlayCard(card: any, player: IEntity, engine: IBattleEngine) {
    // プレイヤーがカードを使った時のフック
    if (this.hasStatus('slow')) {
      this.addStatus('slow', 1);
    }
    if (this.hasStatus('time_warp')) {
      this.addStatus('time_warp', -1);
      if (this.getStatusValue('time_warp') <= 0) {
        this.addStatus('time_warp', 12);
        this.addStatus('strength', 2);
        (engine as any).endTurn();
      }
    }
  }

  onTurnEnd() {
    // ターン終了時の処理
  }

  updateStatusAtTurnStart(engine?: IBattleEngine) {
    // ターン開始時の更新（無形、一部のデバフなど）
    this.statusEffects.forEach(s => {
      const effect = StatusLibrary.get(s.type);
      if (effect) {
        s.value = effect.onTurnStartUpdate(this, s.value, engine);
      }
    });
  }

  updateStatus(engine?: IBattleEngine) {
    this.onTurnEnd();
    // ターン終了時の更新
    this.statusEffects.forEach(s => {
      const effect = StatusLibrary.get(s.type);
      if (effect) {
        s.value = effect.onTurnEndUpdate(this, s.value, engine);
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

  // デバフを全解除する（オレンジ色の丸薬用）
  clearDebuffs() {
    const prevCount = this.statusEffects.length;
    this.statusEffects = this.statusEffects.filter(s => {
      return !isDebuff(s.type, s.value);
    });
    if (this.statusEffects.length < prevCount) {
      console.log(`${this.name} のデバフを全解除しました。`);
    }
  }

  isDead() {
    return this.hp <= 0;
  }

  onDeath(killer: IEntity | null, engine: IBattleEngine) {
    // 死亡時に呼び出されるフック
  }

  onBattleStart(player: IEntity, engine: IBattleEngine) {
    // 戦闘開始時に呼び出されるフック
  }
}

export class Enemy extends Entity {
  nextMove: EnemyMove | null;

  constructor(name: string, hp: number, sprite: string) {
    super(name, hp, sprite);
    this.nextMove = null;
  }

  setNextMove(move: EnemyMove) {
    this.nextMove = move;
  }

  decideNextMove(player?: IEntity, engine?: IBattleEngine) {
    // デフォルト行動
    const damage = 5 + Math.floor(Math.random() * 5);
    this.setNextMove({ type: IntentType.Attack, value: damage, name: '攻撃' });
  }
}


