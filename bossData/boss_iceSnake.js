// boss-冰蛇

const {BossControllerBase} = require('./bossControllerBase.js');

class BossIceSnake extends BossControllerBase{
    constructor(options) {
        super(options);
        // boss配置信息
        this.cfg = {
            bossId: 103,
            maxHp: 10000,
            chaseRange: {x: 1600, y: 900},
            moveSpeed: 0,
            spawnDuration: 1.083,
            skillList:[
                {
                    // 撕咬
                    skillId: 1031,
                    skillDamage: 20,
                    castRange: 5,
                    coolDown: 2.5,
                    duration: 0.833,
                    precastTime: 0.25,
                    weight: 100
                },
                {
                    // 远程攻击--投掷
                    skillId: 1032,
                    skillDamage: 20,
                    castRange: 20,
                    coolDown: 2.5,
                    duration: 0.833,
                    precastTime: 0.25,
                    weight: 0
                },
                {
                    // 持续喷
                    skillId: 1033,
                    skillDamage: 20,
                    castRange: 20,
                    coolDown: 5,
                    duration: 3.083,
                    precastTime: 0.25,
                    weight: 0
                },
                {
                    // 钻地下潜
                    skillId: 1034,
                    skillDamage: 20,
                    castRange: 5,
                    coolDown: 10,
                    duration: 4.85,
                    precastTime: 0.25,
                    weight: 0
                }
            ],

        }

        // 当前属性
        this.hp = this.cfg.maxHp;
        this.chaseRange = this.cfg.chaseRange;
        this.chaseRadius = this.cfg.chaseRadius;
        this.moveSpeed = this.cfg.moveSpeed;
        this.spawnDuration = this.cfg.spawnDuration;
        this.skills = this.cfg.skillList;
        this.pendingSkill = null;
    }


    async doSpawn(deltaTime){
        if (this.spawnTimer === 0){
            // 第一次进入spawn，初始化，广播状态
            // manager负责实际的state sync 间隔广播，controller只更新自身数据
        }
        this.spawnTimer += (deltaTime / 1000);
        if (this.spawnTimer >= this.cfg.spawnDuration){
            this.spawnTimer = 0;
            this.bossState = this.BossStateEnum.Idle;
        }
    }

    async doIdle(deltaTime){

    }


    // 冰蛇无移动能力，朝向目标玩家
    async doChase(deltaTime)
    {
        if (!this.targetPlayer || !this.targetPlayer.pos) return;

        const playerPos = this.targetPlayer.pos;
        const bossPos = this.position;

        const dx = playerPos.x - bossPos.x;
        const dz = playerPos.z - bossPos.z;

        const distSq = dx * dx + dz * dz;
        if (distSq < 0.01) return;

        // 始终保持面向玩家
        const dist = Math.sqrt(distSq);
        this.direction.x = dx / dist;
        this.direction.z = dz / dist;
    }

    async doAttack(deltaTime)
    {
        if (!this.pendingSkill || !this.targetPlayer) return;

        const skill = this.pendingSkill;
        if (this.attackTimer === 0) {

        }

        this.attackTimer += (deltaTime / 1000);
        if (this.attackTimer > skill.duration)
        {
            // 攻击完成
            this.attackTimer = 0;
            // 伤害计算
            const damage = skill.skillDamage;
            this.pendingSkill = null;
            this.bossState = this.BossStateEnum.Idle;

            return {
                skillId: skill.skillId,
                damage: damage,
                targetUid: this.targetPlayer.uid,
            }
        }

        return null;
    }

    async doDead(deltaTime){

    }

    chooseSkill(distance){
        const skills = this.skills || [];
        const candidates = skills.filter(s => distance <= s.castRange);
        if (candidates.length === 0) return null;
        const totalWeight = candidates.reduce((sum, s) => sum + (s.weight || 1), 0);
        let r = Math.random() * totalWeight;
        for (const s of candidates){
            const w = s.weight || 1;
            if (r < w){
                return s;
            }
            r -= w;
        }
        return candidates[0];
    }
}

module.exports = {BossIceSnake};