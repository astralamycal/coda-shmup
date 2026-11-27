import {RewardData} from "./RewardData.ts";

export type EnemyTypeData = {
    tint: string; // "#rrggbb"
    health: number;
    speed: number; // in px/ms
    canShoot: boolean;
    reward: RewardData;
}

export type DifficultyData = {
    everyScore: number; // the difficulty goes up one level every X points
    increasePerLevel: number; // health, speed and damage multiplier added at each level
}
