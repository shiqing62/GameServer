/**
 * 掉落物同步handler
 */
class DropSyncHandler{
    constructor(networkService) {
        this.networkService = networkService;
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