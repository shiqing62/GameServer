const flatBuffers = require('../../node_modules/flatbuffers/js/flatbuffers');
const EnterGameReq = require("../../generated/javascript/game/enter-game/enter-game-req").EnterGameReq;

class EnterGameHandler{
    constructor(ctx) {
        this.enterGameService = ctx.getService('enterGame');
    }

    handle(ws,message){
        if (!ws.uid){
            ws.close();
            return;
        }

        const enterGameReq = message.payload(new EnterGameReq());

        const respBuffer = this.enterGameService.enterGame({
            uid: ws.uid,
            characterId: enterGameReq.characterId(),
            sceneId: enterGameReq.sceneId(),
            ws: ws
        });

        ws.send(respBuffer);
    }
}

module.exports = EnterGameHandler;