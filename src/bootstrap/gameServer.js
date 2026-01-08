/**
 * GameServer
 */

const WebSocket = require('ws');
const flatBuffers = require("flatbuffers");
const path = require('path');
const playerDataPath = path.resolve(__dirname, '../data/players.json');

const GameLoop = require('../core/gameLoop.js');
const GameContext = require('../core/gameContext.js');

// repository
const PlayerRepository = require('../repositories/playerRepository.js');

// managers
const DropManager = require('../managers/dropManager.js');
const PlayerManager = require('../managers/playerManager.js');
const SessionManager = require('../managers/sessionManager.js');

// service
const MapService = require('../services/mapService.js');
const NetworkService = require('../services/networkService.js');
const LoginService = require('../services/loginService.js');

// systems
const DropSystem = require('../systems/dropSystem.js');
const SyncSystem = require('../systems/syncSystem.js');

// handlers
const DropSyncHandler = require('../handlers/dropSyncHandler.js');
const LoginHandler = require('../handlers/loginHandler.js');

// Message
const Message = require('../../generated/javascript/game/message/message').Message;
const Payload = require('../../generated/javascript/game/message/payload').Payload;
const PayloadType = Payload;


class GameServer{

    start(){
        // context
        const ctx = new GameContext();

        // 声明 & 注册 repositories
        const playerRepository = new PlayerRepository(playerDataPath);

        ctx.registerRepository('player',playerRepository);

        // 声明 & 注册 managers
        const playerManager = new PlayerManager();
        const dropManager = new DropManager();
        const sessionManager = new SessionManager();

        ctx.registerManager('player',playerManager);
        ctx.registerManager('drop',dropManager);
        ctx.registerManager('session',sessionManager);

        // 声明 & 注册 services
        const networkService = new NetworkService(ctx);
        const mapService = new MapService();
        const loginService = new LoginService(ctx);

        ctx.registerService('network',networkService);
        ctx.registerService('map',mapService);
        ctx.registerService('login',loginService);

        // 声明 & 注册 handlers
        const dropSyncHandler = new DropSyncHandler(ctx);
        const loginHandler = new LoginHandler(ctx);

        ctx.registerHandler('dropSync',dropSyncHandler);
        ctx.registerHandler('login',loginHandler);

        // systems
        const syncSystem = new SyncSystem(ctx);
        const dropSystem = new DropSystem(ctx);

        // gameLoop
        const gameLoop = new GameLoop({
            tickRate:20,
            maxDelta: 0.1,
            systems:[dropSystem, syncSystem]
        });

        // websocket server
        this._startWsServer(ctx);

        // 启动 gameLoop
        gameLoop.start();

        console.log("--->>>[GameServer] Start!");
    }

    _startWsServer(ctx){
        const wss = new WebSocket.Server({ host: "0.0.0.0", port: 8080});
        const sessionManager = ctx.getManager('session');

        wss.on('connection',ws => {
            console.log("--->>>connection!!!");

            ws.on('message',data => {
                console.log("--->>>message!!!");
                this._dispatchMessage(ctx,ws,data);
            });

            ws.on('close',() => {
                if (ws.uid){
                    sessionManager.unbind(ws.uid);
                }
            });

            ws.on('error', err => {
                console.error("ws error:", err);
            });
        });
    }

    /**
     * 消息分发
     */
    _dispatchMessage(ctx,ws,data){
        console.log("--->>>处理消息分发！！");
        const buf =  new flatBuffers.ByteBuffer(new Uint8Array(data));
        const message = Message.getRootAsMessage(buf);
        const payloadType = message.payloadType();


        switch (payloadType){
            case PayloadType.Game_Login_LoginReq:
                const loginHandler = ctx.getHandler('login');
                loginHandler.handle(ws,message)
                break;



            default:
                console.warn("Unknown payload type; ",payloadType);
        }
    }
}

module.exports = GameServer;