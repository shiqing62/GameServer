
class NetworkService{
    constructor(ctx) {
        this.sessionManager = ctx.getManager('session');
    }

    /**
     * 发送给指定玩家
     * @param uid
     * @param msgId
     * @param payload
     */
    sendToUid(uid,msgId,payload){
        const session = this.sessionManager.getSession(uid);
        if (!session || session.ws.readyState !== 1){
             return;
        }

        session.ws.send(this._pack(msgId,payload));
    }

    /**
     * 发送给相互视野内的玩家
     * @param msgId
     * @param payload
     */
    sendToView(msgId,payload){

    }

    /**
     * 发送给全部玩家
     * @param msgId
     * @param payload
     */
    sendToAll(msgId,payload){
        for (const session of this.sessionManager.getAllSession()) {
            if (session.ws.readyState !== 1){
                continue;
            }

            session.ws.send(this._pack(msgId, payload));
        }
    }

    _pack(msgId,payload){
        // 通过payloadBuilder获取通讯消息
        // return builder.asUint8Array();
    }
}

module.exports = NetworkService;