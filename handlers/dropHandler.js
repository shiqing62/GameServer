const MsgIds = require('../MsgIds.js');
const {send} = require('../utils/send.js');
const {GAME_CONSTANTS} = require('../utils/GAME_CONSTANTS.js');
const mapHandler = require('../handlers/mapHandler.js');
const min_int = 1;
const max_int = 2147483647;     // 32位 int 最大值
let curInstanceId = min_int - 1;    // 初始为0,第一次返回1

// 掉落物品池,weight: 权重
const dropItemPool= [
    {id: 2001, name: "PU_FrostNova",weight: 100},
    {id: 2002, name: "PU_SpeedUP",weight: 100},
    {id: 2003, name: "PU_Rage",weight: 100},
    {id: 2004, name: "PU_Flash",weight: 100},
    {id: 2005, name: "PU_Shield",weight: 100},
    {id: 2006, name: "PU_Cleanse",weight: 100},
    {id: 2007, name: "PU_Magnet",weight: 100},
    {id: 2008, name: "PU_Lightning",weight: 100},
    {id: 2009, name: "PU_SwordDance",weight: 100},
    {id: 2010, name: "PU_SkyBoom",weight: 100},
    {id: 2011, name: "PU_TimeGap",weight: 100},
    {id: 2012, name: "PU_HealthZone",weight: 100},
    {id: 2013, name: "PU_MagicBeam",weight: 100},
]

function handle(players){
    //step1: 随机出一个道具id
    const itemId = getRandomItemId();
    //step2: 创建当前道具的instanceId
    const instanceId = getNextInstanceId();
    //step3: 随机出地块(x,y)在(0-20]之间随机,前开后闭
    const chunk_x = Math.floor(Math.random() * GAME_CONSTANTS.CHUNK_COUNT_X);
    const chunk_y = Math.floor(Math.random() * GAME_CONSTANTS.CHUNK_COUNT_Y);
    //step4: 根据地块随机出一个避开摆件的坐标
    // const pos = mapHandler.getRandomPos(chunk_x,chunk_y);
    const pos = {
        x: 60,
        y: 0,
        z: 80,
    };
    // 构建掉落物品数据
    const dropData = {
        itemId: itemId,
        instanceId: instanceId,
        chunkX: chunk_x,
        chunkY: chunk_y,
        pos: pos
    };
    // 通知给全体玩家
    for (const [otherUid,player] of players.entries()){
        send(player.ws,MsgIds.ServerPushId.DropItem,dropData);
    }
}

function getRandomItemId()
{
    const totalWeight = dropItemPool.reduce((sum,item) => sum + item.weight,0);
    let rnd = Math.random() * totalWeight;
    for (const item of dropItemPool){
        if (rnd < item.weight){
            return item.id;
        }
        rnd -= item.weight;
    }

    // 兜底
    return dropItemPool[0].id;
}

function getNextInstanceId() {
    if (curInstanceId >= max_int) {
        curInstanceId = min_int; // 到达上限就循环回1
    } else {
        curInstanceId++;
    }
    return curInstanceId;
}

module.exports = {handle,getNextInstanceId};