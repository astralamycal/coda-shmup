import {GameObjects} from 'phaser';
import GameConstants from '../GameConstants.ts';

// Shared look of the menus: neon colors on the night road
export default class UiStyles {
    public static readonly TITLE_FONT: string = 'future';
    // The X of the future font looks like an H: texts with an X use this one
    public static readonly TEXT_FONT: string = '"Courier New", monospace';

    public static readonly WHITE: string = '#ffffff';
    public static readonly LIGHT_GREY: string = '#b8c4e0';
    public static readonly NEON_BLUE: string = '#39d6ff';
    public static readonly NEON_PINK: string = '#ff4fd8';
    public static readonly NEON_ORANGE: string = '#ff9a3c';

    public static readonly PANEL_COLOR: number = 0x000000;
    public static readonly PANEL_ALPHA: number = 0.6;

    private static readonly GLOW_BLUR: number = 24;
    private static readonly BLINK_DURATION: number = 600;
    private static readonly BLINK_ALPHA: number = 0.2;

    // A blurred shadow of the text's color, without offset, looks like a neon glow
    public static addGlow(text: GameObjects.Text, color: string): GameObjects.Text {
        return text.setShadow(0, 0, color, UiStyles.GLOW_BLUR, true, true);
    }

    public static blink(text: GameObjects.Text) {
        text.scene.tweens.add({
            targets: text,
            alpha: UiStyles.BLINK_ALPHA,
            duration: UiStyles.BLINK_DURATION,
            yoyo: true,
            repeat: -1
        });
    }

    public static formatScore(score: number): string {
        return score.toString().padStart(GameConstants.MAX_SCORE_DIGITS, '0');
    }
}
