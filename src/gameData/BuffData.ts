export type StatName =
    | 'damage'
    | 'fireRate'
    | 'xpGain'
    | 'scoreMultiplier'
    | 'bulletCount'
    | 'magnetRadius'
    | 'homingBullets'
    | 'spawnRate';

export type BuffData = {
    label: string; // text shown in the level up popup
    stat: StatName | 'maxHealth';
    value: number; // added to the stat each time the buff is picked
    max?: number; // optional: once the stat reaches it, the buff is no longer offered
};
