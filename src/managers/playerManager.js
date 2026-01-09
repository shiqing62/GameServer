/**
 * 玩家信息管理器：{level hp weapons...}
 */

const PlayerRuntimeData = require('../domain/player/playerRuntimeData.js');

class PlayerManager{
    constructor(ctx) {
        this.runtimePlayers = new Map();
        // 持久化仓库
        this.playerRepository = ctx.getRepository('player');
    }

    /**
     * 从持久化数据加载数据，创建runtime data
     */
    async createRuntimePlayer(uid){
        let runtime = this.runtimePlayers.get(uid);
        if (runtime){
            return runtime;
        }

        const profile = await this.playerRepository.getByUid(uid);
        if (!profile){
            return null;
        }

        runtime = new PlayerRuntimeData(uid)
        this.runtimePlayers.set(uid,runtime);
        return runtime;
    }

    /**
     * 获取运行时玩家
     */
    get(uid){
        return this.runtimePlayers.get(uid) || null;
    }

    /**
     * 绑定websocket
     */
    bindSocket(uid,ws){
        const player = this.get(uid);
        if (!player){
            return null;
        }

        player.ws = ws;
        return player;
    }

    /**
     * 断线、挂机等状态
     */
    onDisconnect(uid){
        const player = this.get(uid);
        if (!player){
            return;
        }

        player.ws = null;
    }

    /**
     * 彻底离线，结束游戏 or 自主退出
     */
    async destroyRuntime(uid){
        const player = this.get(uid);
        if (!player){
            return;
        }

        //todo 必要时保存持久化数据
        this.runtimePlayers.delete(uid);
    }

    hasPlayer(uid) {
        return this.runtimePlayers.has(uid);
    }


}

module.exports = PlayerManager;