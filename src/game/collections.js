/* ============================================================
   collections.js — état persistant des collections du joueur
   (cards, pets, artefacts, skills, statues, étoiles…)
   Tout est cliquable et sauvegardé localement.
   ============================================================ */
const KEY='iom_collections';

export function loadCollections(){
  try{ return JSON.parse(localStorage.getItem(KEY)||'{}'); }catch{ return {}; }
}
export function saveCollections(c){ localStorage.setItem(KEY, JSON.stringify(c)); }

/** cycle l'état d'une carte : absent→std→gilded→poly→infernal */
export function cycleCard(col, id){
  col.cards ||= {};
  col.cards[id] = ((col.cards[id]||0) + 1) % 5;
  return col.cards[id];
}
export function setAllCards(col, v){
  col.cards ||= {};
  for(const k of Object.keys(col.cards)) col.cards[k]=v;
  col.bulkState=v;
}
/** Applique un état à toutes les cartes actuellement visibles (monde débloqué). */
export function setAllVisible(col, v, visibleIds){
  col.cards ||= {};
  for(const id of visibleIds) col.cards[id]=v;
}
export function getCardState(col,id){ return (col.cards||{})[id]||0; }

/** pets : niveau 0..max */
export function setPetLevel(col,id,lv){ col.pets||={}; col.pets[id]=Math.max(0,lv|0); }
export function getPetLevel(col,id){ return (col.pets||{})[id]||0; }

/** artefacts : niveau */
export function setArtifactLevel(col,id,lv){ col.artifacts||={}; col.artifacts[id]=Math.max(0,lv|0); }
export function getArtifactLevel(col,id){ return (col.artifacts||{})[id]||0; }

/** skills : niveau 0..max (bool legacy → 1) */
export function setSkillLevel(col,id,lv){ col.skills||={}; col.skills[id]=Math.max(0,lv|0); }
export function getSkillLevel(col,id){
  const v=(col.skills||{})[id];
  if(v===true) return 1;
  return v|0;
}
export function toggleSkill(col,id){
  col.skills||={};
  col.skills[id]=getSkillLevel(col,id)>0?0:1;
}
export function hasSkill(col,id){ return getSkillLevel(col,id)>0; }

/** drones */
export function setDroneCore(col,id,lv){ col.droneCore||={}; col.droneCore[id]=Math.max(0,lv|0); }
export function getDroneCore(col,id){ return (col.droneCore||{})[id]|0; }
export function setDroneSuitLv(col,id,lv){ col.droneSuits||={}; col.droneSuits[id]=Math.max(0,lv|0); }
export function getDroneSuitLv(col,id){ return (col.droneSuits||{})[id]|0; }
export function setDroneFuel(col,id,lv){ col.droneFuel||={}; col.droneFuel[id]=Math.max(0,lv|0); }
export function getDroneFuel(col,id){ return (col.droneFuel||{})[id]|0; }

/** Applique niveaux drones depuis export (cores + fuel grades). */
export function applyExportDrones(col, stats = {}){
  col.caps = { ...(col.caps||{}), droneSuit: +(stats.drone_suit_cap||0) || (col.caps?.droneSuit||0) };
  // cores filled by caller with dronesData helpers if needed
  return col;
}

/** challenges */
export function setChallengeDone(col,id,done){ col.challenges||={}; col.challenges[id]=!!done; }
export function isChallengeDone(col,id){ return !!(col.challenges||{})[id]; }
export function setChallengeShop(col,id,lv){ col.challengeShop||={}; col.challengeShop[id]=Math.max(0,lv|0); }
export function getChallengeShop(col,id){ return (col.challengeShop||{})[id]|0; }
export function setChallengeOverlay(col, data){ col.challengeOverlay=data||null; }
export function getChallengeOverlay(col){ return col.challengeOverlay||null; }

/** statues : état 0=absente,1=construite,2=gildée,3=platinisée (clé = numéro wiki) */
export function cycleStatue(col,num){ col.statueStates||={}; col.statueStates[num]=((col.statueStates[num]||0)+1)%4; return col.statueStates[num]; }
export function setStatueState(col,num,v){ col.statueStates||={}; col.statueStates[num]=Math.max(0,Math.min(3,v|0)); }
export function getStatueState(col,num){ return (col.statueStates||{})[num]||0; }

/** statues par monde : possédée ou non (nom libre) */
export function toggleStatue(col,world,name){
  col.statues||={}; col.statues[world]||={};
  col.statues[world][name]=!col.statues[world][name];
}
export function getStatues(col,world){ return (col.statues||{})[world]||{}; }

/** étoiles : niveau 0..max (bool legacy → 1) */
export function setStarLevel(col,id,lv){ col.stars||={}; col.stars[id]=Math.max(0,lv|0); }
export function getStarLevel(col,id){
  const v=(col.stars||{})[id];
  if(v===true) return 1;
  return v|0;
}
export function toggleStar(col,id){ setStarLevel(col,id, getStarLevel(col,id)>0?0:1); }
export function hasStar(col,id){ return getStarLevel(col,id)>0; }

export function setStarUpgrade(col,id,lv){ col.starUpgrades||={}; col.starUpgrades[id]=Math.max(0,lv|0); }
export function getStarUpgrade(col,id){ return (col.starUpgrades||{})[id]|0; }
export function setSuperStarUpgrade(col,id,lv){ col.superStarUpgrades||={}; col.superStarUpgrades[id]=Math.max(0,lv|0); }
export function getSuperStarUpgrade(col,id){ return (col.superStarUpgrades||{})[id]|0; }
export function toggleBlackHoleBlessing(col,id){
  col.blackHole||={}; col.blackHole[id]=!col.blackHole[id];
}
export function hasBlackHoleBlessing(col,id){ return !!(col.blackHole||{})[id]; }

/** pet quest ranks 0..10 */
export function setPetQuestRank(col,id,lv){ col.petQuestRanks||={}; col.petQuestRanks[id]=Math.max(0,Math.min(10,lv|0)); }
export function getPetQuestRank(col,id){ return (col.petQuestRanks||{})[id]|0; }

/** fishing / archaeology levels */
export function setFishLv(col,bucket,id,lv){ col.fishing||={}; col.fishing[bucket]||={}; col.fishing[bucket][id]=Math.max(0,lv|0); }
export function getFishLv(col,bucket,id){ return ((col.fishing||{})[bucket]||{})[id]|0; }
export function setDockUnlocked(col,id,on){ col.fishing||={}; col.fishing.docks||={}; col.fishing.docks[id]=!!on; }
export function isDockUnlocked(col,id){ return !!((col.fishing||{}).docks||{})[id]; }
export function setArchLv(col,bucket,id,lv){ col.arch||={}; col.arch[bucket]||={}; col.arch[bucket][id]=Math.max(0,lv|0); }
export function getArchLv(col,bucket,id){ return ((col.arch||{})[bucket]||{})[id]|0; }
export function setArchHighestStage(col,n){ col.arch||={}; col.arch.highestStage=Math.max(0,n|0); }
export function getArchHighestStage(col){ return (col.arch||{}).highestStage|0; }

/** compteurs utiles au moteur de reco */
export function cardCounts(col){
  let owned=0,gilded=0,poly=0,infernal=0;
  for(const v of Object.values(col.cards||{})){
    if(v>=1)owned++; if(v>=2)gilded++; if(v>=3)poly++; if(v>=4)infernal++;
  }
  return {owned,gilded,poly,infernal};
}

/** Applique statues + monuments dérivés de l'export (écrase les états statue). */
export function applyExportProgress(col, profile){
  col.statueStates = { ...(profile.statueStates || {}) };
  col.monuments = { ...(col.monuments || {}), ...(profile.monuments || {}) };
  return col;
}

/** Caps export persistés (T4 artefacts, workshop) — survivent au reload. */
export function applyExportCaps(col, stats = {}){
  col.caps = {
    artifact: +(stats.artifact_cap_increase || 0),
    artifactT4: +(stats.artifact_tier4_cap_increase || 0),
    workshop: +(stats.bomb_workshop_cap_increase || 0),
  };
  return col;
}

export function getCaps(col){
  return col.caps || { artifact:0, artifactT4:0, workshop:0 };
}

/** workshop levels */
export function setWorkshopLevel(col,id,lv){ col.workshop||={}; col.workshop[id]=Math.max(0,lv|0); }
export function getWorkshopLevel(col,id){ return (col.workshop||{})[id]||0; }
