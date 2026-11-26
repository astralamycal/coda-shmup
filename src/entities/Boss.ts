import Entity from './Entity.ts';
import Health from "../components/Health.ts";
import SineMovement from "../components/SineMovement.ts";
import Weapon from "../components/Weapon.ts";
import {BossData} from "../gameData/BossData.ts";

export default class Boss extends Entity {
  private static readonly FACING_DOWN_ANGLE: number = 90;
  private static readonly HIT_FLASH_COLOR: number = 0xffffff;
  private static readonly HIT_FLASH_DURATION: number = 50;
  private _tint: number;
  private _shootTimerConfig: Phaser.Types.Time.TimerEventConfig;
  private _shootTimer: Phaser.Time.TimerEvent;

  public init(bulletsGroup: Phaser.Physics.Arcade.Group, data: BossData) {
    this.addComponent(new Health(data.health, this));
    this.addComponent(new SineMovement(data.movement));
    this.addComponent(new Weapon(bulletsGroup, data.weapon.bullet,
      data.weapon.bulletCount, data.weapon.spreadAngle));
    
    // boss reused from pool
    this.getComponent(Health)?.on(Health.CHANGE_EVENT,
      this.onHealthChanged, this);
    
    this._tint = Phaser.Display.Color.HexStringToColor(data.tint).color;
    this.setScale(data.scale);
    this.angle = Boss.FACING_DOWN_ANGLE;
    this.arcadeBody.setCircle(this.width / 2);
    this._shootTimerConfig = {
      delay: data.weapon.fireDelay,
      callback: this.shoot,
      callbackScope: this,
      loop: true
    };
    
    this._shootTimer = this.scene.time.addEvent(this._shootTimerConfig);
  }
  
  public enable(x: number, y: number) {
    this.enableBody(true, x, y, true, true);
    this.setTint(this._tint);
    this.getComponent(SineMovement)?.reset(x);
    this._shootTimer.reset(this._shootTimerConfig);
    
    // if boss reused from pool
    const health = this.getComponent(Health);
    health?.heal(health.max, false);
  }
  
  public disable() {
    this.disableBody(true, true);
    this._shootTimer.paused = true;
  }
  
  private onHealthChanged(current: number) {
    this.setTintFill(Boss.HIT_FLASH_COLOR);
    if (current === 0)
      this.disableBody();
      this.scene.time.delayedCall(Boss.HIT_FLASH_DURATION, () => {
        this.setTint(this._tint);
        if (current === 0)
          this.disable();
    });
  }
  
  private shoot() {
    this.getComponent(Weapon)?.shoot(this);
    this.scene.sound.play('sfx_laser2');
  }
  
  preUpdate(timeSinceLaunch: number, deltaTime: number) {
    super.preUpdate(timeSinceLaunch, deltaTime);
    this.getComponent(SineMovement)?.move(this, deltaTime);
  }
}