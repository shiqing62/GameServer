// 抽象基类，所有具体的boss controller都继承此类并实现行为方法
// 这是一个轻量“数据+行为”容器，state的存取由manager驱动（manager调用controller.tick）

class BossControllerBase{
    constructor({bossId,id,chunk,position,pathfinder}) {
        // 基本标识与位置
        this.id = id || `boss_${Date.now()}`;
        this.bossId = bossId;
        this.chunk = chunk;
        this.position = position || {x: 0, y: 0, z: 0};
        this.direction = {x: 0, y: 0, z: 0};
        this.pathfinder = pathfinder;
        // 生命周期/状态
        this.bossState = null;
        this.lastStateKey = null;
        // 公共计时器
        this.nextAttackTime = 0;
        this.attackTimer = 0;
        this.spawnTimer = 0;
        // target
        this.targetPlayer = null;
        // path related
        this.path = [];
        this.pathIndex = 0;
        this.pathUpdateTimer = 0;
        this.lastPlayerPos = null;
        this.allowedChunks = [];
    }

    async doSpawn(deltaTime){
        throw new Error('doSpawn not implemented');
    }

    async doIdle(deltaTime) {
        throw new Error('doIdle not implemented');
    }

    async doChase(deltaTime){
        throw new Error('doChase not implemented');
    }

    async doAttack(deltaTime){
        throw new Error('doAttack not implemented');
    }

    async doDead(deltaTime){
        throw new Error('doDead not implemented');
    }

    //--------------------------辅助方法：子类/manager可调用--------------------------//

    // 返回用于stateSyncs的简化状态对象
    getStateSnapshotForSync(skillId = 0){
        return {
            bossId: this.bossId,
            bossState: this.bossState,
            skillId: skillId
        };
    }

    // 返回用于位置/血量等实时snapshot
    getRealtimeSnapshot()
    {
        return {
            bossId: this.bossId,
            hp: this.hp,
            pos: this.position,
            direction: this.direction
        };
    }

    // 子类可override，实现自定义路径策略
    requestPathTo(targetPos) {
        if (!this.pathfinder || !this.position) return [];
        try {
            return this.pathfinder.findPath(this.position, targetPos) || [];
        } catch (e) {
            return [];
        }
    }

    // 设置allowedChunks
    setAllowedChunks(chunks){
        this.allowedChunks = chunks;
    }

    distanceTo(pos){
        const dx = (this.position.x - pos.x);
        const dz = (this.position.z - pos.z);
        return Math.sqrt(dx * dx + dz * dz);
    }

    // 子类可实现该方法用来接收外部造成的伤害
    takeDamage(amount){
        this.hp = Math.max(0,(this.hp || 0) - amount);
        if (this.hp <= 0){
            this.bossState = this.BossStateEnum.Dead;
        }
    }

    // 子类可引用统一的枚举
    setEnums({BossStateEnum}){
        this.BossStateEnum = BossStateEnum;
    }

    /**
     * 平滑旋转插值（避免瞬间转向）
     * @param {number} targetX
     * @param {number} targetZ
     * @param {number} deltaTime
     */
    smoothRotate(targetX,targetZ,deltaTime){
        const rotSpeed = 10.0; // 转身速度 (数值越大转得越快)
        const curX = this.direction.x;
        const curZ = this.direction.z;

        // 计算目标角度
        const targetAngle = Math.atan2(targetX, targetZ);
        const currentAngle = Math.atan2(curX, curZ);

        // 角度差（保持 -π ~ π）
        let deltaAngle = targetAngle - currentAngle;
        if (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
        if (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;

        // 插值旋转
        const newAngle = currentAngle + deltaAngle * Math.min(1, (deltaTime / 1000) * rotSpeed);
        this.direction.x = Math.sin(newAngle);
        this.direction.z = Math.cos(newAngle);
    }
}

module.exports = {BossControllerBase};