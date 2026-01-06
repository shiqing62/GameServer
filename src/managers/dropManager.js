
class DropManager{
    constructor() {
        this.drops = new Map();
        this._syncEvents = [];      // 同步事件队列
        this._nextId = 1;
    }

    /**
     *  创建道具
     * @param itemId
     * @param position
     * @param ownerUid
     * @param ttl
     */
    createDrop({itemId,position,ownerUid = null,ttl = 30}){
        console.log("--->>>创建道具！");
        const drop = {
            itemId: itemId,
            instanceId: this._nextId++,
            pos: position,
            spawnTime: Date.now(),
            lifeTime: ttl
        };

        this.drops.set(drop.instanceId,drop);

        // 将新生成的drop加入到同步队列中
        this._syncEvents.push({
            type: "spawn",
            drop
        });

        return drop;
    }

    /**
     * 玩家拾取道具
     * @param dropId 道具的唯一ID：实例ID
     * @param pickerUid 拾取者的uid
     */
    pickupDrop(dropId,pickerUid) {

    }

    /**
     * 超时销毁
     * @param instanceId 道具的唯一ID：实例ID
     */
    removeDropByTimeout(instanceId){
        console.log("--->>>超时销毁！！！");
        this.drops.delete(instanceId);
        // 将新生成的drop加入到同步队列中
        this._syncEvents.push({
            type: "timeout",
        });
    }

    /**
     * 收集同步事件供syncSystem使用
     * @returns {[]|null}
     */
    collectSyncEvents() {
        if (this._syncEvents.length === 0) {
            return null;
        }

        const events = this._syncEvents;
        this._syncEvents = [];
        return events;
    }

    getDrop(instanceId){
        return this.drops.get(instanceId);
    }

    removeDrop(instanceId){
        this.drops.delete(instanceId);
    }

    getAllDrop(){
        return this.drops.values();
    }
}

module.exports = DropManager;