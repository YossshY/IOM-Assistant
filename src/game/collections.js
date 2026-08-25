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

/** skills : possédée ou non */
export function toggleSkill(col,id){ col.skills||={}; col.skills[id]=!col.skills[id]; }
export function hasSkill(col,id){ return !!(col.skills||{})[id]; }

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

/** étoiles */
export function toggleStar(col,id){ col.stars||={}; col.stars[id]=!col.stars[id]; }
export function hasStar(col,id){ return !!(col.stars||{})[id]; }

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
