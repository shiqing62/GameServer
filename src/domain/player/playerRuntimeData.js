/**
 * 玩家局内运行时数据
 */
const CombatState = require('../states/combatState.js');
const TransformState = require('../states/transformState.js');
const ProgressState = require('../states/progressState.js');

class PlayerRuntimeData{
    constructor(uid) {
        this.uid = uid;

        // 运行时数据，不持久化
        this.ws = null;

        // 场景状态
        this.inWorld = false;
        this.sceneId = null;
        this.characterId = null;

        // 局内状态：战斗、位姿、排行
        this.combat = new CombatState();
        this.transform = new TransformState();
        this.progress = new ProgressState();
    }
}

module.exports = PlayerRuntimeData;