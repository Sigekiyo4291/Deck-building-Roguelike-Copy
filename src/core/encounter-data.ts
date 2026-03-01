import {
    Cultist, JawWorm, Louse, AcidSlimeM, SpikeSlimeM, AcidSlimeS, SpikeSlimeS,
    AcidSlimeL, SpikeSlimeL, BlueSlaver, Looter, FungiBeast, RedSlaver,
    GremlinNob, Lagavulin, Sentry,
    SneakyGremlin, MadGremlin, GremlinWizard, ShieldGremlin, FatGremlin,
    SphericGuardian, ShelledParasite, Byrd, Chosen, Mugger, Snecko, SnakePlant, Centurion, Mystic,
    GremlinLeader, BookOfStabbing, Taskmaster,
    Darkling, OrbWalker, Repulsor, Exploder, Spiker, Maw, SpireGrowth, Transient, WrithingMass,
    GiantHead, Nemesis, Reptomancer, Dagger
} from './enemies';

// ヘルパー関数: 指定された数の寄生虫（赤/緑 50%ずつ）を生成
const createLouseGroup = (count: number) => {
    return Array.from({ length: count }, () => new Louse(Math.random() < 0.5 ? 'red' : 'green'));
};

// ヘルパー関数: スライムM + スライムS
const createSlimeGroupMS = () => {
    const m = Math.random() < 0.5 ? new AcidSlimeM() : new SpikeSlimeM();
    const s = Math.random() < 0.5 ? new AcidSlimeS() : new SpikeSlimeS();
    return [m, s];
};

// ヘルパー関数: 序章のチンピラ (Exordium Thugs)
// ①寄生虫orスライムM + ②スレイバー青/赤or狂信者or略奪者
const createExordiumThugs = () => {
    const e1 = Math.random() < 0.5 ? new Louse(Math.random() < 0.5 ? 'red' : 'green') : (Math.random() < 0.5 ? new AcidSlimeM() : new SpikeSlimeM());
    const roll2 = Math.random();
    let e2;
    if (roll2 < 0.33) {
        e2 = Math.random() < 0.5 ? new BlueSlaver() : new RedSlaver();
    } else if (roll2 < 0.66) {
        e2 = new Cultist();
    } else {
        e2 = new Looter();
    }
    return [e1, e2];
};

// ヘルパー関数: 序章のケダモノ (Exordium Wildlife)
// ①キノコビーストorデカアゴムシ + ②寄生虫orスライムM
const createExordiumWildlife = () => {
    const e1 = Math.random() < 0.5 ? new FungiBeast() : new JawWorm();
    const e2 = Math.random() < 0.5 ? new Louse(Math.random() < 0.5 ? 'red' : 'green') : (Math.random() < 0.5 ? new AcidSlimeM() : new SpikeSlimeM());
    return [e1, e2];
};

// ヘルパー関数: グレムリン集団
// スニーキー(2),マッド(2),太っちょ(2),ウィザード(1),シールド(1) から4体ランダム
const createGremlinGang = () => {
    const pool = [
        ...Array(2).fill('sneaky'),
        ...Array(2).fill('mad'),
        ...Array(2).fill('fat'),
        'wizard',
        'shield'
    ];
    // シャッフルして4体選ぶ
    const shuffled = pool.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 4);
    return selected.map(type => {
        switch (type) {
            case 'sneaky': return new SneakyGremlin();
            case 'mad': return new MadGremlin();
            case 'fat': return new FatGremlin();
            case 'wizard': return new GremlinWizard();
            case 'shield': return new ShieldGremlin();
            default: return new SneakyGremlin();
        }
    });
};

// ヘルパー関数: スライム集団
const createSlimeGang = () => {
    return [
        new SpikeSlimeS(), new SpikeSlimeS(), new SpikeSlimeS(),
        new AcidSlimeS(), new AcidSlimeS()
    ];
};

// ヘルパー関数: ビャード集団
const createByrdGroup = (count: number) => {
    return Array.from({ length: count }, () => new Byrd());
};

// ヘルパー関数: センチュリオンとミスティック
const createCenturionAndMystic = () => {
    return [new Centurion(), new Mystic()];
};

// ヘルパー関数: 選ばれし者とビャード
const createChosenAndByrd = () => {
    return [new Chosen(), new Byrd()];
};

// ヘルパー関数: 選ばれし者と狂信者
const createChosenAndCultist = () => {
    return [new Chosen(), new Cultist()];
};

// ヘルパー関数: ヤドカリパラサイトとキノコビースト
const createShelledParasiteAndFungi = () => {
    return [new ShelledParasite(), new FungiBeast()];
};

// ヘルパー関数: スフィアガーディアンとセントリー
const createSphericGuardianAndSentry = () => {
    return [new SphericGuardian(), new Sentry(0)];
};

// ヘルパー関数: グレムリンリーダーとランダムなミニオン2体
const createGremlinLeaderEncounter = () => {
    const minions = [
        () => new SneakyGremlin(),
        () => new MadGremlin(),
        () => new GremlinWizard(),
        () => new ShieldGremlin(),
        () => new FatGremlin()
    ];
    // ランダムに2体選ぶ（重複可）
    const m1 = minions[Math.floor(Math.random() * minions.length)]();
    const m2 = minions[Math.floor(Math.random() * minions.length)]();
    return [m1, new GremlinLeader(), m2]; // リーダーを中央に配置
};

// ヘルパー関数: タスクマスター固定編成
const createTaskmasterEncounter = () => {
    return [new BlueSlaver(), new Taskmaster(), new RedSlaver()];
};

// ヘルパー関数: 異形たちのランダムな組み合わせ (Repulsor, Exploder, Spiker)
const createShapesGroup = (count: number) => {
    const pool = [
        () => new Repulsor(),
        () => new Repulsor(),
        () => new Exploder(),
        () => new Exploder(),
        () => new Spiker(),
        () => new Spiker()
    ];
    // 指定された数だけランダムに選出
    const result = [];
    for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        result.push(pool[randomIndex]());
    }
    return result;
};

// ヘルパー関数: スフィアガーディアンとランダムな異形2体
const createSphericGuardianAndShapes = () => {
    const shapes = createShapesGroup(2);
    return [new SphericGuardian(), ...shapes];
};

// ヘルパー関数: レプトマンサーとダガー2体
const createReptomancerEncounter = () => {
    return [new Dagger(), new Reptomancer(), new Dagger()];
};

// エンカウントの重み付き定義
export interface WeightedEncounter {
    weight: number;
    create: () => any[];
}

// 重み付き抽選用ヘルパー関数
export const selectWeightedEncounter = (pool: Record<string, WeightedEncounter>): any[] => {
    const items = Object.values(pool);
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (const item of items) {
        if (random < item.weight) {
            return item.create();
        }
        random -= item.weight;
    }
    return items[0].create(); // フォールバック
};

export const ENCOUNTER_POOLS: Record<number, {
    weak: Record<string, WeightedEncounter>,
    strong: Record<string, WeightedEncounter>,
    elite: Record<string, WeightedEncounter>
}> = {
    1: {
        weak: {
            "狂信者": { weight: 1, create: () => [new Cultist()] },
            "デカアゴムシ": { weight: 1, create: () => [new JawWorm()] },
            "寄生虫x2": { weight: 1, create: () => createLouseGroup(2) },
            "スライムM+S": { weight: 1, create: () => createSlimeGroupMS() }
        },
        strong: {
            "スライムL": { weight: 4, create: () => [Math.random() < 0.5 ? new AcidSlimeL() : new SpikeSlimeL()] },
            "スレイバー青": { weight: 4, create: () => [new BlueSlaver()] },
            "寄生虫x3": { weight: 4, create: () => createLouseGroup(3) },
            "キノコビーストx2": { weight: 4, create: () => [new FungiBeast(), new FungiBeast()] },
            "略奪者": { weight: 4, create: () => [new Looter()] },
            "序章のチンピラ": { weight: 3, create: () => createExordiumThugs() },
            "序章のケダモノ": { weight: 3, create: () => createExordiumWildlife() },
            "グレムリン集団": { weight: 2, create: () => createGremlinGang() },
            "スレイバー赤": { weight: 2, create: () => [new RedSlaver()] },
            "スライム集団": { weight: 2, create: () => createSlimeGang() }
        },
        elite: {
            "グレムリンノブ": { weight: 1, create: () => [new GremlinNob()] },
            "ラガヴーリン": { weight: 1, create: () => [new Lagavulin()] },
            "三回戦": { weight: 1, create: () => [new Sentry(0), new Sentry(1), new Sentry(2)] }
        }
    },
    2: {
        weak: {
            "スフィアガーディアン": { weight: 20, create: () => [new SphericGuardian()] },
            "選ばれし者": { weight: 20, create: () => [new Chosen()] },
            "ヤドカリパラサイト": { weight: 20, create: () => [new ShelledParasite()] },
            "ビャード": { weight: 20, create: () => createByrdGroup(3) },
            "強盗": { weight: 20, create: () => [new Mugger(), new Looter()] }
        },
        strong: {
            "スネークプラント": { weight: 21, create: () => [new SnakePlant()] },
            "センチュリオンとミスティック": { weight: 21, create: () => createCenturionAndMystic() },
            "スネッコ": { weight: 14, create: () => [new Snecko()] },
            "狂信者たち": { weight: 10, create: () => [new Cultist(), new Cultist(), new Cultist()] },
            "パラサイツ": { weight: 10, create: () => createShelledParasiteAndFungi() },
            "選ばれし者と狂信者": { weight: 10, create: () => createChosenAndCultist() },
            "選ばれし者とビャード": { weight: 7, create: () => createChosenAndByrd() },
            "スフィアガーディアンとセントリー": { weight: 7, create: () => createSphericGuardianAndSentry() }
        },
        elite: {
            "グレムリンリーダー": { weight: 1, create: () => createGremlinLeaderEncounter() },
            "刺突本": { weight: 1, create: () => [new BookOfStabbing()] },
            "タスクマスター": { weight: 1, create: () => createTaskmasterEncounter() }
        }
    },
    3: {
        weak: {
            "ダークリング": { weight: 1, create: () => [new Darkling(), new Darkling(), new Darkling()] },
            "オーブウォーカー": { weight: 1, create: () => [new OrbWalker()] },
            "3体の異形": { weight: 1, create: () => createShapesGroup(3) }
        },
        strong: {
            "4体の異形": { weight: 1, create: () => createShapesGroup(4) },
            "モー": { weight: 1, create: () => [new Maw()] },
            "スフィアガーディアンと2体の異形": { weight: 1, create: () => createSphericGuardianAndShapes() },
            "ダークリング（強）": { weight: 1, create: () => [new Darkling(), new Darkling(), new Darkling()] },
            "塔で成長するもの": { weight: 1, create: () => [new SpireGrowth()] },
            "デカアゴムシ": { weight: 1, create: () => [new JawWorm(3), new JawWorm(3), new JawWorm(3)] },
            "消えゆくもの": { weight: 1, create: () => [new Transient()] },
            "もがき蠢く塊": { weight: 1, create: () => [new WrithingMass()] }
        },
        elite: {
            "巨像の頭": { weight: 1, create: () => [new GiantHead()] },
            "ネメシス": { weight: 1, create: () => [new Nemesis()] },
            "レプトマンサー": { weight: 1, create: () => createReptomancerEncounter() }
        }
    }
};
