class Scene {
    constructor(sceneId) {
        this.sceneId = sceneId;
        this.players = new Map();
    }

    addPlayer(player) {
        this.players.set(player.uid, player);
    }

    removePlayer(uid) {
        this.players.delete(uid);
    }

    getAllPlayers() {
        return Array.from(this.players.values());
    }
}

module.exports = Scene;