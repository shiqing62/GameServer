const {send} = require("../utils/send");
const MsgIds = require("../MsgIds");
const {PlayerStateFlags} = require("../utils/playerStateFlags");

function handle(ws,payload,players){
    const uid = payload.uid();
    const targetPlayer = players.get(uid);
    if (!targetPlayer) return;
    const stateFlags = payload.state();
    const finalHp = payload.hp();   // 变化后的血量
    const maxHp = payload.maxHp();  // 血量的最大值，覆盖掉服务器的原本值
    const finalLevel = payload.level();

    if (stateFlags & PlayerStateFlags.HP){
        // 服务器执行扣血/回血逻辑
        targetPlayer.hp = finalHp;
        targetPlayer.maxHp = maxHp;
    }
    if (stateFlags & PlayerStateFlags.LEVEL){
        // 服务器执行等级变更逻辑
        targetPlayer.level = finalLevel;
    }

    const stateSyncsData = {
        uid: uid,
        stateFlags: stateFlags,
        hp: targetPlayer.hp,
        maxHp: targetPlayer.maxHp,
        level: targetPlayer.level
    };

    // 将数据同步响应给自己
    send(ws,MsgIds.ServerPushId.PlayerStateSyncs,stateSyncsData);

    // 将数据同步给视野内的玩家
    for (const [otherUid,otherPlayer] of players.entries()){
        if (otherUid === uid) continue;
        if (otherPlayer.roomId !== targetPlayer.roomId) continue;
        if (!otherPlayer.ws) continue;

        //TODO 后期增加可视范围
        send(otherPlayer.ws,MsgIds.ServerPushId.PlayerStateSyncs,stateSyncsData);
    }
}

module.exports = {handle};