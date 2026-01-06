/**
 * 游戏运行期间的全局常量
 */

const PLAYER = {
    INIT_HP: 220
}

const WORLD= {
    CHUNK_COUNT_X: 20,
    CHUNK_COUNT_Y: 20,
    CHUNK_SIZE: 32,

    VIEW_RANGE_WIDTH: 1600,
    VIEW_RANGE_HEIGHT: 900,
}

const NETWORK = {
    SYNCS_INTERVAL_MS: 100
}

const DEBUFF = {
    TICK_INTERVAL_MS: 100
}

const GAMELOOP = {
    TICK_RATE: 20,
    MAX_DELTA: 0.1
}

module.exports = {
    PLAYER,
    WORLD,
    NETWORK,
    DEBUFF,
    GAMELOOP
}