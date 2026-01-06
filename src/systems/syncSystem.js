/**
 * 同步系统
 */

class SyncSystem{
    constructor(ctx) {
        this.dropManager = ctx.getManager('drop');
        this.dropSyncHandler = ctx.getHandler('dropSync');

        this._accumulator = 0;
        this._interval = 0.1;
    }

    update(delta){
        this._accumulator += delta;
        if (this._accumulator < this._interval) {
            return;
        }

        this._accumulator -= this._interval;
        this._syncDrops();
    }

    _syncDrops() {
        const events = this.dropManager.collectSyncEvents();
        if (!events || events.length === 0){
            return;
        }
        console.log("--->>>同步道具！！！");
        for (const evt of events) {
            this.dropSyncHandler.handle(evt);
        }
    }
}

module.exports = SyncSystem;