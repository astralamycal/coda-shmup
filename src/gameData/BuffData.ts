export type StatName = 'damage' | 'fireRate' | 'xpGain' | 'scoreMultiplier' | 'bulletCount' | 'magnetRadius';

export type BuffData = {
    label: string; // text shown in the level up popup
    stat: StatName | 'maxHealth';
    value: number; // added to the stat each time the buff is picked
}
