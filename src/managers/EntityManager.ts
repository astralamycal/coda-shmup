import {GameObjects, Plugins, Physics, Scene, Scenes} from "phaser";
import Health from "../components/Health.ts";
import Bullet from "../entities/Bullet.ts";
import Enemy from "../entities/Enemy.ts";
import Player from "../entities/Player.ts";
import GroupUtils from "../utils/GroupUtils.ts";
import GameConstants from "../GameConstants.ts";
import RegistryConstants from "../RegistryConstants.ts";

import Boss from "../entities/Boss.ts";
import Entity from "../entities/Entity.ts";
import {BossData} from "../gameData/BossData.ts";
import {EnemiesData} from "../gameData/EnemiesData.ts";

export default class EntityManager extends Plugins.ScenePlugin {
    public static readonly PLUGIN_KEY: string = 'EntityManager';
    public static readonly MAPPING_NAME: string = 'entityManager';
    private static readonly BOSS_CONTACT_DAMAGE: number = 1;

    // noinspection JSUnusedGlobalSymbols
    private readonly bulletGroupConfig = {
        classType: Bullet,
        maxSize: 256,
        runChildUpdate: true,
        createCallback: (bullet: GameObjects.GameObject) => {
            (bullet as Bullet).init();
        }
    }

    private _player: Player;
    private _playerBullets: Physics.Arcade.Group;
    private _enemies: Physics.Arcade.Group;
    private _enemyBullets: Physics.Arcade.Group;
    private _bosses: Physics.Arcade.Group;
    private _bossData: BossData;
    private _nextBossScore: number;

    constructor(scene: Scene, pluginManager: Plugins.PluginManager) {
        super(scene, pluginManager, EntityManager.PLUGIN_KEY);

        console.log("[EntityManager] Initialized");
    }

    destroy() {
        super.destroy();

        console.log("[EntityManager] Destroyed");
    }

    public initAndSpawnPlayer(): Player {
        this._playerBullets = this.scene!.physics.add.group(this.bulletGroupConfig);
        GroupUtils.populate(64, this._playerBullets);

        this._player = new Player(this.scene!, this.scene!.cameras.main.centerX, this.scene!.cameras.main.height - 128);
        this._player.init(this._playerBullets);

        console.log("[EntityManager] Player spawned");

        this.game!.events.emit(GameConstants.Events.PLAYER_SPAWNED_EVENT, this._player);

        return this._player;
    }

    public initEnemies(): Physics.Arcade.Group {
        this._enemyBullets = this.scene!.physics.add.group(this.bulletGroupConfig);
        GroupUtils.populate(256, this._enemyBullets);

        this._enemies = this.scene!.physics.add.group({
            classType: Enemy,
            defaultKey: 'sprites',
            defaultFrame: 'ufoRed',
            createCallback: (enemy) => {
                (enemy as Enemy).init(this._enemyBullets);
            }
        });

        // Spawn enemies indefinitely
        this.scene!.time.addEvent({
            delay: 1500,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });

        console.log("[EntityManager] Enemies initialized");

        return this._enemies;
    }

    public initBoss() {
        this._bossData = (this.scene!.cache.json.get('enemies') as EnemiesData).boss;
        this._nextBossScore = this._bossData.spawn.firstScore;

        // same one taken from pool at each spawn
        this._bosses = this.scene!.physics.add.group({
            classType: Boss,
            maxSize: 1,
            defaultKey: 'sprites',
            defaultFrame: this._bossData.frame,
            createCallback: (boss) => {
                (boss as Boss).init(this._enemyBullets, this._bossData);
            }
        });

        this.scene!.registry.events.on(RegistryConstants.Events.PLAYER_SCORE_CHANGE,
            this.onScoreChanged, this);
        
        this.scene!.events.once(Scenes.Events.SHUTDOWN, () => {
            this.scene!.registry.events.off(RegistryConstants.Events.PLAYER_SCORE_CHANGE,
            this.onScoreChanged, this);
        });
    }

    public initGroupCollisions() {
        this.scene!.physics.add.overlap(this._playerBullets, this._enemies, (bullet, enemy) => {
            this.onPlayerBulletHit(bullet as Bullet, enemy as Enemy);
        });

        this.scene!.physics.add.overlap(this._playerBullets, this._bosses, (bullet, boss) => {
            this.onPlayerBulletHit(bullet as Bullet, boss as Boss);
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
            this.scene!.registry.inc(RegistryConstants.Keys.PLAYER_SCORE);

            const enemyHealth = (enemy as Enemy).getComponent(Health);
            enemyHealth?.damage(enemyHealth?.max);

            const playerHealth = (player as Player).getComponent(Health);
            playerHealth?.damage(1);

            this.scene?.cameras.main.shake(100, 0.03);
        });

        console.log("[EntityManager] Group collisions initialized");
    }

    private onPlayerBulletHit(bullet: Bullet, target: Entity) {
        this.scene!.registry.inc(RegistryConstants.Keys.PLAYER_SCORE);
        bullet.disable();
        target.getComponent(Health)?.damage(bullet.damage);
    }

    private onScoreChanged(_: any, score: number) {
        if (score < this._nextBossScore)
            return;
        
        this._nextBossScore += this._bossData.spawn.everyScore;
        this.spawnBoss();
    }
    
    private spawnBoss() {
        // Null when previous boss alive
        const boss = this._bosses.get() as Boss;
        if (!boss)
        return;
        boss.enable(this.scene!.cameras.main.centerX, -boss.displayHeight);
    }

    private spawnEnemy() {
        if (this._enemies.countActive(true) >= 5) {
            return;
        }

        const enemy = this._enemies.get() as Enemy;
        if (!enemy) {
            return;
        }

        enemy.enable(Phaser.Math.Between(64, this.scene!.cameras.main.width - 64), 0);

        this.game!.events.emit(GameConstants.Events.ENEMY_SPAWNED_EVENT, enemy);

        console.log("[EntityManager] Enemy spawned");
    }
}