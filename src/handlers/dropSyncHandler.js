/**
 * 掉落物同步handler
 */
class DropSyncHandler{
    constructor(ctx) {
        this.networkService = ctx.getService('network');
    }

    handle(evt){
        console.log("--->>>evt: ",evt.type);
        switch (evt.type){
            case "spawn":
                this._onSpawn(evt);
                break;
            case "pickup":
                this._onPickup();
                break;
            case"timeout":
                this._onTimeout();
                break;
        }
    }

    _onSpawn(drop){
        // todo 构建消息数据结构，通过this.networkService统一send
        console.log("--->>>将掉落生成信息同步给全体玩家！！！");
        const msgId = 1;
        const payload = 1;
        this.networkService.sendToAll(msgId,payload);
    }

    _onPickup(){

    }

    _onTimeout(){

    }
}

module.exports = DropSyncHandler;