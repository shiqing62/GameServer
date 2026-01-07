/**
 * 玩家连接管理器：uid<->ws
 */

const crypto = require("crypto");

class SessionManager{
    constructor() {
        this.sessions = new Map();      // token -> session
        this.uidToToken = new Map();    // uid -> token
    }

    createSession(uid,socket = null){
        // 踢掉旧的session（处理顶号操作）
        const oldToken = this.sessions.get(uid);
        if (oldToken){
            this.sessions.delete(oldToken);
        }

        const token = crypto.randomUUID();
        const session = {
            uid,
            token,
            socket,
            lastActiveTime: Date.now(),
        }

        this.sessions.set(token,session);
        this.uidToToken.set(uid,token);

        return session;
    }

    bindSocket(token,socket){
        const session = this.sessions.get(token);
        if (!session) {
            return false;
        }

        session.socket = socket;
        session.lastActiveTime = Date.now();
        return true;
    }

    removeSession(token){
        const session = this.sessions.get(token);
        if (!session){
            return;
        }

        this.sessions.delete(token);
        this.uidToToken.delete(session.uid);
    }


    getSession(token){
        return this.sessions.get(token);
    }

    getAllSession(){
        return this.sessions.values();
    }
}

module.exports = SessionManager;