import {Plugins, Scene} from "phaser";
import Health from "../components/Health.ts";
import PlayerStats from "../components/PlayerStats.ts";
import Player from "../entities/Player.ts";
import {BuffData} from "../gameData/BuffData.ts";

export default class BuffManager extends Plugins.ScenePlugin {
    public static readonly PLUGIN_KEY: string = 'BuffManager';
    public static readonly MAPPING_NAME: string = 'buffManager';

    constructor(scene: Scene, pluginManager: Plugins.PluginManager) {
        super(scene, pluginManager, BuffManager.PLUGIN_KEY);
    }

    public pickRandomBuffs(count: number): BuffData[] {
        const buffs = this.scene!.cache.json.get('buffs') as BuffData[];

        // Shuffle a copy: the array in the cache must stay untouched
        return Phaser.Utils.Array.Shuffle([...buffs]).slice(0, count);
    }

    public applyBuff(buff: BuffData, player: Player) {
        if (buff.stat === 'maxHealth') {
            player.getComponent(Health)?.increaseMax(buff.value);
            return;
        }

        player.getComponent(PlayerStats)?.add(buff.stat, buff.value);
    }
}
