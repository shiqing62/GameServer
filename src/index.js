const GameServer = require('./bootstrap/gameServer.js');

const server = new GameServer();
server.start();

// 模拟登录
// const path = require('path');
// const PlayerRepository = require('./repositories/playerRepository.js');
// const PlayerAccountService = require('./services/playerAccountService.js');

// const dataPath = path.resolve(__dirname, 'data/players.json');
// const playerRepo = new PlayerRepository(dataPath);
// const accountService = new PlayerAccountService(playerRepo);
//
// const player1 = accountService.login();
// console.log("--->>>first login uid: ", player1.uid);
//
// const player2 = accountService.login(player1.uid);
// console.log("--->>>login with uid: ", player2.uid);
//
// console.log("--->>>all persistent players: "+ playerRepo.getAll());