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
        const loginReq = message.payload(new LoginReq());

        const respBuffer = this.loginService.handleLogin(loginReq,ws);
        ws.send(respBuffer);
    }
}

module.exports = LoginHandler;