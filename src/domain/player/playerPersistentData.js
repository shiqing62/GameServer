/**
 * 玩家持久化存储数据
 */
class PlayerPersistentData{
    constructor({uid,characters}) {
        console.log("--->>>玩家持久化数据存储构造函数：",uid);
        this.uid = uid;
        this.characters = characters;
    }
}

module.exports = PlayerPersistentData;