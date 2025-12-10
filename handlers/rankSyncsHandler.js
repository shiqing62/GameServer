const {send} = require("../utils/send.js");
const MsgIds = require('../MsgIds.js');

function killRankSyncs(payload,ws){
    // 构建同步消息
    const rankInfo = {
        uid: payload.uid,
        ranking: payload.ranking,
        totalKills: payload.totalKills
    };

    send(ws,MsgIds.ServerPushId.KillRankResponse,rankInfo);
}

// 击杀排行推送-->>前10名发生变化&&间隔时间到
function killRankPush(payload,players){
    // 构建推送消息
    const killRank = {
        killRank: payload.map(entry => ({
            uid: entry.uid,
            totalKills: entry.killCount,
        }))
    }
    // 广播给所有玩家
    for (const [_,player] of players.entries()){
        send(player.ws,MsgIds.ServerPushId.KillRankSyncs,killRank);
    }
}

module.exports = {killRankSyncs,killRankPush};