/**
 * 玩家持久化存储数据
 */
class PlayerPersistentData{
    constructor({uid}) {
        this.uid = uid;
        console.log("--->>>玩家持久化数据存储构造函数：",uid);
    }
}

module.exports = PlayerPersistentData;