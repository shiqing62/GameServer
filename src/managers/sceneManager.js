const Scene = require('../domain/scene/scene.js');

class SceneManager{
    constructor() {
        this.scenes = new Map();

        this._initScenes(101);
    }

    _initScenes(sceneId){
        this.scenes.set(sceneId,new Scene());
    }

    get(sceneId){
        return this.scenes.get(sceneId) || null;
    }

    /**
     * 进入场景
     */
    enterScene(player,sceneId,characterId){
        const scene = this.scenes.get(sceneId);
        if (!scene) {
            return false;
        }

        player.sceneId = sceneId;
        player.characterId = characterId;
        player.inWorld = true;

        scene.addPlayer(player);
        return true;
    }

    /**
     * 离开场景
     */
    exitScene(player){
        if (!player.sceneId) {
            return;
        }

        const scene = this.get(player.sceneId);
        if (!scene) {
            return;
        }

        scene.removePlayer(player.uid);

        player.sceneId = null;
        player.inWorld = false;
    }
}

module.exports = SceneManager;