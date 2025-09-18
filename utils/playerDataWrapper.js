const {PlayerData} = require('../schemas/generated/javascript/game/player/player-data.js');
const {Vec3} = require('../schemas/generated/javascript/game/common/vec3.js');
const {GAME_CONSTANTS} = require('../utils/GAME_CONSTANTS.js');

class PlayerDataWrapper{
    constructor(fbPlayer,ws,initData = {}) {
        this.fb = fbPlayer;
        this.ws = ws;
        this.data = fbPlayer?{
            uid: fbPlayer.uid(),
            nickName: fbPlayer.nickName() || '',
            characterId: fbPlayer.characterId(),
            roomId: fbPlayer.roomId(),
            score: fbPlayer.score(),
            ranking: fbPlayer.ranking(),
            pos: {
                x: fbPlayer.pos()?.x() || 0,
                y: fbPlayer.pos()?.y() || 0,
                z: fbPlayer.pos()?.z() || 0,
            },
            dir: {
                x: fbPlayer.dir()?.x() || 0,
                y: fbPlayer.dir()?.y() || 0,
                z: fbPlayer.dir()?.z() || 0,
            },
            level: fbPlayer.level(),
            maxHp: fbPlayer.maxHp(),
            hp: fbPlayer.hp(),
            weapons: Array.from({length: fbPlayer.weaponsLength()},(_,i) => fbPlayer.weapons(i)),
            passives: Array.from({length: fbPlayer.passivesLength()},(_,i) => fbPlayer.passives(i)),
            pets: Array.from({length: fbPlayer.petsLength()},(_,i) => fbPlayer.pets(i))
        }:{
            uid: initData.uid ?? 0,
            nickName: initData.nickName ?? '',
            characterId: initData.characterId ?? 0,
            roomId: initData.roomId ?? 1,
            score: initData.score ?? 0,
            ranking: initData.ranking ?? 0,
            pos: initData.pos ?? { x: 0, y: 0, z: 0 },
            dir: initData.dir ?? { x: 0, y: 0, z: 0 },
            level: initData.level ?? 1,
            maxHp: initData.maxHp ?? GAME_CONSTANTS.INIT_HP,
            hp: initData.hp ?? GAME_CONSTANTS.INIT_HP,
            weapons: initData.weapons ?? [],
            passives: initData.passives ?? [],
            pets: initData.pets ?? [],
        };
    }

    // 本局唯一数据,不得更改
    get uid() {return this.data.uid;}
    get nickName() {return this.data.nickName;}
    get characterId() {return this.data.characterId;}
    get roomId() {return this.data.roomId;}

    // 可修改的
    get level() {return this.data.level;}
    set level(value) {this.data.level = value;}
    get hp() {return this.data.hp;}
    set hp(value) {this.data.hp = value};
    get maxHp() {return this.data.maxHp;}
    set maxHp(value) {this.data.maxHp = value;}
    get pos() {return this.data.pos;}
    set pos(value) {this.data.pos = value;}
    get dir() {return this.data.dir;}
    set dir(value) {this.data.dir = value;}
    get score() {return this.data.score;}
    set score(value) {this.data.score = value;}
    get ranking() {return this.data.ranking;}
    set ranking(value){this.data.ranking = value;}
    get weapons() {return this.data.weapons;}
    set weapons(value) {this.data.weapons = value;}
    get passives() {return this.data.passives;}
    set passives(value) {this.data.passives = value;}
    get pets() {return this.data.pets;}
    set pets(value) {this.data.pets = value;}

    buildFB(builder){
        const nickNameOffset = builder.createString(this.data.nickName);
        const posOffset = Vec3.createVec3(builder,this.data.pos.x,this.data.pos.y,this.data.pos.z);
        const dirOffset = Vec3.createVec3(builder,this.data.dir.x,this.data.dir.y,this.data.dir.z);

        PlayerData.startPlayerData(builder);
        PlayerData.addUid(builder,this.data.uid);
        PlayerData.addNickName(builder,nickNameOffset);
        PlayerData.addCharacterId(builder,this.data.characterId);
        PlayerData.addRoomId(builder,this.data.roomId);
        PlayerData.addScore(builder,this.data.score);
        PlayerData.addRanking(builder,this.data.ranking);
        PlayerData.addPos(builder,posOffset);
        PlayerData.addDir(builder,dirOffset);
        PlayerData.addLevel(builder,this.data.level);
        PlayerData.addHp(builder,this.data.hp);
        PlayerData.addWeapons(builder,PlayerData.createWeaponsVector(builder,this.data.weapons));
        PlayerData.addPassives(builder,PlayerData.createPassivesVector(builder,this.data.passives));
        PlayerData.addPets(builder,PlayerData.createPetsVector(builder,this.data.pets));

        return PlayerData.endPlayerData(builder);
    }
}

module.exports = {PlayerDataWrapper};