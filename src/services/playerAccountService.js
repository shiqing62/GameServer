const Player = require('../domain/player/playerRuntimeData.js');

class PlayerAccountService{
    constructor(playerRepository) {
        this.playerRepository = playerRepository;
    }

    /**
     * 登录接口
     * @param {number} uid 客户端传来的 uid，0 表示无账号
     */
    login(uid = 0){
        // 客户端声明没有有效的账号信息
        if (!uid || uid === 0){
            return this._createAccount();
        }

        // 复登
        const player = this.playerRepository.getByUid(uid);
        if (player){
            return player;
        }

        // fallback --> uid伪造等等
        return this._createAccount();
    }


    _createAccount(){
        const player = this.playerRepository.create();
        this.playerRepository.save(player);
        return player;
    }
}

module.exports = PlayerAccountService;