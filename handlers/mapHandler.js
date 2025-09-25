const path = require('path');
const fs = require("fs");
const flatBuffers = require('flatbuffers');
const { Map } = require('../schemas/generated/javascript/game/map/map.js');
const chunk_size = 32;

// 读取二进制地图
const mapFilePath = path.join(__dirname,"../mapData/bin/MultiPlayerMapData.bin");
const data = fs.readFileSync(mapFilePath);
const buf = new flatBuffers.ByteBuffer(new Uint8Array(data));
const map = Map.getRootAsMap(buf);


// 在给定的地块中,随机返回一个避开摆件的坐标点
function getRandomPos(chunk_x,chunk_y){
    // 找到对应的chunk
    let chunk = null;
    for (let i = 0; i < map.chunksLength(); i++){
        const c = map.chunks(i);
        if (c.x() === chunk_x && c.y() === chunk_y){
            chunk = c;
            break;
        }
    }

    if (!chunk)
    {
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

            if (rx >= minX && rx <= maxX && rz >= minZ && rz <= maxZ){
                valid = false;
                break;
            }
        }

        if (valid)
        {
            return {
                x: Math.round(rx * 100) / 100,
                y: Math.round(ry * 100) / 100,
                z: Math.round(rz * 100) / 100
            };
        }

        // 如果尝试多次都失败，则返回chunk的中心点
        return {
            x: Math.round((originX + chunk_size / 2) * 100) / 100,
            y: 0,
            z: Math.round((originY + chunk_size / 2) * 100) / 100,
        };
    }
}

module.exports = {getRandomPos};