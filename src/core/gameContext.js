/**
 *
 */
class GameContext{
    constructor() {
        this.managers = new Map();
        this.handlers = new Map();
        this.services = new Map();
    }

    registerManager(name,instance){
        this.managers.set(name,instance);
    }

    registerHandler(name,instance){
        this.handlers.set(name,instance);
    }

    registerService(name,instance){
        this.services.set(name,instance);
    }

    getManager(name){
        return this.managers.get(name);
    }

    getHandler(name) {
        return this.handlers.get(name);
    }

    getService(name) {
        return this.services.get(name);
    }
}

module.exports = GameContext;