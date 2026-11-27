export type ProgressionData = {
    firstLevelXp: number; // XP needed to reach level 2
    levelXpGrowth: number; // the XP needed is multiplied by this at each level
    healthPerLevel: number; // max health gained at each level
    speedPowerUp: SpeedPowerUpData;
}

export type SpeedPowerUpData = {
    dropChance: number; // between 0 and 1, rolled at each enemy death
    duration: number; // in ms
    shipIds: number[]; // ships of playerShips.json that can drop
}
