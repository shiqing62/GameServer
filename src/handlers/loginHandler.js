/**
 * 登录处理器
 */
const flatBuffers = require('../../node_modules/flatbuffers/js/flatbuffers');
const LoginReq = require("../../generated/javascript/game/login/login-req").LoginReq;

class LoginHandler{

    constructor(ctx) {
        this.ctx = ctx;
        this.loginService = ctx.getService('login');
    }

    handle(ws,message){
        const payloadBuffer = message.payload();
        const byteBuffer = new flatBuffers.ByteBuffer(payloadBuffer);
        const loginReq = LoginReq.getRootAsLoginReq(byteBuffer);

        const respBuffer = this.loginService.handleLogin(loginReq,ws);
        ws.send(respBuffer);
    }
}

module.exports = LoginHandler;