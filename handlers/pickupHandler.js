const MsgIds = require('../MsgIds.js');
const {send} = require('../utils/send.js');


function handle(ws,payload,players){
    const uid = payload.uid();
    const itemId = payload.itemId();
    const instanceId = payload.instanceId();

    const pickupResponseData = {
        itemId: itemId,
        instanceId: instanceId,
    };

    const pickupPushData = {
        uid: uid,
        itemId: itemId,
        instanceId: instanceId,
    };

    // 通知给拾取者本人-->>添加道具
    send(ws,MsgIds.ResponseId.PickupDropItem,pickupResponseData);

    // 通知给房间内其他人-->>销毁道具
    for (const [otherUid,player] of players.entries()){
        if (otherUid === uid) continue;
        send(player.ws,MsgIds.ServerPushId.PickupDropItem,pickupPushData);
    }
}

module.exports = {handle};