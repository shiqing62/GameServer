const {BossState} = require("../schemas/generated/javascript/game/boss/boss-state.js");
const {send} = require("../utils/send");
const MsgIds = require("../MsgIds");

function stateSyncsHandle(payload,players)
{
    const bossState = payload.bossState;
    // 根据不同的state筛选player--spawn和dead为全体玩家,其他为chunk内的玩家
    let targetPlayers =[];
    switch (bossState)
    {
        // 出生时同步给全体玩家
        case BossState.Spawn:
            targetPlayers = Array.from(players.values());
            break;
        case BossState.Idle:
            targetPlayers = Array.from(players.values());
            break;
        case BossState.Chase:
            targetPlayers = Array.from(players.values());
            break;
        case BossState.Attack:
            targetPlayers = Array.from(players.values());
            break;
        case BossState.Dead:
            targetPlayers = Array.from(players.values());
            break;
    }

    const stateSyncs = {
        bossId: payload.bossId,
        bossState: bossState,
        skillId: payload.skillId,
    };

    console.log("--->>>boss都同步给哪些players: ",targetPlayers.length);
    for (const player of targetPlayers)
    {
        send(player.ws,MsgIds.ServerPushId.BossStateSyncs,stateSyncs);
    }
}

function snapshotSyncsHandle(payload,players){
    let targetPlayers =[];
    targetPlayers = Array.from(players.values());
    const snapshotSyncs = {
        bossId: payload.bossId,
        bossHp: payload.hp,
        bossPos: payload.pos,
        bossDirection: payload.direction,
    }
    for (const player of targetPlayers)
    {
        send(player.ws,MsgIds.ServerPushId.BossSnapshotSyncs,snapshotSyncs);
    }
}

// 同步boss对玩家的造成伤害
function damageToPlayerSyncsHandle(payload,players)
{
    const targetPlayerUId = payload.uid;
    const targetPlayer = players.get(targetPlayerUId);
    if (!targetPlayer)
    {
        console.warn("TargetPlayer 不存在, targetPlayerUId: ",targetPlayerUId);
        return;
    }

    const damage = payload.damage;
    const skillId = payload.skillId;

    const damageSyncs = {
        uid: targetPlayerUId,
        skillId: skillId,
        damage: damage
    }

    // 通知给目标玩家-->>玩家客户端发起playerStateSyncsReq,stateFlag = hp;
    send(targetPlayer.ws,MsgIds.ResponseId.TakeBossDamage,damageSyncs);
}

module.exports = {stateSyncsHandle,snapshotSyncsHandle,damageToPlayerSyncsHandle};