const MsgIds = {
    // 1xxxx
    RequestId:{
        Login: 11001,
        EnterGame: 11002,
        ExitGame : 11003,
        PlayerMove: 12003,
        SkillSyncs: 13001,
        DamageSyncs: 13002,
        PlayerStateSyncs: 13003,
        PickupDropItem: 14001,
        DeBuffSyncs: 15001,
    },

    // 2xxxx
    ResponseId:{
        Login: 21001,
        EnterGame: 21002,
        PlayerMove: 22003,
        PickupDropItem: 24001,
    },

    // 3xxxx
    ServerPushId:{
        PlayerEnter: 32001,  // 玩家进入时通知给相互视野内的其他玩家
        PlayerExit: 32002,   // 离开
        PlayerMove: 32003,   // 玩家移动
        PlayerAttack: 32004,
        SkillSyncs: 33001,   // 技能同步
        DamageSyncs: 33002,  // 伤害同步
        PlayerStateSyncs: 33003,  // 玩家状态同步,包括Hp,Level......
        DropItem: 34001,     // 掉落道具
        PickupDropItem: 34002,
        DeBuffSyncs: 35001,
    }
};

module.exports = MsgIds;