const MsgIds = {
    RequestId:{
        Login: 1001,
        EnterGame: 1002,
        ExitGame : 1003,
        PlayerMove: 2003,
        SkillSyncs: 3001,
        DamageSyncs: 3002,
        PlayerStateSyncs: 3003,
        PickupDropItem: 4001,
    },

    ResponseId:{
        Login: 1001,
        EnterGame: 1002,
        PlayerMove: 2003,
        PickupDropItem: 4001,
    },

    ServerPushId:{
        PlayerEnter: 2001,  // 玩家进入时通知给相互视野内的其他玩家
        PlayerExit: 2002,   // 离开
        PlayerMove: 20031,   // 玩家移动
        PlayerAttack: 2004,
        SkillSyncs: 3001,   // 技能同步
        DamageSyncs: 3002,  // 伤害同步
        PlayerStateSyncs: 3003,  // 玩家状态同步,包括Hp,Level......
        DropItem: 4001,     // 掉落道具
    }
};

module.exports = MsgIds;