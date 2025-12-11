const {GAME_CONSTANTS} = require("../utils/GAME_CONSTANTS");
const {send} = require("../utils/send");
const MsgIds = require("../MsgIds");

class PlayerManager{
    constructor(players) {
        this.players = players;
    }

    /**
     * 获得某个玩家视野范围之内的其他玩家list
     * @param player
     */
    getPlayersInView(player)
    {
        if (!player.ws || player.ws.readyState !== WebSocket.OPEN) return;

        const halfWidth = GAME_CONSTANTS.VIEW_RANGE_WIDTH / 2; // 宽的一半
        const halfHeight = GAME_CONSTANTS.VIEW_RANGE_HEIGHT / 2; // 高的一半
        // 当前玩家坐标
        const {x: px, z: pz} = player.pos;

        // 筛选视野范围内的玩家
        const visiblePlayers = Array.from(this.players.values().filter(p => {
            // 排除自己
            if (p.uid === player.uid) return false;
            // 比如同房间
            if (p.roomId !== player.roomId) return false;
            // 判断是否在可视范围内
            const dx = Math.abs(p.pos.x - px);
            const dz = Math.abs(p.pos.z - pz);
            return dx <= halfWidth && dz <= halfHeight;
        }))

        return visiblePlayers;
    }

    /**
     * 获取以某个点为中心,范围之内的所有player
     * @param pos 中心点
     * @param range 范围: range.x--范围宽 range.y--范围高
     * @returns {unknown[]} 范围之内的players
     */
    getPlayersInRange(pos,range)
    {
        const halfWidth = range.x / 2; // 宽的一半
        const halfHeight = range.y / 2; // 高的一半
        const {x: px, z: pz} = pos;

        const players = Array.from(this.players.values().filter(p => {
            const dx = Math.abs(p.pos.x - px);
            const dz = Math.abs(p.pos.z - pz);
            return dx <= halfWidth && dz <= halfHeight;
        }))

        return players;
    }

    /**
     * 通过uid查找playerData
     * @param payload
     */
    getPlayerByUid(payload) {
        const finderUid = payload.selfUid();
        const finder = this.players.get(finderUid);
        if (!finder) return;

        const targetUid = payload.targetUid();
        const target = this.players.get(targetUid) || null;

        // 构建所查找的玩家的数据
        const findResult = {
            isFind: target !== null,
            targetPlay: target,
        }

        // 返给查找者
        send(finder.ws,MsgIds.ServerPushId.GetPlayerResponse,findResult);
    }
}

module.exports = {PlayerManager};