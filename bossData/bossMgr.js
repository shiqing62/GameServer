// boss统一的管理器:负责tick,spawn,pathfinder初始化,player查找，sync操作
const bossSyncsHandler = require('../handlers/bossSyncsHandler.js');
const mapHandler = require('../handlers/mapHandler.js');
const {GAME_CONSTANTS} = require('../utils/GAME_CONSTANTS');
const {BossState} = require('../schemas/generated/javascript/game/boss/boss-state.js');
const {AStarPathfinder} = require('../utils/AStarPathfinder.js');
const {BossFactory} = require('./bossFactory.js');
const chunkSize = 32;

class BossMgr{
    constructor(players,playerManager) {
        this.players = players;
        this.playerManager = playerManager;
        this.activeBossController = null;
        this.pathfinder = null;
        this.BossState = BossState;
        this.startTickLoop();
    }

    startTickLoop(){
        setInterval(()=>{
            this.update(100);
        },100);
    }

    // manager决定bossId和chunk，然后使用factory创建controller
    spawnBoss() {
        if (this.activeBossController){
            console.warn("[BossManager] boss already exist!!!");
            return;
        }

        // 随机出chunk_x,chunk_y,bossId
        // const chunk_x = Math.floor(Math.random() * GAME_CONSTANTS.CHUNK_COUNT_X);
        // const chunk_y = Math.floor(Math.random() * GAME_CONSTANTS.CHUNK_COUNT_Y);
        const chunk_x = 1;
        const chunk_y = 1;
        const bossId = 101;
        const spawnPos = mapHandler.getRandomPos(chunk_x, chunk_y);
        // 初始化寻路器
        const obstacles = mapHandler.getObstaclesWithNeighbors(chunk_x,chunk_y);
        const chunkOrigin = {x: chunk_x * chunkSize, z: chunk_y * chunkSize};
        this.pathfinder = new AStarPathfinder(obstacles,chunkOrigin,0.25,chunkSize);
        this.pathfinder.setCachedObstacles(obstacles);

        // 使用工厂创建controller，并注入pathfinder
        const controller = BossFactory({
            bossId: bossId,
            id: `boss_${Date.now()}`,
            chunk: {x: chunk_x, y: chunk_y},
            position: spawnPos,
            pathfinder: this.pathfinder,
        });

        // 注入状态枚举
        controller.setEnums({BossStateEnum: BossState});
        // 设置九宫格
        const allowedChunks = [];
        for (let dx = -1; dx <= 1; dx++){
            for (let dy = -1; dy <= 1; dy++){
                allowedChunks.push({x: chunk_x + dx, y: chunk_y + dy});
            }
        }
        controller.setAllowedChunks(allowedChunks);

        // 初始boss状态
        controller.bossState = BossState.Spawn;
        this.activeBossController = controller;

        // 立刻同步state/snapshot,避免瞬移
        this.stateSyncs();
        this.snapshotSyncs();
    }

    update(deltaTime) {
        const controller = this.activeBossController;
        if (!controller) return;

        // 如果在出生过程中，执行出生动画，期间不参与其他状态的判定
        if (controller.bossState === BossState.Spawn){
            controller.doSpawn(deltaTime);
            this.handlePostControllerTick(controller,deltaTime);
            return;
        }

        // 检查boss死亡
        if (controller.hp <= 0){
            controller.bossState = BossState.Dead;
            controller.doDead(deltaTime);
            this.handlePostControllerTick(controller,deltaTime);
            return;
        }

        // 更新冷却倒计时
        if (controller.nextAttackTime > 0){
            controller.nextAttackTime -= deltaTime;
        }

        // 正在攻击则让controller自己处理
        if (controller.bossState === BossState.Attack){
            // 如果controller的doAttack返回了一个伤害事件对象，则manager负责广播伤害
            Promise.resolve(controller.doAttack(deltaTime)).then((attackResult) => {
                if (attackResult){
                    const takeDamageData = {
                        uid: attackResult.targetUid,
                        skillId: attackResult.skillId,
                        damage: attackResult.damage,
                    };
                    bossSyncsHandler.damageToPlayerSyncsHandle(takeDamageData,this.players);
                }
                this.handlePostControllerTick(controller,deltaTime);
            }).catch(err=>{
                console.error('doAttack error', err);
            });
            return;
        }

        if (controller.targetPlayer){
            const target = controller.targetPlayer;
            if (!target) {
                controller.targetPlayer = null;
                controller.bossState = BossState.Idle;
            } else {
                const dist = this.getDistance(controller.position, target.pos);
                // 冷却就绪，尝试从技能池中选择技能
                if (controller.nextAttackTime <= 0) {
                    const skill = controller.chooseSkill(dist);
                    if (skill) {
                        controller.bossState = BossState.Attack;
                        controller.pendingSkill = skill;
                        controller.nextAttackTime = skill.coolDown * 1000;
                        this.stateSyncs(skill.skillId);
                        return;
                    }
                }

                // 否则如果处于追击范围内则 chase
                if (dist <= controller.chaseRadius) {
                    controller.bossState = BossState.Chase;
                } else {
                    // 超出追击范围则放弃
                    controller.targetPlayer = null;
                    controller.bossState = BossState.Idle;
                }
            }
        } else {
            // 无目标 -> 尝试寻找到最近玩家
            const targetPlayer = this.findNearestPlayer((controller.chaseRange || { x: 0, y: 0 }));
            if (targetPlayer) {
                controller.targetPlayer = targetPlayer;
                controller.bossState = BossState.Chase;
                // TODO: 通知玩家被锁定
            } else {
                controller.bossState = BossState.Idle;
            }
        }
        // 最后由 controller 去执行当前 state 的逻辑
        switch (controller.bossState) {
            case BossState.Idle:
                controller.doIdle(deltaTime);
                break;
            case BossState.Chase:
                controller.doChase(deltaTime);
                break;
            case BossState.Dead:
                controller.doDead(deltaTime);
                break;
        }

        // 同步状态与位置
        this.handlePostControllerTick(controller, deltaTime);
    }

    // 统一同步state/snapshot
    handlePostControllerTick(controller,deltaTime){
        const skillId = (controller.pendingSkill && controller.pendingSkill.skillId) || 0;
        this.stateSyncs(skillId);
        this.snapshotSyncs();
    }

    // boss状态同步
    stateSyncs(skillId = 0){
        const controller = this.activeBossController;
        if (!controller) return;

        const key = `${controller.bossState}_${skillId}`;
        if (controller.lastStateKey === key) return;
        controller.lastStateKey = key;
        console.log("--->>>boss状态同步：",controller.lastStateKey);
        const stateSyncsData = controller.getStateSnapshotForSync(skillId);
        bossSyncsHandler.stateSyncsHandle(stateSyncsData,this.players);
    }

    // boss实时信息同步：位置，转向，血量
    snapshotSyncs(){
        const controller = this.activeBossController;
        if (!controller) return;

        const snapshotSyncsData = controller.getRealtimeSnapshot();
        bossSyncsHandler.snapshotSyncsHandle(snapshotSyncsData,this.players);
    }

    // 玩家对boss造成伤害
    calculatePlayerDamage(payload){
        const controller = this.activeBossController;
        if (!controller) return;

        const skillId = payload.skillId();
        const attackerId = payload.uid();
        const damage = payload.damage();
        controller.takeDamage(damage);
        console.log(`--->>>对boss造成伤害, skillId: ${skillId},  damage: ${damage},  剩余血量: ${controller.hp}`);

        if (controller.hp <= 0){
            controller.bossState = BossState.Dead;
        }
    }

    // boss对玩家造成伤害
    calculateBossDamage(payload){
        const skillId = payload.skillId();
        const targetPlayerUId = payload.uid();
        const controller = this.activeBossController;
        if (!controller) return;

        const skill = (controller.skills || []).find(s => s.skillId === skillId);
        if (!skill) return;

        const damage = skill.skillDamage;
        const takeDamageData = {
            uid: targetPlayerUId,
            skillId: skillId,
            damage: damage,
        };

        bossSyncsHandler.damageToPlayerSyncsHandle(takeDamageData,this.players);
    }

    // 在boss的searchRange中找出最近的player
    findNearestPlayer(range){
        const controller = this.activeBossController;
        if (!controller) return null;
        const players = this.playerManager.getPlayersInRange(controller.position,range);
        if (!players || players.length === 0) return null;

        let nearest = null;
        let best = Infinity;
        for (const p of players){
            const dx = p.pos.x - controller.position.x;
            const dz = p.pos.z - controller.position.z;
            const distSq = dx * dx + dz * dz;
            if (distSq < best){
                best = distSq;
                nearest = p;
            }
        }

        return nearest;
    }

    getDistance(pos1,pos2){
        const dx = pos1.x - pos2.x;
        const dz = pos1.z - pos2.z;

        return Math.sqrt(dx * dx + dz * dz);
    }
}

module.exports = {BossMgr};