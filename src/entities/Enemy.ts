import type {BulletData} from '../gameData/BulletData.ts';
import Entity from './Entity.ts';
import GameConstants from '../GameConstants.ts';
import Health from '../components/Health.ts';
import Movement from '../components/Movement.ts';
import Weapon from '../components/Weapon.ts';
import {EnemyTypeData} from '../gameData/EnemyTypeData.ts';
import {RewardData} from '../gameData/RewardData.ts';

export default class Enemy extends Entity {
    public static readonly FRAME: string = 'enemyCar';
    private static readonly SHOOT_ANIMATION: string = 'enemyShoot';
    private static readonly BODY_RADIUS: number = 26;
    private static readonly FACING_DOWN_ANGLE: number = 90;
    private static readonly HIT_FLASH_COLOR: number = 0xffffff;
    private static readonly HIT_FLASH_DURATION: number = 50;
    private static readonly HIT_SLOWDOWN: number = 0.5; // speed factor while flashing after a hit

    private readonly _bulletData: BulletData = {
        width: 14,
        height: 14,
        color: '#ff4fd8',
        outline: '#ffd6f5',
        speed: 480,
        damage: 1
    };
    private _shootTimerConfig: Phaser.Types.Time.TimerEventConfig;
    private _shootTimer: Phaser.Time.TimerEvent;
    private _tint: number;
    private _reward: RewardData;
    private _isFlashing: boolean = false;

    public get reward(): RewardData {
        return this._reward;
    }

    public init(bulletsGroup: Phaser.Physics.Arcade.Group) {
        this.addComponent(new Health(1, this));
        this.addComponent(new Movement());
        this.addComponent(new Weapon(bulletsGroup, this._bulletData));

        // Listen once per enemy, not on every enable(): pooled enemies are reused many times
        this.getComponent(Health)?.on(Health.CHANGE_EVENT, this.onHealthChanged, this);

        this.angle = Enemy.FACING_DOWN_ANGLE;

        this._shootTimerConfig = {
            delay: Phaser.Math.Between(2000, 3000),
            callback: this.shoot,
            callbackScope: this,
            loop: true
        };
        this._shootTimer = this.scene.time.addEvent(this._shootTimerConfig);

        // Create animation when enemy is about to shoot in the global animation manager
        // The headlights flash before the enemy shoots
        if (!this.scene.anims.exists(Enemy.SHOOT_ANIMATION)) {
            this.scene.anims.create({
                key: Enemy.SHOOT_ANIMATION,
                frames: [
                    {key: 'sprites', frame: Enemy.FRAME},
                    {key: 'sprites', frame: Enemy.FRAME + '-shoot0'},
                    {key: 'sprites', frame: Enemy.FRAME + '-shoot1'}
                ],
                frameRate: 4
            });
        }

        this.setCenteredCircleBody(Enemy.BODY_RADIUS);
    }

    // The type and the difficulty are applied each time the enemy is taken from the pool
    public enable(x: number, y: number, type: EnemyTypeData, difficulty: number) {
        this.enableBody(true, x, y - this.displayHeight, true, true);

        this._reward = type.reward;
        this._tint = Phaser.Display.Color.HexStringToColor(type.tint).color;
        this.setTint(this._tint);
        this._isFlashing = false;

        this.getComponent(Health)?.reset(Math.ceil(type.health * difficulty));
        this.getComponent(Movement)?.setSpeed(type.speed * difficulty);

        const weapon = this.getComponent(Weapon);
        if (weapon) {
            weapon.enabled = type.canShoot;
            weapon.setDamage(Math.round(this._bulletData.damage * difficulty));
        }
        this._shootTimer.reset(this._shootTimerConfig);
        this._shootTimer.paused = !type.canShoot;
    }

    public disable() {
        this.stop();
        this.removeAllListeners(Phaser.Animations.Events.ANIMATION_COMPLETE);

        this.disableBody(true, true);
        this._shootTimer.paused = true;
    }

    private onHealthChanged(current: number) {
        this._isFlashing = true;
        this.setTintFill(Enemy.HIT_FLASH_COLOR);

        if (current === 0) this.disableBody();

        this.scene.time.delayedCall(Enemy.HIT_FLASH_DURATION, () => {
            this._isFlashing = false;
            this.setTint(this._tint);

            if (current === 0) this.disable();
        });
    }

    private shoot() {
        this.play(Enemy.SHOOT_ANIMATION);
        this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
            this.setTexture('sprites', Enemy.FRAME);

            this.getComponent(Weapon)?.shoot(this);
            this.scene.sound.play(GameConstants.SoundKeys.ENEMY_SHOOT);
        });
    }

    preUpdate(timeSinceLaunch: number, deltaTime: number) {
        super.preUpdate(timeSinceLaunch, deltaTime);

        // Destroy entities when out of screen
        if (this.y > this.scene.cameras.main.height + this.displayHeight) {
            this.disable();
        }

        const speedFactor: number = this._isFlashing ? Enemy.HIT_SLOWDOWN : 1;
        this.getComponent(Movement)?.moveVertically(this, deltaTime * speedFactor);
    }
}
