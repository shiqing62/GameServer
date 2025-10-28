const MsgIds = require('../MsgIds.js');
const PlayerDataModule = require('../schemas/generated/javascript/game/player/player-data.js');
const PlayerData = PlayerDataModule.PlayerData;
const EnterGameResponseModule = require('../schemas/generated/javascript/game/login/enter-game-response.js');
const EnterGameResponse = EnterGameResponseModule.EnterGameResponse;
const LoginResponseModule = require('../schemas/generated/javascript/game/login/login-response.js');
const LoginResponse = LoginResponseModule.LoginResponse;
const PayloadModule = require('../schemas/generated/javascript/game/message/payload.js');
const PayloadType = PayloadModule.Payload;
const {Vec3} = require('../schemas/generated/javascript/game/common/vec3.js');
const {PlayerEnterPush} = require("../schemas/generated/javascript/game/syncs/player-enter-push.js");
const {PlayerMovePush} = require("../schemas/generated/javascript/game/syncs/player-move-push");
const {DamageSyncsPush} = require("../schemas/generated/javascript/game/syncs/damage-syncs-push.js");
const {SkillType} = require("../schemas/generated/javascript/game/syncs/skill-type.js");
const {RandomPointData} = require("../schemas/generated/javascript/game/syncs/random-point-data.js");
const {ProjectileData} = require("../schemas/generated/javascript/game/syncs/projectile-data.js");
const {MeleeData} = require("../schemas/generated/javascript/game/syncs/melee-data.js");
const {AttachedData} = require("../schemas/generated/javascript/game/syncs/attached-data.js");
const {PlayerStateSyncs} = require("../schemas/generated/javascript/game/syncs/player-state-syncs.js");
const {PlayerStateFlags} = require("./playerStateFlags.js");
const {PlayerMove} = require("../schemas/generated/javascript/game/syncs/player-move.js");
const {PlayerMoveResponse} = require("../schemas/generated/javascript/game/syncs/player-move-response.js");
const {SkillData} = require("../schemas/generated/javascript/game/syncs/skill-data.js");
const {SkillSyncs} = require("../schemas/generated/javascript/game/syncs/skill-syncs.js");
const {PlayerExitPush} = require("../schemas/generated/javascript/game/syncs/player-exit-push");
const {ParamValue} = require("../schemas/generated/javascript/game/common/param-value");
const {IntValue} = require("../schemas/generated/javascript/game/common/int-value");
const {UIntValue} = require("../schemas/generated/javascript/game/common/uint-value");
const {FloatValue} = require("../schemas/generated/javascript/game/common/float-value");
const {BoolValue} = require("../schemas/generated/javascript/game/common/bool-value");
const {Vec3Value} = require("../schemas/generated/javascript/game/common/vec3-value");
const {Float4} = require("../schemas/generated/javascript/game/common/float4");
const {Float4Value} = require("../schemas/generated/javascript/game/common/float4-value");
const {Param} = require("../schemas/generated/javascript/game/syncs/param");
const {DropItemPush} = require("../schemas/generated/javascript/game/drop/drop-item-push");
const {PickupResponse} = require("../schemas/generated/javascript/game/drop/pickup-response");
const {PickupPush} = require("../schemas/generated/javascript/game/drop/pickup-push");
const {DeBuffAction} = require("../schemas/generated/javascript/game/syncs/de-buff-action");
const {DeBuffSyncsPush} = require("../schemas/generated/javascript/game/syncs/de-buff-syncs-push");
const {DeBuffParam} = require("../schemas/generated/javascript/game/common/de-buff-param");
const {BossStateSyncsPush} = require("../schemas/generated/javascript/game/boss/boss-state-syncs-push");
const {BossSnapshotSyncsPush} = require("../schemas/generated/javascript/game/boss/boss-snapshot-syncs-push");
const {TakeBossDamageResponse} = require("../schemas/generated/javascript/game/boss/take-boss-damage-response");

const payloadBuilder = {
    // 登录响应
    [MsgIds.ResponseId.Login]:{
        payloadType: PayloadType.Game_Login_LoginResponse,
        build: (builder,payload) => {
            LoginResponse.startLoginResponse(builder);
            LoginResponse.addUid(builder,payload.uid);
            return LoginResponse.endLoginResponse(builder);
        }
    },

    // 进入游戏响应
    [MsgIds.ResponseId.EnterGame]:{
        payloadType: PayloadType.Game_Login_EnterGameResponse,
        build:(builder,payload) =>{
            const {selfPlayerData,visiblePlayers} = payload;

            // 构建self数据
            const selfPlayerDataOffset = buildPlayerData(builder,selfPlayerData);
            // 构建visiblePlayers
            const visibleOffset = visiblePlayers.map(player => buildPlayerData(builder,player));
            const visibleVec = EnterGameResponse.createVisiblePlayersVector(builder,visibleOffset);

            // 构建enterGameResp
            EnterGameResponse.startEnterGameResponse(builder);
            EnterGameResponse.addSelfPlayer(builder,selfPlayerDataOffset);
            EnterGameResponse.addVisiblePlayers(builder,visibleVec);
            return EnterGameResponse.endEnterGameResponse(builder);
        }
    },

    // 退出游戏
    [MsgIds.ServerPushId.PlayerExit]:{
        payloadType:PayloadType.Game_Syncs_PlayerExitPush,
        build:(builder,payload) => {
            const playerUId = payload.playerUId;
            // 构建exitGamePush
            PlayerExitPush.startPlayerExitPush(builder);
            PlayerExitPush.addUid(builder,playerUId);
            return PlayerExitPush.endPlayerExitPush(builder);
        }
    },

    // 其他玩家进入时通知给相互视野内的玩家
    [MsgIds.ServerPushId.PlayerEnter]:{
        payloadType: PayloadType.Game_Syncs_PlayerEnterPush,
        build:(builder,payload) => {
            const {selfPlayerData} = payload;
            const playerDataOffset = buildPlayerData(builder,selfPlayerData);
            PlayerEnterPush.startPlayerEnterPush(builder);
            PlayerEnterPush.addPlayerData(builder,playerDataOffset);
            return PlayerEnterPush.endPlayerEnterPush(builder);
        }
    },

    // 响应自己的移动
    [MsgIds.ResponseId.PlayerMove]:{
        payloadType: PayloadType.Game_Syncs_PlayerMoveResponse,
        build:(builder,payload) =>{
            const {uid,pos} = payload;
            const posOffset = Vec3.createVec3(builder,pos.x,pos.y,pos.z);
            PlayerMoveResponse.startPlayerMoveResponse(builder);
            PlayerMoveResponse.addUid(builder,uid);
            PlayerMoveResponse.addPos(builder,posOffset);
            return PlayerMoveResponse.endPlayerMoveResponse(builder);
        }
    },

    // 同步视野内其他玩家移动
    [MsgIds.ServerPushId.PlayerMove]:{
        payloadType: PayloadType.Game_Syncs_PlayerMovePush,
        build:(builder,payload) => {
            const {playersPos} = payload;
            // 构建每个playerMove数据
            const moveOffsets = [];
            for (let i = playersPos.length - 1;i >= 0;i--){
                const p = playersPos[i];
                const posOffset = Vec3.createVec3(builder,p.pos.x,p.pos.y,p.pos.z);
                const dirOffset = Vec3.createVec3(builder,p.dir.x,p.dir.y,p.dir.z);

                PlayerMove.startPlayerMove(builder);
                PlayerMove.addUid(builder,p.uid);
                PlayerMove.addPos(builder,posOffset);
                PlayerMove.addDir(builder,dirOffset);
                moveOffsets.push(PlayerMove.endPlayerMove(builder));
            }

            // 构建vector
            PlayerMovePush.startPlayersPosVector(builder,moveOffsets.length);
            for (let i = moveOffsets.length - 1; i >= 0; i--){
                builder.addOffset(moveOffsets[i]);
            }

            const playersPosVector = builder.endVector();

            // 构建PlayerMovePush
            PlayerMovePush.startPlayerMovePush(builder);
            PlayerMovePush.addPlayersPos(builder,playersPosVector);
            return PlayerMovePush.endPlayerMovePush(builder);
        }
    },

    // 技能同步
    [MsgIds.ServerPushId.SkillSyncs]:{
        payloadType: PayloadType.Game_Syncs_SkillSyncs,
        build:(builder,payload) => {
            const {attackerId,targetId,skillId,skillType,skillData,scaleFactor,extraParams} = payload;
            let skillDataOffset = null;
            let skillDataType = null;
            switch (skillType){
                case SkillType.Projectile:
                    const projectileStartPos = skillData.startPos;
                    const projectileDirection = skillData.direction;
                    const speed = skillData.speed;
                    const projectileLifeTime = skillData.lifeTime;
                    const projectileStartPosOffset = Vec3.createVec3(builder,projectileStartPos.x,projectileStartPos.y,projectileStartPos.z);
                    const projectileDirectionOffset = Vec3.createVec3(builder,projectileDirection.x,projectileDirection.y,projectileDirection.z);

                    ProjectileData.startProjectileData(builder);
                    ProjectileData.addStartPos(builder,projectileStartPosOffset);
                    ProjectileData.addDirection(builder,projectileDirectionOffset);
                    ProjectileData.addSpeed(builder,speed);
                    ProjectileData.addLifeTime(builder,projectileLifeTime);

                    skillDataOffset = ProjectileData.endProjectileData(builder);
                    skillDataType = SkillData.ProjectileData;
                    break;
                case SkillType.RandomPoint:
                    const pos = skillData.pos;
                    const posOffset = Vec3.createVec3(builder,pos.x,pos.y,pos.z);

                    RandomPointData.startRandomPointData(builder);
                    RandomPointData.addPos(builder,posOffset);

                    skillDataOffset = RandomPointData.endRandomPointData(builder);
                    skillDataType = SkillData.RandomPointData;
                    break;
                case SkillType.Melee:
                    const meleeStartPos = skillData.startPos;
                    const meleeDirection = skillData.direction;
                    const meleeLifeTime = skillData.lifeTime;
                    const meleeStartPosOffset = Vec3.createVec3(builder,meleeStartPos.x,meleeStartPos.y,meleeStartPos.z);
                    const meleeDirectionOffset = Vec3.createVec3(builder,meleeDirection.x,meleeDirection.y,meleeDirection.z);

                    MeleeData.startMeleeData(builder);
                    MeleeData.addStartPos(builder,meleeStartPosOffset);
                    MeleeData.addDirection(builder,meleeDirectionOffset);
                    MeleeData.addLifeTime(builder,meleeLifeTime);

                    skillDataOffset = MeleeData.endMeleeData(builder);
                    skillDataType = SkillData.MeleeData;
                    break;
                case SkillType.Attached:
                    const attachedAnchorPos = skillData.anchorPos;
                    const attachedLifeTime = skillData.lifeTime;
                    const attachedAnchorPosOffset = Vec3.createVec3(builder,attachedAnchorPos.x,attachedAnchorPos.y,attachedAnchorPos.z);

                    AttachedData.startAttachedData(builder);
                    AttachedData.addAnchorPos(builder,attachedAnchorPosOffset);
                    AttachedData.addLifeTime(builder,attachedLifeTime);

                    skillDataOffset = AttachedData.endAttachedData(builder);
                    skillDataType = SkillData.AttachedData;
                    break;
            }

            // 构建 extraParams
            let extraParamsVectorOffset = null;
            if (Array.isArray(extraParams) && extraParams.length > 0)
            {
                const paramOffsets = [];
                for (let i = 0; i < extraParams.length; i++) {
                    const p = extraParams[i];
                    // 构建union member
                    let pValueOffset = null;
                    switch(p.paramValueType){
                        case ParamValue.IntValue:
                            IntValue.startIntValue(builder);
                            IntValue.addV(builder,p.paramValue);
                            pValueOffset = IntValue.endIntValue(builder);
                            break;
                        case ParamValue.UIntValue:
                            UIntValue.startUIntValue(builder);
                            UIntValue.addV(builder,p.paramValue);
                            pValueOffset = UIntValue.endUIntValue(builder);
                            break;
                        case ParamValue.FloatValue:
                            FloatValue.startFloatValue(builder);
                            FloatValue.addV(builder,p.paramValue);
                            pValueOffset = FloatValue.endFloatValue(builder);
                            break;
                        case ParamValue.BoolValue:
                            BoolValue.startBoolValue(builder);
                            BoolValue.addV(builder,!!p.paramValue);
                            pValueOffset = BoolValue.endBoolValue(builder);
                            break;
                        case ParamValue.Vec3Value:
                            const vec3 = p.paramValue;
                            const vec3Offset = Vec3.createVec3(builder,vec3.x,vec3.y,vec3.z);
                            Vec3Value.startVec3Value(builder);
                            Vec3Value.addV(builder,vec3Offset);
                            pValueOffset = Vec3Value.endVec3Value(builder);
                            break;
                        case ParamValue.Float4Value:
                            const float4 = p.paramValue;
                            const float4Offset = Float4.createFloat4(builder,float4.x,float4.y,float4.z,float4.w);
                            Float4Value.startFloat4Value(builder);
                            Float4Value.addV(builder,float4Offset);
                            pValueOffset = Float4Value.endFloat4Value(builder);
                            break;
                        default:
                            console.warn('Unknown ParamValueType while building: ',p.paramValueType);
                            continue;
                    }
                    // 构建Param表，包括paramType,paramValueType,paramValue
                    Param.startParam(builder);
                    Param.addParamType(builder,p.paramType);
                    Param.addParamValueType(builder,p.paramValueType);
                    Param.addParamValue(builder,pValueOffset);
                    const paramOffset = Param.endParam(builder);

                    paramOffsets.push(paramOffset);
                }

                // 创建vector
                extraParamsVectorOffset = SkillSyncs.createExtraParamsVector(builder,paramOffsets);
            }

            // 构建最终 SkillSyncs
            SkillSyncs.startSkillSyncs(builder);
            SkillSyncs.addAttackerId(builder,attackerId);
            SkillSyncs.addTargetId(builder,targetId);
            SkillSyncs.addSkillId(builder,skillId);
            SkillSyncs.addSkillType(builder,skillType);
            SkillSyncs.addSkillDataType(builder,skillDataType);
            SkillSyncs.addSkillData(builder,skillDataOffset);
            SkillSyncs.addScaleFactor(builder,scaleFactor);
            if (extraParamsVectorOffset != null){
                SkillSyncs.addExtraParams(builder,extraParamsVectorOffset);
            }
            return SkillSyncs.endSkillSyncs(builder);
        }
    },

    // 状态同步: 包含玩家的血量，等级......
    [MsgIds.ServerPushId.PlayerStateSyncs]:{
        payloadType: PayloadType.Game_Syncs_PlayerStateSyncs,
        build:(builder,payload) => {
            const {uid,stateFlags,hp,maxHp,level} = payload;
            PlayerStateSyncs.startPlayerStateSyncs(builder);
            PlayerStateSyncs.addUid(builder,uid);
            PlayerStateSyncs.addState(builder,stateFlags);

            // 只有对应位标记才序列化
            if (stateFlags & PlayerStateFlags.HP){
                PlayerStateSyncs.addHp(builder,hp);
                PlayerStateSyncs.addMaxHp(builder,maxHp);
            }
            if (stateFlags & PlayerStateFlags.LEVEL){
                PlayerStateSyncs.addLevel(builder,level);
            }
            return PlayerStateSyncs.endPlayerStateSyncs(builder);
        }
    },

    // 伤害同步
    [MsgIds.ServerPushId.DamageSyncs]:{
        payloadType: PayloadType.Game_Syncs_DamageSyncsPush,
        build:(builder,payload) =>{
            const {damageSyncsData} = payload;
            const pos = damageSyncsData.pos;
            const posOffset = Vec3.createVec3(builder,pos.x,pos.y,pos.z);

            DamageSyncsPush.startDamageSyncsPush(builder);
            DamageSyncsPush.addAttackerId(builder,damageSyncsData.attackerId);
            DamageSyncsPush.addTargetId(builder,damageSyncsData.targetId);
            DamageSyncsPush.addSkillId(builder,damageSyncsData.skillId);
            DamageSyncsPush.addDamage(builder,damageSyncsData.damage);
            DamageSyncsPush.addPos(builder,posOffset);
            DamageSyncsPush.addHp(builder,damageSyncsData.hp)
            return DamageSyncsPush.endDamageSyncsPush(builder);
        }
    },

    // debuff同步
    [MsgIds.ServerPushId.DeBuffSyncs]:{
        payloadType: PayloadType.Game_Syncs_DeBuffSyncsPush,
        build:(builder,payload) =>{
            const {attackerId,targetId,debuffId,action,params} = payload;

            // 构建params
            let paramsVectorOffset = null;
            if (Array.isArray(params) && params.length > 0)
            {
                const paramOffsets = [];
                for (let i = 0; i < params.length; i++) {
                    const p = params[i];
                    // 构建union member
                    let pValueOffset = null;
                    switch (p.paramValueType)
                    {
                        case ParamValue.IntValue:
                            IntValue.startIntValue(builder);
                            IntValue.addV(builder,p.paramValue);
                            pValueOffset = IntValue.endIntValue(builder);
                            break;
                        case ParamValue.UIntValue:
                            UIntValue.startUIntValue(builder);
                            UIntValue.addV(builder,p.paramValue);
                            pValueOffset = UIntValue.endUIntValue(builder);
                            break;
                        case ParamValue.FloatValue:
                            FloatValue.startFloatValue(builder);
                            FloatValue.addV(builder,p.paramValue);
                            pValueOffset = FloatValue.endFloatValue(builder);
                            break;
                        case ParamValue.BoolValue:
                            BoolValue.startBoolValue(builder);
                            BoolValue.addV(builder,!!p.paramValue);
                            pValueOffset = BoolValue.endBoolValue(builder);
                            break;
                        case ParamValue.Vec3Value:
                            const vec3 = p.paramValue;
                            const vec3Offset = Vec3.createVec3(builder,vec3.x,vec3.y,vec3.z);
                            Vec3Value.startVec3Value(builder);
                            Vec3Value.addV(builder,vec3Offset);
                            pValueOffset = Vec3Value.endVec3Value(builder);
                            break;
                        case ParamValue.Float4Value:
                            const float4 = p.paramValue;
                            const float4Offset = Float4.createFloat4(builder,float4.x,float4.y,float4.z,float4.w);
                            Float4Value.startFloat4Value(builder);
                            Float4Value.addV(builder,float4Offset);
                            pValueOffset = Float4Value.endFloat4Value(builder);
                            break;
                        default:
                            console.warn('Unknown ParamValueType while building: ',p.paramValueType);
                            continue;
                    }

                    // 构建 DeBuffParam 表
                    DeBuffParam.startDeBuffParam(builder);
                    DeBuffParam.addParamType(builder,p.paramType);
                    DeBuffParam.addParamValueType(builder,p.paramValueType);
                    DeBuffParam.addParamValue(builder,pValueOffset);
                    const paramOffset = DeBuffParam.endDeBuffParam(builder);
                    paramOffsets.push(paramOffset);
                }

                // 创建vector
                paramsVectorOffset = DeBuffSyncsPush.createParamsVector(builder,paramOffsets);
            }

            DeBuffSyncsPush.startDeBuffSyncsPush(builder);
            DeBuffSyncsPush.addAttackerId(builder,attackerId);
            DeBuffSyncsPush.addTargetId(builder,targetId);
            DeBuffSyncsPush.addDebuffId(builder,debuffId);
            DeBuffSyncsPush.addAction(builder,action);
            DeBuffSyncsPush.addParams(builder,paramsVectorOffset);

            return DeBuffSyncsPush.endDeBuffSyncsPush(builder);
        }
    },

    // 掉落道具
    [MsgIds.ServerPushId.DropItem]:{
        payloadType: PayloadType.Game_Drop_DropItemPush,
        build: (builder,payload) =>{
            const {itemId,instanceId,chunkX,chunkY,pos} = payload;
            const posOffset = Vec3.createVec3(builder,pos.x,pos.y,pos.z);

            DropItemPush.startDropItemPush(builder);
            DropItemPush.addItemId(builder,itemId);
            DropItemPush.addInstanceId(builder,instanceId);
            DropItemPush.addChunkX(builder,chunkX);
            DropItemPush.addChunkY(builder,chunkY);
            DropItemPush.addPos(builder,posOffset);

            return DropItemPush.endDropItemPush(builder);
        }
    },

    // 拾取响应
    [MsgIds.ResponseId.PickupDropItem]:{
        payloadType: PayloadType.Game_Drop_PickupResponse,
        build: (builder,payload) =>{
            const {itemId,instanceId} = payload;

            PickupResponse.startPickupResponse(builder);
            PickupResponse.addItemId(builder,itemId);
            PickupResponse.addInstanceId(builder,instanceId);

            return PickupResponse.endPickupResponse(builder);
        }
    },

    // 其他玩家拾取推送
    [MsgIds.ServerPushId.PickupDropItem]:{
        payloadType: PayloadType.Game_Drop_PickupPush,
        build: (builder,payload) => {
            const {uid,itemId,instanceId} = payload;

            PickupPush.startPickupPush(builder);
            PickupPush.addUid(builder,uid);
            PickupPush.addItemId(builder,itemId);
            PickupPush.addInstanceId(builder,instanceId);

            return PickupPush.endPickupPush(builder);
        }
    },

    // boss状态同步推送
    [MsgIds.ServerPushId.BossStateSyncs]:{
        payloadType: PayloadType.Game_Boss_BossStateSyncsPush,
        build: (builder,payload) => {
            const {bossId,bossState,skillId} = payload;

            BossStateSyncsPush.startBossStateSyncsPush(builder);
            BossStateSyncsPush.addBossId(builder,bossId);
            BossStateSyncsPush.addBossState(builder,bossState);
            if (skillId !== 0)
            {
                BossStateSyncsPush.addSkillId(builder,skillId);
            }

            return BossStateSyncsPush.endBossStateSyncsPush(builder);
        }
    },

    // boss实时状态同步推送
    [MsgIds.ServerPushId.BossSnapshotSyncs]:{
        payloadType: PayloadType.Game_Boss_BossSnapshotSyncsPush,
        build: (builder,payload) => {
            const {bossId,bossHp,bossPos,bossDirection} = payload;
            const posOffset = Vec3.createVec3(builder,bossPos.x,bossPos.y,bossPos.z);
            const dirOffset = Vec3.createVec3(builder,bossDirection.x,bossDirection.y,bossDirection.z);

            BossSnapshotSyncsPush.startBossSnapshotSyncsPush(builder);
            BossSnapshotSyncsPush.addBossId(builder,bossId);
            BossSnapshotSyncsPush.addHp(builder,bossHp);
            BossSnapshotSyncsPush.addPos(builder,posOffset);
            BossSnapshotSyncsPush.addDirection(builder,dirOffset);

            return BossSnapshotSyncsPush.endBossSnapshotSyncsPush(builder);
        }
    },

    // boss造成的伤害响应
    [MsgIds.ResponseId.TakeBossDamage]:{
        payloadType: PayloadType.Game_Boss_TakeBossDamageResponse,
        build: (builder,payload) =>{
            const {uid,skillId,damage} = payload;

            TakeBossDamageResponse.startTakeBossDamageResponse(builder);
            TakeBossDamageResponse.addUid(builder,uid);
            TakeBossDamageResponse.addSkillId(builder,skillId);
            TakeBossDamageResponse.addDamage(builder,damage);

            return TakeBossDamageResponse.endTakeBossDamageResponse(builder);
        }
    },
};

// 接口: 构建玩家数据
function buildPlayerData(builder,player)
{
    const nickOffset = builder.createString(player.nickName);
    const posOffset = Vec3.createVec3(builder,player.pos.x,player.pos.y,player.pos.z);
    const dirOffset = Vec3.createVec3(builder,player.dir.x,player.dir.y,player.dir.z);
    const weaponsOffset = PlayerData.createWeaponsVector(builder,player.weapons);
    const passiveOffset = PlayerData.createPassivesVector(builder,player.passives);
    const petsOffset = PlayerData.createPetsVector(builder,player.pets);
    PlayerData.startPlayerData(builder);
    PlayerData.addUid(builder, player.uid);
    PlayerData.addNickName(builder, nickOffset);
    PlayerData.addCharacterId(builder, player.characterId);
    PlayerData.addRoomId(builder, player.roomId);
    PlayerData.addScore(builder, player.score);
    PlayerData.addRanking(builder, player.ranking);
    PlayerData.addPos(builder, posOffset);
    PlayerData.addDir(builder,dirOffset);
    PlayerData.addLevel(builder, player.level);
    PlayerData.addHp(builder, player.hp);
    PlayerData.addWeapons(builder, weaponsOffset);
    PlayerData.addPassives(builder, passiveOffset);
    PlayerData.addPets(builder, petsOffset);

    return PlayerData.endPlayerData(builder);
}

module.exports = {payloadBuilder};