import {GameObjects, Scenes, Scene} from "phaser";
import Experience from "../components/Experience.ts";
import Health from "../components/Health.ts";
import Player from "../entities/Player.ts";
import GameConstants from "../GameConstants.ts";
import RegistryConstants from "../RegistryConstants.ts";
import {BuffData} from "../gameData/BuffData.ts";

export default class MainUIScene extends Scene {
    private static readonly HEALTH_BAR_WIDTH: number = 400;
    private static readonly HEALTH_BAR_HEIGHT: number = 40;
    private static readonly HEALTH_BAR_COLOR: number = 0xe63946;
    private static readonly XP_BAR_HEIGHT: number = 24;
    private static readonly XP_BAR_COLOR: number = 0x66ccff;
    private static readonly BAR_BACKGROUND_COLOR: number = 0x222222;
    private static readonly POPUP_OVERLAY_COLOR: number = 0x000000;
    private static readonly POPUP_OVERLAY_ALPHA: number = 0.7;
    private static readonly POPUP_CHOICE_SPACING: number = 160;

    private _healthBarFill: GameObjects.Rectangle;
    private _scoreText: GameObjects.BitmapText;
    private _xpBarFill: GameObjects.Rectangle;
    private _levelText: GameObjects.BitmapText;

    constructor() {
        super(GameConstants.SceneKeys.MAIN_UI);
    }

    // noinspection JSUnusedGlobalSymbols
    init() {
        this.game.events.on(GameConstants.Events.PLAYER_SPAWNED_EVENT, this.onPlayerSpawned, this);
        this.registry.events.on(RegistryConstants.Events.PLAYER_SCORE_CHANGE, this.onPlayerScoreChanged, this);
        this.game.events.on(GameConstants.Events.LEVEL_UP_CHOICES_EVENT, this.showLevelUpPopup, this);

        this.events.once(Scenes.Events.SHUTDOWN, () => {
            this.game.events.off(GameConstants.Events.PLAYER_SPAWNED_EVENT, this.onPlayerSpawned, this);
            this.registry.events.off(RegistryConstants.Events.PLAYER_SCORE_CHANGE, this.onPlayerScoreChanged, this);
            this.game.events.off(GameConstants.Events.LEVEL_UP_CHOICES_EVENT, this.showLevelUpPopup, this);
        }, this);
    }

    // noinspection JSUnusedGlobalSymbols
    create() {
        const playerHealthIcon = this.add.image(64, 64, "sprites", "playerLife1_blue")
            .setOrigin(0, 0).setScale(1.5);
        const healthBarX: number = playerHealthIcon.x + playerHealthIcon.displayWidth + 16;
        this.add.rectangle(healthBarX, 64, MainUIScene.HEALTH_BAR_WIDTH, MainUIScene.HEALTH_BAR_HEIGHT,
            MainUIScene.BAR_BACKGROUND_COLOR).setOrigin(0, 0);
        this._healthBarFill = this.add.rectangle(healthBarX, 64, MainUIScene.HEALTH_BAR_WIDTH, MainUIScene.HEALTH_BAR_HEIGHT,
            MainUIScene.HEALTH_BAR_COLOR).setOrigin(0, 0);

        let scoreStr: string = "".padStart(GameConstants.MAX_SCORE_DIGITS, "0");
        if (this.registry.has(RegistryConstants.Keys.PLAYER_SCORE))
            scoreStr = this.registry.get(RegistryConstants.Keys.PLAYER_SCORE).toString()
                .padStart(GameConstants.MAX_SCORE_DIGITS, "0");
        this._scoreText = this.add.bitmapText(this.scale.width - 64, 64, "future-bmp", scoreStr, 128)
            .setOrigin(1, 0);

        this.createXpBar();

        this.scene.bringToTop();

        console.log("MainUIScene created");
    }

    // XP bar along the bottom of the screen, its fill is scaled from 0 to 1
    private createXpBar() {
        const xpBarY: number = this.scale.height - MainUIScene.XP_BAR_HEIGHT;
        this.add.rectangle(0, xpBarY, this.scale.width, MainUIScene.XP_BAR_HEIGHT, MainUIScene.BAR_BACKGROUND_COLOR)
            .setOrigin(0, 0);
        this._xpBarFill = this.add.rectangle(0, xpBarY, this.scale.width, MainUIScene.XP_BAR_HEIGHT, MainUIScene.XP_BAR_COLOR)
            .setOrigin(0, 0).setScale(0, 1);
        this._levelText = this.add.bitmapText(64, xpBarY - 16, "future-bmp", MainUIScene.formatLevel(1), 64)
            .setOrigin(0, 1);
    }

    private static formatLevel(level: number): string {
        return "LVL " + level;
    }

    private updateHealthBar(health: Health) {
        this._healthBarFill.setScale(health.current / health.max, 1);
    }

    private onExperienceChanged(current: number, required: number) {
        this._xpBarFill.setScale(current / required, 1);
    }

    private onPlayerLevelUp(level: number) {
        this._levelText.setText(MainUIScene.formatLevel(level));
    }

    private showLevelUpPopup(buffs: BuffData[]) {
        const centerX: number = this.scale.width / 2;
        const centerY: number = this.scale.height / 2;

        const popup = this.add.container(0, 0);
        popup.add(this.add.rectangle(0, 0, this.scale.width, this.scale.height, MainUIScene.POPUP_OVERLAY_COLOR,
            MainUIScene.POPUP_OVERLAY_ALPHA)
            .setOrigin(0, 0));
        popup.add(this.add.bitmapText(centerX, centerY - MainUIScene.POPUP_CHOICE_SPACING, "future-bmp", "LEVEL UP", 96)
            .setOrigin(0.5));

        buffs.forEach((buff: BuffData, index: number) => {
            const choice = this.add.text(centerX, centerY + index * MainUIScene.POPUP_CHOICE_SPACING, buff.label,
                {fontSize: '48px', color: '#fff', fontFamily: 'future', backgroundColor: '#333', padding: {x: 32, y: 16}})
                .setOrigin(0.5)
                .setInteractive({useHandCursor: true});

            choice.on(Phaser.Input.Events.POINTER_DOWN, () => {
                popup.destroy();
                this.game.events.emit(GameConstants.Events.BUFF_SELECTED_EVENT, buff);
            });
            popup.add(choice);
        });
    }

    private onPlayerScoreChanged(_: any, value: number) {
        const scoreStr: string = value.toString().padStart(GameConstants.MAX_SCORE_DIGITS, "0");
        this._scoreText.setText(scoreStr);
    }

    private onPlayerSpawned(player: Player) {
        const health = player.getComponent(Health);
        if (health) {
            this.updateHealthBar(health);
            health.on(Health.CHANGE_EVENT, () => this.updateHealthBar(health), this);
        }

        const experience = player.getComponent(Experience);
        this.onExperienceChanged(0, 1);
        this._levelText.setText(MainUIScene.formatLevel(experience?.level ?? 1));
        experience?.on(Experience.CHANGE_EVENT, this.onExperienceChanged, this);
        experience?.on(Experience.LEVEL_UP_EVENT, this.onPlayerLevelUp, this);
    }
}