import { Entity } from './entity';

export abstract class StatusEffect {
    abstract id: string;
    abstract name: string;
    abstract description: string;
    abstract icon: string; // 絵文字または画像パス

    /**
     * デバフかどうかを判定する
     * @param value 現在のスタック値
     */
    isDebuff(value: number): boolean {
        return false;
    }

    /**
     * バフかどうかを判定する
     * @param value 現在のスタック値
     */
    isBuff(value: number): boolean {
        return false;
    }

    /**
     * ターン開始時（プレイヤーのドロー前など）の処理
     * @param entity 付与されているエンティティ
     * @param value 現在のスタック値
     * @param engine バトルエンジン（オプション）
     * @returns 更新後のスタック値
     */
    onTurnStartUpdate(entity: Entity, value: number, engine?: any): number {
        return value;
    }

    /**
     * ターン終了時の処理
     * @param entity 付与されているエンティティ
     * @param value 現在のスタック値
     * @param engine バトルエンジン（オプション）
     * @returns 更新後のスタック値
     */
    onTurnEndUpdate(entity: Entity, value: number, engine?: any): number {
        return value;
    }

    /**
     * ダメージ計算時の補正（攻撃側：筋力など）
     */
    modifyAttackDamage(entity: Entity, value: number, damage: number): number {
        return damage;
    }

    /**
     * ダメージ計算時の補正（防御側：脆弱、無形など）
     */
    modifyIncomingDamage(entity: Entity, value: number, damage: number): number {
        return damage;
    }

    /**
     * ブロック獲得時の補正（敏捷性、崩壊など）
     */
    modifyBlockAmount(entity: Entity, value: number, block: number): number {
        return block;
    }
}

// --- 具体的なステータスの実装 ---

export class VulnerableStatus extends StatusEffect {
    id = 'vulnerable';
    name = '脆弱';
    description = '受けるダメージが50%増加する。';
    icon = '💔';
    isDebuff(value: number): boolean { return value > 0; }
    onTurnEndUpdate(entity: Entity, value: number): number {
        return Math.max(0, value - 1);
    }
}

export class WeakStatus extends StatusEffect {
    id = 'weak';
    name = '脱力';
    description = 'アタックで与えるダメージが25%減少する。';
    icon = '📉';
    isDebuff(value: number): boolean { return value > 0; }
    onTurnEndUpdate(entity: Entity, value: number): number {
        return Math.max(0, value - 1);
    }
}

export class FrailStatus extends StatusEffect {
    id = 'frail';
    name = '崩壊';
    description = 'ブロックの効果が25%減少する。';
    icon = '🥀';
    isDebuff(value: number): boolean { return value > 0; }
    onTurnEndUpdate(entity: Entity, value: number): number {
        return Math.max(0, value - 1);
    }
}

export class StrengthStatus extends StatusEffect {
    id = 'strength';
    name = '筋力';
    description = 'アタックのダメージが増加する。';
    icon = '💪';
    isBuff(value: number): boolean { return value > 0; }
    isDebuff(value: number): boolean { return value < 0; }
}

export class DexterityStatus extends StatusEffect {
    id = 'dexterity';
    name = '敏捷性';
    description = 'ブロックの獲得量が増加する。';
    icon = '👟';
    isBuff(value: number): boolean { return value > 0; }
    isDebuff(value: number): boolean { return value < 0; }
}

export class MetallicizeStatus extends StatusEffect {
    id = 'metallicize';
    name = '金属化';
    description = 'ターン終了時、その数値分のブロックを得る。';
    icon = '🔩';
    isBuff(value: number): boolean { return value > 0; }
    onTurnEndUpdate(entity: Entity, value: number): number {
        entity.addBlock(value);
        return value;
    }
}

export class PlatedArmorStatus extends StatusEffect {
    id = 'plated_armor';
    name = 'プレートアーマー';
    description = 'ターン終了時、この数値分のブロックを得る。アタックダメージを受けると数値が1減少する。';
    icon = '🛡️';
    isBuff(value: number): boolean { return value > 0; }
    onTurnEndUpdate(entity: Entity, value: number): number {
        entity.addBlock(value);
        return value;
    }
}

export class RitualStatus extends StatusEffect {
    id = 'ritual';
    name = '儀式';
    description = 'ターン終了時、筋力を得る。';
    icon = '🐦';
    isBuff(value: number): boolean { return value > 0; }
    onTurnEndUpdate(entity: Entity, value: number): number {
        entity.addStatus('strength', value);
        return value;
    }
}

export class RegenerationStatus extends StatusEffect {
    id = 'regeneration';
    name = '再生';
    description = 'ターン終了時、この数値分のHPを回復する。ターン経過で数値が1減少する。';
    icon = '💖';
    isBuff(value: number): boolean { return value > 0; }
    onTurnEndUpdate(entity: Entity, value: number): number {
        entity.heal(value);
        return Math.max(0, value - 1);
    }
}

export class IntangibleStatus extends StatusEffect {
    id = 'intangible';
    name = '無形';
    description = '受けるダメージが1になる。';
    icon = '👻';
    isBuff(value: number): boolean { return value > 0; }
    onTurnStartUpdate(entity: Entity, value: number): number {
        return Math.max(0, value - 1);
    }
}

export class ArtifactStatus extends StatusEffect {
    id = 'artifact';
    name = 'アーティファクト';
    description = '次に受けるデバフを無効化します。';
    icon = '💎';
    isBuff(value: number): boolean { return value > 0; }
}

export class BarricadeStatus extends StatusEffect {
    id = 'barricade';
    name = 'バリケード';
    description = 'ターン開始時にブロックが失われない。';
    icon = '🏰';
    isBuff(value: number): boolean { return value > 0; }
}

export class EntangledStatus extends StatusEffect {
    id = 'entangled';
    name = '絡みつき';
    description = 'このターン、アタックカードを使用できない。';
    icon = '🕸️';
    isDebuff(value: number): boolean { return value > 0; }
    onTurnEndUpdate(entity: Entity, value: number): number { return 0; }
}

export class NoDrawStatus extends StatusEffect {
    id = 'no_draw';
    name = 'ドロー不可';
    description = 'カードを引くことができない。';
    icon = '🚫';
    isDebuff(value: number): boolean { return value > 0; }
    onTurnEndUpdate(entity: Entity, value: number): number { return 0; }
}

export class ConfusionStatus extends StatusEffect {
    id = 'confusion';
    name = '混乱';
    description = 'カードを引いたとき、そのコストをランダムに変更する。';
    icon = '🌀';
    isDebuff(value: number): boolean { return value > 0; }
}

export class StrengthDownStatus extends StatusEffect {
    id = 'strength_down';
    name = '筋力消失';
    description = 'ターン終了時、筋力を失う。';
    icon = '🥱';
    isDebuff(value: number): boolean { return value > 0; }
    onTurnEndUpdate(entity: Entity, value: number): number {
        entity.addStatus('strength', -value);
        return 0;
    }
}

export class DexterityDownStatus extends StatusEffect {
    id = 'dexterity_down';
    name = '俊敏性消失';
    description = 'ターン終了時、俊敏性を失う。';
    icon = '🐢';
    isDebuff(value: number): boolean { return value > 0; }
    onTurnEndUpdate(entity: Entity, value: number): number {
        entity.addStatus('dexterity', -value);
        return 0;
    }
}

export class DemonFormStatus extends StatusEffect {
    id = 'demon_form';
    name = '悪魔化';
    description = 'ターン開始時、筋力2を得る。';
    icon = '😈';
    isBuff(value: number): boolean { return value > 0; }
    onTurnStartUpdate(entity: Entity, value: number): number {
        entity.addStatus('strength', value * 2);
        return value;
    }
}

export class DemonFormPlusStatus extends StatusEffect {
    id = 'demon_form_plus';
    name = '悪魔化+';
    description = 'ターン開始時、筋力3を得る。';
    icon = '👹';
    isBuff(value: number): boolean { return value > 0; }
    onTurnStartUpdate(entity: Entity, value: number): number {
        entity.addStatus('strength', value * 3);
        return value;
    }
}

export class BrutalityStatus extends StatusEffect {
    id = 'brutality';
    name = '残虐';
    description = 'ターン開始時、HPを1失いカードを1枚引く。';
    icon = '🩸';
    isBuff(value: number): boolean { return value > 0; }
    onTurnStartUpdate(entity: Entity, value: number, engine?: any): number {
        entity.loseHP(1);
        if (engine) engine.drawCards(value);
        return value;
    }
}

export class CombustStatus extends StatusEffect {
    id = 'combust';
    name = '燃焼';
    description = 'ターン終了時、HPを1失い敵全体にダメージを与える。';
    icon = '🧨';
    isBuff(value: number): boolean { return value > 0; }
    onTurnEndUpdate(entity: Entity, value: number, engine?: any): number {
        entity.loseHP(1);
        if (engine) {
            for (const enemy of engine.enemies) {
                if (!enemy.isDead()) {
                    engine.attackWithEffect(entity, enemy, value); // 本来はvalueダメージだが、StSでは固定ダメージの場合が多い。現在の実装に合わせる。
                }
            }
        }
        return value;
    }
}

export class BerserkStatus extends StatusEffect {
    id = 'berserk';
    name = '狂戦士';
    description = 'ターン開始時、エナジーを1得る。';
    icon = '💢';
    isBuff(value: number): boolean { return value > 0; }
    onTurnStartUpdate(entity: Entity, value: number, engine?: any): number {
        if (entity.hasOwnProperty('energy')) {
            (entity as any).energy += value;
        }
        return value;
    }
}

// 他の単純なステータス
export class ThornsStatus extends StatusEffect {
    id = 'thorns'; name = '棘'; description = '攻撃を受けるとダメージを反射する。'; icon = '🌵';
    isBuff(v: number) { return v > 0; }
}
export class CurlUpStatus extends StatusEffect {
    id = 'curl_up'; name = '丸まり'; description = '攻撃を受けた際、ブロックを得る。'; icon = '🐚';
    isBuff(v: number) { return v > 0; }
}
export class RageStatus extends StatusEffect {
    id = 'rage'; name = '激怒'; description = 'アタックをプレイするたびブロック獲得。'; icon = '💢';
    isBuff(v: number) { return v > 0; }
    onTurnEndUpdate() { return 0; }
}
export class DoubleTapStatus extends StatusEffect {
    id = 'double_tap'; name = 'ダブルタップ'; description = '次のアタックが2回発動。'; icon = '⚔️';
    isBuff(v: number) { return v > 0; }
}
export class FireBreathingStatus extends StatusEffect {
    id = 'fire_breathing'; name = '炎の吐息'; description = '特定のカードを引くと全体ダメージ。'; icon = '🔥';
    isBuff(v: number) { return v > 0; }
}
export class FeelNoPainStatus extends StatusEffect {
    id = 'feel_no_pain'; name = '無痛'; description = '廃棄時にブロック獲得。'; icon = '🦴';
    isBuff(v: number) { return v > 0; }
}
export class RuptureStatus extends StatusEffect {
    id = 'rupture'; name = '破裂'; description = 'HP喪失時に筋力獲得。'; icon = '⤴️';
    isBuff(v: number) { return v > 0; }
}
export class EvolveStatus extends StatusEffect {
    id = 'evolve'; name = '進化'; description = '状態異常を引くとドロー。'; icon = '🧬';
    isBuff(v: number) { return v > 0; }
}
export class DarkEmbraceStatus extends StatusEffect {
    id = 'dark_embrace'; name = '闇の抱擁'; description = '廃棄時にドロー。'; icon = '👐';
    isBuff(v: number) { return v > 0; }
}
export class JuggernautStatus extends StatusEffect {
    id = 'juggernaut'; name = 'ジャガーノート'; description = 'ブロック獲得時にダメージ。'; icon = '💥';
    isBuff(v: number) { return v > 0; }
}
export class CorruptionStatus extends StatusEffect {
    id = 'corruption'; name = '堕落'; description = 'スキルコスト0、使用後廃棄。'; icon = '🔮';
    isBuff(v: number) { return v > 0; }
}
export class MalleableStatus extends StatusEffect {
    id = 'malleable'; name = '柔軟'; description = '攻撃を受けるたびにブロック獲得。'; icon = '💠';
    isBuff(v: number) { return v > 0; }
}
export class SplitStatus extends StatusEffect {
    id = 'split'; name = '分裂'; description = 'HP半分以下で分裂。'; icon = '♾️';
    isBuff(v: number) { return v > 0; }
}
export class SporeCloudStatus extends StatusEffect {
    id = 'spore_cloud'; name = '胞子の雲'; description = '死亡時に相手を脆弱化。'; icon = '🍄';
    isBuff(v: number) { return v > 0; }
}
export class ThieveryStatus extends StatusEffect {
    id = 'thievery'; name = 'コソ泥'; description = '攻撃時にゴールド強奪。'; icon = '💰';
    isBuff(v: number) { return v > 0; }
}
export class ModeShiftStatus extends StatusEffect {
    id = 'mode_shift'; name = 'モードシフト'; description = 'ダメージを受けると減少、0で防御態勢へ。'; icon = '⚙️';
    isBuff(v: number) { return v > 0; }
}
export class SharpHideStatus extends StatusEffect {
    id = 'sharp_hide'; name = 'シャープハイド'; description = 'アタックプレイ時にダメージを受ける。'; icon = '🗡️';
    isBuff(v: number) { return v > 0; }
}
export class DuplicationStatus extends StatusEffect {
    id = 'duplication'; name = '複製'; description = '次のカード/ポーションが2回発動。'; icon = '👥';
    isBuff(v: number) { return v > 0; }
}
export class PenNibStatus extends StatusEffect {
    id = 'pen_nib'; name = 'ペン先'; description = '10枚目のアタックのダメージ2倍。'; icon = '🖋️';
    isBuff(v: number) { return v > 0; }
}
export class VigorStatus extends StatusEffect {
    id = 'vigor'; name = '活力'; description = '次のアタックのダメージ増加。'; icon = '🔥';
    isBuff(v: number) { return v > 0; }
}
export class EnrageEnemyStatus extends StatusEffect {
    id = 'enrage_enemy'; name = '激怒'; description = 'スキルプレイ時に筋力獲得。'; icon = '💢';
    isBuff(v: number) { return v > 0; }
}


export class StatusLibrary {
    private static effects: Map<string, StatusEffect> = new Map();

    static register(effect: StatusEffect) {
        this.effects.set(effect.id, effect);
    }

    static get(id: string): StatusEffect | undefined {
        return this.effects.get(id);
    }

    static getAll(): StatusEffect[] {
        return Array.from(this.effects.values());
    }

    static isDebuff(id: string, value: number): boolean {
        const effect = this.get(id);
        return effect ? effect.isDebuff(value) : false;
    }

    static isBuff(id: string, value: number): boolean {
        const effect = this.get(id);
        return effect ? effect.isBuff(value) : false;
    }
}

// ライブラリへの登録
StatusLibrary.register(new VulnerableStatus());
StatusLibrary.register(new WeakStatus());
StatusLibrary.register(new FrailStatus());
StatusLibrary.register(new StrengthStatus());
StatusLibrary.register(new DexterityStatus());
StatusLibrary.register(new MetallicizeStatus());
StatusLibrary.register(new PlatedArmorStatus());
StatusLibrary.register(new RitualStatus());
StatusLibrary.register(new RegenerationStatus());
StatusLibrary.register(new IntangibleStatus());
StatusLibrary.register(new ArtifactStatus());
StatusLibrary.register(new BarricadeStatus());
StatusLibrary.register(new EntangledStatus());
StatusLibrary.register(new NoDrawStatus());
StatusLibrary.register(new ConfusionStatus());
StatusLibrary.register(new StrengthDownStatus());
StatusLibrary.register(new DexterityDownStatus());
StatusLibrary.register(new DemonFormStatus());
StatusLibrary.register(new DemonFormPlusStatus());
StatusLibrary.register(new BrutalityStatus());
StatusLibrary.register(new CombustStatus());
StatusLibrary.register(new BerserkStatus());
StatusLibrary.register(new ThornsStatus());
StatusLibrary.register(new CurlUpStatus());
StatusLibrary.register(new RageStatus());
StatusLibrary.register(new DoubleTapStatus());
StatusLibrary.register(new FireBreathingStatus());
StatusLibrary.register(new FeelNoPainStatus());
StatusLibrary.register(new RuptureStatus());
StatusLibrary.register(new EvolveStatus());
StatusLibrary.register(new DarkEmbraceStatus());
StatusLibrary.register(new JuggernautStatus());
StatusLibrary.register(new CorruptionStatus());
StatusLibrary.register(new MalleableStatus());
StatusLibrary.register(new SplitStatus());
StatusLibrary.register(new SporeCloudStatus());
StatusLibrary.register(new ThieveryStatus());
StatusLibrary.register(new ModeShiftStatus());
StatusLibrary.register(new SharpHideStatus());
StatusLibrary.register(new DuplicationStatus());
StatusLibrary.register(new PenNibStatus());
StatusLibrary.register(new VigorStatus());
StatusLibrary.register(new EnrageEnemyStatus());
