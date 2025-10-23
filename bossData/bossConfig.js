/*
    @param: attackDamage - 普攻伤害
    @param: attackRange - 普攻范围
    @param: chaseRange - 找寻目标距离,超出则重新找寻目标{x: width, y: height}
    @param: lifeTime - lifeTime之后自动死亡,自动死亡不掉落或者掉落物品质下降
    @param: spawnDuration - 出生时长,期间不进入chase or attack状态,用于客户端做出生动画
 */
const BossConfig = {
    101:{
        bossId: 101,
        maxHp: 5000,
        moveSpeed: 3.5,
        chaseRange: {x: 1600, y: 900},
        lifeTime: 90,
        spawnDuration: 2,
        skillList: [
            {
                skillId: 1011,      // 普攻1
                effectId: 1011,
                skillDamage: 20,
                skillRange: 2,
                coolDown: 2.5,
                duration: 2.067,
                weight: 50
            }, {
                skillId: 1012,      // 普攻2
                effectId: 1012,
                skillDamage: 20,
                skillRange: 2,
                coolDown: 2.5,
                duration: 1.867,
                weight: 50
            }, {
                skillId: 1013,      // skill
                effectId: 1013,
                skillDamage: 50,
                skillRange: 2,
                coolDown: 5,
                duration: 1.667,
                weight: 80
            },
        ],
    },
}

module.exports = {BossConfig};