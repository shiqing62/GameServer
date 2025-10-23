const path = require('path');
const fs = require("fs");
const flatBuffers = require('flatbuffers');
const {Map} = require('../schemas/generated/javascript/game/map/map.js');
const chunk_size = 32;

// 读取二进制地图
const mapFilePath = path.join(__dirname, "../mapData/bin/MultiPlayerMapData.bin");
const data = fs.readFileSync(mapFilePath);
const buf = new flatBuffers.ByteBuffer(new Uint8Array(data));
const map = Map.getRootAsMap(buf);


// 在给定的地块中,随机返回一个避开摆件的坐标点
function getRandomPos(chunk_x, chunk_y) {
    // 找到对应的chunk
    let chunk = null;
    for (let i = 0; i < map.chunksLength(); i++) {
        const c = map.chunks(i);
        if (c.x() === chunk_x && c.y() === chunk_y) {
            chunk = c;
            break;
        }
    }

    if (!chunk) {
        throw new Error(`chunk(${chunk_x},${chunk_y}) not found`);
    }

    const originX = chunk_x * chunk_size;
    const originY = chunk_y * chunk_size;

    const MAX_TRY = 50;
    for (let i = 0; i < MAX_TRY; i++) {
        // 随机生成一个点
        const rx = originX + Math.random() * chunk_size;
        const rz = originY + Math.random() * chunk_size;
        const ry = 0;   // 暂时不考虑高度

        // 检测是否与任何prop相交
        let valid = true;
        for (let j = 0; j < chunk.propsLength(); j++) {
            const prop = chunk.props(j);
            const p = prop.pos();
            const s = prop.size();

            // AABB边界
            const minX = p.x() - s.x() / 2;
            const maxX = p.x() + s.x() / 2;
            const minZ = p.z() - s.z() / 2;
            const maxZ = p.z() + s.z() / 2;

            if (rx >= minX && rx <= maxX && rz >= minZ && rz <= maxZ) {
                valid = false;
                break;
            }
        }

        if (valid) {
            return {
                x: Math.round(rx * 100) / 100,
                y: Math.round(ry * 100) / 100,
                z: Math.round(rz * 100) / 100
            };
        }
    }

    // 如果尝试多次都失败，则返回chunk的中心点
    return {
        x: Math.round((originX + chunk_size / 2) * 100) / 100,
        y: 0,
        z: Math.round((originY + chunk_size / 2) * 100) / 100,
    };
}

/**
 * 获取指定chunk的障碍物集合
 * @param {number} chunk_x
 * @param {number} chunk_y
 * @returns {Array<{x1:number,x2:number,z1:number,z2:number}>} - 每个障碍物的AABB范围
 */
function getObstacles(chunk_x, chunk_y) {
    let chunk = null;
    for (let i = 0; i < map.chunksLength(); i++) {
        const c = map.chunks(i);
        if (c.x() === chunk_x && c.y() === chunk_y) {
            chunk = c;
            break;
        }
    }
    if (!chunk) return [];

    const obstacles = [];
    for (let j = 0; j < chunk.propsLength(); j++) {
        const prop = chunk.props(j);
        const p = prop.pos();
        const s = prop.size();
        if (!p || !s) continue;

        const x1 = p.x() - s.x() / 2;
        const x2 = p.x() + s.x() / 2;
        const z1 = p.z() - s.z() / 2;
        const z2 = p.z() + s.z() / 2;

        obstacles.push({x1, x2, z1, z2});
    }

    return obstacles;
}

/**
 * 获取当前chunk及周围8个chunk的所有障碍物(边缘或者角落会自动缩减)
 * @param {number} chunk_x 当前chunk的x坐标
 * @param {number} chunk_y 当前chunk的y坐标
 * @returns {Array<{x1:number,x2:number,z1:number,z2:number}>} - 每个障碍物的AABB范围
 */
function getObstaclesWithNeighbors(chunk_x, chunk_y) {
    const obstacles = [];

    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            const nx = chunk_x + dx;
            const ny = chunk_y + dy;

            // 过滤非法chunk
            let chunk = null;
            for (let i = 0; i < map.chunksLength(); i++) {
                const c = map.chunks(i);
                if (c.x() === nx && c.y() === ny) {
                    chunk = c;
                    break;
                }
            }
            if (!chunk) continue;
            console.log(`--->>>chunk_x: ${chunk.x()} chunk_y: ${chunk.y()}`);
            // 提取障碍物
            for (let j = 0; j < chunk.propsLength(); j++) {
                const prop = chunk.props(j);
                const p = prop.pos();
                const s = prop.size();
                if (!p || !s) continue;

                const x1 = p.x() - s.x() / 2;
                const x2 = p.x() + s.x() / 2;
                const z1 = p.z() - s.z() / 2;
                const z2 = p.z() + s.z() / 2;

                obstacles.push({x1, x2, z1, z2});
            }
        }
    }

    return obstacles;
}


module.exports = {getRandomPos, getObstaclesWithNeighbors};