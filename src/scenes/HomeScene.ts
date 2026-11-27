import {Loader} from "phaser";
import GameConstants from "../GameConstants.ts";
import SaveManager from "../managers/SaveManager.ts";
import SaveConstants from "../SaveConstants.ts";
import ScrollingRoad from "../ui/ScrollingRoad.ts";
import UiStyles from "../ui/UiStyles.ts";

export default class HomeScene extends Phaser.Scene {
    private static readonly DEFAULT_VOLUME_PERCENT: number = 50;
    private static readonly MAX_VOLUME_PERCENT: number = 100;
    private static readonly VOLUME_STEP_PERCENT: number = 10;
    private static readonly DLC_ANGLE: number = -6;
    private static readonly DLC_PULSE_SCALE: number = 1.08;
    private static readonly DLC_PULSE_DURATION: number = 400;

    private saveManager: SaveManager;
    private _volumeText: Phaser.GameObjects.Text;
    private _volumePercent: number;

    constructor() {
        super(GameConstants.SceneKeys.HOME);
    }

    preload() {
        const width: number = this.scale.width;
        const y: number = this.scale.height / 2;

        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(0, y, width, 64);
        this.load.on(Loader.Events.PROGRESS, function (value: number) { // 0-1
            console.log("Loading : " + value);

            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(0, y, width * value, 64);
        });
        this.load.on(Loader.Events.COMPLETE, function () {
            console.log("Loading complete");

            progressBar.destroy();
            progressBox.destroy();
        });

        this.load.setPath('assets');

        this.load.image('bg', 'Backgrounds/road.png');
        this.load.atlas('sprites', 'Spritesheet/gameSprites.png', 'Spritesheet/gameSprites.json');
        this.load.bitmapFont('future-bmp', 'Fonts/kenvector_future.png', 'Fonts/kenvector_future.xml');
        this.load.font('future', 'Fonts/kenvector_future.ttf');
        this.load.json('playerShips', 'Data/playerShips.json');
        this.load.json('enemies', 'Data/enemies.json');
        this.load.json('progression', 'Data/progression.json');
        this.load.json('buffs', 'Data/buffs.json');
        Object.values(GameConstants.SoundKeys).forEach((key: string) => this.load.audio(key, `Sounds/${key}.ogg`));
    }

    create() {
        this.saveManager.load();

        new ScrollingRoad(this);
        this.add.rectangle(0, 400, this.scale.width, 640, UiStyles.PANEL_COLOR, UiStyles.PANEL_ALPHA).setOrigin(0, 0);

        this.createTitle();
        this.createBestScore();
        this.createStartPrompt();
        this.createVolumeOption();
        this.createControlsHint();
        this.playMusic();

        // Ignore the OS key repeat: SPACE may still be held from the previous game
        this.input.keyboard?.on('keydown-SPACE', (event: KeyboardEvent) => {
            if (event.repeat)
                return;

            this.scene.launch(GameConstants.SceneKeys.MAIN_UI);
            this.scene.start(GameConstants.SceneKeys.MAIN_GAME);
        });

        console.log("HomeScene created");
    }

    private createTitle() {
        const centerX: number = this.scale.width / 2;
        UiStyles.addGlow(this.add.text(centerX, 540, 'MIDNIGHT',
            {fontSize: '128px', color: UiStyles.WHITE, fontFamily: UiStyles.TITLE_FONT}).setOrigin(0.5), UiStyles.NEON_BLUE);
        UiStyles.addGlow(this.add.text(centerX, 680, 'THE ROCKIST 2',
            {fontSize: '92px', color: UiStyles.WHITE, fontFamily: UiStyles.TITLE_FONT}).setOrigin(0.5), UiStyles.NEON_BLUE);

        // Tilted like a sticker on the game box
        const dlc = UiStyles.addGlow(this.add.text(centerX + 120, 820, '+ VINE BOOM DLC',
            {fontSize: '56px', color: UiStyles.NEON_PINK, fontFamily: UiStyles.TITLE_FONT}).setOrigin(0.5), UiStyles.NEON_PINK)
            .setAngle(HomeScene.DLC_ANGLE);
        this.tweens.add({
            targets: dlc,
            scale: HomeScene.DLC_PULSE_SCALE,
            duration: HomeScene.DLC_PULSE_DURATION,
            yoyo: true,
            repeat: -1
        });
    }

    private createBestScore() {
        const bestScore: number = Number(this.saveManager.getData(SaveConstants.Keys.PLAYER_BEST_SCORE) ?? 0);
        UiStyles.addGlow(this.add.text(this.scale.width / 2, 960, 'BEST ' + UiStyles.formatScore(bestScore),
            {fontSize: '44px', color: UiStyles.NEON_ORANGE, fontFamily: UiStyles.TITLE_FONT}).setOrigin(0.5), UiStyles.NEON_ORANGE);
    }

    private createStartPrompt() {
        const prompt = UiStyles.addGlow(this.add.text(this.scale.width / 2, 1260, 'PRESS SPACE TO START',
            {fontSize: '52px', color: UiStyles.WHITE, fontFamily: UiStyles.TITLE_FONT}).setOrigin(0.5), UiStyles.NEON_BLUE);
        UiStyles.blink(prompt);
    }

    private createControlsHint() {
        this.add.text(this.scale.width / 2, 1720,
            'FLÈCHES : CONDUIRE   ESPACE : TIRER   1 2 3 : VOITURE\nSOURIS : CHOISIR UN BUFF   R : REJOUER   B : BOSS',
            {fontSize: '28px', color: UiStyles.LIGHT_GREY, fontFamily: UiStyles.TEXT_FONT, align: 'center', lineSpacing: 12})
            .setOrigin(0.5);
    }

    private createVolumeOption() {
        this._volumePercent = this.saveManager.getData(SaveConstants.Keys.VOLUME_PERCENT) ?? HomeScene.DEFAULT_VOLUME_PERCENT;

        this._volumeText = UiStyles.addGlow(this.add.text(this.scale.width / 2, 1380, '',
            {fontSize: '40px', color: UiStyles.NEON_BLUE, fontFamily: UiStyles.TITLE_FONT}).setOrigin(0.5), UiStyles.NEON_BLUE);
        this.applyVolume();

        this.input.keyboard?.on('keydown-LEFT', () => this.changeVolume(-HomeScene.VOLUME_STEP_PERCENT));
        this.input.keyboard?.on('keydown-RIGHT', () => this.changeVolume(HomeScene.VOLUME_STEP_PERCENT));
    }

    private changeVolume(deltaPercent: number) {
        this._volumePercent = Phaser.Math.Clamp(this._volumePercent + deltaPercent, 0, HomeScene.MAX_VOLUME_PERCENT);
        this.saveManager.setData(SaveConstants.Keys.VOLUME_PERCENT, this._volumePercent);
        this.applyVolume();
    }

    private applyVolume() {
        this.sound.volume = this._volumePercent / HomeScene.MAX_VOLUME_PERCENT;
        this._volumeText.setText(`<  VOLUME ${this._volumePercent} %  >`);
    }

    // The music keeps playing across scenes: start it only once
    private playMusic() {
        if (!this.sound.get(GameConstants.SoundKeys.MUSIC))
            this.sound.add(GameConstants.SoundKeys.MUSIC, {loop: true}).play();
    }
}