/**
 *
 */

const WebSocket = require('ws');
const GameLoop = require('../core/gameLoop.js');
const GameContext = require('../core/gameContext.js');
// const {Message} = require('/schemas/generated/javascript/game/message/message.js');
// const {Payload} = require('/schemas/generated/javascript/game/message/payload.js');
// const PayloadType = Payload;


// managers
const DropManager = require('../managers/dropManager.js');
const PlayerManager = require('../managers/playerManager.js');
const SessionManager = require('../managers/sessionManager.js');

// service
const MapService = require('../services/mapService.js');
const NetworkService = require('../services/networkService.js');

// systems
const DropSystem = require('../systems/dropSystem.js');
const SyncSystem = require('../systems/syncSystem.js');
const flatBuffers = require("flatbuffers");

// handlers
const DropSyncHandler = require('../handlers/dropSyncHandler.js');

class GameServer{

    start(){
        // context
        const ctx = new GameContext();

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

        ctx.registerService('network',networkService);
        ctx.registerService('map',mapService);

        // 声明 & 注册 handlers
        const dropSyncHandler = new DropSyncHandler();

        ctx.registerHandler('dropSync',dropSyncHandler);


        //systems
        const syncSystem = new SyncSystem(ctx);
        const dropSystem = new DropSystem(ctx);

        // gameLoop
        const gameLoop = new GameLoop({
            tickRate:20,
            maxDelta: 0.1,
            systems:[
                dropSystem,
                syncSystem
            ]
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

            ws.close('close',()=>{
                if (ws.uid){
                    sessionManager.unbind(ws.uid);
                }
            })
        });
    }

    /**
     * 消息分发
     */
    _dispatchMessage(ctx,ws,data){
        console.log("--->>>处理消息分发！！");
        // const buf =  new flatBuffers.ByteBuffer(new Uint8Array(data));
        // const message = Message.getRootAsMessage(buf);
        // const payloadType = message.payloadType();
        //
        // switch (payloadType){
        //
        // }
    }
}

module.exports = GameServer;