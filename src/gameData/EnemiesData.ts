import {BossData} from './BossData.ts';
import {DifficultyData, EnemySpawnData, EnemyTypeData} from './EnemyTypeData.ts';

export type EnemiesData = {
    boss: BossData;
    types: EnemyTypeData[];
    spawn: EnemySpawnData;
    difficulty: DifficultyData;
};
