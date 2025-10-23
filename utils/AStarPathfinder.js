class AStarPathfinder {
    constructor(obstacles, chunkOrigin, gridSize = 0.25, chunkSize = 32) {
        this.gridSize = gridSize;
        this.chunkSize = chunkSize;
        this.chunkOrigin = chunkOrigin; // {x, z}
        this.obstacles = obstacles;
        this.grid = this.buildGrid(obstacles);
    }

    setCachedObstacles(allObstacles)
    {
        this.allObstacles = allObstacles || [];
    }

    getActiveObstacles(chunk_x,chunk_y)
    {
        if (!this.allObstacles) return this.obstacles || [];

        const chunkSize = this.chunkSize;
        const minX = chunk_x * chunkSize;
        const maxX = (chunk_x+1) * chunkSize;
        const minZ = chunk_y *chunkSize;
        const maxZ = (chunk_y + 1) * chunkSize;

        return this.allObstacles.filter(o=> !(o.x2 < minX || o.x1 > maxX || o.z2 < minZ || o.z1 > maxZ));
    }

    // 根据当前的chunk动态更新grid
    updateGridForChunk(chunk_x,chunk_y)
    {
        const obstacles = this.getActiveObstacles(chunk_x,chunk_y);
        const chunkOrigin = {x: chunk_x * this.chunkSize, z: chunk_y * this.chunkSize};
        this.chunkOrigin = chunkOrigin;
        this.obstacles = obstacles;
        this.grid = this.buildGrid(obstacles);
    }

    buildGrid(obstacles) {
        const cellsPerRow = Math.floor(this.chunkSize / this.gridSize);
        const grid = new Array(cellsPerRow);

        for (let x = 0; x < cellsPerRow; x++) {
            grid[x] = new Array(cellsPerRow);
            for (let z = 0; z < cellsPerRow; z++) {
                const worldX = this.chunkOrigin.x + x * this.gridSize;
                const worldZ = this.chunkOrigin.z + z * this.gridSize;
                grid[x][z] = !this.isBlocked(worldX, worldZ, obstacles);
            }
        }

        return grid;
    }

    isBlocked(x, z, obstacles) {
        const pad = 0.1;
        return obstacles.some(o =>
            x >= o.x1 - pad && x <= o.x2 + pad &&
            z >= o.z1 - pad && z <= o.z2 + pad
        );
    }

    toGridCoords(pos) {
        return {
            x: Math.floor((pos.x - this.chunkOrigin.x) / this.gridSize),
            z: Math.floor((pos.z - this.chunkOrigin.z) / this.gridSize),
        };
    }

    key(n) {
        return `${n.x},${n.z}`;
    }

    heuristic(a, b) {
        // 曼哈顿距离
        return Math.abs(a.x - b.x) + Math.abs(a.z - b.z);
    }

    getNeighbors(n) {
        return [
            { x: n.x + 1, z: n.z },
            { x: n.x - 1, z: n.z },
            { x: n.x, z: n.z + 1 },
            { x: n.x, z: n.z - 1 },
        ];
    }

    isWalkable(n) {
        return (
            n.x >= 0 && n.z >= 0 &&
            n.x < this.grid.length &&
            n.z < this.grid[0].length &&
            this.grid[n.x][n.z]
        );
    }

    findPath(start, end) {
        const startNode = this.toGridCoords(start);
        const endNode = this.toGridCoords(end);
        const open = [startNode];
        const cameFrom = {};
        const gScore = { [this.key(startNode)]: 0 };
        const fScore = { [this.key(startNode)]: this.heuristic(startNode, endNode) };

        while (open.length > 0) {
            open.sort((a, b) => fScore[this.key(a)] - fScore[this.key(b)]);
            const current = open.shift();

            if (current.x === endNode.x && current.z === endNode.z) {
                let path = this.reconstructPath(cameFrom, current);
                path = this.smoothPath(path, this.obstacles);
                return path;
            }

            for (const neighbor of this.getNeighbors(current)) {
                if (!this.isWalkable(neighbor)) continue;

                const tentative = gScore[this.key(current)] + 1;
                const keyN = this.key(neighbor);
                if (tentative < (gScore[keyN] || Infinity)) {
                    cameFrom[keyN] = current;
                    gScore[keyN] = tentative;
                    fScore[keyN] = tentative + this.heuristic(neighbor, endNode);
                    if (!open.some(n => n.x === neighbor.x && n.z === neighbor.z)) {
                        open.push(neighbor);
                    }
                }
            }
        }

        return [];
    }

    reconstructPath(cameFrom, current) {
        const path = [current];
        const visited = new Set();
        let safety = 0;

        while (current && !visited.has(this.key(current))){
            visited.add(this.key(current));
            path.push(current);
            current = cameFrom[this.key(current)];
            safety++;
            if (safety > 10000) {
                console.warn("[AStar] Path reconstruct exceeded safety limit");
                break;
            }
        }

        return path.reverse().map(n => ({
            x: n.x * this.gridSize + this.gridSize / 2 + this.chunkOrigin.x,
            z: n.z * this.gridSize + this.gridSize / 2 + this.chunkOrigin.z
        }));
    }

    // 路径平滑函数
    smoothPath(path, obstacles) {
        if (!path || path.length <= 2) return path;

        const smoothed = [path[0]]; // 起点始终保留
        let i = 0;
        while(i < path.length - 1){
            let j = path.length - 1;
            let found = false;

            while(j > i+1){
                if (!this.lineIntersectsObstacles(path[i],path[j],obstacles)){
                    smoothed.push(path[j]);
                    i = j;
                    found = true;
                    break;
                }
                j--;
            }

            if (!found){
                smoothed.push(path[i + 1]);
            }
        }

        return smoothed;
    }

    // 辅助函数：检测线段是否与障碍物相交
    lineIntersectsObstacles(p1, p2, obstacles) {
        for (const obs of obstacles) {
            // 简化成轴对齐矩形检测
            if (this.lineIntersectsRect(p1, p2, obs)) {
                return true;
            }
        }
        return false;
    }

    // 基础几何：线段与矩形是否相交
    lineIntersectsRect(p1, p2, rect) {
        const rectEdges = [
            [{x: rect.x1, z: rect.z1}, {x: rect.x2, z: rect.z1}],
            [{x: rect.x2, z: rect.z1}, {x: rect.x2, z: rect.z2}],
            [{x: rect.x2, z: rect.z2}, {x: rect.x1, z: rect.z2}],
            [{x: rect.x1, z: rect.z2}, {x: rect.x1, z: rect.z1}]
        ];

        for (const [a, b] of rectEdges) {
            if (this.segmentsIntersect(p1, p2, a, b)) return true;
        }

        return false;
    }

    segmentsIntersect(p1, p2, q1, q2) {
        const cross = (a, b, c) => (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x);
        const d1 = cross(p1, p2, q1);
        const d2 = cross(p1, p2, q2);
        const d3 = cross(q1, q2, p1);
        const d4 = cross(q1, q2, p2);
        return d1 * d2 < 0 && d3 * d4 < 0;
    }
}



module.exports = {AStarPathfinder};