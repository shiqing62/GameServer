const {send} = require("../utils/send");
const MsgIds = require("../MsgIds");
const {SkillType} = require("../schemas/generated/javascript/game/syncs/skill-type");
const {RandomPointData} = require("../schemas/generated/javascript/game/syncs/random-point-data");
const {ProjectileData} = require("../schemas/generated/javascript/game/syncs/projectile-data");
const {MeleeData} = require("../schemas/generated/javascript/game/syncs/melee-data");

function handle(ws,payload,players)
{
    const skillSyncsData = {
        attackerId:payload.attackerId(),
        targetId:payload.targetId(),
        skillId:payload.skillId(),
        skillType:payload.skillType(),
        skillData:{},
        scaleFactor:payload.scaleFactor()
    }

    switch (payload.skillType()){
        case SkillType.RandomPoint:
            const randomPointData = new RandomPointData();
            payload.skillData(randomPointData);
            skillSyncsData.skillData = {
                pos:{x:randomPointData.pos().x(),y:randomPointData.pos().y(),z:randomPointData.pos().z()}
            }
            break;
        case SkillType.Projectile:
            const projectileData = new ProjectileData();
            payload.skillData(projectileData);
            skillSyncsData.skillData = {
                startPos:{x: projectileData.startPos().x(),y: projectileData.startPos().y(),z: projectileData.startPos().z()},
                direction:{x: projectileData.direction().x(),y: projectileData.direction().y(),z: projectileData.direction().z()},
                speed: projectileData.speed(),
                lifeTime: projectileData.lifeTime()
            };
            break;
        case SkillType.Melee:
            const meleeData = new MeleeData();
            payload.skillData(meleeData);
            skillSyncsData.skillData = {
                startPos:{x: meleeData.startPos().x(),y: meleeData.startPos().y(),z: meleeData.startPos().z()},
                direction: {x: meleeData.direction().x(),y: meleeData.direction().y(),z: meleeData.direction().z()},
                lifeTime: meleeData.lifeTime()
            };
            break;
    }

    //TODO 筛选出视野内的玩家
    for (const [uid, player] of players.entries()) {
        if (uid !== skillSyncsData.attackerId)
        {
            send(player.ws,MsgIds.ServerPushId.SkillSyncs,skillSyncsData);
        }
    }
}

module.exports = {handle};