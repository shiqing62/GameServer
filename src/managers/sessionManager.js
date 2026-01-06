/**
 * 玩家连接管理器：uid<->ws
 */
class SessionManager{
    constructor() {
        this.sessions = new Map();
    }

    addSession(uid,ws){
        this.sessions.set(uid,{
            uid: uid,
            ws: ws,
            connectAt: Date.now()
        });
    }

    removeSession(uid){
        this.sessions.delete(uid);
    }

    getSession(uid){
        return this.sessions.get(uid);
    }

    getAllSession(){
        return this.sessions.values();
    }
}

module.exports = SessionManager;