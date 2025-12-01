// const bossSyncsHandler = require('../handlers/bossSyncsHandler.js');
// const mapHandler = require('../handlers/mapHandler.js');
// const {BossConfig} = require('../bossData/bossConfig.js');
// const {GAME_CONSTANTS} = require("../utils/GAME_CONSTANTS");
// const {BossState} = require('../schemas/generated/javascript/game/boss/boss-state.js');
// const {AStarPathfinder} = require('../utils/AStarPathfinder.js');

// class BossManager {
//     constructor(players,playerManager) {
//         this.players = players;
//         this.activeBoss = null;
//         this.playerManager = playerManager;
//         this.startTickLoop();
//     }

//     startTickLoop(){
//         setInterval(()=>{
//             this.update(100);
//         },100);
//     }

//     spawnBoss() {
//         if (this.activeBoss) {
//             console.warn("[BossManager] Boss already exists");
//             return;
//         }

//         // 随机出chunkX,chunkY
//         // const chunk_x = Math.floor(Math.random() * GAME_CONSTANTS.CHUNK_COUNT_X);
//         // const chunk_y = Math.floor(Math.random() * GAME_CONSTANTS.CHUNK_COUNT_Y);
//         const chunk_x = 1;
//         const chunk_y = 1;
//         const spawnPos = mapHandler.getRandomPos(chunk_x, chunk_y);
//         // 随机出一个boss
//         const bossId = 101;
//         const cfg = BossConfig[bossId];
//         if (!cfg) {
//             console.error(`[BossManager] Invalid bossId: ${bossId}`);
//             return;
//         }

//         const boss = {
//             id: `boss_${Date.now()}`,
//             bossId: bossId,
//             chunk: {x: chunk_x, y: chunk_y},
//             position: spawnPos,
//             direction: {x: 0, y: 0, z: 0},
//             hp: cfg.maxHp,
//             targetPlayer: null,
//             nextAttackTime: 0,          // 攻击冷却,技能与普攻共享，倒计时结束才可以进行下一次
//             attackTimer: 0,             // 攻击计时,到时切换到chase
//             bossState: BossState.Spawn,
//             pendingSkill: null,         // 即将要释放的技能
//             chaseRange: cfg.chaseRange, // 追击距离,在此范围之内才可以被锁定为targetPlayer
//             chaseRadius: Math.sqrt(cfg.chaseRange.x * cfg.chaseRange.x + cfg.chaseRange.y * cfg.chaseRange.y) / 2,  // 追击半径
//             skills: cfg.skillList,
//             moveSpeed: cfg.moveSpeed,
//             spawnDuration: cfg.spawnDuration,
//             spawnTimer: 0,              // 出生计时,到时切换至idle
//             lastState: null,
//             path: [],                   // 避开障碍物的追击player轨迹点
//             pathIndex: 0,
//             pathUpdateTimer: 0,
//         };

//         // 确定出生九宫格
//         const allowedChunks = [];
//         for (let dx = -1; dx <= 1; dx++){
//             for (let dy = -1; dy <= 1; dy++){
//                 allowedChunks.push({x: chunk_x + dx, y: chunk_y + dy});
//             }
//         }

//         boss.allowedChunks = allowedChunks;
//         this.activeBoss = boss;

//         // 初始化寻路器
//         const obstacles = mapHandler.getObstaclesWithNeighbors(chunk_x,chunk_y);
//         const chunkSize = 32;
//         const chunkOrigin = {x: chunk_x * chunkSize, z: chunk_y * chunkSize};
//         this.pathfinder = new AStarPathfinder(obstacles,chunkOrigin,0.25,chunkSize);
//         this.pathfinder.setCachedObstacles(obstacles);      // 缓存九宫格障碍
//         this.handleBossState();
//     }


//     update(deltaTime) {
//         const boss = this.activeBoss;
//         if (!boss) {
//             return;
//         }

//         if (boss.bossState === BossState.Spawn)
//         {
//             this.handleBossState(deltaTime);
//             return;
//         }

//         // 判断死亡
//         if (boss.hp <= 0) {
//             boss.bossState = BossState.Dead;
//             this.handleBossState();
//             return;
//         }

//         // 更新冷却计时
//         if (boss.nextAttackTime > 0) {
//             boss.nextAttackTime -= deltaTime;
//         }

//         // 如果boss在攻击中,不执行后续逻辑(直至攻击结束)
//         if (boss.bossState === BossState.Attack) {
//             this.handleBossState(deltaTime);
//             return;
//         }

//         // 如果当前有目标,先判断距离
//         if (boss.targetPlayer) {
//             const target = boss.targetPlayer;
//             // 检查目标是否仍然存在、有效
//             if (!target) {
//                 boss.targetPlayer = null;
//                 boss.bossState = BossState.Idle;
//             } else {
//                 const dist = this.getDistance(boss.position, target.pos);
//                 // 冷却就绪,尝试从技能池中选择一个可用技能
//                 if (boss.nextAttackTime <= 0) {
//                     console.log("--->>>dist: ",dist);
//                     const skill = this.chooseSkill(boss,dist);
//                     if (skill)
//                     {
//                         // 找到了可释放的技能,进入攻击处理
//                         boss.bossState = BossState.Attack;
//                         // 确定即将释放的技能
//                         boss.pendingSkill = skill;
//                         boss.nextAttackTime = skill.coolDown * 1000;    // 代码逻辑中的单位为/ms,配置表里的cd单位时/s
//                         this.handleBossState(deltaTime);
//                         return;
//                     }
//                 }
//                 // 否则继续追击
//                 if (dist <= boss.chaseRadius) {
//                     boss.bossState = BossState.Chase;
//                 }
//                 // 超出追击范围则放弃目标
//                 else {
//                     console.log("--->>>radius: ",boss.chaseRadius);
//                     boss.targetPlayer = null;
//                     boss.bossState = BossState.Idle;
//                 }
//             }
//         } else{
//             // 没有目标则尝试寻找最近的玩家
//             const targetPlayer = this.findNearestPlayer(boss.chaseRange);
//             if (targetPlayer) {
//                 boss.targetPlayer = targetPlayer;
//                 boss.bossState = BossState.Chase;
//                 console.log("--->>>找到了玩家， bossState: ",boss.bossState);

//                 //TODO 通知给被锁定的玩家，客户端做出预警等表现
//             }
//             else {
//                 console.log("--->>>没有找到玩家，bossState: ",boss.bossState);
//                 boss.bossState = BossState.Idle;
//             }
//         }

//         // 最后指向当前状态的逻辑
//         this.handleBossState(deltaTime);
//         // 同步boss实时信息
//         this.snapshotSyncs();
//     }

//     handleBossState(deltaTime = 0) {
//         switch (this.activeBoss.bossState) {
//             case BossState.Spawn:
//                 this.doSpawn(deltaTime);
//                 break;
//             case BossState.Idle:
//                 this.doIdle();
//                 break;
//             case BossState.Chase:
//                 this.doChase(deltaTime);
//                 break;
//             case BossState.Attack:
//                 this.doAttack(deltaTime);
//                 break;
//             case BossState.Dead:
//                 this.doDead();
//                 break;
//         }
//     }

//     doSpawn(deltaTime)
//     {
//         const boss = this.activeBoss;
//         if (!boss) return;

//         if (boss.spawnTimer === 0)
//         {
//             this.stateSyncs();
//             // 立刻同步一次位置,避免boss从(0,0)点直接跳跃到出生点
//             this.snapshotSyncs();
//         }

//         // 出生计时
//         boss.spawnTimer += deltaTime / 1000;
//         if (boss.spawnTimer >= boss.spawnDuration)
//         {
//             boss.bossState = BossState.Idle;
//         }
//     }

//     doIdle() {
//         // 告知客户端boss进入idle
//         const boss = this.activeBoss;
//         if (!boss) return;

//         this.stateSyncs();
//     }

//     doChase(deltaTime) {
//         const boss = this.activeBoss;
//         if (!boss || !boss.targetPlayer) return;

//         const targetPlayer = boss.targetPlayer;
//         const playerPos = targetPlayer.pos;
//         const bossPos = boss.position;
//         const moveSpeed = boss.moveSpeed;
//         if (!playerPos || !bossPos) return;

//         // 计算boss当前chunk的坐标
//         const chunkSize = this.pathfinder.chunkSize;
//         const chunk_x = Math.floor(bossPos.x / chunkSize);
//         const chunk_y = Math.floor(bossPos.z / chunkSize);

//         // 将boss的行动范围限定在出生确定的九宫格中
//         const isAllowed = boss.allowedChunks.some(c => c.x === chunk_x && c.y === chunk_y);
//         if (!isAllowed){
//             console.log("[Boss] 超出活动范围，停止追击!!!");
//             boss.targetPlayer = null;
//             boss.path = [];
//             return;
//         }

//         // 检查目标是否超出boss的九宫格范围
//         const rangeMinX = (boss.chunk.x - 1) * chunkSize;
//         const rangeMaxX = (boss.chunk.x + 2) * chunkSize;
//         const rangeMinZ = (boss.chunk.y - 1) * chunkSize;
//         const rangeMaxZ = (boss.chunk.y + 2) * chunkSize;
//         // 判断目标玩家是否超出范围
//         if (playerPos.x < rangeMinX || playerPos.x > rangeMaxX || playerPos.z < rangeMinZ || playerPos.z > rangeMaxZ){
//             console.log('[Boss] target out of range,clearing target!!!');
//             boss.targetPlayer = null;
//             boss.path = [];
//             return;
//         }

//         // 计算与目标的距离
//         const dxt = playerPos.x - bossPos.x;
//         const dzt = playerPos.z - bossPos.z;
//         const distToTarget = Math.sqrt(dxt * dxt + dzt * dzt);

//         // 停止追击判定
//         if (distToTarget <= 3.5){
//             // 停止移动，只更新朝向
//             const normX = dxt / (distToTarget || 0.0001);
//             const normZ = dzt / (distToTarget || 0.0001);
//             boss.direction.x = normX;
//             boss.direction.z = normZ;

//             return;
//         }

//         // 刷新追击路径
//         boss.pathUpdateTimer += deltaTime;
//         // 检测目标玩家的移动距离
//         if (!boss.lastPlayerPos){
//             boss.lastPlayerPos = {...playerPos};
//         }
//         const dxp = playerPos.x - boss.lastPlayerPos.x;
//         const dzp = playerPos.z - boss.lastPlayerPos.z;
//         const playerMoveDist = Math.sqrt(dxp * dxp + dzp * dzp);

//         const needRePath = boss.pathUpdateTimer > 2000 || boss.path.length === 0 || playerMoveDist > 5;
//         if (needRePath){
//             // 根据boss的当前chunk信息更新A*的障碍
//             this.pathfinder.updateGridForChunk(chunk_x,chunk_y);
//             boss.path = this.pathfinder.findPath(bossPos,playerPos);
//             boss.pathIndex = 0;
//             boss.pathUpdateTimer = 0;
//             boss.lastPlayerPos = {...playerPos};    // 更新缓存位置
//         }

//         // 如果路径为空则直接靠近目标
//         if (boss.path.length === 0){
//             const dirX = dxt / (distToTarget || 0.0001);
//             const dirZ = dzt / (distToTarget || 0.0001);
//             boss.position.x += dirX * moveSpeed * (deltaTime / 1000);
//             boss.position.z += dirZ * moveSpeed * (deltaTime / 1000);
//             boss.direction.x = dirX;
//             boss.direction.z = dirZ;
//             return;
//         }

//         // 按照路径前进
//         const targetNode = boss.path[boss.pathIndex];
//         const dirX = targetNode.x - boss.position.x;
//         const dirZ = targetNode.z - boss.position.z;
//         const dist = Math.sqrt(dirX * dirX + dirZ * dirZ) || 0.0001;
//         // 只在目标点到达节点时推进到下一个
//         if (dist < 0.2) {
//             boss.pathIndex++;
//             if (boss.pathIndex >= boss.path.length) {
//                 boss.path = [];
//                 return;
//             }
//         } else {
//             const normX = dirX / dist;
//             const normZ = dirZ / dist;
//             boss.position.x += normX * moveSpeed * (deltaTime / 1000);
//             boss.position.z += normZ * moveSpeed * (deltaTime / 1000);
//             boss.direction.x = normX;
//             boss.direction.z = normZ;
//         }

//         this.stateSyncs();
//     }

//     doAttack(deltaTime) {
//         const boss = this.activeBoss;
//         if (!boss || !boss.pendingSkill || !boss.targetPlayer) return;

//         const skill = boss.pendingSkill;
//         const targetPlayer = boss.targetPlayer;

//         if (boss.attackTimer === 0)     // 刚从chase切换到attack
//         {
//             // step1: 向客户端发送攻击指令，客户端执行攻击动作
//             // 同步状态
//             this.stateSyncs(skill.skillId);
//         }

//         // 攻击时间计时
//         boss.attackTimer += deltaTime / 1000;
//         if (boss.attackTimer >= skill.duration)
//         {
//             // 攻击结束,重置状态并将伤害同步给targetPlayer
//             boss.attackTimer = 0;
//             // 计算伤害
//             const damage = skill.skillDamage;
//             // 检查目标是否存活
//             if (targetPlayer && targetPlayer.hp > 0){
//                 //TODO 处理伤害---写一个playerManager????
//                 // 将伤害同步给客户端
//             }

//             // 攻击完成后回到idle状态---boss再次锁定目标
//             boss.pendingSkill = null;
//             boss.bossState = BossState.Idle;
//             //TODO 重新选择 targetPlayer
//         }
//     }

//     doDead() {
//         // 将boss dead的状态同步给所有客户端
//         this.stateSyncs();
//         // 清除boss
//         this.activeBoss = null;
//         //TODO 掉落奖励
//     }

//     stateSyncs(skillId = 0)
//     {
//         const boss = this.activeBoss;
//         if (!boss) return;

//         // 防止重复广播相同的状态
//         const key = `${boss.bossState}_${skillId}`;
//         if (boss.lastState === key) return;
//         boss.lastState = key;

//         // 同步状态
//         const stateSyncsData = {
//             bossId: boss.bossId,
//             bossState: boss.bossState,
//             skillId: skillId,
//         }
//         bossSyncsHandler.stateSyncsHandle(stateSyncsData,this.players);
//     }

//     snapshotSyncs()
//     {
//         const boss = this.activeBoss;
//         if (!boss) return;

//         // 同步实时数据
//         const snapshotSyncsData = {
//             bossId: boss.bossId,
//             hp: boss.hp,
//             pos: boss.position,
//             direction: boss.direction,
//         }

//         bossSyncsHandler.snapshotSyncsHandle(snapshotSyncsData,this.players);
//     }


//     /**
//      * 在boss的searchRange中找出最近的player
//      * @param range
//      */
//     findNearestPlayer(range) {
//         const boss = this.activeBoss;
//         const players = this.playerManager.getPlayersInRange(boss.position, range);

//         if (players.length === 0) return null;

//         let nearestPlayer = null;
//         let nearestDistSq = Infinity;

//         for (const p of players) {
//             const dx = p.pos.x - boss.position.x;
//             const dz = p.pos.z - boss.position.z;
//             const distSq = dx * dx + dz * dz;
//             if (distSq < nearestDistSq) {
//                 nearestDistSq = distSq;
//                 nearestPlayer = p;
//             }
//         }
//         return nearestPlayer;
//     }

//     getDistance(pos1, pos2) {
//         const dx = pos1.x - pos2.x;
//         const dz = pos1.z - pos2.z;
//         return Math.sqrt(dx * dx + dz * dz);
//     }

//     /**
//      * 根据距离筛选并按权重随机返回一个
//      * @param boss
//      * @param distance
//      */
//     chooseSkill(boss, distance) {
//         const skills = boss.skills || [];
//         // 过滤: 满足距离
//         const candidates = skills.filter(s => {
//             if (distance > s.castRange) return false;
//             return true;
//         });

//         if (candidates.length === 0) return null;

//         // 根据权重随机选择
//         const totalWeight = candidates.reduce((sum, s) => sum + (s.weight || 1), 0);
//         let r = Math.random() * totalWeight;
//         for(const s of candidates){
//             const w = s.weight || 1;
//             if (r < w) return s;
//             r -= w;
//         }

//         return candidates[0];
//     }

//     // 计算boss某个技能对player的伤害
//     calculateBossDamage(payload) {
//         const skillId = payload.skillId();
//         const targetPlayerUId = payload.uid();
//         let damage = 0;
//         const boss = this.activeBoss;
//         if (!boss) return;

//         const skill = boss.skills.find(s => s.skillId === skillId);
//         if (!skill) return;

//         damage = skill.skillDamage;
//         console.log("--->>>对玩家造成伤害: ",damage);

//         const takeDamageData = {
//             uid: targetPlayerUId,
//             skillId: skillId,
//             damage: damage,
//         }

//         // 通过handle广播伤害
//         bossSyncsHandler.damageToPlayerSyncsHandle(takeDamageData,this.players);
//     }

//     // 计算player对boss造成的伤害
//     calculatePlayerDamage(payload){
//         const boss = this.activeBoss;
//         if (!boss) return;

//         const skillId = payload.skillId();
//         const attackerId = payload.uid();
//         const damage = payload.damage();
//         console.log(`--->>>对boss造成伤害, skillId: ${skillId},  damage: ${damage},  剩余血量: ${boss.hp}`);
//         boss.hp -= damage;
//         boss.hp = Math.max(boss.hp,0);

//         if (boss.hp <= 0){
//             boss.bossState = BossState.Dead;
//         }
//     }
// }

// module.exports = {BossManager};