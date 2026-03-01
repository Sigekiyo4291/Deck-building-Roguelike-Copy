import { ironcladCards } from './ironclad';
import { ironcladAttackCards } from './ironclad/attack';
import { ironcladSkillCards } from './ironclad/skill';
import { ironcladPowerCards } from './ironclad/power';
import { curseCards } from './curse/curse';
import { statusCards } from './status/status';

export const CardLibrary = {
    ...ironcladCards,
    ...ironcladAttackCards,
    ...ironcladSkillCards,
    ...ironcladPowerCards,
    ...curseCards,
    ...statusCards,
};
