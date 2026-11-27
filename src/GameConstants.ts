export default class GameConstants {
    public static readonly Events = Object.freeze({
        PLAYER_SPAWNED_EVENT: "playerSpawned",
        ENEMY_SPAWNED_EVENT: "enemySpawned",
        LEVEL_UP_CHOICES_EVENT: "levelUpChoices",
        BUFF_SELECTED_EVENT: "buffSelected",
    } as const);

    public static readonly SceneKeys = Object.freeze({
        HOME: "HomeScene",
        MAIN_GAME: "MainGameScene",
        MAIN_UI: "MainUIScene",
        GAME_OVER: "GameOverScene",
    } as const);

    // Each sound file is named after its key: public/assets/Sounds/<key>.ogg
    public static readonly SoundKeys = Object.freeze({
        PLAYER_SHOOT: "sfx_laser1",
        ENEMY_SHOOT: "sfx_laser2",
        BOSS_HIT: "sfx_boom",
        EXPLOSION: "sfx_explosion",
        PICKUP: "sfx_pickup",
        LEVEL_UP: "sfx_levelup",
        MUSIC: "music",
    } as const);

    public static readonly MAX_SCORE_DIGITS: number = 6;
}