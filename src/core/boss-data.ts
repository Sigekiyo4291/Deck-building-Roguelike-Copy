import { SlimeBoss, Guardian, Hexaghost } from './entity';

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
    }
};

export const ACT_BOSSES: Record<number, string[]> = {
    1: ['slime_boss', 'guardian', 'hexaghost'],
    2: [], // 今後追加予定
    3: []  // 今後追加予定
};
