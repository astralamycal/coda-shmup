import {Loader} from "phaser";
import GameConstants from "../GameConstants.ts";
import SaveManager from "../managers/SaveManager.ts";
import SaveConstants from "../SaveConstants.ts";

export default class HomeScene extends Phaser.Scene {
    private static readonly DEFAULT_VOLUME_PERCENT: number = 50;
    private static readonly MAX_VOLUME_PERCENT: number = 100;
    private static readonly VOLUME_STEP_PERCENT: number = 10;

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
        this.add.text(this.scale.width / 2, this.scale.width / 2, 'CODA SHMUP',
            {fontSize: '72px', color: '#fff', fontFamily: 'future'}).setOrigin(0.5);
        this.add.text(this.scale.width / 2, this.scale.width / 2 + 72, 'Press SPACE to start',
            {fontSize: '32px', color: '#fff'}).setOrigin(0.5);

        this.createVolumeOption();
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

    private createVolumeOption() {
        this.saveManager.load();
        this._volumePercent = this.saveManager.getData(SaveConstants.Keys.VOLUME_PERCENT) ?? HomeScene.DEFAULT_VOLUME_PERCENT;

        this._volumeText = this.add.text(this.scale.width / 2, this.scale.width / 2 + 160, '',
            {fontSize: '32px', color: '#fff'}).setOrigin(0.5);
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
        this._volumeText.setText(`<  Volume : ${this._volumePercent} %  >`);
    }

    // The music keeps playing across scenes: start it only once
    private playMusic() {
        if (!this.sound.get(GameConstants.SoundKeys.MUSIC))
            this.sound.add(GameConstants.SoundKeys.MUSIC, {loop: true}).play();
    }
}