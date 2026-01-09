/**
 * 玩家局内战斗相关的状态
 */

class CombatState {
    constructor() {
        this.level = 1;
        this.curHp = 100;
        this.maxHp = 100;
        this.weapons = [];
        this.passives = [];
    }

    isAlive() {
        return this.curHp > 0;
    }
}

module.exports = CombatState;