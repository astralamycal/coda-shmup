import IComponent from "./IComponent.ts";
import {ProgressionData} from "../gameData/ProgressionData.ts";

export default class Experience extends Phaser.Events.EventEmitter implements IComponent {
    public enabled: boolean = true;

    public static readonly CHANGE_EVENT: string = 'change';
    public static readonly LEVEL_UP_EVENT: string = 'levelUp';

    private readonly _data: ProgressionData;
    private _level: number = 1;
    private _current: number = 0;
    private _required: number;

    public get level(): number {
        return this._level;
    }

    public constructor(data: ProgressionData) {
        super();

        this._data = data;
        this._required = data.firstLevelXp;
    }

    public add(amount: number) {
        if (!this.enabled || amount <= 0)
            return;

        this._current += amount;
        if (this._current >= this._required)
            this.levelUp();

        this.emit(Experience.CHANGE_EVENT, this._current, this._required);
    }

    private levelUp() {
        // Keep the extra XP for the next level
        this._current -= this._required;
        this._required = Math.round(this._required * this._data.levelXpGrowth);
        this._level++;

        this.emit(Experience.LEVEL_UP_EVENT, this._level);
    }
}
