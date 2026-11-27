import {GameObjects, Plugins, Physics, Scene, Scenes} from 'phaser';
import Health from '../components/Health.ts';
import PlayerStats from '../components/PlayerStats.ts';
import Boss from '../entities/Boss.ts';
import Bullet from '../entities/Bullet.ts';
import Enemy from '../entities/Enemy.ts';
import Entity from '../entities/Entity.ts';
import Orb from '../entities/Orb.ts';
import HealthPickup from '../entities/HealthPickup.ts';
import Player from '../entities/Player.ts';
import GroupUtils from '../utils/GroupUtils.ts';
import {BossData} from '../gameData/BossData.ts';
import {EnemiesData} from '../gameData/EnemiesData.ts';
import {EnemyTypeData} from '../gameData/EnemyTypeData.ts';
import {HealthPickupData, ProgressionData} from '../gameData/ProgressionData.ts';
import GameConstants from '../GameConstants.ts';
import RegistryConstants from '../RegistryConstants.ts';

export default class EntityManager extends Plugins.ScenePlugin {
    public static readonly PLUGIN_KEY: string = 'EntityManager';
    public static readonly MAPPING_NAME: string = 'entityManager';
    private static readonly BOSS_CONTACT_DAMAGE: number = 1;
    private static readonly ORB_POOL_SIZE: number = 32;

    // noinspection JSUnusedGlobalSymbols
    private readonly bulletGroupConfig = {
        classType: Bullet,
        maxSize: 256,
        runChildUpdate: true,
        createCallback: (bullet: GameObjects.GameObject) => {
            (bullet as Bullet).init();
        }
    };

    private _player: Player;
    private _playerBullets: Physics.Arcade.Group;
    private _enemies: Physics.Arcade.Group;
    private _enemyBullets: Physics.Arcade.Group;
    private _bosses: Physics.Arcade.Group;
    private _enemiesData: EnemiesData;
    private _bossData: BossData;
    private _nextBossScore: number;
    private _bossSpawnCount: number;
    private _orbs: Physics.Arcade.Group;
    private _healthPickups: Physics.Arcade.Group;
    private _healthPickupData: HealthPickupData;

    constructor(scene: Scene, pluginManager: Plugins.PluginManager) {
        super(scene, pluginManager, EntityManager.PLUGIN_KEY);
    }

    public initAndSpawnPlayer(): Player {
        this._playerBullets = this.scene!.physics.add.group(this.bulletGroupConfig);
        GroupUtils.populate(64, this._playerBullets);

        this._player = new Player(this.scene!, this.scene!.cameras.main.centerX, this.scene!.cameras.main.height - 128);
        this._player.init(this._playerBullets);

        this.game!.events.emit(GameConstants.Events.PLAYER_SPAWNED_EVENT, this._player);

        return this._player;
    }

    public initEnemies(): Physics.Arcade.Group {
        this._enemiesData = this.scene!.cache.json.get('enemies') as EnemiesData;

        this._enemyBullets = this.scene!.physics.add.group(this.bulletGroupConfig);
        GroupUtils.populate(256, this._enemyBullets);

        this._enemies = this.scene!.physics.add.group({
            classType: Enemy,
            defaultKey: 'sprites',
            defaultFrame: Enemy.FRAME,
            createCallback: (enemy) => {
                (enemy as Enemy).init(this._enemyBullets);
                this.listenToDeath(enemy as Enemy);
            }
        });

        this._player.setTargets(this._enemies);

        // Spawn enemies indefinitely
        this.scheduleNextEnemy();

        return this._enemies;
    }

    public initBoss() {
        this._bossData = this._enemiesData.boss;
        this._nextBossScore = this._bossData.spawn.firstScore;
        this._bossSpawnCount = 0;

        // Only one boss at a time: the same one is taken back from the pool at each spawn
        this._bosses = this.scene!.physics.add.group({
            classType: Boss,
            maxSize: 1,
            defaultKey: 'sprites',
            defaultFrame: this._bossData.frame,
            createCallback: (boss) => {
                (boss as Boss).init(this._enemyBullets, this._bossData);
                this.listenToDeath(boss as Boss);
            }
        });

        this.scene!.registry.events.on(RegistryConstants.Events.PLAYER_SCORE_CHANGE, this.onScoreChanged, this);
        this.scene!.events.once(Scenes.Events.SHUTDOWN, () => {
            this.scene!.registry.events.off(RegistryConstants.Events.PLAYER_SCORE_CHANGE, this.onScoreChanged, this);
        });
    }

    public initOrbs() {
        this._orbs = this.scene!.physics.add.group({
            classType: Orb,
            defaultKey: 'sprites',
            defaultFrame: Orb.FRAME,
            createCallback: (orb) => {
                (orb as Orb).init(this._player);
            }
        });
        GroupUtils.populate(EntityManager.ORB_POOL_SIZE, this._orbs);
    }

    public initHealthPickups() {
        this._healthPickupData = (this.scene!.cache.json.get('progression') as ProgressionData).healthPickup;
        this._healthPickups = this.scene!.physics.add.group({
            classType: HealthPickup,
            defaultKey: 'sprites',
            defaultFrame: HealthPickup.FRAME,
            createCallback: (healthPickup) => {
                (healthPickup as HealthPickup).init();
            }
        });
    }

    public initGroupCollisions() {
        this.scene!.physics.add.overlap(this._playerBullets, this._enemies, (bullet, enemy) => {
            this.onPlayerBulletHit(bullet as Bullet, enemy as Enemy);
        });

        this.scene!.physics.add.overlap(this._playerBullets, this._bosses, (bullet, boss) => {
            this.onPlayerBulletHit(bullet as Bullet, boss as Boss);
        });

        this.scene!.physics.add.overlap(this._player, this._orbs, (player, orb) => {
            (orb as Orb).disable();
            this.scene!.sound.play(GameConstants.SoundKeys.PICKUP);
            (player as Player).collectXp((orb as Orb).xpValue);
        });

        this.scene!.physics.add.overlap(this._player, this._healthPickups, (player, healthPickup) => {
            (healthPickup as HealthPickup).disable();
            (player as Player).getComponent(Health)?.heal(this._healthPickupData.heal);
            this.scene!.sound.play(GameConstants.SoundKeys.PICKUP);
        });

        this.scene!.physics.add.overlap(this._player, this._bosses, (player) => {
            (player as Player).getComponent(Health)?.damage(EntityManager.BOSS_CONTACT_DAMAGE);

            this.scene?.cameras.main.shake(100, 0.03);
        });

        this.scene!.physics.add.overlap(this._player, this._enemyBullets, (player, bullet) => {
            (bullet as Bullet).disable();
            (player as Player).getComponent(Health)?.damage((bullet as Bullet).damage);

            this.scene?.cameras.main.shake(100, 0.01);
        });

        this.scene!.physics.add.overlap(this._player, this._enemies, (player, enemy) => {
            const enemyHealth = (enemy as Enemy).getComponent(Health);
            enemyHealth?.damage(enemyHealth?.max);

            const playerHealth = (player as Player).getComponent(Health);
            playerHealth?.damage(1);

            this.scene?.cameras.main.shake(100, 0.03);
        });
    }

    private listenToDeath(enemy: Enemy | Boss) {
        enemy.getComponent(Health)?.on(Health.DEATH_EVENT, () => this.onEnemyKilled(enemy));
    }

    private onEnemyKilled(enemy: Enemy | Boss) {
        const scoreMultiplier = this._player.getComponent(PlayerStats)?.get('scoreMultiplier') ?? 1;
        this.scene!.registry.inc(RegistryConstants.Keys.PLAYER_SCORE, Math.round(enemy.reward.score * scoreMultiplier));
        this.spawnOrb(enemy.x, enemy.y, enemy.reward.xp);
        this.trySpawnHealthPickup(enemy.x, enemy.y);
        this.scene!.sound.play(GameConstants.SoundKeys.EXPLOSION);
    }

    private trySpawnHealthPickup(x: number, y: number) {
        if (Math.random() >= this._healthPickupData.dropChance) return;

        const healthPickup = this._healthPickups.get() as HealthPickup;
        if (!healthPickup) return;

        healthPickup.enable(x, y);
    }

    private spawnOrb(x: number, y: number, xpValue: number) {
        const orb = this._orbs.get() as Orb;
        if (!orb) return;

        orb.enable(x, y, xpValue);
    }

    private onPlayerBulletHit(bullet: Bullet, target: Entity) {
        bullet.disable();
        target.getComponent(Health)?.damage(bullet.damage);
    }

    private onScoreChanged(_: any, score: number) {
        if (score < this._nextBossScore) return;

        this._nextBossScore += this._bossData.spawn.everyScore;
        this.spawnBoss();
    }

    // Also called by the B debug key
    public spawnBoss() {
        // Null when the previous boss is still alive
        const boss = this._bosses.get() as Boss;
        if (!boss) return;

        boss.enable(this.scene!.cameras.main.centerX, -boss.displayHeight, this._bossSpawnCount);
        this._bossSpawnCount++;
        this.scene!.sound.play(GameConstants.SoundKeys.BOSS_HIT);
    }

    // 1 at the start, then increasePerLevel more every everyScore points
    private getDifficulty(): number {
        const difficultyData = this._enemiesData.difficulty;
        const score: number = this.scene!.registry.get(RegistryConstants.Keys.PLAYER_SCORE) ?? 0;
        const level: number = Math.floor(score / difficultyData.everyScore);

        return 1 + level * difficultyData.increasePerLevel;
    }

    // The delay shrinks with the difficulty and with the traffic buff
    private scheduleNextEnemy() {
        const delay: number = this._enemiesData.spawn.delay / (this.getDifficulty() * this.getSpawnRate());
        this.scene!.time.delayedCall(delay, () => {
            this.spawnEnemy();
            this.scheduleNextEnemy();
        });
    }

    private getSpawnRate(): number {
        return this._player.getComponent(PlayerStats)?.get('spawnRate') ?? 1;
    }

    private spawnEnemy() {
        if (this._enemies.countActive(true) >= Math.round(this._enemiesData.spawn.maxActive * this.getSpawnRate())) {
            return;
        }

        const enemy = this._enemies.get() as Enemy;
        if (!enemy) {
            return;
        }

        const type = Phaser.Utils.Array.GetRandom(this._enemiesData.types) as EnemyTypeData;
        enemy.enable(Phaser.Math.Between(64, this.scene!.cameras.main.width - 64), 0, type, this.getDifficulty());

        this.game!.events.emit(GameConstants.Events.ENEMY_SPAWNED_EVENT, enemy);
    }
}
