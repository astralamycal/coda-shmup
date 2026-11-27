import Entity from './Entity.ts';
import Movement from "../components/Movement.ts";
import PlayerStats from "../components/PlayerStats.ts";
import Player from "./Player.ts";

export default class Orb extends Entity {
    public static readonly FRAME: string = 'star2';
    private static readonly FALL_SPEED: number = 0.25;
    private static readonly MAGNET_SPEED_FACTOR: number = 4; // pulled faster than it falls

    private _xpValue: number = 0;
    private _player: Player;
    private readonly _directionToPlayer: Phaser.Math.Vector2 = new Phaser.Math.Vector2();

    public get xpValue(): number {
        return this._xpValue;
    }

    public init(player: Player) {
        this._player = player;
        this.addComponent(new Movement(Orb.FALL_SPEED));
        this.arcadeBody.setCircle(this.width / 2);
    }

    public enable(x: number, y: number, xpValue: number) {
        this.enableBody(true, x, y, true, true);
        this._xpValue = xpValue;
    }

    public disable() {
        this.disableBody(true, true);
    }

    preUpdate(timeSinceLaunch: number, deltaTime: number) {
        super.preUpdate(timeSinceLaunch, deltaTime);

        if (this.isInMagnetRange())
            this.moveTowardsPlayer(deltaTime);
        else
            this.getComponent(Movement)?.moveVertically(this, deltaTime);

        // Recycle orbs the player didn't catch
        if (this.y > this.scene.cameras.main.height + this.displayHeight)
            this.disable();
    }

    private isInMagnetRange(): boolean {
        const magnetRadius: number = this._player.getComponent(PlayerStats)?.get('magnetRadius') ?? 0;
        return Phaser.Math.Distance.Between(this.x, this.y, this._player.x, this._player.y) < magnetRadius;
    }

    private moveTowardsPlayer(deltaTime: number) {
        this._directionToPlayer.set(this._player.x - this.x, this._player.y - this.y).normalize();
        this.getComponent(Movement)?.move(this, this._directionToPlayer, deltaTime * Orb.MAGNET_SPEED_FACTOR);
    }
}
