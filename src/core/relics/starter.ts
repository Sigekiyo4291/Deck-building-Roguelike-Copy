import { Relic } from '../relic-class';
import { RoomType } from '../map-data';
import { CardLibrary } from '../card';
import { IEntity, IPlayer, IBattleEngine } from '../types';

export const StarterRelics = {
    BURNING_BLOOD: new class extends Relic {
        constructor() { super('burning_blood', 'バーニングブラッド', '戦闘終了時、HPを6回復する。', 'starter'); }
        onVictory(owner: IEntity, engine: IBattleEngine) {
            owner.heal(6);
        }
    }
};
