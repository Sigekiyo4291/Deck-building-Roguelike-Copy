import { Relic } from '../relic-class';
import { RoomType } from '../map-data';
import { CardLibrary } from '../card';

export const StarterRelics = {
    BURNING_BLOOD: new class extends Relic {
        constructor() { super('burning_blood', 'バーニングブラッド', '戦闘終了時、HPを6回復する。', 'starter'); }
        onVictory(owner, engine) {
            owner.heal(6);
        }
    }
};
