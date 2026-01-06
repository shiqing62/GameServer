// core/gameLoop.js

class GameLoop {
    constructor({tickRate = 20, maxDelta = 0.1, systems = []}) {
        this.tickRate = tickRate;
        this.tickInterval = 1000 / tickRate;
        this.maxDelta = maxDelta;

        this.systems = systems;
        this._running = false;
        this._lastTime = 0;
        this._timer = null;

        this.frame = 0;
        this.time = 0;
    }

    start() {
        if (this._running) return;

        this._running = true;
        this._lastTime = Date.now();

        this._timer = setInterval(() => {
            this._tick();
        }, this.tickInterval);

        console.log(`--->>>[GameLoop] started @ ${this.tickRate} TPS`);
    }

    stop() {
        if (!this._running) return;

        clearInterval(this._timer);
        this._timer = null;
        this._running = false;

        console.log("--->>>[GameLoop] stopped!")
    }

    _tick() {
        const now = Date.now();
        let delta = (now - this._lastTime) / 1000;
        this._lastTime = now;

        // 防止长时间阻塞导致 delta 爆炸
        if (delta > this.maxDelta) {
            delta = this.maxDelta;
        }

        this.time += delta;
        this.frame++;

        // 按顺序驱动所有system
        for (const system of this.systems) {
            try {
                system.update(delta, this.time, this.frame);
            } catch (err) {
                console.error(`[GameLoop] System ${system.constructor.name} error`);
            }
        }
    }

    addSystem(system) {
        this.systems.push(system);
    }

}

module.exports = GameLoop;