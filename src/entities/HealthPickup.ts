import Entity from './Entity.ts';
import Movement from '../components/Movement.ts';

// A pink cross dropped by enemies: it gives back a little health
export default class HealthPickup extends Entity {
    public static readonly FRAME: string = 'healthPickup';
    private static readonly FALL_SPEED: number = 0.2;
    private static readonly BODY_RADIUS: number = 20;
    private static readonly BLINK_DURATION: number = 250;
    private static readonly BLINK_ALPHA: number = 0.5;

    public init() {
        this.addComponent(new Movement(HealthPickup.FALL_SPEED));
        this.setCenteredCircleBody(HealthPickup.BODY_RADIUS);

        this.scene.tweens.add({
            targets: this,
            alpha: HealthPickup.BLINK_ALPHA,
            duration: HealthPickup.BLINK_DURATION,
            yoyo: true,
            repeat: -1
        });
    }

    public enable(x: number, y: number) {
        this.enableBody(true, x, y, true, true);
    }

    public disable() {
        this.disableBody(true, true);
    }

    preUpdate(timeSinceLaunch: number, deltaTime: number) {
        super.preUpdate(timeSinceLaunch, deltaTime);

        this.getComponent(Movement)?.moveVertically(this, deltaTime);

        if (this.y > this.scene.cameras.main.height + this.displayHeight) this.disable();
    }
}
