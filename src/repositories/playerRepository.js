/**
 * 持久化玩家账号数据（纯数据层Repository）
 * uid分配
 * read/write 磁盘
 */

const fs = require('fs');
const path = require('path');
const PlayerPersistentData = require('../domain/player/playerPersistentData.js');

class PlayerRepository{
    constructor(filePath = 'src/data/players.json') {
        this.filePath = path.resolve(process.cwd(),filePath);

        this.lastUid = 0;
        this.players = new Map();

        this._ensureFile();
        this._loadFromDisk();
    }


    /**
     * 根据玩家uid获取持久化数据
     * @param uid
     * @returns {any|null}
     */
    getByUid(uid){
        return this.players.get(uid) || null;
    }


    /**
     * 创建新玩家（仅分配uid）
     * @returns {{uid: *}}
     */
    create(){
        const uid = this._allocUid();
        const player = new PlayerPersistentData({uid});

        this.players.set(uid,player);
        return player;
    }


    /**
     * 保存玩家（持久化）
     * @param player
     */
    save(player){
        if (!player || !player.uid){
            throw new Error('Invalid player data!');
        }

        this.players.set(player.uid,player);
        this._saveToDisk();
    }

    /**
     * 获取所有持久化玩家
     * @returns {any[]}
     */
    getAll(){
        return Array.from(this.players.values());
    }


    _allocUid(){
        this.lastUid++;
        return this.lastUid;
    }

    _ensureFile(){
        const dir = path.dirname(this.filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        if (!fs.existsSync(this.filePath)) {
            fs.writeFileSync(
                this.filePath,
                JSON.stringify({ lastUid: 10000, players: {} }, null, 2),
                'utf-8'
            );
        }
    }

    _loadFromDisk(){
        const raw = fs.readFileSync(this.filePath, 'utf-8').trim();

        if (!raw) {
            throw new Error(`players.json is empty: ${this.filePath}`);
        }

        const data = JSON.parse(raw);

        this.lastUid = data.lastUid || 0;

        for (const uid in data.players) {
            this.players.set(Number(uid), data.players[uid]);
        }
    }

    _saveToDisk(){
        const obj = {
            lastUid: this.lastUid,
            players: {}
        };

        for (const [uid,player] of this.players.entries()) {
            obj.players[uid] = player;
        }

        fs.writeFileSync(this.filePath,JSON.stringify(obj,null,2),'utf-8');
    }
}

module.exports = PlayerRepository;