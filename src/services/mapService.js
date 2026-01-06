/**
 * 世界地图服务：
 * - 加载地图数据
 * - 提供 chunk 查询能力
 * - 提供避开障碍物的随机坐标
 *  - 提供障碍物 AABB 查询
 */

const path = require('path');
const fs = require('fs');
const flatBuffers = require('flatbuffers');
const {Map} = require('../../schemas/generated/javascript/game/map/map.js');
const CONSTANTS = require('../shared/constants.js');


class MapService {
    constructor() {
        this._map = null;
        this._loadMap();
    }

    /**
     * 加载 map 数据
     * @private
     */
    _loadMap() {
        const mapFilePath = path.join(__dirname, "../../mapData/bin/MultiPLayerMapData.bin");
        const data = fs.readFileSync(mapFilePath);
        const buf = new flatBuffers.ByteBuffer(new Uint8Array(data));
        this._map = Map.getRootAsMap(buf);

        console.log("--->>>[MapService] map loaded!");
    }

    /**
     * 查找指定 chunk
     * @private
     */
    _getChunk(chunk_x, chunk_y) {
        for (let i = 0; i < this._map.chunksLength(); i++) {
            const c = this._map.chunks(i);
            if (c.x() === chunk_x && c.y() === chunk_y) {
                return c;
            }
        }

        return null;
    }

    /**
     * 在指定的 chunk 中随机返回一个避开障碍物的坐标
     */
    getRandomFreePosition(chunk_x, chunk_y) {
        console.log("--->>>在指定的 chunk 中随机返回一个避开障碍物的坐标");
        const chunk = this._getChunk(chunk_x, chunk_y);
        console.log("--->>>chunk: ",chunk);
        if (!chunk) {
            throw new Error(`Chunk (${chunk_x}, ${chunk_y}) not found!`);
        }

        const origin_x = chunk_x * CONSTANTS.WORLD.CHUNK_SIZE;
        const origin_z = chunk_y * CONSTANTS.WORLD.CHUNK_SIZE;
        console.log("--->>>origin_x: ",origin_x);
        console.log("--->>>origin_z: ",origin_z);

        for (let i = 0; i < 50; i++) {
            console.log("--->>>i: ",i);
            const x = origin_x + Math.random() * CONSTANTS.WORLD.CHUNK_SIZE;
            const z = origin_z + Math.random() * CONSTANTS.WORLD.CHUNK_SIZE;
            const y = 0;
            console.log("--->>>chunk.propsLength(): ",chunk.propsLength());
            let valid = true;

            for (let j = 0; j < chunk.propsLength(); j++) {
                const prop = chunk.props(j);
                const p = prop.pos();
                const s = prop.size();

                const minX = p.x() - s.x() / 2;
                const maxX = p.x() + s.x() / 2;
                const minZ = p.z() - s.z() / 2;
                const maxZ = p.z() + s.z() / 2;

                if (x >= minX && x <= maxX && z >= minZ && z <= maxZ) {
                    valid = false;
                    break;
                }
            }
            console.log("--->>>valid: ",valid);

            if (valid) {
                return {
                    x: Math.round(x * 100) / 100,
                    y: 0,
                    z: Math.round(z * 100) / 100
                };
            }
        }

        console.log("--->>>fallback!!!");
        // fallback :chunk 中心
        return {
            x: Math.round((origin_x + CONSTANTS.WORLD.CHUNK_SIZE / 2) * 100) / 100,
            y: 0,
            z: Math.round((origin_z + CONSTANTS.WORLD.CHUNK_SIZE / 2) * 100) / 100
        };
    }

    /**
     * 获取指定 chunk 的障碍物 AABB
     * @param chunk_x
     * @param chunk_y
     */
    getObstacles(chunk_x, chunk_y) {
        const chunk = this._getChunk(chunk_x, chunk_y);
        if (!chunk) return [];

        const obstacles = [];

        for (let i = 0; i < chunk.propsLength(); i++) {
            const prop = chunk.props(i);
            const p = prop.pos();
            const s = prop.size();

            if (!p || !s) continue;

            obstacles.push({
                x1: p.x() - s.x() / 2,
                x2: p.x() + s.x() / 2,
                z1: p.z() - s.z() / 2,
                z2: p.z() + s.z() / 2,
            });
        }

        return obstacles;
    }

    /**
     * 获取当前 chunk + 周围8个 chunk 的障碍物AABB
     */
    getObstaclesWithNeighbors(chunk_x, chunk_y) {
        const obstacles = [];

        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const nx = chunk_x + dx;
                const ny = chunk_y + dy;

                const chunk = this._getChunk(nx, ny);
                if (!chunk) continue;

                for (let i = 0; i < chunk.propsLength(); i++) {
                    const prop = chunk.props(i);
                    const p = prop.pos();
                    const s = prop.size();
                    if (!p || !s) continue;

                    obstacles.push({
                        x1: p.x() - s.x() / 2,
                        x2: p.x() + s.x() / 2,
                        z1: p.z() - s.z() / 2,
                        z2: p.z() + s.z() / 2,
                    });
                }
            }
        }

        return obstacles;
    }
}

module.exports = MapService;