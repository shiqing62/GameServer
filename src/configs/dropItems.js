/**
 * 掉落道具配置
 */
const DROP_ITEM_POOL = [
    { id: 2001, name: "PU_FrostNova",   weight: 100 },
    { id: 2002, name: "PU_SpeedUP",     weight: 100 },
    { id: 2003, name: "PU_Rage",        weight: 100 },
    { id: 2004, name: "PU_Flash",       weight: 100 },
    { id: 2005, name: "PU_Shield",      weight: 100 },
    { id: 2006, name: "PU_Cleanse",     weight: 100 },
    { id: 2007, name: "PU_Magnet",      weight: 100 },
    { id: 2008, name: "PU_Lightning",   weight: 100 },
    { id: 2009, name: "PU_SwordDance",  weight: 100 },
    { id: 2010, name: "PU_SkyBoom",     weight: 100 },
    { id: 2011, name: "PU_TimeGap",     weight: 100 },
    { id: 2012, name: "PU_HealthZone",  weight: 100 },
    { id: 2013, name: "PU_MagicBeam",   weight: 100 },
];

function getDropItemPool(){
    console.log("--->>>getDropItemPool!!");
    return DROP_ITEM_POOL;
}

module.exports = {getDropItemPool};