const {send} = require("../utils/send");
const MsgIds = require("../MsgIds");
const {PlayerStateFlags} = require("../utils/playerStateFlags");

function handle(ws,payload,players){
    const attackerId = payload.attackerId();
    const targetId = payload.targetId();
    const targetPlayer = players.get(targetId);

    if(!targetPlayer || !targetPlayer.ws)
    {
        console.warn(`Target player ${targetId} not found or not connected!`);
        return;
    }

    let actualDamage = payload.damage();
    if (actualDamage > 1000)
    {
        console.log(`作弊检测: 攻击者 ${attackerId} 对目标 ${targetId} 伤害异常 ${actualDamage}, 置为0`);
        actualDamage = 0;
    }

    // 服务器执行扣血逻辑
    // const oldHp = targetPlayer.hp;
    // targetPlayer.hp = Math.max(0,targetPlayer.hp - actualDamage);

    // 生成状态位
    // let state = 0;
    // if (targetPlayer.hp !== oldHp){
    //     state |= PlayerStateFlags.HP;
    // }

    // 构建状态同步数据(PlayerStateUpdate)--同步给视野内的其他敌人，改变客户端血条UI
    // const stateSyncsData = {
    //     uid: targetId,
    //     state: state,
    //     hp:targetPlayer.hp,
    // };

    // 构建伤害同步数据(DamageSyncsPush)--同步给受击者，自己在客户端执行扣血和受击显示
    const damageSyncsData={
        attackerId: attackerId,
        targetId: targetId,
        skillId: payload.skillId(),
        damage: actualDamage,
        pos: payload.pos(),
        hp: targetPlayer.hp
    }

    // 同步给受击者(状态同步--扣自身血量,播放受击特效)
    send(targetPlayer.ws,MsgIds.ServerPushId.DamageSyncs,{damageSyncsData: damageSyncsData});

    // // 同步给受击者视野内的敌人(状态同步--扣对应敌人的血量(PlayerStateUpdate))
    // for (const [otherUid,otherPlayer] of players.entries()){
    //     if (otherUid === targetId) continue;
    //     if (otherPlayer.roomId !== targetPlayer.roomId) continue;
    //     if (!otherPlayer.ws) continue;
    //
    //     //TODO 后期增加可视范围
    //     send(otherPlayer.ws,MsgIds.ServerPushId.PlayerStateSyncs,stateSyncsData);
    // }
}

module.exports = {handle};