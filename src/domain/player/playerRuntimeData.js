/**
 * 玩家局内运行时数据
 */
class PlayerRuntimeData{
    constructor(uid) {
        this.uid = uid;

        // 运行时数据，不持久化
        this.ws = null;
    }
}

module.exports = PlayerRuntimeData;