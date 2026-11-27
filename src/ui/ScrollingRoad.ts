import {GameObjects, Scene} from "phaser";

// The neon road, scrolling down as if the player was driving up
export default class ScrollingRoad extends GameObjects.TileSprite {
    private static readonly TEXTURE_KEY: string = 'bg';
    private static readonly TILE_SCALE: number = 2;
    private static readonly SCROLL_SPEED: number = 0.3; // in road texture px/ms

    constructor(scene: Scene) {
        super(scene, 0, 0, scene.scale.width, scene.scale.height, ScrollingRoad.TEXTURE_KEY);
        this.setOrigin(0, 0).setTileScale(ScrollingRoad.TILE_SCALE);

        // add.existing also registers preUpdate: the road scrolls by itself, and stops when the scene is paused
        scene.add.existing(this);
    }

    preUpdate(_timeSinceLaunch: number, deltaTime: number) {
        this.tilePositionY -= ScrollingRoad.SCROLL_SPEED * deltaTime;
    }
}
