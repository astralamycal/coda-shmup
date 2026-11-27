import IComponent from './IComponent.ts';
import Entity from '../entities/Entity.ts';

export default class Health extends Phaser.Events.EventEmitter implements IComponent {
    public enabled: boolean = true;

    public static readonly CHANGE_EVENT: string = 'change';
    public static readonly DEATH_EVENT: string = 'death';
    private static readonly EXPLOSION_FRAME: string = 'spark';
    private static readonly EXPLOSION_PARTICLES: number = 16;
    private static readonly EXPLOSION_LIFESPAN: number = 600;

    private _current: number;
    private _max: number;
    private readonly _entity: Entity;

    public get current(): number {
        return this._current;
    }

    public get max(): number {
        return this._max;
    }

    public constructor(value: number, entity: Entity) {
        super();

        this._current = value;
        this._max = value;
        this._entity = entity;
    }

    // Full health with a new max, without events: used when an entity is taken back from the pool
    public reset(max: number) {
        this._max = max;
        this._current = max;
    }

    public increaseMax(amount: number) {
        if (!this.enabled || amount <= 0) return;
        this._max += amount;
        this.heal(amount);
    }

    public damage(amount: number, emitEvents: boolean = true): void {
        if (!this.enabled || amount <= 0) return;
        this.adjust(-amount, emitEvents);
    }

    public heal(amount: number, emitEvents: boolean = true): void {
        if (!this.enabled || amount <= 0) return;
        this.adjust(amount, emitEvents);
    }

    private adjust(delta: number, emitEvents: boolean = true): void {
        if (!this.enabled) return;

        const prev: number = this._current;
        this._current = Phaser.Math.Clamp(this._current + delta, 0, this._max);

        if (emitEvents && this._current !== prev) {
            this.emit(Health.CHANGE_EVENT, this._current);

            if (this._current <= 0 && prev > 0) {
                this.playExplosion();
                this.emit(Health.DEATH_EVENT);
            }
        }
    }

    private playExplosion() {
        const scene = this._entity.scene;
        const particles = scene.add.particles(this._entity.x, this._entity.y, 'sprites', {
            frame: Health.EXPLOSION_FRAME,
            speed: {min: 100, max: 400},
            scale: {start: 1, end: 0},
            lifespan: Health.EXPLOSION_LIFESPAN,
            emitting: false
        });
        particles.explode(Health.EXPLOSION_PARTICLES);
        scene.time.delayedCall(Health.EXPLOSION_LIFESPAN, () => particles.destroy());
    }
}
