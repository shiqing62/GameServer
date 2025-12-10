const rankSyncsHandler = require("../handlers/rankSyncsHandler.js");

class RankManager {
    constructor(players) {
        this.players = players;
        this.killRank = new Map();  // 击杀榜(key: uid, value: totalKillCount)
    }


    /**
     * 更新击杀榜
     * @param payload
     */
    updateKillRank(payload){
        const uid = payload.uid();
        const killsDelta = payload.killsDelta();    // 固定间隔内的击杀数

        if (killsDelta <= 0){
            // 没有变化，无需更新
            return;
        }

        // 当前累计击杀数
        const oldKills = this.killRank.get(uid) || 0;
        // 新的总数
        const newKills = oldKills + killsDelta;
        // 写回排行榜
        this.killRank.set(uid,newKills);

       // 构建请求者的排名信息
        const rankInfo = {
            uid: uid,
            ranking: 1,
            totalKills: newKills
        }
        // 将请求者的排名信息，总击杀数返回给请求者
        rankSyncsHandler.killRankSyncs(rankInfo,this.players.get(uid).ws);

        // TODO 如果前10名的排名发生了变化 && 间隔时间到
        const killRank = this.getTopKillRank();
        rankSyncsHandler.killRankPush(killRank,this.players);
    }

    /**
     * 获取击杀榜的前N名
     * @param topN
     */
    getTopKillRank(topN = 10){
        return [...this.killRank.entries()]
            .sort((a,b) => b[1] - a[1])     // 按killCount倒序
            .slice(0,topN)                                                // 取前n名
            .map(([uid,killCount]) => ({uid,killCount}));
    }
}

module.exports = {RankManager};