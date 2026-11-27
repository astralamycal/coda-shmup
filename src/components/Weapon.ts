import {Physics} from 'phaser';
import {BulletData} from "../gameData/BulletData.ts";
import Bullet from "../entities/Bullet.ts";
import Entity from "../entities/Entity.ts";
import IComponent from "./IComponent.ts";

export default class Weapon implements IComponent {
    private static readonly FULL_CIRCLE: number = 360;

    public enabled: boolean = true;

    private readonly _bullets: Physics.Arcade.Group;
    private _bulletData: BulletData;
    private _bulletCount: number;
    private readonly _spreadAngle: number;

    constructor(bullets: Physics.Arcade.Group, bulletData: BulletData, bulletCount: number = 1, spreadAngle: number = 0) {
        if (!bullets) {
            console.error("Weapon 'bullets' group cannot be null or undefined");
        }

        this._bullets = bullets;
        this._bulletData = bulletData;
        this._bulletCount = bulletCount;
        this._spreadAngle = spreadAngle;
    }

    public setBulletCount(bulletCount: number) {
        this._bulletCount = bulletCount;
    }

    public setDamage(damage: number) {
        this._bulletData = {...this._bulletData, damage: damage};
    }

    // Shoots bulletCount bullets, fanned out over spreadAngle degrees around the source forward direction
    public shoot(source: Entity) {
        if (!this.enabled || !this._bullets)
            return;

        const angleStep: number = this.getAngleStep();
        const firstAngle: number = source.angle - angleStep * (this._bulletCount - 1) / 2;
        for (let i = 0; i < this._bulletCount; i++) {
            this.shootBullet(source, firstAngle + angleStep * i);
        }
    }

    // One bullet, whatever the spread: used to aim at a target
    public shootAt(source: Entity, angle: number) {
        if (!this.enabled || !this._bullets)
            return;

        this.shootBullet(source, angle);
    }

    private getAngleStep(): number {
        if (this._bulletCount <= 1)
            return 0;

        // On a full circle, the last bullet would overlap the first one
        if (this._spreadAngle >= Weapon.FULL_CIRCLE)
            return Weapon.FULL_CIRCLE / this._bulletCount;

        return this._spreadAngle / (this._bulletCount - 1);
    }

    private shootBullet(source: Entity, angle: number) {
        const bullet: Bullet = this._bullets.get() as Bullet;
        if (!bullet)
            return;

        const direction: Phaser.Math.Vector2 = new Phaser.Math.Vector2(1, 0).rotate(Phaser.Math.DegToRad(angle));
        const velocity: Phaser.Math.Vector2 = direction.clone().scale(this._bulletData.speed);
        const spawnDistance: number = source.arcadeBody.radius;
        bullet.enable(source.x + direction.x * spawnDistance, source.y + direction.y * spawnDistance,
            velocity.x, velocity.y, this._bulletData);
    }
}
