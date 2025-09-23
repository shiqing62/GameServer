const {send} = require("../utils/send");
const MsgIds = require("../MsgIds");
const {SkillType} = require("../schemas/generated/javascript/game/syncs/skill-type");
const {RandomPointData} = require("../schemas/generated/javascript/game/syncs/random-point-data");
const {ProjectileData} = require("../schemas/generated/javascript/game/syncs/projectile-data");
const {MeleeData} = require("../schemas/generated/javascript/game/syncs/melee-data");
const {AttachedData} = require("../schemas/generated/javascript/game/syncs/attached-data");
const {Param} = require("../schemas/generated/javascript/game/syncs/param");
const {ParamValue} = require("../schemas/generated/javascript/game/syncs/param-value");
const {IntValue} = require("../schemas/generated/javascript/game/syncs/int-value");
const {UIntValue} = require("../schemas/generated/javascript/game/syncs/uint-value");
const {FloatValue} = require("../schemas/generated/javascript/game/syncs/float-value");
const {BoolValue} = require("../schemas/generated/javascript/game/syncs/bool-value");
const {Vec3Value} = require("../schemas/generated/javascript/game/syncs/vec3-value");
const {Float4Value} = require("../schemas/generated/javascript/game/syncs/float4-value");

function handle(ws,payload,players)
{
    const skillSyncsData = {
        attackerId:payload.attackerId(),
        targetId:payload.targetId(),
        skillId:payload.skillId(),
        skillType:payload.skillType(),
        skillData:{},
        scaleFactor:payload.scaleFactor(),
        extraParams:[],
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
        case SkillType.Attached:
            const attachedData = new AttachedData();
            payload.skillData(attachedData);
            skillSyncsData.skillData = {
                anchorPos:{x: attachedData.anchorPos().x(),y: attachedData.anchorPos().y(),z: attachedData.anchorPos().z()},
                lifeTime: attachedData.lifeTime()
            };
            break;
    }

    // 读取 extraParams 向量
    const len = payload.extraParamsLength();
    for (let i = 0; i < len; i++) {
        const p = new Param();
        payload.extraParams(i, p);

        const pType = p.paramType();    // paramType 枚举值
        const pValueType = p.paramValueType();      // union的类型标识

        // 按照union类型读取
        let actualValue = null;
        switch (pValueType) {
            case ParamValue.IntValue:
                const intValue = new IntValue();
                p.paramValue(intValue);     // union -->> 填充IntValue对象
                actualValue = intValue.v();     // IntValue.v() 读值
                break;
            case ParamValue.UIntValue:
                const uintValue = new UIntValue();
                p.paramValue(uintValue);
                actualValue = uintValue.v();
                break;
            case ParamValue.FloatValue:
                const floatValue = new FloatValue();
                p.paramValue(floatValue);
                actualValue = floatValue.v();
                break;
            case ParamValue.BoolValue:
                const boolValue = new BoolValue();
                p.paramValue(boolValue);
                actualValue = !!boolValue.v();      // 转换为 boolean
                break;
            case ParamValue.Vec3Value:
                const vec3Value = new Vec3Value();
                p.paramValue(vec3Value);
                const vec = vec3Value.v();
                actualValue = {
                    x: vec.x(),
                    y: vec.y(),
                    z: vec.z(),
                }
                break;
            case ParamValue.Float4Value:
                const float4Value = new Float4Value();
                p.paramValue(float4Value);
                const float4 = float4Value.v();
                actualValue = {
                    x: float4.x(),
                    y: float4.y(),
                    z: float4.z(),
                    w: float4.w(),
                }
                break;
            default:
                console.warn('Unknown ParamValue type: ', pValueType);
        }

        skillSyncsData.extraParams.push({
            paramType: pType,
            paramValueType: pValueType,
            paramValue: actualValue
        });
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