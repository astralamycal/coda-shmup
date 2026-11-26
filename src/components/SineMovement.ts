import Entity from "../entities/Entity.ts";
import {SineMovementData} from "../gameData/SineMovementData.ts";
import IComponent from "./IComponent.ts";

export default class SineMovement implements IComponent {
  public enabled: boolean = true;
  private readonly _data: SineMovementData;
  private _originX: number = 0;
  private _elapsedTime: number = 0;

  public constructor(data: SineMovementData) {
    this._data = data;
  }

  // called on entity reset
  public reset(originX: number) {
    this._originX = originX;
    this._elapsedTime = 0;
  }
  
  public move(entity: Entity, deltaTime: number) {
    if (!this.enabled) return;
    
    this._elapsedTime += deltaTime;
    entity.x = this._originX + Math.sin(this._elapsedTime *
    this._data.frequency) * this._data.amplitude;
    
    // go down until target height, then oscillate
    if (entity.y < this._data.targetY)
    entity.y += this._data.verticalSpeed * deltaTime;
  }
}