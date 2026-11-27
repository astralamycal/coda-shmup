import {Plugins, Scene} from 'phaser';
import Health from '../components/Health.ts';
import PlayerStats from '../components/PlayerStats.ts';
import Player from '../entities/Player.ts';
import {BuffData} from '../gameData/BuffData.ts';

export default class BuffManager extends Plugins.ScenePlugin {
    public static readonly PLUGIN_KEY: string = 'BuffManager';
    public static readonly MAPPING_NAME: string = 'buffManager';

    constructor(scene: Scene, pluginManager: Plugins.PluginManager) {
        super(scene, pluginManager, BuffManager.PLUGIN_KEY);
    }

    public pickRandomBuffs(count: number, player: Player): BuffData[] {
        // filter() returns a new array: the one in the cache stays untouched by the shuffle
        const availableBuffs = (this.scene!.cache.json.get('buffs') as BuffData[]).filter(
            (buff: BuffData) => !this.isMaxed(buff, player)
        );

        return Phaser.Utils.Array.Shuffle(availableBuffs).slice(0, count);
    }

    private isMaxed(buff: BuffData, player: Player): boolean {
        if (buff.max === undefined || buff.stat === 'maxHealth') return false;

        return (player.getComponent(PlayerStats)?.get(buff.stat) ?? 0) >= buff.max;
    }

    public applyBuff(buff: BuffData, player: Player) {
        if (buff.stat === 'maxHealth') {
            player.getComponent(Health)?.increaseMax(buff.value);
            return;
        }

        player.getComponent(PlayerStats)?.add(buff.stat, buff.value);
    }
}
