const flatBuffers = require('../../node_modules/flatbuffers/js/flatbuffers');
const EnterGameResp = require('../../generated/javascript/game/enter-game/enter-game-resp').EnterGameResp;
const MessageBuilder = require('../core/protocol/messageBuilder.js');
const PayloadType = require('../../generated/javascript/game/message/payload').Payload;

class EnterGameService{
    constructor(ctx) {
        this.playerManager = ctx.getManager('player');
        this.sceneManager = ctx.getManager('scene');
        this.playerRepo = ctx.getRepository('player');
    }

    enterGame({uid,characterId,sceneId,ws}){
        // 基础校验（账号层）
        const account = this.playerRepo.getByUid(uid);
        if (!account){
            return this._errorResp(2001);
        }

        //todo 校验所选角色是否合法（是否拥有该角色，error_code: 2002）


        // 防止重复进入
        if (this.playerManager.hasPlayer(uid)){
            return this._errorResp(2003);
        }

        // 校验场景是否合法
        const scene = this.sceneManager.get(sceneId);
        if (!scene){
            return this._errorResp(2004);
        }

        // 创建 runtime player
        const player = this.playerManager.createRuntimePlayer(uid);

        // 玩家状态变更
        player.inWorld = true;
        player.sceneId = sceneId;
        player.characterId = characterId;
        player.ws = ws;

        scene.addPlayer(player);

        // 调用enterScene
        this.sceneManager.enterScene(player,player.sceneId,player.characterId);

        return this._successResp(sceneId);
    }

    _successResp(sceneId){
        const builder = new flatBuffers.Builder(64);

        EnterGameResp.startEnterGameResp(builder);
        EnterGameResp.addSuccess(builder,true);
        EnterGameResp.addErrorCode(builder,0);
        EnterGameResp.addSceneId(builder,sceneId);

        const enterGameRespOffset = EnterGameResp.endEnterGameResp(builder);

        // 包装一层Message
        const messageOffset = MessageBuilder.warp(PayloadType.Game_EnterGame_EnterGameResp,enterGameRespOffset,builder);
        builder.finish(messageOffset);

        return builder.asUint8Array();
    }


    _errorResp(code){
        const builder = new flatBuffers.Builder(64);

        EnterGameResp.startEnterGameResp(builder);
        EnterGameResp.addSuccess(builder,false);
        EnterGameResp.addErrorCode(builder,code);

        const enterGameRespOffset = EnterGameResp.endEnterGameResp(builder);

        // 包装一层Message
        const messageOffset = MessageBuilder.warp(PayloadType.Game_EnterGame_EnterGameResp,enterGameRespOffset,builder);
        builder.finish(messageOffset);

        return builder.asUint8Array();
    }
}

module.exports = EnterGameService;