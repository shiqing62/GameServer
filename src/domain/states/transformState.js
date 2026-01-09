/**
 * 玩家位姿（坐标 & 朝向）
 */
const float3 = require('../../../generated/javascript/game/common/float3.js');

class TransformState {
    constructor() {
        this.pos = new float3(0, 0, 0);
        this.dir = new float3(0, 0, 0);
    }
}

module.exports = TransformState;