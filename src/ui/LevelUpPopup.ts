import {GameObjects, Scene} from 'phaser';
import {BuffData} from '../gameData/BuffData.ts';
import UiStyles from './UiStyles.ts';

// Level up popup: the buff is chosen with the arrows and confirmed with SPACE, or with the mouse
export default class LevelUpPopup extends GameObjects.Container {
    private static readonly OVERLAY_COLOR: number = 0x000000;
    private static readonly OVERLAY_ALPHA: number = 0.7;
    private static readonly CHOICE_SPACING: number = 160;
    private static readonly SELECTED_SCALE: number = 1.1;
    private static readonly CHOICE_COLOR: string = '#7fdcff';
    private static readonly CHOICE_BACKGROUND: string = '#0b0b2a';
    private static readonly SELECTED_COLOR: string = '#0b0b2a';
    // The player is often shooting when the popup opens: a short delay avoids picking a buff by mistake
    private static readonly KEYBOARD_DELAY: number = 400;

    private readonly _buffs: BuffData[];
    private readonly _onSelected: (buff: BuffData) => void;
    private _choices: GameObjects.Text[] = [];
    private _selectedIndex: number = 0;
    private _keyboardEnabled: boolean = false;

    constructor(scene: Scene, buffs: BuffData[], onSelected: (buff: BuffData) => void) {
        super(scene, 0, 0);
        this._buffs = buffs;
        this._onSelected = onSelected;

        this.createBackground();
        this.createChoices();
        this.select(0);

        scene.add.existing(this);
        scene.input.keyboard?.on('keydown', this.onKeyDown, this);
        scene.time.delayedCall(LevelUpPopup.KEYBOARD_DELAY, () => (this._keyboardEnabled = true));
    }

    private createBackground() {
        const centerX: number = this.scene.scale.width / 2;
        const centerY: number = this.scene.scale.height / 2;

        this.add(
            this.scene.add
                .rectangle(
                    0,
                    0,
                    this.scene.scale.width,
                    this.scene.scale.height,
                    LevelUpPopup.OVERLAY_COLOR,
                    LevelUpPopup.OVERLAY_ALPHA
                )
                .setOrigin(0, 0)
        );
        this.add(
            this.scene.add
                .bitmapText(centerX, centerY - LevelUpPopup.CHOICE_SPACING, 'future-bmp', 'LEVEL UP', 96)
                .setOrigin(0.5)
        );

        const hintY: number = centerY + this._buffs.length * LevelUpPopup.CHOICE_SPACING;
        this.add(
            this.scene.add
                .text(centerX, hintY, '↑ ↓ : CHOISIR   ESPACE : VALIDER', {
                    fontSize: '32px',
                    color: UiStyles.LIGHT_GREY,
                    fontFamily: UiStyles.TEXT_FONT
                })
                .setOrigin(0.5)
        );
    }

    private createChoices() {
        const centerX: number = this.scene.scale.width / 2;
        const centerY: number = this.scene.scale.height / 2;

        this._buffs.forEach((buff: BuffData, index: number) => {
            const choice = this.scene.add
                .text(centerX, centerY + index * LevelUpPopup.CHOICE_SPACING, buff.label, {
                    fontSize: '48px',
                    fontFamily: UiStyles.TEXT_FONT,
                    fontStyle: 'bold',
                    padding: {x: 32, y: 16}
                })
                .setOrigin(0.5)
                .setInteractive({useHandCursor: true});

            choice.on(Phaser.Input.Events.POINTER_OVER, () => this.select(index));
            choice.on(Phaser.Input.Events.POINTER_DOWN, () => this.confirm(index));

            this._choices.push(choice);
            this.add(choice);
        });
    }

    // Wrap: going up from the first choice selects the last one
    private select(index: number) {
        this._selectedIndex = Phaser.Math.Wrap(index, 0, this._choices.length);

        this._choices.forEach((choice: GameObjects.Text, choiceIndex: number) => {
            const isSelected: boolean = choiceIndex === this._selectedIndex;
            choice.setColor(isSelected ? LevelUpPopup.SELECTED_COLOR : LevelUpPopup.CHOICE_COLOR);
            choice.setBackgroundColor(isSelected ? UiStyles.NEON_BLUE : LevelUpPopup.CHOICE_BACKGROUND);
            choice.setScale(isSelected ? LevelUpPopup.SELECTED_SCALE : 1);
        });
    }

    private onKeyDown(event: KeyboardEvent) {
        if (event.repeat || !this._keyboardEnabled) return;

        if (event.code === 'ArrowUp' || event.code === 'ArrowLeft') this.select(this._selectedIndex - 1);
        else if (event.code === 'ArrowDown' || event.code === 'ArrowRight') this.select(this._selectedIndex + 1);
        else if (event.code === 'Space') this.confirm(this._selectedIndex);
    }

    private confirm(index: number) {
        const buff: BuffData = this._buffs[index];
        this.scene.input.keyboard?.off('keydown', this.onKeyDown, this);
        this.destroy();
        this._onSelected(buff);
    }
}
