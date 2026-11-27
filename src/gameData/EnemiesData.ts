import {BossData} from "./BossData.ts";
import {DifficultyData, EnemyTypeData} from "./EnemyTypeData.ts";

export type EnemiesData = {
    boss: BossData;
    types: EnemyTypeData[];
    difficulty: DifficultyData;
}
