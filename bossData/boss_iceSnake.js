// boss-冰蛇

const {BossControllerBase} = require('./bossControllerBase.js');
const orbitDistance = 10;   // 周旋距离
const rePathTime = 2000;
const rePathDistance = 3;

class BossIceSnake extends BossControllerBase{
    constructor(options) {
        super(options);
        // boss配置信息
        this.cfg = {
            bossId: 103,
            maxHp: 10000,
            chaseRange: {x: 1600, y: 900},
            moveSpeed: 5.5,
            spawnDuration: 1.083,
            skillList:[
                {
                    // 撕咬
                    skillId: 1031,
                    skillDamage: 20,
                    castRange: 4,
                    coolDown: 2.5,
                    duration: 0.833,
                    precastTime: 0.25,
                    weight: 50
                },
                {
                    // 远程攻击--投掷
                    skillId: 1032,
                    skillDamage: 20,
                    castRange: 4,
                    coolDown: 2.5,
                    duration: 0.833,
                    precastTime: 0.25,
                    weight: 50
                },
                {
                    // 持续喷
                    skillId: 1033,
                    skillDamage: 20,
                    castRange: 4,
                    coolDown: 2.5,
                    duration: 0.833,
                    precastTime: 0.25,
                    weight: 50
                },
                {
                    // 钻地下潜
                    skillId: 1034,
                    skillDamage: 20,
                    castRange: 4,
                    coolDown: 2.5,
                    duration: 0.833,
                    precastTime: 0.25,
                    weight: 50
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





    async doChase(deltaTime)
    {
        if (!this.targetPlayer || !this.targetPlayer.pos) return;

        const playerPos = this.targetPlayer.pos;
        const bossPos = this.position;
        const moveSpeed = this.moveSpeed;
        const chunkSize = (this.pathfinder && this.pathfinder.chunkSize) || 32;

        const chunk_x = Math.floor(bossPos.x / chunkSize);
        const chunk_y = Math.floor(bossPos.y / chunkSize);

        // 区域检查
        const isAllowed = this.allowedChunks.some(c => c.x === chunk_x && c.y === chunk_y);
        if (!isAllowed){
            console.log("[Boss] 超出活动范围，停止追击!");
            this.targetPlayer = null;
            this.path = [];
            return;
        }

        const rangeMinX = (this.chunk.x - 1) * chunkSize;
        const rangeMaxX = (this.chunk.x + 2) * chunkSize;
        const rangeMinZ = (this.chunk.y - 1) * chunkSize;
        const rangeMaxZ = (this.chunk.y + 2) * chunkSize;

        // 玩家是否超出范围
        if (playerPos.x < rangeMinX || playerPos.x > rangeMaxX || playerPos.z < rangeMinZ || playerPos.z > rangeMaxZ){
            console.log("[Boss] target out of range, clearing target!");
            this.targetPlayer = null;
            this.path = [];
            return;
        }

        // 计算距离
        const dxt = playerPos.x - bossPos.x;
        const dzt = playerPos.z - bossPos.z;
        const distToTarget = Math.sqrt(dxt * dxt + dzt * dzt) || 0.0001;

        // 停止追击-->>开始周旋
        if (distToTarget <= orbitDistance){
            // 开始周旋
            //todo 设定一个周旋范围，避免逻辑频繁切换

            return;
        }


        // 路径刷新
        this.pathUpdateTimer += deltaTime;
        if (!this.lastPlayerPos) this.lastPlayerPos = {...playerPos};
        const dxp = playerPos.x - this.lastPlayerPos.x;
        const dzp = playerPos.z - this.lastPlayerPos.z;
        const playerMoveDist = Math.sqrt((dxp * dxp + dzp * dzp));

        const needRePath = this.pathUpdateTimer > rePathTime || this.path.length === 0 || playerMoveDist > rePathDistance;
        if (needRePath){
            // 重新规划路径
            this.pathfinder.updateGridForChunk(chunk_x,chunk_y);
            this.path = this.pathfinder.findPath(bossPos,playerPos);
            this.pathIndex = 0;
            this.pathUpdateTimer = 0;
            this.lastPlayerPos = {...playerPos};
        }

        // 如果路径为空，直线朝玩家移动
        if (this.path.length === 0){
            const ddlen = Math.sqrt(dxt * dxt + dzt * dzt) || 0.0001;
            this.position.x += (dxt / ddlen) * moveSpeed * (deltaTime / 1000);
            this.position.z += (dzt / ddlen) * moveSpeed * (deltaTime / 1000);
            this.direction.x = dxt / ddlen;
            this.direction.z = dzt / ddlen;
            return;
        }

        // 路径跟随
        const targetNode = this.path[this.pathIndex];
        const dirX = targetNode.x - this.position.x;
        const dirZ = targetNode.z - this.position.z;
        const dist = Math.sqrt(dirX * dirX + dirZ * dirZ) || 0.0001;

        if (dist < 0.2){
            // 切换节点
            this.pathIndex++;
            if (this.pathIndex >= this.path.length){
                this.path = [];
            }

            const ddlen = Math.sqrt(dxt * dxt + dzt * dzt) || 0.0001;
            this.direction.x = dxt / ddlen;
            this.direction.z = dzt / ddlen;
            return;
        }

        // 沿路经前进
        const normX = dirX / dist;
        const normZ = dirZ / dist;
        this.position.x += normX * moveSpeed * (deltaTime / 1000);
        this.position.z += normZ * moveSpeed * (deltaTime / 1000);

        // 始终保持面向玩家
        const ddlen = Math.sqrt(dxt * dxt + dzt * dzt) || 0.0001;
        this.direction.x = dxt / ddlen;
        this.direction.z = dzt / ddlen;
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

    // 与玩家进行周旋
    doOrbit()
    {

    }

    // 周旋模式1--左右徘徊，寻找攻击机会
    orbitMode1()
    {

    }
}





chooseSKill(dist)
{

}