import { SlimeBoss, Guardian, Hexaghost, Collector, Champ, BronzeAutomaton, TimeEater, Deca, Donu, Cultist, AwakenedOne } from './enemies';

export interface BossData {
    id: string;
    name: string;
    image: string;
    createEnemies: () => any[];
}

export const BOSS_DATA: Record<string, BossData> = {
    'slime_boss': {
        id: 'slime_boss',
        name: 'スライムボス',
        image: 'assets/images/enemies/SlimeBoss.png',
        createEnemies: () => [new SlimeBoss()]
    },
    'guardian': {
        id: 'guardian',
        name: 'ガーディアン',
        image: 'assets/images/enemies/Guardian.png',
        createEnemies: () => [new Guardian()]
    },
    'hexaghost': {
        id: 'hexaghost',
        name: 'ヘキサゴースト',
        image: 'assets/images/enemies/Hexaghost.png',
        createEnemies: () => [new Hexaghost()]
    },
    'champ': {
        id: 'champ',
        name: 'チャンプ',
        image: 'assets/images/enemies/slime.png',
        createEnemies: () => [new Champ()]
    },
    'collector': {
        id: 'collector',
        name: 'コレクター',
        image: 'assets/images/enemies/slime.png',
        createEnemies: () => [new Collector()]
    },
    'bronze_automaton': {
        id: 'bronze_automaton',
        name: 'ブロンズ・オートマトン',
        image: 'assets/images/enemies/slime.png',
        createEnemies: () => [new BronzeAutomaton()]
    },
    'time_eater': {
        id: 'time_eater',
        name: 'タイムイーター',
        image: 'assets/images/enemies/slime.png',
        createEnemies: () => [new TimeEater()]
    },
    'deca_and_donu': {
        id: 'deca_and_donu',
        name: 'デカとドヌー',
        image: 'assets/images/enemies/slime.png',
        createEnemies: () => [new Deca(), new Donu()]
    },
    'cultist_and_awakened_one': {
        id: 'cultist_and_awakened_one',
        name: '狂信者と目覚めしもの',
        image: 'assets/images/enemies/slime.png',
        createEnemies: () => [new Cultist(), new Cultist(), new AwakenedOne()]
    }
};

export const ACT_BOSSES: Record<number, string[]> = {
    1: ['slime_boss', 'guardian', 'hexaghost'],
    2: ['champ', 'collector', 'bronze_automaton'],
    3: ['time_eater', 'deca_and_donu', 'cultist_and_awakened_one']
};
