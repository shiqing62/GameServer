const {send} = require("../utils/send.js");
const MsgIds = require('../MsgIds.js');

function weaponSyncsHandler(payload,players){
    const uid = payload.uid();
    if (!players.has(uid)) return;

    const player = players.get(uid);
    player.weapons = [];
    for (let i = 0; i < payload.weaponsLength(); i++) {
        // 将武器信息写入playerData中
        player.weapons.push(payload.weapons(i))
    }
    console.log("--->>player.weapons: "+player.weapons);
}

function passiveSyncsHandler(payload,players){
    const uid = payload.uid();
    if (!players.has(uid)) return;

    const player = players.get(uid);
    player.passives = [];
    for (let i = 0; i < payload.passivesLength(); i++) {
        // 将被动信息写入playerData中
        player.passives.push(payload.passives(i));
    }
    console.log("--->>player.passives: "+player.passives);
}

module.exports = {weaponSyncsHandler,passiveSyncsHandler};