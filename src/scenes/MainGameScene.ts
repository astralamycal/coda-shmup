import {Scene, Scenes} from 'phaser';
import Experience from "../components/Experience.ts";
import Health from "../components/Health.ts";
import RegistryConstants from "../RegistryConstants.ts";
import SaveManager from "../managers/SaveManager.ts";
import SaveConstants from "../SaveConstants.ts";
import BuffManager from "../managers/BuffManager.ts";
import ScrollingRoad from "../ui/ScrollingRoad.ts";
import EntityManager from "../managers/EntityManager.ts";
import Player from "../entities/Player.ts";
import {BuffData} from "../gameData/BuffData.ts";
import GameConstants from "../GameConstants.ts";

export default class MainGameScene extends Scene {
    private static readonly BUFF_CHOICES_COUNT: number = 3;

    private saveManager: SaveManager;
    private entityManager: EntityManager;
    private buffManager: BuffManager;
    private _player: Player;

    constructor() {
        super(GameConstants.SceneKeys.MAIN_GAME);
    }

    // noinspection JSUnusedGlobalSymbols
    create() {
        if (!this.saveManager) {
            console.error('SaveManager plugin not found');
        }
        this.saveManager?.load();

        new ScrollingRoad(this);

        if (!this.entityManager) {
            console.error('EntityManager plugin not found');
        }

        const player = this.entityManager.initAndSpawnPlayer();
        this._player = player;
        player.getComponent(Health)?.once(Health.DEATH_EVENT, () => {
            // Hide the player and let its explosion play before showing the game over screen
            player.disableBody(true, true);
            this.time.delayedCall(1000, this.endGame, [], this);
        }, this);
        this.entityManager.initEnemies();
        this.entityManager.initBoss();
        this.entityManager.initOrbs();
        this.entityManager.initPowerUps();
        this.entityManager.initGroupCollisions();

        this.listenToLevelUp();

        if (this.input.keyboard) {
            // Debug keys: R restarts the game, B makes the boss appear now
            this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R).on('down', () => this.scene.restart());
            this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B).on('down', () => this.entityManager.spawnBoss());
        } else {
            console.error('No keyboard input');
        }

        this.registry.set(RegistryConstants.Keys.PLAYER_SCORE, 0);
    }

    private listenToLevelUp() {
        this._player.getComponent(Experience)?.on(Experience.LEVEL_UP_EVENT, this.onPlayerLevelUp, this);

        this.game.events.on(GameConstants.Events.BUFF_SELECTED_EVENT, this.onBuffSelected, this);
        this.events.once(Scenes.Events.SHUTDOWN, () => {
            this.game.events.off(GameConstants.Events.BUFF_SELECTED_EVENT, this.onBuffSelected, this);
        });
    }

    // Freeze the game while the player picks a buff in the UI scene
    private onPlayerLevelUp() {
        const choices: BuffData[] = this.buffManager.pickRandomBuffs(MainGameScene.BUFF_CHOICES_COUNT, this._player);
        this.sound.play(GameConstants.SoundKeys.LEVEL_UP);
        this.scene.pause();
        this.game.events.emit(GameConstants.Events.LEVEL_UP_CHOICES_EVENT, choices);
    }

    private onBuffSelected(buff: BuffData) {
        this.buffManager.applyBuff(buff, this._player);
        this.scene.resume();
    }

    private endGame() {
        const bestScore: number = Number(this.saveManager.getData(SaveConstants.Keys.PLAYER_BEST_SCORE) ?? 0);
        const currentScore: number = Number(this.registry.get(RegistryConstants.Keys.PLAYER_SCORE) ?? 0);
        if (currentScore > bestScore) {
            this.saveManager.setData(SaveConstants.Keys.PLAYER_BEST_SCORE, currentScore);
        }

        this.scene.start(GameConstants.SceneKeys.GAME_OVER);
    }
}
