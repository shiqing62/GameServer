const {GMType} = require('../schemas/generated/javascript/game/gm/gmtype.js');
const {send} = require("../utils/send");
const MsgIds = require("../MsgIds");
const dropHandler = require('./dropHandler.js');
const {DropItemData} = require('../schemas/generated/javascript/game/gm/drop-item-data.js');

function handle(ws,payload,players){
    const gmType = payload.gmType();
    switch (gmType)
    {
        case GMType.DropItem:
            handleDropCmd(payload.gmData(new DropItemData()),players);
            break;
    }
}

function handleDropCmd(dropItemData,players){
    const itemId = dropItemData.itemId();
    const pos = dropItemData.pos();
    const instanceId = dropHandler.getNextInstanceId();
    // 构造一条dropItemCommand
    const dropData = {
        itemId: itemId,
        instanceId: instanceId,
        chunkX: -1,
        chunkY: -1,
        pos: {
            x: pos.x(),
            y: pos.y(),
            z: pos.z(),
        }
    };
    // 通知给全体玩家
    for (const [otherUid,player] of players.entries()){
        send(player.ws,MsgIds.ServerPushId.DropItem,dropData);
    }
}

module.exports = {handle};