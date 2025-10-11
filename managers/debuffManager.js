const {GAME_CONSTANTS} = require('../utils/GAME_CONSTANTS.js');
const debuffHandler = require('../handlers/debuffSyncsHandler.js');

class DeBuffManager{
    constructor(players) {
        // 保存所有目标的debuff信息
        this.activeDeBuffs = new Map();
        this.players = players;
        // 启动循环检查
        this.startTickLoop();
    }

    /**
     * 给某个玩家添加debuff
     * @param attackerId - debuff施加者
     * @param targetId - 被施加目标
     * @param debuffData - {debuffId,duration,instanceId}
     */
    addDeBuff(attackerId,targetId,debuffData){
        const now = Date.now();
        const {debuffId,duration,instanceId} = debuffData;

        let targetList = this.activeDeBuffs.get(targetId);
        if (!targetList){
            targetList = [];
            this.activeDeBuffs.set(targetId,targetList);
        }

        // 如果instanceId === 0 -->> 覆盖
        // 检查是否有同类的debuff
        const existing = targetList.find(d => d.debuffId === debuffId);
        if (existing && instanceId === 0){
            // 如果已有,覆盖掉原debuff的作用时间
            existing.startTime = now;
            existing.duration = duration;
        }else{
            // 新加debuff
            targetList.push({
                debuffId: debuffId,
                duration: duration,
                startTime: now,
            });
        }
    }

    startTickLoop(){
        setInterval(()=>{
            const now = Date.now();

            for (const [targetId,debuffList] of this.activeDeBuffs.entries()) {

                const remainList = debuffList.filter(debuff => {
                    const elapsed = now - debuff.startTime;
                    if (elapsed > debuff.duration){
                        // debuff到期,通知客户端移除debuff
                        debuffHandler.removeDeBuff(targetId,debuff.debuffId,this.players);
                        return false;
                    }
                    return true;
                });

                // 如果该目标还剩余debuff,则更新,否则删除条目
                if (remainList.length > 0)
                {
                    this.activeDeBuffs.set(targetId,remainList);
                } else {
                    this.activeDeBuffs.delete(targetId);
                }
            }
        },GAME_CONSTANTS.DEBUFF_TICK_INTERVAL_MS);
    }
}

module.exports = {DeBuffManager};