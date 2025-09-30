const MsgIds = require('../MsgIds.js');
const {send} = require('../utils/send.js');
const {dropItems} = require('./dropHandler.js');

function handle(ws,payload,players){
    const uid = payload.uid();
    const itemId = payload.itemId();
    const instanceId = payload.instanceId();

    // 校验instanceId合法性
    if (!dropItems.has(instanceId)){
        console.warn(`拾取失败: instanceId:${instanceId} 不存在或已被拾取`);
        return;
    }
    const dropData = dropItems.get(instanceId);
    // 校验itemId是否匹配
    if (dropData.itemId !== itemId)
    {
        console.warn(`拾取失败: 玩家上报itemId:${itemId}, 实际itemId=${dropData.itemId}`);
        return;
    }
    // 移除掉落物
    dropItems.delete(instanceId);

    const pickupResponseData = {
        itemId: itemId,
        instanceId: instanceId,
    };
    // 通知给拾取者本人-->>添加道具
    send(ws,MsgIds.ResponseId.PickupDropItem,pickupResponseData);

    const pickupPushData = {
        uid: uid,
        itemId: itemId,
        instanceId: instanceId,
    };
    // 通知给房间内其他人-->>销毁道具
    for (const [otherUid,player] of players.entries()){
        if (otherUid === uid) continue;
        if (!player || !player.ws) continue;
        send(player.ws,MsgIds.ServerPushId.PickupDropItem,pickupPushData);
    }
}

module.exports = {handle};