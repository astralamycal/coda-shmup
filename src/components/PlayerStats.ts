import IComponent from "./IComponent.ts";
import {StatName} from "../gameData/BuffData.ts";

export default class PlayerStats extends Phaser.Events.EventEmitter implements IComponent {
    public enabled: boolean = true;

    public static readonly CHANGE_EVENT: string = 'change';

    // Multipliers start at 1, the magnet radius gives a small natural pull on the orbs (in px)
    private readonly _values: Record<StatName, number> = {
        damage: 1,
        fireRate: 1,
        xpGain: 1,
        scoreMultiplier: 1,
        bulletCount: 1,
        magnetRadius: 120
    };

    public get(stat: StatName): number {
        return this._values[stat];
    }

    public add(stat: StatName, amount: number) {
        if (!this.enabled)
            return;

        this._values[stat] += amount;
        this.emit(PlayerStats.CHANGE_EVENT);
    }
}
