const rankSyncsHandler = require("../handlers/rankSyncsHandler.js");

class RankManager {
    constructor(players) {
        this.players = players;
        this.killRank = new Map();  // 击杀榜(key: uid, value: totalKillCount)
        this.pushInvertal = 2000;   // 2000ms同步一次
        // 创建内部定时器
        this.startPushTimer();
    }

    /**
     * 内部自动定时推送排行榜
     */
    startPushTimer() {
        setInterval(() => {
            this.killRankPush();
        }, this.pushInvertal);
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

        // 获取排名
        const ranking = this.getRanking(uid);

       // 构建请求者的排名信息
        const rankInfo = {
            uid: uid,
            ranking: ranking,
            totalKills: newKills
        }
        // 将请求者的排名信息，总击杀数返回给请求者
        rankSyncsHandler.killRankSyncs(rankInfo,this.players.get(uid).ws);
    }

    /**
     * 将最新的击杀榜推送给客户端(每2s推送一次)
     */
    killRankPush() {
        // 间隔时间到
        const killRank = this.getTopKillRank();
        if (killRank.length === 0) return;

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

    /**
     * 获取指定 uid 在当前 killRank 中的排名
     * @param uid
     * @returns {number|null} ranking 若不在榜中返回 -1
     */
    getRanking(uid) {
        if(!this.killRank.has(uid)) return -1;

        const sorted = [...this.killRank.entries()].sort((a,b) => b[1] - a[1]);
        const index = sorted.findIndex((k) => k === uid);

        return index >= 0 ? index + 1 : -1;
    }

    /**
     * 当玩家死亡或者退出游戏时，清除在排行榜中的记录
     * @param uid
     */
    clearKillRankEntry(uid){
        if (this.killRank.has(uid)){
            this.killRank.delete(uid);
            // 立即同步下去
            this.killRankPush();
        }
    }
}

module.exports = {RankManager};