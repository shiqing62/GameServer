const MsgIds = require('../MsgIds.js');
const { send } = require('../utils/send.js');

function handle(ws,payload,players){
    const uid = payload.uid();

    // 将该玩家从players中清理
    players.delete(uid);

    // 通知给相互视野内的其他玩家--该玩家退出游戏,清理视野内该玩家的实体
    for (const [otherUid,player] of players.entries()){
        if (otherUid === uid) continue;

        send(player.ws,MsgIds.ServerPushId.PlayerExit, {playerUId:uid});
    }
}

module.exports = {handle};