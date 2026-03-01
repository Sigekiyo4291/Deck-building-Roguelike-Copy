export enum IntentType {
    Attack = 'attack',
    Defend = 'defend',
    Buff = 'buff',
    Debuff = 'debuff',
    AttackDefend = 'attack_defend',
    AttackDebuff = 'attack_debuff',
    AttackBuff = 'attack_buff',
    AttackHeal = 'attack_heal',
    Special = 'special',
    Stun = 'stun',
    Heal = 'heal',
    Escape = 'escape',
    Unknown = 'unknown'
}

export interface EnemyMove {
    id?: string;
    type: IntentType;
    name: string;
    value?: number;
    times?: number;
    effect?: (self: any, player: any, engine: any) => void;
}
