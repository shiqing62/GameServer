//boss-石头人
const {BossControllerBase} = require('./bossControllerBase.js');
const stopDistance = 3.5;   // boss停止追击敌人的距离，避免贴脸
const rePathTime = 2000;    // 更新路径的最大时间
const rePathDistance = 3;   // 当目标玩家移动过多距离后，直接重新规划路径

class BossStoneGolem extends BossControllerBase{
    constructor(options) {
        super(options);
        // 该boss的配置信息
        this.cfg = {
            bossId: 101,
            maxHp: 5000,
            chaseRange: {x: 1600, y: 900},
            moveSpeed: 3.5,
            spawnDuration: 2,
            get chaseRadius(){
                return Math.sqrt(this.chaseRange.x * this.chaseRange.x + this.chaseRange.y * this.chaseRange.y) / 2;
            },
            skillList:[
                {
                    skillId: 1011,
                    skillDamage: 20,
                    castRange: 4,       // 释放距离
                    coolDown: 2.5,
                    duration: 2.067,
                    precastTime: 0.25,  // 技能前摇
                    weight: 50
                },
                {
                    skillId: 1012,
                    skillDamage: 20,
                    castRange: 4,
                    coolDown: 2.5,
                    duration: 1.867,
                    weight: 50
                },
                {
                    skillId: 1013,
                    effectId: 1013,
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

    async doIdle(deltaTime){

    }


    doChase(deltaTime) {
        if (!this.targetPlayer || !this.targetPlayer.pos) return;

        const playerPos = this.targetPlayer.pos;
        const bossPos = this.position;
        const moveSpeed = this.moveSpeed;
        const chunkSize = (this.pathfinder && this.pathfinder.chunkSize) || 32;

        const chunk_x = Math.floor(bossPos.x / chunkSize);
        const chunk_y = Math.floor(bossPos.z / chunkSize);

        // === 区域检查 ===
        const isAllowed = this.allowedChunks.some(c => c.x === chunk_x && c.y === chunk_y);
        if (!isAllowed) {
            console.log("[Boss] 超出活动范围，停止追击!");
            this.targetPlayer = null;
            this.path = [];
            return;
        }

        const rangeMinX = (this.chunk.x - 1) * chunkSize;
        const rangeMaxX = (this.chunk.x + 2) * chunkSize;
        const rangeMinZ = (this.chunk.y - 1) * chunkSize;
        const rangeMaxZ = (this.chunk.y + 2) * chunkSize;

        // === 玩家是否超出范围 ===
        if (playerPos.x < rangeMinX || playerPos.x > rangeMaxX || playerPos.z < rangeMinZ || playerPos.z > rangeMaxZ) {
            console.log("[Boss] target out of range, clearing target!");
            this.targetPlayer = null;
            this.path = [];
            return;
        }

        // === 距离计算 ===
        const dxt = playerPos.x - bossPos.x;
        const dzt = playerPos.z - bossPos.z;
        const distToTarget = Math.sqrt(dxt * dxt + dzt * dzt) || 0.0001;

        // === 停止追击条件 ===
        if (distToTarget <= stopDistance) {
            const ddlen = Math.sqrt(dxt * dxt + dzt * dzt) || 0.0001;
            this.direction.x = dxt / ddlen;
            this.direction.z = dzt / ddlen;
            return;
        }

        // === 路径刷新 ===
        this.pathUpdateTimer += deltaTime;
        if (!this.lastPlayerPos) this.lastPlayerPos = { ...playerPos };
        const dxp = playerPos.x - this.lastPlayerPos.x;
        const dzp = playerPos.z - this.lastPlayerPos.z;
        const playerMoveDist = Math.sqrt(dxp * dxp + dzp * dzp);

        const needRePath = this.pathUpdateTimer > rePathTime || this.path.length === 0 || playerMoveDist > rePathDistance;
        if (needRePath) {
            this.pathfinder.updateGridForChunk(chunk_x, chunk_y);
            this.path = this.pathfinder.findPath(bossPos, playerPos);
            this.pathIndex = 0;
            this.pathUpdateTimer = 0;
            this.lastPlayerPos = { ...playerPos };
        }

        // === 如果路径为空则直接朝玩家移动 ===
        if (this.path.length === 0) {
            const ddlen = Math.sqrt(dxt * dxt + dzt * dzt) || 0.0001;
            this.position.x += (dxt / ddlen) * moveSpeed * (deltaTime / 1000);
            this.position.z += (dzt / ddlen) * moveSpeed * (deltaTime / 1000);
            this.direction.x = dxt / ddlen;
            this.direction.z = dzt / ddlen;
            return;
        }

        // === 路径跟随 ===
        const targetNode = this.path[this.pathIndex];
        const dirX = targetNode.x - this.position.x;
        const dirZ = targetNode.z - this.position.z;
        const dist = Math.sqrt(dirX * dirX + dirZ * dirZ) || 0.0001;

        if (dist < 0.2) {
            this.pathIndex++;
            if (this.pathIndex >= this.path.length) {
                this.path = [];
            }
            // 每次节点切换时，立即转向玩家
            const ddlen = Math.sqrt(dxt * dxt + dzt * dzt) || 0.0001;
            this.direction.x = dxt / ddlen;
            this.direction.z = dzt / ddlen;
            return;
        }

        // === 沿路径前进 ===
        const normX = dirX / dist;
        const normZ = dirZ / dist;
        this.position.x += normX * moveSpeed * (deltaTime / 1000);
        this.position.z += normZ * moveSpeed * (deltaTime / 1000);

        // 始终保持面向玩家（覆盖路径方向）
        const ddlen = Math.sqrt(dxt * dxt + dzt * dzt) || 0.0001;
        this.direction.x = dxt / ddlen;
        this.direction.z = dzt / ddlen;
    }


    // 负责计时&最终伤害计算（伤害同步由manager触发）
    async doAttack(deltaTime){
        if (!this.pendingSkill || !this.targetPlayer) return;

        const skill = this.pendingSkill;
        if (this.attackTimer === 0){
            // manager负责同步，controller只负责计时
        }

        this.attackTimer += (deltaTime / 1000);
        if (this.attackTimer >= skill.duration){
            // 攻击完成
            this.attackTimer = 0;
            // 伤害计算，返回具体的伤害值由manager进行同步
            const damage = skill.skillDamage;
            // 清理pendingSkill，并返回idle状态
            this.pendingSkill = null;
            this.bossState = this.BossStateEnum.Idle;

            // 返回供manager同步的数据对象
            return {
                skillId: skill.skillId,
                damage: damage,
                targetUid: this.targetPlayer.uid,
            };
        }
        return null;
    }

    async doDead(deltaTime){

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

module.exports = {BossStoneGolem};