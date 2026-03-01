import { StarterRelics } from './starter';
import { CommonRelics } from './common';
import { UncommonRelics } from './uncommon';
import { RareRelics } from './rare';
import { BossRelics } from './boss';
import { ShopRelics } from './shop';
import { EventRelics } from './event';

export const RelicLibrary = {
    ...StarterRelics,
    ...CommonRelics,
    ...UncommonRelics,
    ...RareRelics,
    ...BossRelics,
    ...ShopRelics,
    ...EventRelics
};
