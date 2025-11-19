// boss-龙
const {BossControllerBase} = require('./bossControllerBase.js');

class BossDragon extends BossControllerBase{
    constructor(options) {
        super(options);
        // 该boss的配置信息
        this.cfg = {
            bossId: 102,
            maxHp: 10000,
            chaseRange: {x: 1600, y: 900},
            moveSpeed: 5.5,
            spawnDuration: 1.9,
            get chaseRadius(){
                return Math.sqrt(this.chaseRange.x * this.chaseRange.x + this.chaseRange.y * this.chaseRange.y) / 2;
            },
            skillList:[
                {
                    // 拍
                    skillId: 1021,
                    skillDamage: 20,
                    castRange: 4,       // 释放距离
                    coolDown: 2.5,
                    duration: 2.067,
                    precastTime: 0.25,  // 技能前摇
                    weight: 50
                },
                {
                    // 甩尾
                    skillId: 1022,
                    skillDamage: 20,
                    castRange: 4,
                    coolDown: 2.5,
                    duration: 1.867,
                    weight: 50
                },
                {
                    // 火球
                    skillId: 1023,
                    skillDamage: 50,
                    castRange: 4,
                    coolDown: 5,
                    duration: 1.667,
                    weight: 200
                }
            ],
        };

        // 当前属性
        this.hp = this.cfg.maxHp;
        this.chaseRange = this.cfg.chaseRange;
        this.chaseRadius = this.cfg.chaseRadius;
        this.moveSpeed = this.cfg.moveSpeed;
        this.spawnDuration = this.cfg.spawnDuration;
        this.skills = this.cfg.skillList;
        this.pendingSkill = null;
    }


    // 控制spawn计时并在完成后将状态设置为idle
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

    async doChase(deltaTime)
    {
        // 如果路径长度超过20，起飞
        // 如果路径上有障碍物，跳跃


        // 设想：龙会飞跃障碍物，落地喷火
        if (!this.targetPlayer || !this.targetPlayer.pos) return;

        const playerPos = this.targetPlayer.pos;
        const bossPos = this.position;
        const moveSpeed = this.moveSpeed;

        this.position.x += moveSpeed * deltaTime / 1000;
        this.position.z += moveSpeed * deltaTime / 1000;
    }

    async doAttack(deltaTime){
        // 拍
        // 甩尾--锁定的目标玩家
        // 喷火球--锁定的目标玩家--追踪锁定型
        // 直线喷火--在周围的玩家里随机挑一个
        // 范围喷火
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


    // 从技能池中选择一个技能（基于距离与冷却）
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