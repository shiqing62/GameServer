const {BossStoneGolem} = require('./boss_stoneGolem.js');
const {BossDragon} = require('./boss_dragon.js');
const {BossIceSnake} = require('./boss_iceSnake.js');

function BossFactory({bossId,id,chunk,position,pathfinder}) {
   switch (bossId){
       case 101:
           return new BossStoneGolem({bossId,id,chunk,position,pathfinder});
       case 102:
           return new BossDragon({bossId,id,chunk,position,pathfinder});
       case 103:
           return new BossIceSnake({bossId,id,chunk,position,pathfinder});
       default:
           throw new Error(`Unknown bossId: ${bossId}`);
   }
}

module.exports = {BossFactory};