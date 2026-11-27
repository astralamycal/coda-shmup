import Entity from './Entity.ts';
import Movement from "../components/Movement.ts";
import {PlayerShipsData} from "../gameData/PlayerShipsData.ts";

// A car to pick up: the player drives it for a few seconds
export default class SpeedPowerUp extends Entity {
    private static readonly FALL_SPEED: number = 0.2;
    private static readonly DISPLAY_SCALE: number = 0.7;
    private static readonly FACING_UP_ANGLE: number = -90;
    private static readonly BODY_RADIUS: number = 30;
    private static readonly TINT: number = 0xffe066; // yellow, so it can't be mistaken for the player
    private static readonly BLINK_DURATION: number = 250;

    private _shipId: number = 0;

    public get shipId(): number {
        return this._shipId;
    }

    public init() {
        this.addComponent(new Movement(SpeedPowerUp.FALL_SPEED));
        this.setScale(SpeedPowerUp.DISPLAY_SCALE);
        this.angle = SpeedPowerUp.FACING_UP_ANGLE;
        this.setTint(SpeedPowerUp.TINT);

        this.scene.tweens.add({
            targets: this,
            alpha: 0.4,
            duration: SpeedPowerUp.BLINK_DURATION,
            yoyo: true,
            repeat: -1
        });
    }

    public enable(x: number, y: number, shipId: number) {
        this._shipId = shipId;
        const playerShipsData = this.scene.cache.json.get('playerShips') as PlayerShipsData;
        this.setTexture('sprites', playerShipsData[shipId].texture);
        this.setCenteredCircleBody(SpeedPowerUp.BODY_RADIUS);

        this.enableBody(true, x, y, true, true);
    }

    public disable() {
        this.disableBody(true, true);
    }

    preUpdate(timeSinceLaunch: number, deltaTime: number) {
        super.preUpdate(timeSinceLaunch, deltaTime);

        this.getComponent(Movement)?.moveVertically(this, deltaTime);

        if (this.y > this.scene.cameras.main.height + this.displayHeight)
            this.disable();
    }
}
