import {
    Cultist, JawWorm, Louse, AcidSlimeM, SpikeSlimeM, AcidSlimeS, SpikeSlimeS,
    AcidSlimeL, SpikeSlimeL, BlueSlaver, Looter, FungiBeast, RedSlaver,
    GremlinNob, Lagavulin, Sentry
} from './entity';

export const ENCOUNTER_POOLS: Record<number, {
    weak: (() => any[])[],
    strong: (() => any[])[],
    elite: (() => any[])[]
}> = {
    1: {
        weak: [
            () => [new Cultist()],
            () => [new JawWorm()],
            () => [new Louse('red'), new Louse('green')],
            () => [new SpikeSlimeS(), new AcidSlimeM()],
            () => [new AcidSlimeS(), new SpikeSlimeM()],
            () => [new AcidSlimeS(), new SpikeSlimeS(), new SpikeSlimeS()]
        ],
        strong: [
            () => [new AcidSlimeL()],
            () => [new SpikeSlimeL()],
            () => [new BlueSlaver()],
            () => [new Looter()],
            () => [new Louse('red'), new Louse('green'), new Louse('red')],
            () => [new FungiBeast(), new FungiBeast()],
            () => [new BlueSlaver(), new RedSlaver()],
            () => [new Looter(), new Cultist()],
            () => [new FungiBeast(), new JawWorm()],
            () => [new Louse('green'), new AcidSlimeM(), new SpikeSlimeM()]
        ],
        elite: [
            () => [new GremlinNob()],
            () => [new Lagavulin()],
            () => [new Sentry(0), new Sentry(1), new Sentry(2)]
        ]
    },
    2: {
        // 仮でAct 1のプールを流用（敵が増えたらここを差し替える）
        weak: [
            () => [new Cultist()],
            () => [new JawWorm()],
            () => [new Louse('red'), new Louse('green')],
            () => [new AcidSlimeM(), new SpikeSlimeM()]
        ],
        strong: [
            () => [new AcidSlimeL()],
            () => [new SpikeSlimeL()],
            () => [new BlueSlaver()],
            () => [new Looter()]
        ],
        elite: [
            () => [new GremlinNob()],
            () => [new Lagavulin()]
        ]
    },
    3: {
        // 仮でAct 1のプールを流用
        weak: [
            () => [new Cultist()],
            () => [new JawWorm()]
        ],
        strong: [
            () => [new AcidSlimeL()],
            () => [new SpikeSlimeL()]
        ],
        elite: [
            () => [new GremlinNob()]
        ]
    }
};
