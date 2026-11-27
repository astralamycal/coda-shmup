import {SineMovementData} from "./SineMovementData.ts";
import {WeaponData} from "./WeaponData.ts";
import {RewardData} from "./RewardData.ts";

export type BossData = {
    frame: string;
    tint: string; // "#rrggbb"
    scale: number;
    health: number;
    introDuration: number; // in ms, the boss doesn't shoot during its intro
    reward: RewardData;
    spawn: BossSpawnData;
    movement: SineMovementData;
    weapon: WeaponData;
    scaling: BossScalingData;
}

// Added at each new appearance of the boss
export type BossScalingData = {
    healthPerSpawn: number; // health multiplier added each time
    bulletsPerSpawn: number; // bullets added to the spread shot each time
}

export type BossSpawnData = {
    firstScore: number; // score at which the first boss appears
    everyScore: number; // then a new boss every X points
}
