import Entity from './Entity.ts';
import PlayerStats from '../components/PlayerStats.ts';
import Player from './Player.ts';

export default class Orb extends Entity {
    public static readonly FRAME: string = 'orb';
    private static readonly BODY_RADIUS: number = 16;
    private static readonly FALL_SPEED: number = 0.25; // in px/ms
    private static readonly MAGNET_SPEED: number = 1.5; // in px/ms, faster than the fastest car
    private static readonly STEERING: number = 0.006; // share of the gap to the wanted velocity closed each ms

    private _xpValue: number = 0;
    private _player: Player;
    private readonly _velocity: Phaser.Math.Vector2 = new Phaser.Math.Vector2();
    private readonly _wantedVelocity: Phaser.Math.Vector2 = new Phaser.Math.Vector2();

    public get xpValue(): number {
        return this._xpValue;
    }

    public init(player: Player) {
        this._player = player;
        this.setCenteredCircleBody(Orb.BODY_RADIUS);
    }

    public enable(x: number, y: number, xpValue: number) {
        this.enableBody(true, x, y, true, true);
        this._xpValue = xpValue;
        this._velocity.set(0, Orb.FALL_SPEED);
    }

    public disable() {
        this.disableBody(true, true);
    }

    preUpdate(timeSinceLaunch: number, deltaTime: number) {
        super.preUpdate(timeSinceLaunch, deltaTime);

        // Steer little by little towards the wanted velocity: the orb curves towards the player instead of turning at once
        this.updateWantedVelocity();
        this._velocity.lerp(this._wantedVelocity, Math.min(1, Orb.STEERING * deltaTime));
        this.x += this._velocity.x * deltaTime;
        this.y += this._velocity.y * deltaTime;

        // Recycle orbs the player didn't catch
        if (this.y > this.scene.cameras.main.height + this.displayHeight) this.disable();
    }

    private updateWantedVelocity() {
        if (this.isInMagnetRange()) {
            this._wantedVelocity
                .set(this._player.x - this.x, this._player.y - this.y)
                .normalize()
                .scale(Orb.MAGNET_SPEED);
        } else {
            this._wantedVelocity.set(0, Orb.FALL_SPEED);
        }
    }

    private isInMagnetRange(): boolean {
        const magnetRadius: number = this._player.getComponent(PlayerStats)?.get('magnetRadius') ?? 0;
        return Phaser.Math.Distance.Between(this.x, this.y, this._player.x, this._player.y) < magnetRadius;
    }
}
