GameServer/
├─ src/                    ★ 所有代码都在这里
│
│  ├─ core/                ★ 核心驱动（不碰具体业务）
│  │   ├─ gameLoop.js
│  │   ├─ systemScheduler.js（可选）
│  │   ├─ time.js（可选）
│  │   └─ logger.js（可选）
│  │
│  ├─ systems/             ★ 所有“行为逻辑”
│  │   ├─ movementSystem.js
│  │   ├─ combatSystem.js
│  │   ├─ bossSystem.js
│  │   ├─ dropSystem.js
│  │   ├─ buffSystem.js
│  │   ├─ rankSystem.js
│  │   └─ syncSystem.js
│  │
│  ├─ managers/            ★ 纯状态管理
│  │   ├─ playerManager.js
│  │   ├─ bossManager.js
│  │   ├─ dropManager.js
│  │   ├─ debuffManager.js
│  │   └─ rankManager.js
│  │
│  ├─ controllers/         ★ 所有网络/外部入口
│  │   ├─ loginController.js
│  │   ├─ enterGameController.js
│  │   ├─ moveController.js
│  │   ├─ skillController.js
│  │   ├─ pickupController.js
│  │   ├─ gmController.js
│  │   └─ ...
│  │
│  ├─ network/             ★ 网络层（协议/连接）
│  │   ├─ server.js
│  │   ├─ wsServer.js
│  │   └─ sessionManager.js
│  │
│  ├─ schemas/             ★ ★ FlatBuffers / 协议
│  │   ├─ fbs/
│  │   │   ├─ player.fbs
│  │   │   ├─ battle.fbs
│  │   │   └─ rank.fbs
│  │   │
│  │   ├─ generated/       ★ 自动生成代码
│  │   │   ├─ js/
│  │   │   └─ ts/
│  │   └─ README.md
│  │
│  ├─ shared/              ★ 跨层通用模块
│  │   ├─ constants.js
│  │   ├─ enums.js
│  │   ├─ utils/
│  │   └─ math/
│  │
│  ├─ config/              ★ 配置
│  │   ├─ game.config.js
│  │   └─ server.config.js
│  │
│  └─ index.js             ★ 程序入口
│
├─ scripts/                ★ 构建 / 工具脚本
│  ├─ gen-schema.js
│  └─ start-dev.js
│
├─ test/
│
├─ package.json
├─ package-lock.json
└─ README.md
