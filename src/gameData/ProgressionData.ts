export type ProgressionData = {
    firstLevelXp: number; // XP needed to reach level 2
    levelXpGrowth: number; // the XP needed is multiplied by this at each level
    healthPerLevel: number; // max health gained at each level
    healthPickup: HealthPickupData;
};

export type HealthPickupData = {
    dropChance: number; // between 0 and 1, rolled at each enemy death
    heal: number; // health given back when picked up
};
