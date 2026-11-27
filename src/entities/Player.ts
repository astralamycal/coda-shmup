import {Input, Scene} from 'phaser';
import {PlayerShipData, PlayerShipsData} from '../gameData/PlayerShipsData.ts';
import type {BulletData} from '../gameData/BulletData.ts';
import {ProgressionData} from '../gameData/ProgressionData.ts';
import Entity from './Entity.ts';
import GameConstants from '../GameConstants.ts';
import Experience from '../components/Experience.ts';
import Health from '../components/Health.ts';
import Movement from '../components/Movement.ts';
import PlayerStats from '../components/PlayerStats.ts';
import Weapon from '../components/Weapon.ts';

export default class Player extends Entity {
    private static readonly BASE_HEALTH: number = 5;
    private static readonly BASE_RATE_OF_FIRE: number = 0.35; // seconds between two shots
    private static readonly INVULNERABILITY_DURATION: number = 400; // in ms after a hit
    private static readonly INVULNERABILITY_ALPHA: number = 0.5;
    private static readonly SPREAD_ANGLE: number = 20; // used once the player shoots several bullets
    private static readonly HOMING_INTERVAL: number = 10000; // in ms, between two volleys of aimed bullets

    private readonly _bulletData: BulletData = {
        width: 32,
        height: 8,
        color: '#ffffff',
        outline: '#39d6ff',
        speed: 1100,
        damage: 1
    };

    private readonly _cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;
    private _playerShipData: PlayerShipData;
    private _rateOfFire: number;
    private _lastShotTime: number;
    private _targets: Phaser.Physics.Arcade.Group;

    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, 'sprites');

        if (this.scene.input.keyboard) {
            this._cursorKeys = this.scene.input.keyboard.createCursorKeys();

            this.scene.input.keyboard.addKey(Input.Keyboard.KeyCodes.ONE).on('down', () => this.selectPlayerShip(1));
            this.scene.input.keyboard.addKey(Input.Keyboard.KeyCodes.TWO).on('down', () => this.selectPlayerShip(2));
            this.scene.input.keyboard.addKey(Input.Keyboard.KeyCodes.THREE).on('down', () => this.selectPlayerShip(3));
        }
    }

    public init(bulletsGroup: Phaser.Physics.Arcade.Group) {
        this.addComponent(new Health(Player.BASE_HEALTH, this));
        this.addComponent(new Movement());
        this.addComponent(new Weapon(bulletsGroup, this._bulletData, 1, Player.SPREAD_ANGLE));
        this.addComponent(new PlayerStats());
        this.getComponent(PlayerStats)?.on(PlayerStats.CHANGE_EVENT, this.applyStats, this);

        const progressionData = this.scene.cache.json.get('progression') as ProgressionData;
        this.addComponent(new Experience(progressionData));
        this.getComponent(Experience)?.on(Experience.LEVEL_UP_EVENT, () => {
            this.getComponent(Health)?.increaseMax(progressionData.healthPerLevel);
        });

        this.angle = -90;

        this.selectPlayerShip(1);

        this._rateOfFire = Player.BASE_RATE_OF_FIRE;
        this._lastShotTime = 0;

        this.scene.time.addEvent({
            delay: Player.HOMING_INTERVAL,
            callback: this.shootHomingBullets,
            callbackScope: this,
            loop: true
        });

        // Short invulnerability after a hit, shown by a transparent car: a spread shot can't hit several times
        this.getComponent(Health)?.on(Health.CHANGE_EVENT, () => {
            this.arcadeBody.setEnable(false);
            this.setAlpha(Player.INVULNERABILITY_ALPHA);

            this.scene.time.delayedCall(Player.INVULNERABILITY_DURATION, () => {
                this.setAlpha(1);

                // A dead player stays disabled
                if (this.active) this.arcadeBody.setEnable(true);
            });
        });
    }

    public collectXp(amount: number) {
        const xpGain = this.getComponent(PlayerStats)?.get('xpGain') ?? 1;
        this.getComponent(Experience)?.add(amount * xpGain);
    }

    private applyStats() {
        const stats = this.getComponent(PlayerStats);
        if (!stats) return;

        const weapon = this.getComponent(Weapon);
        weapon?.setDamage(this._bulletData.damage * stats.get('damage'));
        weapon?.setBulletCount(stats.get('bulletCount'));
        this._rateOfFire = Player.BASE_RATE_OF_FIRE / stats.get('fireRate');
    }

    public setTargets(targets: Phaser.Physics.Arcade.Group) {
        this._targets = targets;
    }

    public selectPlayerShip(playerShipDataId: number) {
        const playerShipsData = this.scene.cache.json.get('playerShips') as PlayerShipsData;
        this._playerShipData = playerShipsData[playerShipDataId];

        this.setTexture('sprites', this._playerShipData.texture);
        const bodyData = this._playerShipData.body;
        this.arcadeBody.setCircle(bodyData.radius, bodyData.offsetX, bodyData.offsetY);

        this.getComponent(Movement)?.setSpeed(this._playerShipData.movementSpeed);
    }

    // One bullet towards each of the farthest enemies
    private shootHomingBullets() {
        const homingBullets: number = this.getComponent(PlayerStats)?.get('homingBullets') ?? 0;
        if (!this.active || homingBullets === 0) return;

        const targets: Entity[] = this.getFarthestTargets(homingBullets);
        targets.forEach((target: Entity) => {
            const angle: number = Phaser.Math.RadToDeg(Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y));
            this.getComponent(Weapon)?.shootAt(this, angle);
        });

        if (targets.length > 0) this.scene.sound.play(GameConstants.SoundKeys.PLAYER_SHOOT);
    }

    private getFarthestTargets(count: number): Entity[] {
        if (!this._targets) return [];

        const distanceTo = (target: Entity): number => Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
        return (this._targets.getMatching('active', true) as Entity[])
            .sort((a: Entity, b: Entity) => distanceTo(b) - distanceTo(a))
            .slice(0, count);
    }

    preUpdate(timeSinceLaunch: number, deltaTime: number) {
        super.preUpdate(timeSinceLaunch, deltaTime);

        // Press left or right arrow keys to move the player smoothly horizontally using deltaTime
        if (this._cursorKeys.left.isDown) {
            if (this._cursorKeys.shift.isDown) {
                this.angle -= this._playerShipData.movementSpeed * deltaTime;
            } else {
                this.getComponent(Movement)?.moveHorizontally(this, -deltaTime);
            }
        } else if (this._cursorKeys.right.isDown) {
            if (this._cursorKeys.shift.isDown) {
                this.angle += this._playerShipData.movementSpeed * deltaTime;
            } else {
                this.getComponent(Movement)?.moveHorizontally(this, deltaTime);
            }
        }
        // Stop player from going offscreen
        this.x = Phaser.Math.Clamp(
            this.x,
            this.displayWidth / 2,
            this.scene.cameras.main.width - this.displayWidth / 2
        );

        // Press space to shoot
        if (this._cursorKeys.space.isDown) {
            if (timeSinceLaunch - this._lastShotTime > this._rateOfFire * 1000) {
                this.getComponent(Weapon)?.shoot(this);
                this.scene.sound.play(GameConstants.SoundKeys.PLAYER_SHOOT);

                this._lastShotTime = timeSinceLaunch;
            }
        }
    }
}
