const flatBuffers = require('../../node_modules/flatbuffers/js/flatbuffers');
const LoginResp = require('../../generated/javascript/game/login/login-resp').LoginResp;
const MessageBuilder = require('../core/protocol/messageBuilder.js');
const PayloadType = require('../../generated/javascript/game/message/payload').Payload;

class LoginService {
    constructor(ctx) {
        this.playerRepo = ctx.getRepository('player');
        this.sessionManager = ctx.getManager('session');
    }

    handleLogin(loginReq, socket = null) {
        const uid = loginReq.uid();
        const token = loginReq.sessionToken();

        let player;
        let session;
        let isNew = false;

        // 新玩家
        if (!uid && !token){
            player = this.playerRepo.createPlayer();
            session = this.sessionManager.createSession(player.uid,socket);
            isNew = true;
        }

        // 老玩家重新登录s
        else if (uid && !token){
            if (!this.playerRepo.hasPlayer(uid)){
                // 查无此人
                return this._errorResp(1001,"uid not exists");
            }
            player = this.playerRepo.getByUid(uid);
            session = this.sessionManager.createSession(uid,socket);
        }

        // 断线重连
        else if (uid && token){
            const oldSession = this.sessionManager.getSession(token);
            if (!oldSession || oldSession.uid !== uid){
                return this._errorResp(1002,"invalid session");
            }
            this.sessionManager.bindSocket(token,socket);
            player = this.playerRepo.getByUid(uid);
            session = oldSession;
        }
        else
        {
            // 非法连接
            return this._errorResp(1000,"invalid login params");
        }

        return this._successResp(player.uid,session.token,isNew);
    }

    _successResp(uid,token,isNew){
        const builder = new flatBuffers.Builder(128);
        const uidOffset = builder.createString(uid);
        const tokenOffset = builder.createString(token);

        LoginResp.startLoginResp(builder);
        LoginResp.addUid(builder,uidOffset);
        LoginResp.addSessionToken(builder,tokenOffset);
        LoginResp.addIsNew(builder,isNew);
        LoginResp.addErrorCode(builder,0);

        const loginRespOffset = LoginResp.endLoginResp(builder);

        // 用MessageBuilder包装一层
        const messageOffset = MessageBuilder.warp(PayloadType.Game_Login_LoginResp,loginRespOffset,builder);
        builder.finish(messageOffset);
        
        return builder.asUint8Array();
    }

    _errorResp(code,msg){
        const builder = new flatBuffers.Builder(128);
        const msgOffset = builder.createString(msg);

        LoginResp.startLoginResp(builder);
        LoginResp.addErrorCode(builder,code);
        LoginResp.addErrorMsg(builder,msgOffset);

        const respOffset = LoginResp.endLoginResp(builder);

        builder.finish(respOffset);
        return builder.asUint8Array();
    }
}

module.exports = LoginService;