const bossSyncsHandler = require('../handlers/bossSyncsHandler.js');
const mapHandler = require('../handlers/mapHandler.js');
const {BossConfig} = require('../bossData/bossConfig.js');
const {GAME_CONSTANTS} = require("../utils/GAME_CONSTANTS");
const {BossState} = require('../schemas/generated/javascript/game/boss/boss-state.js');

class BossManager {
    constructor(players,playerManager) {
        this.players = players;
        this.activeBoss = null;
        this.playerManager = playerManager;
        this.startTickLoop();
    }

    spawnBoss() {
        if (this.activeBoss) {
            console.warn("[BossManager] Boss already exists");
            return;
        }

        // 随机出chunkX,chunkY
        // const chunk_x = Math.floor(Math.random() * GAME_CONSTANTS.CHUNK_COUNT_X);
        // const chunk_y = Math.floor(Math.random() * GAME_CONSTANTS.CHUNK_COUNT_Y);
        const chunk_x = 1;
        const chunk_y = 1;
        const spawnPos = mapHandler.getRandomPos(chunk_x, chunk_y);
        // 随机出一个boss
        const bossId = 101;
        const cfg = BossConfig[bossId];
        if (!cfg) {
            console.error(`[BossManager] Invalid bossId: ${bossId}`);
            return;
        }

        const boss = {
            id: `boss_${Date.now()}`,
            bossId: bossId,
            chunk: {x: chunk_x, y: chunk_y},
            position: spawnPos,
            direction: {x: 0, y: 0, z: 0},
            hp: cfg.maxHp,
            targetPlayer: null,
            nextAttackTime: 0,          // 攻击冷却,技能与普攻共享，倒计时结束才可以进行下一次
            attackTimer: 0,             // 攻击计时,到时切换到chase
            bossState: BossState.Spawn,
            pendingSkill: null,         // 即将要释放的技能
            chaseRange: cfg.chaseRange, // 追击距离,在此范围之内才可以被锁定为targetPlayer
            skills: cfg.skillList,
            moveSpeed: cfg.moveSpeed,
            spawnDuration: cfg.spawnDuration,
            spawnTimer: 0,              // 出生计时,到时切换至idle
            lastState: null,
        };
        this.activeBoss = boss;

        this.handleBossState();
    }

    startTickLoop(){
        setInterval(()=>{
            this.update(100);
        },100);
    }

    update(deltaTime) {
        const boss = this.activeBoss;
        if (!boss || boss.bossState === BossState.Dead) {
            return;
        }

        if (boss.bossState === BossState.Spawn)
        {
            this.handleBossState(deltaTime);
            return;
        }

        // 判断死亡
        if (boss.hp <= 0) {
            boss.bossState = BossState.Dead;
            this.handleBossState();
            return;
        }

        // 更新冷却计时
        if (boss.nextAttackTime > 0) {
            boss.nextAttackTime -= deltaTime;
        }

        // 如果boss在攻击中,不执行后续逻辑(直至攻击结束)
        if (boss.bossState === BossState.Attack) {
            this.handleBossState(deltaTime);
            return;
        }

        // 如果当前有目标,先判断距离
        if (boss.targetPlayer) {
            const target = boss.targetPlayer;
            // 检查目标是否仍然存在、有效
            if (!target) {
                boss.targetPlayer = null;
                boss.bossState = BossState.Idle;
            } else {
                const dist = this.getDistance(boss.position, target.pos);
                // 冷却就绪,尝试从技能池中选择一个可用技能
                if (boss.nextAttackTime <= 0) {
                    console.log("--->>>dist: ",dist);
                    const skill = this.chooseSkill(boss,dist);
                    if (skill)
                    {
                        // 找到了可释放的技能,进入攻击处理
                        boss.bossState = BossState.Attack;
                        // 确定即将释放的技能
                        boss.pendingSkill = skill;
                        boss.nextAttackTime = skill.coolDown * 1000;    // 代码逻辑中的单位为/ms,配置表里的cd单位时/s
                        this.handleBossState(deltaTime);
                        return;
                    }
                }
                // 否则继续追击
                if (dist <= boss.chaseRange) {
                    boss.bossState = BossState.Chase;
                }
                // 超出追击范围则放弃目标
                else {
                    boss.targetPlayer = null;
                    boss.bossState = BossState.Idle;
                }
            }
        }

        // 没有目标则尝试寻找最近的玩家
        if (!boss.targetPlayer) {
            const targetPlayer = this.findNearestPlayer(boss.chaseRange);
            if (targetPlayer) {
                boss.targetPlayer = targetPlayer;
                boss.bossState = BossState.Chase;

                //TODO 通知给被锁定的玩家，客户端做出预警等表现
            }
            else {
                boss.bossState = BossState.Idle;
            }
        }

        // 最后指向当前状态的逻辑
        this.handleBossState(deltaTime);
        // 同步boss实时信息
        this.snapshotSyncs();
    }

    handleBossState(deltaTime = 0) {
        switch (this.activeBoss.bossState) {
            case BossState.Spawn:
                this.doSpawn(deltaTime);
                break;
            case BossState.Idle:
                this.doIdle();
                break;
            case BossState.Chase:
                this.doChase(deltaTime);
                break;
            case BossState.Attack:
                this.doAttack(deltaTime);
                break;
            case BossState.Dead:
                this.doDead();
                break;
        }
    }

    doSpawn(deltaTime)
    {
        const boss = this.activeBoss;
        if (!boss) return;

        if (boss.spawnTimer === 0)
        {
            this.stateSyncs();
        }

        // 出生计时
        boss.spawnTimer += deltaTime / 1000;
        if (boss.spawnTimer >= boss.spawnDuration)
        {
            boss.bossState = BossState.Idle;
            this.handleBossState();
        }
    }

    doIdle() {
        // 告知客户端boss进入idle
        const boss = this.activeBoss;
        if (!boss) return;

        this.stateSyncs();
    }

    doChase(deltaTime) {
        const boss = this.activeBoss;
        if (!boss || !boss.targetPlayer) return;

        // 追击敌人
        const targetPlayer = boss.targetPlayer;
        const playerPos = targetPlayer.pos;
        const bossPos = boss.position;

        if (!playerPos || !bossPos) return;

        const moveSpeed = boss.moveSpeed;
        // 计算朝向向量
        const dirX = playerPos.x - bossPos.x;
        const dirZ = playerPos.z - bossPos.z;
        const distance = Math.sqrt(dirX * dirX + dirZ * dirZ);
        if (distance < 0.001) return;

        // 保持一定距离,避免贴脸重叠
        const minDistance = 5.0;
        if (distance < minDistance){
            // 停止前进,仅调整朝向
            const normX = dirX/distance;
            const normZ = dirZ/distance;
            boss.direction.x = normX;
            boss.direction.z = normZ;

            return;
        }

        // 归一化方向
        const normX = dirX / distance;
        const normZ = dirZ / distance;

        // 计算位移
        const moveX = normX * moveSpeed * (deltaTime / 1000);
        const moveZ = normZ * moveSpeed * (deltaTime / 1000);

        // 更新boss的位置
        boss.position.x += moveX;
        boss.position.z += moveZ;
        // 更新boss的朝向
        boss.direction.x = normX;
        boss.direction.z = normZ;

        // 同步状态
        this.stateSyncs();
    }

    doAttack(deltaTime) {
        const boss = this.activeBoss;
        if (!boss || !boss.pendingSkill || !boss.targetPlayer) return;

        const skill = boss.pendingSkill;
        const targetPlayer = boss.targetPlayer;

        if (boss.attackTimer === 0)     // 刚从chase切换到attack
        {
            // step1: 向客户端发送攻击指令，客户端执行攻击动作
            // 同步状态
            this.stateSyncs(skill.skillId);
        }

        // 攻击时间计时
        boss.attackTimer += deltaTime / 1000;
        if (boss.attackTimer >= skill.duration)
        {
            // 攻击结束,重置状态并将伤害同步给targetPlayer
            boss.attackTimer = 0;
            // 计算伤害
            const damage = skill.skillDamage;
            // 检查目标是否存活
            if (targetPlayer && targetPlayer.hp > 0){
                //TODO 处理伤害---写一个playerManager????
                // 将伤害同步给客户端
            }

            // 攻击完成后回到idle状态---boss再次锁定目标
            boss.pendingSkill = null;
            boss.bossState = BossState.Idle;
            this.stateSyncs();
        }
    }

    doDead() {

    }

    stateSyncs(skillId = 0)
    {
        const boss = this.activeBoss;
        if (!boss) return;

        // 防止重复广播相同的状态
        const key = `${boss.bossState}_${skillId}`;
        if (boss.lastState === key) return;
        boss.lastState = key;

        // 同步状态
        const stateSyncsData = {
            bossId: boss.bossId,
            bossState: boss.bossState,
            skillId: skillId,
        }
        bossSyncsHandler.stateSyncsHandle(stateSyncsData,this.players);
    }

    snapshotSyncs()
    {
        const boss = this.activeBoss;
        if (!boss) return;

        // 同步实时数据
        const snapshotSyncsData = {
            bossId: boss.bossId,
            hp: boss.hp,
            pos: boss.position,
            direction: boss.direction,
        }

        bossSyncsHandler.snapshotSyncsHandle(snapshotSyncsData,this.players);
    }


    /**
     * 在boss的searchRange中找出最近的player
     * @param range
     */
    findNearestPlayer(range) {
        const boss = this.activeBoss;
        const players = this.playerManager.getPlayersInRange(boss.position, range);

        if (players.length === 0) return null;

        let nearestPlayer = null;
        let nearestDistSq = Infinity;

        for (const p of players) {
            const dx = p.pos.x - boss.position.x;
            const dz = p.pos.z - boss.position.z;
            const distSq = dx * dx + dz * dz;
            if (distSq < nearestDistSq) {
                nearestDistSq = distSq;
                nearestPlayer = p;
            }
        }
        return nearestPlayer;
    }

    getDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dz * dz);
    }

    /**
     * 根据距离筛选并按权重随机返回一个
     * @param boss
     * @param distance
     */
    chooseSkill(boss, distance) {
        const skills = boss.skills || [];
        // 过滤: 满足距离
        const candidates = skills.filter(s => {
            if (distance > s.skillRange) return false;
            return true;
        });

        if (candidates.length === 0) return null;

        // 根据权重随机选择
        const totalWeight = candidates.reduce((sum, s) => sum + (s.weight || 1), 0);
        let r = Math.random() * totalWeight;
        for(const s of candidates){
            const w = s.weight || 1;
            if (r < w) return s;
            r -= w;
        }

        return candidates[0];
    }
}

module.exports = {BossManager};