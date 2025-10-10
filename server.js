const WebSocket = require('ws');
const flatBuffers = require('flatbuffers');
// 导入生成的模块
const {Message} = require('./schemas/generated/javascript/game/message/message.js');
const {Payload} = require('./schemas/generated/javascript/game/message/payload.js');
const PayloadType = Payload;
const {GAME_CONSTANTS} = require('./utils/GAME_CONSTANTS.js');

// 引入 handler
const loginHandler = require('./handlers/loginHandler.js');
const enterGameHandler = require('./handlers/enterGameHandler.js');
const exitGameHandler = require('./handlers/exitGameHandler.js');
const playerMoveHandler = require('./handlers/playerMoveHandler');
const skillSyncsHandler = require('./handlers/skillSyncsHandler.js');
const damageSyncsHandler = require('./handlers/damageSyncsHandler.js');
const playerStateSyncsHandler = require('./handlers/playerStateSyncsHandler.js');
const dropHandler = require('./handlers/dropHandler.js');
const pickupHandler = require('./handlers/pickupHandler.js');
const gmHandler = require('./handlers/gmCommandHandler.js');
const debuffHandler = require('./handlers/debuffSyncsHandler.js');

// 引入 FBS 生成的请求结构
const {EnterGameRequest} = require('./schemas/generated/javascript/game/login/enter-game-request.js');
const {PlayerMoveRequest} = require("./schemas/generated/javascript/game/syncs/player-move-request.js");
const {DamageSyncsRequest} = require("./schemas/generated/javascript/game/syncs/damage-syncs-request.js");
const {SkillSyncs} = require("./schemas/generated/javascript/game/syncs/skill-syncs.js");
const {PlayerStateSyncs} = require("./schemas/generated/javascript/game/syncs/player-state-syncs.js");
const {PlayerExitRequest} = require("./schemas/generated/javascript/game/syncs/player-exit-request.js");
const {PickupRequest} = require("./schemas/generated/javascript/game/drop/pickup-request.js");
const {GMCommand} = require("./schemas/generated/javascript/game/gm/gmcommand.js");
const {DeBuffSyncsRequest} = require("./schemas/generated/javascript/game/syncs/de-buff-syncs-request.js");

const players = new Map();
const wss = new WebSocket.Server({ host: "0.0.0.0", port: 8080});


wss.on('connection',function connection (ws){
    console.log("--->>>client connection!!!!")
    ws.on('message',function incoming (data){
        const buf =  new flatBuffers.ByteBuffer(new Uint8Array(data));
        const message = Message.getRootAsMessage(buf);
        const payloadType = message.payloadType();

        switch (payloadType) {
            case PayloadType.Game_Login_LoginRequest:  // 登录
                loginHandler.handle(ws);
                break;
            case PayloadType.Game_Login_EnterGameRequest:  // 进入游戏
                const enterGameReq = message.payload(new EnterGameRequest());
                enterGameHandler.handle(ws,enterGameReq,players)
                break;
            case PayloadType.Game_Syncs_PlayerExitRequest:  // 玩家请求退出游戏
                const exitGameReq = message.payload(new PlayerExitRequest());
                exitGameHandler.handle(ws,exitGameReq,players)
                break;
            case PayloadType.Game_Syncs_PlayerMoveRequest:  // 玩家移动
                const moveReq = message.payload(new PlayerMoveRequest());
                playerMoveHandler.handle(ws,moveReq,players);
                break;
            case PayloadType.Game_Syncs_SkillSyncs:  // 客户端发起同步技能的请求
                const skillData = message.payload(new SkillSyncs());
                skillSyncsHandler.handle(ws,skillData,players);
                break;
            case PayloadType.Game_Syncs_DamageSyncsRequest:  // 同步伤害
                const damageData = message.payload(new DamageSyncsRequest());
                damageSyncsHandler.handle(ws,damageData,players);
                break;
            case PayloadType.Game_Syncs_PlayerStateSyncs:
                const stateSyncsData = message.payload(new PlayerStateSyncs());
                playerStateSyncsHandler.handle(ws,stateSyncsData,players);
                break;
            case PayloadType.Game_Drop_PickupRequest:
                const pickupData = message.payload(new PickupRequest());
                pickupHandler.handle(ws,pickupData,players);
                break;
            case PayloadType.Game_Syncs_DeBuffSyncsRequest:
                const debuffData = message.payload(new DeBuffSyncsRequest());
                debuffHandler.handle(ws,debuffData,players)
                break;
            case Payload.Game_GM_GMCommand:
                const gmData = message.payload(new GMCommand());
                gmHandler.handle(ws,gmData,players);
                break;
            default:
                console.log('Unknown payload type:', payloadType);
        }
    });

    //TODO 玩家退出
    ws.on('close',()=>{
        // 清理断开的玩家
        for (const [uid,player] of players.entries()){
            if (player.ws === ws)
            {
                players.delete(uid);
                break;
            }
        }
    });
});


//TODO 根据玩家位置变化幅度改为动态频率
setInterval(()=>{
    for (const [uid, player] of players.entries()) {
        if (!player.ws || player.ws.readyState !== WebSocket.OPEN) continue;

        const halfWidth = GAME_CONSTANTS.VIEW_RANGE_WIDTH / 2; // 宽的一半
        const halfHeight = GAME_CONSTANTS.VIEW_RANGE_HEIGHT / 2; // 高的一半

        // 当前玩家坐标
        const { x: px, y: pz } = player.pos;

        // 筛选视野范围内的玩家
        const visiblePlayers = Array.from(players.values()).filter(p => {
            // 排除自己
            if (p.uid === uid) return false;
            // 必须同房间
            if (p.roomId !== player.roomId) return false;
            // 判断是否在可视范围内
            const dx = Math.abs(p.pos.x - px);
            const dz = Math.abs(p.pos.z - pz);
            return dx <= halfWidth && dz <= halfHeight;
        });

        if (visiblePlayers.length > 0) {
            // 发送同步消息
            playerMoveHandler.handleMoveSyncs(player.ws,player,visiblePlayers);
        }
    }
},GAME_CONSTANTS.SYNCS_INTERVAL_MS);

// 掉落逻辑
setInterval(()=>{
    dropHandler.handle(players);
},30*1000);


