const MsgIds = require('../MsgIds.js');
const { send } = require('../utils/send.js');
const {DeBuffAction} = require("../schemas/generated/javascript/game/syncs/de-buff-action");
const {ParamValue} = require("../schemas/generated/javascript/game/common/param-value");
const {IntValue} = require("../schemas/generated/javascript/game/common/int-value");
const {UIntValue} = require("../schemas/generated/javascript/game/common/uint-value");
const {FloatValue} = require("../schemas/generated/javascript/game/common/float-value");
const {BoolValue} = require("../schemas/generated/javascript/game/common/bool-value");
const {Vec3Value} = require("../schemas/generated/javascript/game/common/vec3-value");
const {Float4Value} = require("../schemas/generated/javascript/game/common/float4-value");


function handle(ws,payload,players){
    const attackerId = payload.attackerId();
    const targetId = payload.targetId();
    const debuffId = payload.debuffId();
    const targetPlayer = players.get(targetId);

    if(!targetPlayer || !targetPlayer.ws)
    {
        console.warn(`Target player ${targetId} not found or not connected!`);
        return;
    }

    // 解析 params 数组
    const params = [];
    const len = payload.paramsLength();
    for (let i = 0; i < len; i++) {
        const p = payload.params(i);
        const pType = p.paramType();
        const pValueType = p.paramValueType();
        let actualValue = null;

        switch (pValueType)
        {
            case ParamValue.IntValue:
                actualValue = p.paramValue(new IntValue()).v();
                break;
            case ParamValue.UIntValue:
                actualValue = p.paramValue(new UIntValue()).v();
                break;
            case ParamValue.FloatValue:
                actualValue = p.paramValue(new FloatValue()).v();
                break;
            case ParamValue.BoolValue:
                actualValue = p.paramValue(new BoolValue()).v();
                break;
            case ParamValue.Vec3Value:
                const v3 = p.paramValue(new Vec3Value()).v();
                actualValue = {
                    x: v3.x(),
                    y: v3.y(),
                    z: v3.z(),
                };
                break;
            case ParamValue.Float4Value:
                const f4 = p.paramValue(new Float4Value()).v();
                actualValue = {
                    x: f4.x(),
                    y: f4.y(),
                    z: f4.z(),
                    w: f4.w(),
                };
                break;
            default:
                console.warn('Unknown ParamValue type: ', pValueType);
        }

        params.push({
            paramType: pType,
            paramValue: actualValue
        });
    }

    // 构建DeBuff数据
    const debuffSyncsData = {
        attackerId: attackerId,
        targetId: targetId,
        debuffId: debuffId,
        action: DeBuffAction.Apply,
        params:params,
    };

    //TODO 筛选出debuff接受者视野内的玩家
    for (const [_, player] of players.entries()) {
        send(player.ws,MsgIds.ServerPushId.DeBuffSyncs,debuffSyncsData);
    }
}

module.exports = {handle};
