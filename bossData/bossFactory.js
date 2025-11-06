const {BossStoneGolem} = require('./boss_stoneGolem.js');

function BossFactory({bossId,id,chunk,position,pathfinder}) {
   switch (bossId){
       case 101:
           return new BossStoneGolem({bossId,id,chunk,position,pathfinder});

       default:
           throw new Error(`Unknown bossId: ${bossId}`);
   }
}

module.exports = {BossFactory};