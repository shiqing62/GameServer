const {send} = require("../utils/send.js");
const MsgIds = require('../MsgIds.js');

function killRankSyncs(payload,players){

    // 构建同步消息
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

module.exports = {killRankSyncs};