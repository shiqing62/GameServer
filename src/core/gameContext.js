/**
 *
 */
class GameContext{
    constructor() {
        this.managers = new Map();
        this.handlers = new Map();
        this.services = new Map();
        this.repositories = new Map();
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

    registerRepository(name,instance){
        this.repositories.set(name,instance);
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

    getRepository(name){
        return this.repositories.get(name);
    }
}

module.exports = GameContext;