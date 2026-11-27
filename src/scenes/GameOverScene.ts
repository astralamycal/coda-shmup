import GameConstants from "../GameConstants.ts";
import RegistryConstants from "../RegistryConstants.ts";
import SaveManager from "../managers/SaveManager.ts";
import SaveConstants from "../SaveConstants.ts";
import ScrollingRoad from "../ui/ScrollingRoad.ts";
import UiStyles from "../ui/UiStyles.ts";

export default class GameOverScene extends Phaser.Scene {
    private saveManager: SaveManager;

    constructor() {
        super(GameConstants.SceneKeys.GAME_OVER);
    }

    create() {
        this.scene.stop(GameConstants.SceneKeys.MAIN_UI);

        new ScrollingRoad(this);
        this.add.rectangle(0, 480, this.scale.width, 720, UiStyles.PANEL_COLOR, UiStyles.PANEL_ALPHA).setOrigin(0, 0);

        const centerX: number = this.scale.width / 2;
        UiStyles.addGlow(this.add.text(centerX, 640, 'GAME OVER',
            {fontSize: '128px', color: UiStyles.WHITE, fontFamily: UiStyles.TITLE_FONT}).setOrigin(0.5), UiStyles.NEON_PINK);

        const score: number = Number(this.registry.get(RegistryConstants.Keys.PLAYER_SCORE) ?? 0);
        const bestScore: number = Number(this.saveManager.getData(SaveConstants.Keys.PLAYER_BEST_SCORE) ?? 0);
        UiStyles.addGlow(this.add.text(centerX, 820, 'SCORE ' + UiStyles.formatScore(score),
            {fontSize: '64px', color: UiStyles.WHITE, fontFamily: UiStyles.TITLE_FONT}).setOrigin(0.5), UiStyles.NEON_BLUE);
        UiStyles.addGlow(this.add.text(centerX, 920, 'BEST ' + UiStyles.formatScore(bestScore),
            {fontSize: '44px', color: UiStyles.NEON_ORANGE, fontFamily: UiStyles.TITLE_FONT}).setOrigin(0.5), UiStyles.NEON_ORANGE);

        // The best score was saved just before this scene: equal means it was beaten during this game
        if (score > 0 && score >= bestScore) {
            UiStyles.addGlow(this.add.text(centerX, 1040, 'NEW RECORD!',
                {fontSize: '52px', color: UiStyles.NEON_PINK, fontFamily: UiStyles.TITLE_FONT}).setOrigin(0.5), UiStyles.NEON_PINK);
        }

        const prompt = UiStyles.addGlow(this.add.text(centerX, 1360, 'PRESS SPACE TO PLAY AGAIN',
            {fontSize: '48px', color: UiStyles.WHITE, fontFamily: UiStyles.TITLE_FONT}).setOrigin(0.5), UiStyles.NEON_BLUE);
        UiStyles.blink(prompt);

        // Ignore the OS key repeat: SPACE is often still held from shooting when the player dies
        this.input.keyboard?.on('keydown-SPACE', (event: KeyboardEvent) => {
            if (event.repeat)
                return;

            this.scene.start(GameConstants.SceneKeys.HOME);
        });
    }
}
