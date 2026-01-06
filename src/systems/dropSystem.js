const dropItems = require('../configs/dropItems.js');
const CONSTANTS = require('../shared/constants.js');

class DropSystem{
    constructor(ctx) {
        this.dropManager = ctx.getManager('drop');
        this.mapService = ctx.getService('map');

        this._spawnTimer = 0;   // 内部时间累积
        this._interval = 60;    // 间隔
    }

    update(delta,time){
        const now = Date.now();
        this._spawnTimer += delta;

        if (this._spawnTimer >= this._interval){
            this._spawnTimer -= this._interval;
            this.spawnRandomDrop();
        }

        for (let drop of this.dropManager.getAllDrop()) {
            const activeTime = (now - drop.spawnTime) / 1000;

            if (activeTime > drop.lifeTime){
                this.dropManager.removeDropByTimeout(drop.instanceId);
            }
        }
    }

    /**
     * 生成死亡掉落
     */
    spawnDeathDrop() {

    }

    /**
     * 生成随机掉落道具
     */
    spawnRandomDrop(){
        console.log("--->>>生成随机掉落道具!!");

        // 获取随机掉落道具ID
        const itemId = this.rollByWeight().id;
        console.log("--->>>itemId: ",itemId);
        // 获取随机掉落chunk_x,chunk_y
        const chunk_x = Math.floor(Math.random() * CONSTANTS.WORLD.CHUNK_COUNT_X);
        const chunk_y = Math.floor(Math.random() * CONSTANTS.WORLD.CHUNK_COUNT_Y);
        console.log("--->>>chunk_x: ",chunk_x);
        console.log("--->>>chunk_y: ",chunk_y);
        // 根据chunk_x,chunk_y获取一个避开障碍物的坐标点
        const pos = this.mapService.getRandomFreePosition(chunk_x,chunk_y);
        console.log("--->>>pos: ",pos);

        this.dropManager.createDrop({itemId,pos});
    }

    /**
     * 从道具池中按照权重随机获取一个
     */
    rollByWeight(){
        const pool = dropItems.getDropItemPool();
        const totalWeight = pool.reduce((sum,item) => sum + item.weight,0);
        console.log("--->>>totalWeight: ",totalWeight);
        let rand = Math.random() * totalWeight;

        for (const item of pool) {
            rand -= item.weight;
            if (rand <= 0){
                return item;
            }
        }

        // 保底取值
        return pool[0];
    }

}

module.exports = DropSystem;