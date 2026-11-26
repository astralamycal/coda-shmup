import {SineMovementData} from "./SineMovementData.ts";
import {WeaponData} from "./WeaponData.ts";

export type BossData = {
  frame: string;
  tint: string; // "#rrggbb"
  scale: number;
  health: number;
  spawn: BossSpawnData;
  movement: SineMovementData;
  weapon: WeaponData;
}
  
export type BossSpawnData = {
  firstScore: number; // score at which the first boss appears
  everyScore: number; // then a new boss every X points
}