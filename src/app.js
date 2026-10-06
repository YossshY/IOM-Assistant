/* ============================================================
   app.js — Orchestration UI (logique de jeu dans src/game/*)
   ============================================================ */
import { parseExportStats, deriveProfile } from './game/statsParser.js';
import { detectMissingInformation } from './game/missingInfo.js';
import { generateRecommendations, CONFIDENCE } from './game/recommendationEngine.js';
import { loadHistory, saveImport, diffExports, fmtNum, fmtStat } from './game/history.js';
import { CARD_STATES, CARD_SETS } from './game/cards.js';
import { ORE_CARDS, BAR_CARDS, MISC_CARDS, visibleCards } from './game/cardsData.js';
import { STARS_FULL, STAR_UPGRADES, SUPER_STAR_UPGRADES, BLACK_HOLE_BLESSINGS, starEffectiveMax } from './game/starsData.js';
// icônes misc réelles : mapping id → fichier téléchargé depuis le wiki
const MISC_ICONS={superstar:'Misc_Super_Star.png',novagiant:'Misc_Novagiant_Combo.png',minername:'Misc_Miner_Name.png',lootbug:'Misc_Lootbug.png',goldbug:'Golden_Lootbug_Chance.png',prestige:'Misc_Prestige.png',freebie:'Misc_Freebie.png',stonks:'Misc_Stonks.png',superstonks:'Super_Stonks.png',ultrastonks:'Misc_Ultra_Stonks.png',contract:'Misc_Contract.png',void:'Misc_Void.png',goldvoid:'Misc_Golden_Void.png',rainbowvoid:'Rainbow_Void_Portal.png',galacvoid:'Galactic_Void_Portal.png',world1:'Misc_World_1.png',world2:'Misc_World_2.png',world3:'Misc_World_3.png',world4:'Misc_World_4.png',alex:'Misc_Alex.png',bluecow:'Blue_Cow.png',goldore:'Misc_Golden_Vein.png',sushi:'Misc_Sushi.png',archabil:'Misc_Arch_Ability.png',goldvein:'Misc_Golden_Vein.png',rainbowvein:'Misc_Rainbow_Vein.png',gleamvein:'Misc_Gleaming_Vein.png',fuel:'Misc_Fuel.png',rod:'Misc_Fishing_Rod.png',code:'Misc_Code.png',frozenara:'Misc_FrozenAra.png',celio:'Misc_Celios_Hat.png',vydn:'Misc_Vydn.png',lute:'Misc_Lute.png',julk:'Misc_Julk.png',pizza:'Misc_Yummy_Pizza.png',lootfrog:'Lootfrogs_Caught.png',goldfrog:'Golden_Lootfrogs_Caught.png',bigfrog:'Misc_Big_Lootfrog.png',massfrog:'Misc_Massive_Lootfrog.png',floor73:'Misc_Floor_73.png'};
import { estimateFreebieGemEv, estimateLootbug2xWorth, estimatePickaxeGap } from './game/playerMath.js';
import { ARTIFACTS, SKILLS, OBELISK_UNLOCKS, artifactEffectiveMax, EXTERNAL_TOOLS } from './game/knowledgeBase.js';
import { WORKSHOP_UPGRADES, workshopEffectiveMax, formatWorkshopBonus, WORKSHOP_WIKI_REF_CAP } from './game/workshopData.js';
import { skillMaxLevels, SKILL_TREE_ROWS } from './game/skillsData.js';
import { DRONE_CORE_UPGRADES, DRONE_SUITS, DRONE_FUEL, coreLevelFromExport, suitCapFromExport } from './game/dronesData.js';
import { CHALLENGES, CHALLENGE_SHOP } from './game/challengesData.js';
import {
  FISHING_DOCKS, NOTICE_UPGRADES_T1, NOTICE_UPGRADES_T2,
  ENHANCE_T1, ENHANCE_T2, LEGENDARY_FISH, FISHING_EXPORT_KEYS,
  FISH_UPGRADES_T1, FISH_UPGRADES_T2,
} from './game/fishingData.js';
import { ARCH_UPGRADES, ARCH_IDOLS, ARCH_IDOL_MAX } from './game/archaeologyData.js';
import { RESEARCH_VEINS, MONUMENTS } from './game/constructData.js';
import * as C from './game/collections.js';
import { applyExportArrays, listUnmappedSkillNodes } from './game/exportArrays.js';

/** Durée du run prestige (raw.time) — pas le lifetime du compte. */
function fmtRunDuration(sec){
  if(sec==null||!isFinite(sec)) return 'inconnu';
  const h=sec/3600;
  if(h<48) return `${h.toFixed(1)} h (prestige actuel)`;
  return `${(h/24).toFixed(1)} j (prestige actuel)`;
}
function fmtSource(src){
  if(!src) return '—';
  if(/^https?:\/\//i.test(src)) return `<a href="${src}" target="_blank" rel="noopener">lien ↗</a>`;
  return String(src);
}

/** Max affiché : T4 = maxBase + caps persistés (ex. 32+20=52). */
function artifactMax(a){
  return artifactEffectiveMax(a, state.parsed?.stats||{}, C.getCaps(state.col));
}
function workshopMax(u){
  return workshopEffectiveMax(u, C.getCaps(state.col));
}
/** Somme des états statues (plat=3) — pour bonus « per statue owned ». */
function statuePower(){
  let n=0;
  for(let i=1;i<=27;i++) n+=C.getStatueState(state.col,i)||0;
  return n;
}
function formatArtBonus(a, lv){
  const sp=a.perStatue?statuePower():1;
  const per=a.perLevel*(a.perStatue?sp:1);
  const tot=per*lv;
  const fmt=v=>{
    if(a.unit===' Bars') return (v>=0?'+':'')+v+' Bars';
    if(a.unit==='') return (v>=0?'+':'')+Math.round(v);
    const d=Math.abs(a.perLevel)%1!==0?2: (Math.abs(tot)%1!==0?2:0);
    return (v>=0?'+':'')+Number(v.toFixed(d))+a.unit;
  };
  let desc=`${a.name} ${a.perLevel>=0?'+':''}${a.perLevel}${a.unit}`;
  if(a.perStatue) desc=`${a.name} +${a.perLevel}% Per Statue Owned (${per}%)`;
  return { desc, total: fmt(tot), perLabel: desc };
}

const $ = s => document.querySelector(s);
let state = { parsed:null, profile:{}, history:[], col:C.loadCollections() };

/* ---------- navigation : menu principal + onglets ---------- */
function show(page){
  document.querySelectorAll('.page').forEach(p=>p.classList.add('hidden'));
  $('#page-'+page).classList.remove('hidden');
  window.scrollTo({top:0});
}
document.querySelectorAll('.menu-btn').forEach(b=>b.addEventListener('click',()=>show(b.dataset.go)));

/* ---------- import ---------- */
$('#btnImport').addEventListener('click',()=>doImport($('#statsText').value));
$('#btnFile').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;
  const r=new FileReader();r.onload=()=>{$('#statsText').value=r.result;doImport(r.result)};r.readAsText(f);});

function doImport(text){
  const parsed=parseExportStats(text), el=$('#importMsg');
  if(!parsed.ok){el.textContent='⚠ '+parsed.error;el.className='msg err';return;}
  state.parsed=parsed;
  state.profile={...deriveProfile(parsed),answers:state.profile.answers||{}};
  state.col=C.applyExportProgress(state.col,state.profile);
  state.col=C.applyExportCaps(state.col,parsed.stats);
  applyDronesFromExport(parsed.stats);
  applyExportArrays(state.col, parsed.stats);
  C.saveCollections(state.col);
  state.history=saveImport(parsed);
  const menus=parsed.stats.skill_tree_nodes_array?' · menus importés':'';
  el.innerHTML=`✅ ${parsed.version} — ${parsed.statCount} stats`+(parsed.unknownKeys.length?` · <span class="warn">${parsed.unknownKeys.length} inconnues</span>`:'')+menus+` · OB ${state.profile.obeliskLevel??'?'} · W${state.profile.maxWorld??'?'}`;
  el.className='msg ok';
  renderAll();
  show('dashboard');
}

function renderAll(){
  renderTop();renderDash();renderRoadmap();renderAllStats();renderFishing();renderArchaeology();
  renderCards();renderPets();renderArtifacts();renderWorkshop();
  renderSkills();renderDrones();renderChallenges();renderShop();
  renderConstruct();renderStars();renderHistory();
}

function applyDronesFromExport(stats){
  C.applyExportDrones(state.col, stats);
  for(const u of DRONE_CORE_UPGRADES){
    C.setDroneCore(state.col, u.id, coreLevelFromExport(u, stats));
  }
  for(const f of DRONE_FUEL){
    C.setDroneFuel(state.col, f.id, Math.min(f.maxGrade, +(stats[f.gradeKey]||0)|0));
  }
}

function renderTop(){
  if(!state.parsed)return;
  const known=state.parsed.versionKnown?'':' · ⚠ version inconnue de la base';
  const red=state.profile.armorReduction!=null?` · Armure −${(state.profile.armorReduction*100).toFixed(0)}%`:'';
  $('#topVersion').textContent=`${state.parsed.version}${known} · OB ${state.profile.obeliskLevel??'?'} · Monde ${state.profile.maxWorld??'?'}${red}`;
}

/* ---------- dashboard ---------- */
function renderDash(){
  const g=$('#dashProfile');
  if(!state.parsed){g.innerHTML='<p class="muted">Aucun import.</p>';renderDashTools();renderDashMath();return;}
  const p=state.profile;
  const nextA=p.nextObeliskArmor;
  g.innerHTML=[
    ['Version',p.version],['Obelisk Level',p.obeliskLevel??'?'],['Cap XP',p.xpLevelCap??'?'],
    ['Monde max',p.maxWorld??'?'],
    ['Étage',p.currentFloor??'—'],
    ['Black Hole',p.blackHoleLevel??'—'],
    ['Quêtes W4',p.w4QuestProgress??'—'],
    ['Temps du run',fmtRunDuration(p.runSeconds)],
    ['Pickaxe Damage',fmtNum(p.pickaxeDamage)],
    ['Armure OB+1 (eff.)',nextA!=null?fmtNum(nextA):'—'],
    ['Passe OB+1',p.canDamageNext===true?'Oui':p.canDamageNext===false?'Non':'?'],
    ['Multi PP','×'+fmtNum(p.ppMulti??1)],
    ['Cards possédées',C.cardCounts(state.col).owned],
    ['Pets débloqués',Object.values(state.col.pets||{}).filter(v=>v>0).length],
  ].map(c=>`<div class="cell"><span>${c[0]}</span><b>${c[1]}</b></div>`).join('');
  renderDashTools();
  renderDashMath();
}
/** Estimateurs wiki/export — guider sans réécrire tout ObeliskFarm. */
function renderDashMath(){
  const box=$('#dashMath');
  if(!box)return;
  if(!state.parsed){box.innerHTML='<p class="muted">Importe un exportstats pour les estimateurs.</p>';return;}
  const s=state.parsed.stats;
  const freebie=estimateFreebieGemEv(s);
  const loot=estimateLootbug2xWorth(s, freebie);
  const gap=estimatePickaxeGap(s, state.profile);
  let h=`<div class="math-grid">
    <div class="math-card"><b>~${freebie.gemsPerHour} gems/h</b><span>Freebies (approx.)</span>
      <small>${freebie.claimsPerHour}/h · refresh ×${freebie.refreshMulti} · ${freebie.gemsPerClaim} gems/claim · 🟡</small></div>
    <div class="math-card"><b>Lootbug 2× ${loot.worth?'OUI':'non'}</b><span>+${loot.extraGems} gems vs coût ${loot.cost}</span>
      <small>${loot.note} · 🟡</small></div>`;
  if(gap){
    h+=`<div class="math-card"><b>${gap.blocked?`×${gap.needMulti} pioche`:'OK armure'}</b><span>OB${gap.obNext}</span>
      <small>${gap.note}</small></div>`;
  }
  h+=`</div><p class="muted" style="margin-top:8px">Estimateurs maison (wiki + export). Détail bombs/Founder → <a href="${EXTERNAL_TOOLS.obeliskFarm.url}" target="_blank" rel="noopener">ObeliskFarm</a>.</p>`;
  box.innerHTML=h;
}
function renderDashTools(){
  const box=$('#dashTools');
  if(!box)return;
  const tools=[
    EXTERNAL_TOOLS.obeliskFarm,
    EXTERNAL_TOOLS.obeliskFarmGemEv,
    EXTERNAL_TOOLS.obeliskFarmFishing,
    EXTERNAL_TOOLS.obeliskFarmArch,
    EXTERNAL_TOOLS.obeliskFarmStars,
    EXTERNAL_TOOLS.obeliskFarmOvernight,
    EXTERNAL_TOOLS.pickaxeDamage,
    EXTERNAL_TOOLS.fishingGems,
    EXTERNAL_TOOLS.obeliskFight,
    EXTERNAL_TOOLS.starOb60,
  ];
  box.innerHTML=tools.map(t=>{
    const sub=t.module?` · ouvre puis choisis « ${t.module} »`:(t.note?` — ${t.note}`:'');
    return `<a class="tool-link" href="${t.url}" target="_blank" rel="noopener">${t.name}${sub?`<small>${sub}</small>`:''}</a>`;
  }).join('');
}

/* ---------- roadmap ---------- */
function renderRoadmap(){
  const box=$('#roadList');
  if(!state.parsed){box.innerHTML='<p class="muted">Après l\'import.</p>';return;}
  const recs=generateRecommendations(state.parsed.stats,state.profile,state.col);
  let h='',i=1;
  for(const r of recs.filter(r=>r.priority>0)){
    const cf=CONFIDENCE[r.confidence];
    h+=`<div class="rec"><div class="rank">${i++}</div><div><strong>${r.title}</strong>
      <span class="conf" title="${cf.hint}">${cf.icon} ${cf.label}</span>
      <p>${r.reason}</p>
      ${r.progress!=null?`<div class="bar"><i style="width:${Math.min(100,r.progress*100)}%"></i></div>`:''}
      <p style="opacity:.6">Source : ${fmtSource(r.source)}</p></div></div>`;
  }
  for(const r of recs.filter(r=>r.priority===0))
    h+=`<p class="blocked">${CONFIDENCE.insufficient.icon} ${r.title} — ${r.reason}</p>`;
  const gaps=detectMissingInformation(state.parsed,state.profile);
  if(gaps.length)
    h+=`<p class="warn" style="margin-top:10px">À compléter : ${gaps.map(g=>g.label).join(' · ')}</p>`;
  box.innerHTML=h||'<p class="muted">Rien à signaler.</p>';
}

/* ---------- toutes les stats ---------- */
function renderAllStats(){
  const box=$('#allStats');
  if(!state.parsed){box.innerHTML='<p class="muted">—</p>';return;}
  const s=state.parsed.stats;
  box.innerHTML=Object.entries(s).map(([k,v])=>
    `<div class="statline"><span>${k}</span><b>${fmtStat(v)}</b></div>`).join('');
}

/* ================= FISHING ================= */
let fishTab='notices';
/** Emoji ou chemin assets/ → HTML pour .art-ico */
function artIco(icon, fallback='🔧'){
  if(icon&&String(icon).startsWith('assets/'))
    return `<img src="${icon}" alt="" loading="lazy" onerror="this.replaceWith(document.createTextNode('${fallback}'))">`;
  return icon||fallback;
}
function lvRow(icon, title, sub, lv, max, dataAttr, id){
  const maxed=lv>=max && max>0;
  return `<div class="art-row">
    <div class="art-ico">${artIco(icon)}</div>
    <div class="art-desc"><b>${title}</b>${sub?` — ${sub}`:''}</div>
    <div class="art-stats"><span class="lv">${lv}/${max}</span></div>
    <div class="art-actions">
      <button class="pixbtn ghost" data-${dataAttr}="${id}" data-d="-1">−</button>
      ${maxed?`<span class="btn-maxed">Maxed</span>`:`<button class="pixbtn" data-${dataAttr}="${id}" data-d="1">+</button>`}
    </div>
  </div>`;
}
function renderFishing(){
  const box=$('#fishingStats'); if(!box) return;
  document.querySelectorAll('[data-fishtab]').forEach(b=>{
    b.classList.toggle('on', b.dataset.fishtab===fishTab);
    b.classList.toggle('ghost', b.dataset.fishtab!==fishTab);
  });
  const hint=$('#fishHint');
  if(fishTab==='notices'){
    if(hint) hint.textContent='Notice upgrades T1 + T2 (tokens)';
    box.innerHTML='<div class="tier-block t1"><div class="tier-head"><div class="th-l">Tier 1 Notices</div></div>'
      +NOTICE_UPGRADES_T1.map(u=>lvRow('📋',u.name,u.per,C.getFishLv(state.col,'notice',u.id),u.max,'fn1',u.id)).join('')
      +'</div><div class="tier-block t2" style="margin-top:12px"><div class="tier-head"><div class="th-l">Tier 2 Notices</div></div>'
      +NOTICE_UPGRADES_T2.map(u=>lvRow('📋',u.name,u.per,C.getFishLv(state.col,'notice',u.id),u.max,'fn2',u.id)).join('')
      +'</div>';
    return;
  }
  if(fishTab==='upgrades'){
    if(hint) hint.textContent='Fishing Upgrades (fish) + docks';
    let html='<div class="tier-block t1"><div class="tier-head"><div class="th-l">Tier 1 Upgrades</div></div>'
      +FISH_UPGRADES_T1.map(u=>lvRow('🐟',u.name,u.per,C.getFishLv(state.col,'upgrades',u.id),u.max,'fu1',u.id)).join('')
      +'</div><div class="tier-block t2" style="margin-top:12px"><div class="tier-head"><div class="th-l">Tier 2 Upgrades</div></div>'
      +FISH_UPGRADES_T2.map(u=>lvRow('🐟',u.name,u.per,C.getFishLv(state.col,'upgrades',u.id),u.max,'fu2',u.id)).join('')
      +'</div><div class="tier-block t3" style="margin-top:12px"><div class="tier-head"><div class="th-l">Docks</div></div>';
    html+=FISHING_DOCKS.map(d=>{
      const on=C.isDockUnlocked(state.col,d.id) || (d.tier===1 && d.id==='lake');
      return `<div class="art-row"><div class="art-ico">🎣</div><div class="art-desc"><b>${d.name}</b> — ${d.ticks} ticks · T${d.tier}</div>
        <div class="art-actions"><button class="pixbtn ${on?'on':''}" data-dock="${d.id}">${on?'UNLOCK':'—'}</button></div></div>`;
    }).join('')+'</div>';
    box.innerHTML=html;
    return;
  }
  if(fishTab==='enhance'){
    if(hint) hint.textContent='Enhance gem sink T1/T2';
    box.innerHTML='<div class="tier-block t3"><div class="tier-head"><div class="th-l">Tier 1 Enhance</div></div>'
      +ENHANCE_T1.map(u=>lvRow('💎',u.name,u.per,C.getFishLv(state.col,'enhance',u.id),u.max,'fe1',u.id)).join('')
      +'</div><div class="tier-block t4" style="margin-top:12px"><div class="tier-head"><div class="th-l">Tier 2 Enhance</div></div>'
      +ENHANCE_T2.map(u=>lvRow('💎',u.name,u.per,C.getFishLv(state.col,'enhance',u.id),u.max,'fe2',u.id)).join('')
      +'</div>';
    return;
  }
  if(hint) hint.textContent='Legendary fish — tribute ranks 0–2';
  box.innerHTML=LEGENDARY_FISH.map(f=>{
    const lv=Math.min(2, C.getFishLv(state.col,'legendary',f.id));
    return lvRow(f.icon||'🐟',f.name,`${f.dock} · ${f.card}`,lv,2,'fleg',f.id);
  }).join('');
}
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-fishtab]');
  if(t){ fishTab=t.dataset.fishtab; renderFishing(); return; }
  const d=e.target.closest('[data-dock]');
  if(d){ C.setDockUnlocked(state.col,d.dataset.dock,!C.isDockUnlocked(state.col,d.dataset.dock)); C.saveCollections(state.col); renderFishing(); return; }
  const n1=e.target.closest('[data-fn1]');
  if(n1){ const u=NOTICE_UPGRADES_T1.find(x=>x.id===n1.dataset.fn1); C.setFishLv(state.col,'notice',u.id,Math.min(u.max,Math.max(0,C.getFishLv(state.col,'notice',u.id)+ +n1.dataset.d))); C.saveCollections(state.col); renderFishing(); return; }
  const n2=e.target.closest('[data-fn2]');
  if(n2){ const u=NOTICE_UPGRADES_T2.find(x=>x.id===n2.dataset.fn2); C.setFishLv(state.col,'notice',u.id,Math.min(u.max,Math.max(0,C.getFishLv(state.col,'notice',u.id)+ +n2.dataset.d))); C.saveCollections(state.col); renderFishing(); return; }
  const u1=e.target.closest('[data-fu1]');
  if(u1){ const u=FISH_UPGRADES_T1.find(x=>x.id===u1.dataset.fu1); C.setFishLv(state.col,'upgrades',u.id,Math.min(u.max,Math.max(0,C.getFishLv(state.col,'upgrades',u.id)+ +u1.dataset.d))); C.saveCollections(state.col); renderFishing(); return; }
  const u2=e.target.closest('[data-fu2]');
  if(u2){ const u=FISH_UPGRADES_T2.find(x=>x.id===u2.dataset.fu2); C.setFishLv(state.col,'upgrades',u.id,Math.min(u.max,Math.max(0,C.getFishLv(state.col,'upgrades',u.id)+ +u2.dataset.d))); C.saveCollections(state.col); renderFishing(); return; }
  const e1=e.target.closest('[data-fe1]');
  if(e1){ const u=ENHANCE_T1.find(x=>x.id===e1.dataset.fe1); C.setFishLv(state.col,'enhance',u.id,Math.min(u.max,Math.max(0,C.getFishLv(state.col,'enhance',u.id)+ +e1.dataset.d))); C.saveCollections(state.col); renderFishing(); return; }
  const e2=e.target.closest('[data-fe2]');
  if(e2){ const u=ENHANCE_T2.find(x=>x.id===e2.dataset.fe2); C.setFishLv(state.col,'enhance',u.id,Math.min(u.max,Math.max(0,C.getFishLv(state.col,'enhance',u.id)+ +e2.dataset.d))); C.saveCollections(state.col); renderFishing(); return; }
  const lg=e.target.closest('[data-fleg]');
  if(lg){ C.setFishLv(state.col,'legendary',lg.dataset.fleg,Math.min(2,Math.max(0,C.getFishLv(state.col,'legendary',lg.dataset.fleg)+ +lg.dataset.d))); C.saveCollections(state.col); renderFishing(); }
});
$('#btnFishMaxTab')?.addEventListener('click',()=>{
  if(fishTab==='notices'){ for(const u of NOTICE_UPGRADES_T1) C.setFishLv(state.col,'notice',u.id,u.max); for(const u of NOTICE_UPGRADES_T2) C.setFishLv(state.col,'notice',u.id,u.max); }
  else if(fishTab==='upgrades'){ for(const u of FISH_UPGRADES_T1) C.setFishLv(state.col,'upgrades',u.id,u.max); for(const u of FISH_UPGRADES_T2) C.setFishLv(state.col,'upgrades',u.id,u.max); for(const d of FISHING_DOCKS) C.setDockUnlocked(state.col,d.id,true); }
  else if(fishTab==='enhance'){ for(const u of ENHANCE_T1) C.setFishLv(state.col,'enhance',u.id,u.max); for(const u of ENHANCE_T2) C.setFishLv(state.col,'enhance',u.id,u.max); }
  else if(fishTab==='legendary') for(const f of LEGENDARY_FISH) C.setFishLv(state.col,'legendary',f.id,2);
  C.saveCollections(state.col);renderFishing();
});
$('#btnFishClearTab')?.addEventListener('click',()=>{
  if(fishTab==='notices'){ for(const u of [...NOTICE_UPGRADES_T1,...NOTICE_UPGRADES_T2]) C.setFishLv(state.col,'notice',u.id,0); }
  else if(fishTab==='upgrades'){ for(const u of [...FISH_UPGRADES_T1,...FISH_UPGRADES_T2]) C.setFishLv(state.col,'upgrades',u.id,0); for(const d of FISHING_DOCKS) C.setDockUnlocked(state.col,d.id,false); }
  else if(fishTab==='enhance'){ for(const u of [...ENHANCE_T1,...ENHANCE_T2]) C.setFishLv(state.col,'enhance',u.id,0); }
  else if(fishTab==='legendary') for(const f of LEGENDARY_FISH) C.setFishLv(state.col,'legendary',f.id,0);
  C.saveCollections(state.col);renderFishing();
});

/* ================= ARCHAEOLOGY ================= */
let archTab='upgrades';
function renderArchaeology(){
  const box=$('#archGrid'); if(!box) return;
  document.querySelectorAll('[data-archtab]').forEach(b=>{
    b.classList.toggle('on', b.dataset.archtab===archTab);
    b.classList.toggle('ghost', b.dataset.archtab!==archTab);
  });
  const hint=$('#archHint');
  if(archTab==='upgrades'){
    if(hint) hint.textContent='Ascension 0 upgrades';
    box.innerHTML=ARCH_UPGRADES.map(u=>lvRow('🦴',u.name,u.per,C.getArchLv(state.col,'upgrades',u.id),u.max,'aupg',u.id)).join('');
    return;
  }
  if(hint) hint.textContent=`${ARCH_IDOLS.length} idols · niveau 0–${ARCH_IDOL_MAX}`;
  box.innerHTML=ARCH_IDOLS.map(idol=>{
    const lv=C.getArchLv(state.col,'idols',idol.id);
    const max=Math.max(ARCH_IDOL_MAX, lv);
    const icon=`assets/cards/${idol.name}_Idol.png`;
    return lvRow(icon,idol.name,idol.note||'',lv,max,'aidol',idol.id);
  }).join('');
}
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-archtab]');
  if(t){ archTab=t.dataset.archtab; renderArchaeology(); return; }
  const up=e.target.closest('[data-aupg]');
  if(up){ const u=ARCH_UPGRADES.find(x=>x.id===up.dataset.aupg); C.setArchLv(state.col,'upgrades',u.id,Math.min(u.max,Math.max(0,C.getArchLv(state.col,'upgrades',u.id)+ +up.dataset.d))); C.saveCollections(state.col); renderArchaeology(); return; }
  const id=e.target.closest('[data-aidol]');
  if(id){
    const cur=C.getArchLv(state.col,'idols',id.dataset.aidol);
    const max=Math.max(ARCH_IDOL_MAX, cur);
    C.setArchLv(state.col,'idols',id.dataset.aidol,Math.min(max,Math.max(0,cur+ +id.dataset.d)));
    C.saveCollections(state.col); renderArchaeology();
  }
});
$('#btnArchMaxTab')?.addEventListener('click',()=>{
  if(archTab==='upgrades') for(const u of ARCH_UPGRADES) C.setArchLv(state.col,'upgrades',u.id,u.max);
  else if(archTab==='idols') for(const i of ARCH_IDOLS) C.setArchLv(state.col,'idols',i.id,ARCH_IDOL_MAX);
  C.saveCollections(state.col);renderArchaeology();
});
$('#btnArchClearTab')?.addEventListener('click',()=>{
  if(archTab==='upgrades') for(const u of ARCH_UPGRADES) C.setArchLv(state.col,'upgrades',u.id,0);
  else if(archTab==='idols') for(const i of ARCH_IDOLS) C.setArchLv(state.col,'idols',i.id,0);
  C.saveCollections(state.col);renderArchaeology();
});

/* ================= CARDS =================
   Toutes les cartes individuelles, groupées par catégorie.
   Masquage progressif : une carte liée au monde N n'apparaît que si le
   joueur a débloqué ce monde (monuments cochés dans Construct ou OB requis). */
function maxWorldUnlocked(){
  const mons=state.col.monuments||{};
  if(mons[4]||state.profile.w4Open)return 4;
  if(mons[3])return 3;
  if(mons[2])return 2;
  if(state.profile.maxWorld)return state.profile.maxWorld;
  const ob=state.profile.obeliskLevel;
  if(ob!=null){ if(ob>=64)return 3; if(ob>=42)return 2; }
  return 1;
}
function renderCards(){
  const box=$('#cardSets');
  const maxW=maxWorldUnlocked();
  const cards=visibleCards(maxW);
  let h=`<p class="muted">Monde max détecté : <b>${maxW}</b> — les cartes des mondes supérieurs sont masquées (coche tes Monuments dans Construct ou importe un exportstats pour les révéler). Ordre = <a href="https://shminer.miraheze.org/wiki/Cards/Card_Effects" target="_blank" rel="noopener">wiki Card Effects</a>.</p>`;

  for(const set of CARD_SETS){
    const setCards=cards.filter(c=>c.cat===set.id);
    if(!setCards.length)continue;
    h+=`<h3 style="display:flex;align-items:center;gap:10px">${set.icon} ${set.name} <span class="muted">(${setCards.length})</span>
      <span style="display:inline-flex;gap:6px;margin-left:auto">
        <button class="pixbtn gold" data-bulkset="${set.id}" data-v="2" style="font-size:7px;padding:5px 8px">Tout Gilded</button>
        <button class="pixbtn poly" data-bulkset="${set.id}" data-v="3" style="font-size:7px;padding:5px 8px">Tout Poly</button>
        <button class="pixbtn inf"  data-bulkset="${set.id}" data-v="4" style="font-size:7px;padding:5px 8px">Tout Infernal</button>
      </span></h3><div class="cardgrid">`;
    for(const c of setCards){
      const st=C.getCardState(state.col,c.id);
      h+=cardTile(c.id,cardIconSrc(c),c.name,st,c.effect,c.world?`W${c.world}`:null,c.mod,st>0);
    }
    h+='</div>';
  }
  box.innerHTML=h;
  const cc=C.cardCounts(state.col), total=cards.length;
  $('#cardCounts').textContent=`${cc.owned}/${total} possédées · ${cc.gilded} gilded · ${cc.poly} poly · ${cc.infernal} infernal`;
}
/** Résout l'icône : path assets, ou MISC_ICONS (id misc_xxx → xxx). */
function cardIconSrc(c){
  if(c.icon&&String(c.icon).startsWith('assets/')) return c.icon;
  const miscKey=(c.id||'').replace(/^misc_/,'');
  if(MISC_ICONS[miscKey]) return 'assets/cards/'+MISC_ICONS[miscKey];
  if(MISC_ICONS[c.id]) return 'assets/cards/'+MISC_ICONS[c.id];
  if(c.name){
    const slug=String(c.name).replace(/['']/g,'').replace(/[^a-zA-Z0-9]+/g,'_').replace(/^_|_$/g,'');
    return 'assets/cards/'+slug+'.png';
  }
  return c.icon||'🃏';
}
function cardTile(id,img,name,st,effect,worldTag,mod,unlocked=true){
  const backings=['Card_Backing_Standard','Card_Backing_Standard','Card_Backing_Gilded','Card_Backing_Polychrome','Card_Backing_Infernal'];
  const bg=`assets/backings/${backings[st]}.png`;
  const eff=effect?effect[Math.min(Math.max(st-1,0),effect.length-1)]:'';
  const icon=(img&&String(img).startsWith('assets/'))
    ? `<img class="em" src="${img}" alt="" loading="lazy" onerror="this.style.display='none'">`
    : `<span class="em">${img||'🃏'}</span>`;
  return `<div class="card ${unlocked?'':'locked'}" data-card="${id}"
    style="background-image:url('${bg}')"
    title="${name}${mod?' — '+mod:''}${worldTag?' ['+worldTag+']':''}\n${CARD_STATES[st].name}${eff&&st>0?' : '+eff:''}\nClic gauche : +1 · Clic droit : −1">
    <div class="card-art">${icon}</div>
    <div class="card-foot">
      <span class="nm">${name}</span>
      ${st>0&&eff?`<span class="eff">${eff}</span>`:''}
      ${worldTag?`<span class="wtag">${worldTag}</span>`:''}
    </div></div>`;
}
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-card]');
  if(t){C.adjustCard(state.col,t.dataset.card,1);C.saveCollections(state.col);renderCards();renderDash();}
  const b=e.target.closest('[data-bulk]');
  if(b){C.setAllVisible(state.col,+b.dataset.bulk,visibleCards(maxWorldUnlocked()).map(c=>c.id));C.saveCollections(state.col);renderCards();renderDash();}
  const bs=e.target.closest('[data-bulkset]');
  if(bs){
    const set=bs.dataset.bulkset;
    const ids=visibleCards(maxWorldUnlocked()).filter(c=>c.cat===set).map(c=>c.id);
    C.setAllVisible(state.col,+bs.dataset.v,ids);C.saveCollections(state.col);renderCards();renderDash();
  }
});
document.addEventListener('contextmenu',e=>{
  const t=e.target.closest('[data-card]');
  if(t){e.preventDefault();C.adjustCard(state.col,t.dataset.card,-1);C.saveCollections(state.col);renderCards();renderDash();}
});

/* ================= PETS =================
   17 pets avec skins (lvl 5) et quêtes (lvl 10) — wiki Pets v2.2.6.
   Clic sur les icônes skin/quest pour marquer débloqué. */
import { PETS_FULL } from './game/petsData.js';

function totalPetLevels(){ return Object.values(state.col.pets||{}).reduce((a,b)=>a+(b||0),0); }

function renderPets(){
  const box=$('#petList');
  const total=totalPetLevels();
  const owned=(state.col.petUnlocks)||{};
  box.innerHTML=PETS_FULL.map(p=>{
    const stored=C.getPetLevel(state.col,p.id);
    const lv=stored;
    const petMax=Math.max(p.maxLevel, lv);
    const locked = p.unlockTotal>0 && total<p.unlockTotal && lv===0;
    const skinOn=owned['skin_'+p.id];
    const qRank=C.getPetQuestRank(state.col,p.id);
    const questOn=qRank>0 || owned['quest_'+p.id];
    return `<div class="petrow ${locked?'locked':''}">
      <img class="pet-em" src="${p.iconDefault}" alt="" loading="lazy"
        onerror="this.style.display='none'">
      <div class="pet-info">
        <b>${p.name}</b> <span class="muted">· unlock ${p.unlockTotal} · ${p.price} 💎 · max ${p.maxLevel}</span>
        <p>${p.levelBy} — ${p.bonus}</p>
        <div class="pet-unlocks">
          <button class="petchip ${skinOn?'on':''}" data-petunlock="skin_${p.id}" title="${p.skin?`${p.skin.name} : ${p.skin.bonus}`:''}">
            🎨 ${p.skin?p.skin.name:'Skin'} ${p.skin?'('+p.skin.price+'💎)':''}
          </button>
          <span class="petchip ${questOn?'on':''}" title="${p.quest?`${p.quest.name} — ${p.quest.rankUp} — ${p.quest.bonus}`:''}">
            🏆 ${p.quest?p.quest.name:'Quête'}
            <button class="pixbtn ghost" data-qrank="${p.id}" data-d="-1" style="min-width:28px;height:26px;padding:0">−</button>
            <b>${qRank}/10</b>
            <button class="pixbtn" data-qrank="${p.id}" data-d="1" style="min-width:28px;height:26px;padding:0">+</button>
          </span>
        </div>
      </div>
      <div class="lvbtns">
        <button class="pixbtn ghost" data-pet="${p.id}" data-d="-1">−</button>
        <span class="lvval">${lv}/${petMax}</span>
        <button class="pixbtn" data-pet="${p.id}" data-d="1">+</button>
      </div></div>`;
  }).join('')+`<p class="muted" style="margin-top:10px">Total niveaux : ${total} · Quest ranks 0–10 (screens Crab/Dwarf/Duck 10/10). Skins = bonus même non équipé.</p>`;
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-pet]');if(!b)return;
  const pet=PETS_FULL.find(p=>p.id===b.dataset.pet);
  const cur=C.getPetLevel(state.col,b.dataset.pet);
  C.setPetLevel(state.col,b.dataset.pet,Math.min(Math.max(pet.maxLevel,cur),Math.max(0,cur+ +b.dataset.d)));
  C.saveCollections(state.col);renderPets();renderDash();
});
document.addEventListener('click',e=>{
  const c=e.target.closest('[data-petunlock]');if(!c)return;
  state.col.petUnlocks=state.col.petUnlocks||{};
  state.col.petUnlocks[c.dataset.petunlock]=!state.col.petUnlocks[c.dataset.petunlock];
  C.saveCollections(state.col);renderPets();
});
document.addEventListener('click',e=>{
  const q=e.target.closest('[data-qrank]');if(!q)return;
  C.setPetQuestRank(state.col,q.dataset.qrank, C.getPetQuestRank(state.col,q.dataset.qrank)+ +q.dataset.d);
  C.saveCollections(state.col);renderPets();
});

/* ================= PRESTIGE / ARTEFACTS (layout jeu) ================= */
function renderArtifacts(){
  const box=$('#artGrid');
  const caps=C.getCaps(state.col);
  const hint=$('#artCapHint');
  if(hint) hint.textContent=`Caps export : +${caps.artifact} · T4 +${caps.artifactT4}`+(caps.artifactT4?` → max ${32+caps.artifactT4}/${17+caps.artifactT4}`:'');

  let html='';
  for(const tier of [1,2,3,4]){
    const list=ARTIFACTS.filter(a=>a.tier===tier);
    const maxes=list.map(a=>artifactMax(a));
    const lvs=list.map(a=>Math.min(artifactMax(a), C.getArtifactLevel(state.col,a.id)));
    const owned=lvs.filter(v=>v>0).length;
    const sumLv=lvs.reduce((a,b)=>a+b,0);
    const sumMax=maxes.reduce((a,b)=>a+b,0);
    const tierMaxed=sumLv>=sumMax && sumMax>0;
    html+=`<div class="tier-block t${tier}">
      <div class="tier-head">
        <div class="th-l">Tier ${tier} Artifacts: ${owned}/${list.length}<br>Tier ${tier} Levels: ${sumLv}/${sumMax}</div>
        <div class="th-r">
          ${tierMaxed
            ? `<span class="btn-maxed">Maxed</span>`
            : `<button class="btn-max-tier" data-arttier="${tier}">Max tier</button>`}
        </div>
      </div>`;
    for(const a of list){
      const max=artifactMax(a);
      const lv=Math.min(max, C.getArtifactLevel(state.col,a.id));
      const {desc,total}=formatArtBonus(a,lv);
      const maxed=lv>=max;
      html+=`<div class="art-row">
        <div class="art-ico">${artIco(a.icon,'🏺')}</div>
        <div class="art-desc">${desc}</div>
        <div class="art-stats"><span class="lv">${lv}/${max}</span><span class="tot">${total}</span></div>
        <div class="art-actions">
          <button class="pixbtn ghost" data-art="${a.id}" data-d="-1" title="-1">−</button>
          ${maxed
            ? `<span class="btn-maxed">Maxed</span>`
            : `<button class="pixbtn" data-art="${a.id}" data-d="1">+</button>
               <button class="pixbtn gold" data-artmax="${a.id}">Max</button>`}
        </div>
      </div>`;
    }
    html+='</div>';
  }
  box.innerHTML=html;
}
function setArtLevel(id,lv){
  const a=ARTIFACTS.find(x=>x.id===id); if(!a)return;
  C.setArtifactLevel(state.col,id,Math.min(artifactMax(a),Math.max(0,lv|0)));
  C.saveCollections(state.col);renderArtifacts();renderRoadmap();
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-art]');
  if(b){
    const a=ARTIFACTS.find(x=>x.id===b.dataset.art);
    setArtLevel(a.id, C.getArtifactLevel(state.col,a.id)+ +b.dataset.d);
    return;
  }
  const m=e.target.closest('[data-artmax]');
  if(m){ setArtLevel(m.dataset.artmax, artifactMax(ARTIFACTS.find(x=>x.id===m.dataset.artmax))); return; }
  const t=e.target.closest('[data-arttier]');
  if(t){
    const tier=+t.dataset.arttier;
    for(const a of ARTIFACTS.filter(x=>x.tier===tier)) C.setArtifactLevel(state.col,a.id,artifactMax(a));
    C.saveCollections(state.col);renderArtifacts();renderRoadmap();
  }
});
$('#btnArtMaxAll')?.addEventListener('click',()=>{
  for(const a of ARTIFACTS) C.setArtifactLevel(state.col,a.id,artifactMax(a));
  C.saveCollections(state.col);renderArtifacts();renderRoadmap();
});
$('#btnArtClear')?.addEventListener('click',()=>{
  for(const a of ARTIFACTS) C.setArtifactLevel(state.col,a.id,0);
  C.saveCollections(state.col);renderArtifacts();renderRoadmap();
});

/* ================= WORKSHOP ================= */
function renderWorkshop(){
  const box=$('#wsGrid'); if(!box) return;
  const caps=C.getCaps(state.col);
  const hint=$('#wsCapHint');
  if(hint) hint.textContent=`bomb_workshop_cap_increase : +${caps.workshop}`+(caps.workshop?` (max ≈ wiki − ${WORKSHOP_WIKI_REF_CAP-caps.workshop})`:' — importe un export');

  let html='<div class="tier-block t1"><div class="tier-head"><div class="th-l">Workshop Upgrades</div></div>';
  for(const u of WORKSHOP_UPGRADES){
    const max=workshopMax(u);
    const lv=Math.min(max, C.getWorkshopLevel(state.col,u.id));
    const bonus=formatWorkshopBonus(u,lv);
    const maxed=lv>=max;
    const lock=u.world4?' <span class="muted">(W4)</span>':'';
    html+=`<div class="art-row">
      <div class="art-ico">${artIco(u.icon,'🔧')}</div>
      <div class="art-desc">${u.name}${lock}${bonus!=='—'&&!u.unlock?` — ${bonus}`:u.unlock&&lv?` — Unlocked`:''}</div>
      <div class="art-stats"><span class="lv">${lv}/${max}</span></div>
      <div class="art-actions">
        <button class="pixbtn ghost" data-ws="${u.id}" data-d="-1">−</button>
        ${maxed
          ? `<span class="btn-maxed">Maxed</span>`
          : `<button class="pixbtn" data-ws="${u.id}" data-d="1">+</button>
             <button class="pixbtn gold" data-wsmax="${u.id}">Max</button>`}
      </div>
    </div>`;
  }
  html+='</div>';
  box.innerHTML=html;
}
function setWsLevel(id,lv){
  const u=WORKSHOP_UPGRADES.find(x=>x.id===id); if(!u)return;
  C.setWorkshopLevel(state.col,id,Math.min(workshopMax(u),Math.max(0,lv|0)));
  C.saveCollections(state.col);renderWorkshop();
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-ws]');
  if(b){ setWsLevel(b.dataset.ws, C.getWorkshopLevel(state.col,b.dataset.ws)+ +b.dataset.d); return; }
  const m=e.target.closest('[data-wsmax]');
  if(m){ setWsLevel(m.dataset.wsmax, workshopMax(WORKSHOP_UPGRADES.find(x=>x.id===m.dataset.wsmax))); }
});
$('#btnWsMaxAll')?.addEventListener('click',()=>{
  for(const u of WORKSHOP_UPGRADES) C.setWorkshopLevel(state.col,u.id,workshopMax(u));
  C.saveCollections(state.col);renderWorkshop();
});
$('#btnWsClear')?.addEventListener('click',()=>{
  for(const u of WORKSHOP_UPGRADES) C.setWorkshopLevel(state.col,u.id,0);
  C.saveCollections(state.col);renderWorkshop();
});

/* ================= SKILLS (layout wiki #Skills) ================= */
let selectedSkill=null;
function skillCardHtml(id){
  const s=SKILLS.find(x=>x.id===id); if(!s) return '';
  const max=skillMaxLevels(s);
  const lv=Math.min(max, C.getSkillLevel(state.col,s.id));
  const maxed=lv>=max && lv>0;
  const cost=Array.isArray(s.cost)?s.cost.join('/') : s.cost;
  const sel=selectedSkill===s.id?' sel':'';
  const st=s.sTier?' stier':'';
  const owned=lv>0?' owned':'';
  return `<div class="sk-node${sel}${st}${owned}${maxed?' maxed':''}" data-skillsel="${s.id}">
    <div class="sk-name">${s.name}${s.sTier?' <span class="tag">prio</span>':''}</div>
    <div class="sk-fx">${s.effect||''}</div>
    <div class="sk-meta">
      <span>Cost: ${cost} SP${s.unlockOb?` · OB${s.unlockOb}`:''}</span>
      <span class="sk-lv">${lv}/${max}</span>
    </div>
    <div class="sk-actions">
      <button class="pixbtn ghost" data-skill="${s.id}" data-d="-1">−</button>
      ${maxed?`<span class="btn-maxed">Maxed</span>`:`<button class="pixbtn" data-skill="${s.id}" data-d="1">+</button>`}
    </div>
  </div>`;
}
function renderSkills(){
  const box=$('#skillList'); if(!box) return;
  const owned=SKILLS.filter(s=>C.getSkillLevel(state.col,s.id)>0).length;
  const hint=$('#skillHint');
  const extra=listUnmappedSkillNodes(state.parsed?.stats||{});
  const extraTxt=extra.length?` · hors arbre : ${extra.map(e=>`${e.name} ${e.level}`).join(', ')}`:'';
  if(hint) hint.textContent=`${owned}/${SKILLS.length} · layout wiki Skill-Tree#Skills${extraTxt}`;
  box.innerHTML=`<div class="skill-tree">${SKILL_TREE_ROWS.map(row=>{
    const filled=row.filter(Boolean).length;
    if(filled===1){
      const id=row.find(Boolean);
      return `<div class="sk-row one"><div class="sk-spacer"></div>${skillCardHtml(id)}<div class="sk-spacer"></div></div>`;
    }
    if(filled===2 && !row[0] && !row[3]){
      return `<div class="sk-row two">${skillCardHtml(row[1])}${skillCardHtml(row[2])}</div>`;
    }
    if(filled===3 && row[0] && row[1] && row[2] && !row[3]){
      return `<div class="sk-row three">${skillCardHtml(row[0])}${skillCardHtml(row[1])}${skillCardHtml(row[2])}</div>`;
    }
    return `<div class="sk-row four">${row.map(id=>id?skillCardHtml(id):'<div class="sk-empty"></div>').join('')}</div>`;
  }).join('')}</div>`;
  const d=$('#skillDetail');
  const sk=SKILLS.find(x=>x.id===selectedSkill)||SKILLS[0];
  if(d&&sk){
    const cost=Array.isArray(sk.cost)?sk.cost.join(' / '):sk.cost;
    d.innerHTML=`<b style="color:var(--amber)">${sk.name}</b><br>${sk.effect||''}<br><span class="muted">Cost: ${cost} SP · Level ${C.getSkillLevel(state.col,sk.id)}/${skillMaxLevels(sk)}</span>
      <a class="muted" href="https://shminer.miraheze.org/wiki/Skill-Tree#Skills" target="_blank" rel="noopener">wiki ↗</a>`;
  }
}
function setSkillLv(id,lv){
  const s=SKILLS.find(x=>x.id===id); if(!s)return;
  C.setSkillLevel(state.col,id,Math.min(skillMaxLevels(s),Math.max(0,lv|0)));
  C.saveCollections(state.col);renderSkills();renderRoadmap();
}
document.addEventListener('click',e=>{
  const sel=e.target.closest('[data-skillsel]');
  if(sel&&!e.target.closest('[data-skill]')){ selectedSkill=sel.dataset.skillsel; renderSkills(); return; }
  const b=e.target.closest('[data-skill]');
  if(b){ selectedSkill=b.dataset.skill; setSkillLv(b.dataset.skill, C.getSkillLevel(state.col,b.dataset.skill)+ +b.dataset.d); }
});
$('#btnSkillMaxS')?.addEventListener('click',()=>{
  for(const s of SKILLS.filter(x=>x.sTier)) C.setSkillLevel(state.col,s.id,skillMaxLevels(s));
  C.saveCollections(state.col);renderSkills();renderRoadmap();
});
$('#btnSkillClear')?.addEventListener('click',()=>{
  for(const s of SKILLS) C.setSkillLevel(state.col,s.id,0);
  C.saveCollections(state.col);renderSkills();renderRoadmap();
});

/* ================= DRONES ================= */
let droneTab='upgrades';
function renderDrones(){
  const box=$('#droneGrid'); if(!box) return;
  const stats=state.parsed?.stats||{};
  const cap=suitCapFromExport(stats, C.getCaps(state.col));
  const hint=$('#droneHint');
  document.querySelectorAll('[data-dronetab]').forEach(b=>{
    b.classList.toggle('on', b.dataset.dronetab===droneTab);
    b.classList.toggle('ghost', b.dataset.dronetab!==droneTab);
  });
  if(droneTab==='upgrades'){
    if(hint) hint.textContent=`drone_count ${stats.drone_count??'—'} · suit cap ${cap}`;
    let html='<div class="tier-block t1"><div class="tier-head"><div class="th-l">Core Upgrades</div></div>';
    html+=DRONE_CORE_UPGRADES.map(u=>{
      const max=u.maxBase;
      const lv=Math.min(max, C.getDroneCore(state.col,u.id));
      const tot=u.unlock?(lv?'Unlocked':'—'):`${u.perLevel*lv}${u.unit}`;
      const maxed=lv>=max;
      return `<div class="art-row">
        <div class="art-ico">${artIco(u.icon,'🛸')}</div>
        <div class="art-desc">${u.name}${tot&&!u.unlock?` — ${tot.startsWith('-')?tot:'+'+tot}`:u.unlock&&lv?' — Unlocked':''}</div>
        <div class="art-stats"><span class="lv">${lv}/${max}</span></div>
        <div class="art-actions">
          <button class="pixbtn ghost" data-dcore="${u.id}" data-d="-1">−</button>
          ${maxed?`<span class="btn-maxed">Maxed</span>`:`<button class="pixbtn" data-dcore="${u.id}" data-d="1">+</button>`}
        </div>
      </div>`;
    }).join('');
    html+='</div><div class="tier-block t2" style="margin-top:12px"><div class="tier-head"><div class="th-l">Suit Upgrades</div></div>';
    html+=DRONE_SUITS.map(s=>{
      const lv=Math.min(cap, C.getDroneSuitLv(state.col,s.id));
      const maxed=lv>=cap;
      const bonus=s.perLevel*lv;
      const tot=s.unit==='s'?`${bonus}s`:`${bonus>=0?'+':''}${bonus}${s.unit}`;
      return `<div class="art-row">
        <div class="art-ico">${artIco(s.icon,'🤖')}</div>
        <div class="art-desc"><b>${s.name}</b> — ${s.ability}<br><span class="muted">${s.upgrade} → ${tot}</span></div>
        <div class="art-stats"><span class="lv">${lv}/${cap}</span></div>
        <div class="art-actions">
          <button class="pixbtn ghost" data-dsuit="${s.id}" data-d="-1">−</button>
          ${maxed?`<span class="btn-maxed">Maxed</span>`:`<button class="pixbtn" data-dsuit="${s.id}" data-d="1">+</button>
            <button class="pixbtn gold" data-dsuitmax="${s.id}">Max</button>`}
        </div>
      </div>`;
    }).join('')+'</div>';
    box.innerHTML=html;
  } else {
    if(hint) hint.textContent='Drone Level = fuel grades (*_fuel_grade export)';
    box.innerHTML=DRONE_FUEL.map(f=>{
      const lv=Math.min(f.maxGrade, C.getDroneFuel(state.col,f.id));
      const maxed=lv>=f.maxGrade;
      return `<div class="art-row">
        <div class="art-ico">${artIco(f.icon,'⛽')}</div>
        <div class="art-desc"><b>${f.name}</b> — ${f.buff}</div>
        <div class="art-stats"><span class="lv">${lv}/${f.maxGrade}</span></div>
        <div class="art-actions">
          <button class="pixbtn ghost" data-dfuel="${f.id}" data-d="-1">−</button>
          ${maxed?`<span class="btn-maxed">Maxed</span>`:`<button class="pixbtn" data-dfuel="${f.id}" data-d="1">+</button>`}
        </div>
      </div>`;
    }).join('');
  }
}
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-dronetab]');
  if(t){ droneTab=t.dataset.dronetab; renderDrones(); return; }
  const c=e.target.closest('[data-dcore]');
  if(c){
    const u=DRONE_CORE_UPGRADES.find(x=>x.id===c.dataset.dcore);
    C.setDroneCore(state.col,u.id,Math.min(u.maxBase,Math.max(0,C.getDroneCore(state.col,u.id)+ +c.dataset.d)));
    C.saveCollections(state.col);renderDrones(); return;
  }
  const s=e.target.closest('[data-dsuit]');
  if(s){
    const cap=suitCapFromExport(state.parsed?.stats||{}, C.getCaps(state.col));
    C.setDroneSuitLv(state.col,s.dataset.dsuit,Math.min(cap,Math.max(0,C.getDroneSuitLv(state.col,s.dataset.dsuit)+ +s.dataset.d)));
    C.saveCollections(state.col);renderDrones(); return;
  }
  const sm=e.target.closest('[data-dsuitmax]');
  if(sm){
    const cap=suitCapFromExport(state.parsed?.stats||{}, C.getCaps(state.col));
    C.setDroneSuitLv(state.col,sm.dataset.dsuitmax,cap);
    C.saveCollections(state.col);renderDrones(); return;
  }
  const f=e.target.closest('[data-dfuel]');
  if(f){
    const row=DRONE_FUEL.find(x=>x.id===f.dataset.dfuel);
    C.setDroneFuel(state.col,row.id,Math.min(row.maxGrade,Math.max(0,C.getDroneFuel(state.col,row.id)+ +f.dataset.d)));
    C.saveCollections(state.col);renderDrones();
  }
});

/* ================= CHALLENGES ================= */
let chalTab='regular';
function renderChallenges(){
  const box=$('#chalGrid'); if(!box) return;
  document.querySelectorAll('[data-chaltab]').forEach(b=>{
    b.classList.toggle('on', b.dataset.chaltab===chalTab);
    b.classList.toggle('ghost', b.dataset.chaltab!==chalTab);
  });
  const overlay=$('#chalOverlay');
  const ov=C.getChallengeOverlay(state.col) || { id:'div_7', progress:7, goal:15 };
  const ovCh=CHALLENGES.divine.find(c=>c.id===ov.id) || CHALLENGES.divine.find(c=>c.n===7);
  if(overlay&&ovCh){
    overlay.innerHTML=`<div class="chal-card">
      <b>Overlay — Divine Challenge ${ovCh.n}</b>
      ${ovCh.text}<br>
      <div style="display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap">
        <span>Progress</span>
        <button class="pixbtn ghost" data-ovp="-1">−</button>
        <span class="lvval" style="min-width:64px">${ov.progress||0}/${ov.goal||ovCh.goal||'?'} </span>
        <button class="pixbtn" data-ovp="1">+</button>
        <span class="muted">Reward: 10 Divine Coins</span>
      </div>
    </div>`;
  }
  const hint=$('#chalHint');
  const list=CHALLENGES[chalTab]||[];
  const done=list.filter(c=>C.isChallengeDone(state.col,c.id)).length;
  if(hint) hint.textContent=`${done}/${list.length} done · +10 coins each`;
  box.innerHTML=list.map(c=>{
    const ok=C.isChallengeDone(state.col,c.id);
    return `<div class="art-row">
      <div class="art-ico">${ok?'✅':'⬜'}</div>
      <div class="art-desc"><b>#${c.n}</b> ${c.text}</div>
      <div class="art-actions">
        <button class="pixbtn ${ok?'on':''}" data-chal="${c.id}">${ok?'FAIT':'TODO'}</button>
        ${c.n===7&&chalTab==='divine'?`<button class="pixbtn ghost" data-ovset="${c.id}">Overlay</button>`:''}
      </div>
    </div>`;
  }).join('');
}
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-chaltab]');
  if(t){ chalTab=t.dataset.chaltab; renderChallenges(); return; }
  const c=e.target.closest('[data-chal]');
  if(c){
    C.setChallengeDone(state.col,c.dataset.chal,!C.isChallengeDone(state.col,c.dataset.chal));
    C.saveCollections(state.col);renderChallenges(); return;
  }
  const op=e.target.closest('[data-ovp]');
  if(op){
    const ov=C.getChallengeOverlay(state.col)||{ id:'div_7', progress:7, goal:15 };
    ov.progress=Math.max(0, Math.min(ov.goal||15, (ov.progress||0)+ +op.dataset.ovp));
    C.setChallengeOverlay(state.col, ov);
    C.saveCollections(state.col);renderChallenges(); return;
  }
  const os=e.target.closest('[data-ovset]');
  if(os){
    const ch=CHALLENGES.divine.find(x=>x.id===os.dataset.ovset);
    C.setChallengeOverlay(state.col,{ id:ch.id, progress:0, goal:ch.goal||15 });
    C.saveCollections(state.col);renderChallenges();
  }
});
$('#btnChalAllDone')?.addEventListener('click',()=>{
  for(const c of (CHALLENGES[chalTab]||[])) C.setChallengeDone(state.col,c.id,true);
  C.saveCollections(state.col);renderChallenges();
});
$('#btnChalClear')?.addEventListener('click',()=>{
  for(const c of (CHALLENGES[chalTab]||[])) C.setChallengeDone(state.col,c.id,false);
  C.saveCollections(state.col);renderChallenges();
});

/* ================= SHOP ================= */
function renderShop(){
  const box=$('#shopGrid'); if(!box) return;
  const hint=$('#shopHint');
  if(hint) hint.textContent='Niveaux manuels (Regular / Extreme / Divine coins)';
  let html='';
  for(const tier of ['regular','extreme','divine']){
    const label=tier[0].toUpperCase()+tier.slice(1);
    html+=`<div class="tier-block t${tier==='regular'?1:tier==='extreme'?2:4}"><div class="tier-head"><div class="th-l">${label} Shop</div></div>`;
    for(const u of CHALLENGE_SHOP[tier]){
      const lv=Math.min(u.max, C.getChallengeShop(state.col,u.id));
      const maxed=lv>=u.max;
      html+=`<div class="art-row">
        <div class="art-ico">🏅</div>
        <div class="art-desc">${u.name} — ${u.per}</div>
        <div class="art-stats"><span class="lv">${lv}/${u.max}</span></div>
        <div class="art-actions">
          <button class="pixbtn ghost" data-cshop="${u.id}" data-d="-1">−</button>
          ${maxed?`<span class="btn-maxed">Maxed</span>`:`<button class="pixbtn" data-cshop="${u.id}" data-d="1">+</button>`}
        </div>
      </div>`;
    }
    html+='</div>';
  }
  box.innerHTML=html;
}
document.addEventListener('click',e=>{
  const s=e.target.closest('[data-cshop]');
  if(s){
    const all=[...CHALLENGE_SHOP.regular,...CHALLENGE_SHOP.extreme,...CHALLENGE_SHOP.divine];
    const u=all.find(x=>x.id===s.dataset.cshop);
    C.setChallengeShop(state.col,u.id,Math.min(u.max,Math.max(0,C.getChallengeShop(state.col,u.id)+ +s.dataset.d)));
    C.saveCollections(state.col);renderShop();
  }
});
$('#btnShopMaxAll')?.addEventListener('click',()=>{
  for(const tier of Object.values(CHALLENGE_SHOP)) for(const u of tier) C.setChallengeShop(state.col,u.id,u.max);
  C.saveCollections(state.col);renderShop();
});
$('#btnShopClear')?.addEventListener('click',()=>{
  for(const tier of Object.values(CHALLENGE_SHOP)) for(const u of tier) C.setChallengeShop(state.col,u.id,0);
  C.saveCollections(state.col);renderShop();
});

/* ================= STATUES / RESEARCH / MONUMENTS ================= */
import { STATUES, STATUE_STATES, visibleStatues, gatingInfo } from './game/statuesData.js';

let constructTab='statues';
function renderConstructStatuesHtml(){
  const maxW=maxWorldUnlocked();
  let h='';
  for(const w of [1,3,4]){
    if(w>maxW){ h+=`<h3>Monde ${w} <span class="muted">— verrouillé (Monument requis)</span></h3>`; continue; }
    const list=visibleStatues(maxW).filter(s=>s.world===w);
    h+=`<h3>Statues Monde ${w} <span class="muted">(${list.length})</span></h3>
      <div class="statue-board"><div class="statue-grid">`;
    for(const s of list){
      const st=C.getStatueState(state.col,s.num);
      const stDef=STATUE_STATES[st];
      const icon=st>=3?s.iconPlatinum:st===2?s.iconGilded:s.iconNormal;
      const rawBonus=st>=3?(s.platinumBonus||s.gildedBonus||s.bonus):st===2?(s.gildedBonus||s.bonus):s.bonus;
      const bonusHtml=rawBonus.split(' · ').map(b=>`<span class="bl">${b}</span>`).join('');
      h+=`<div class="statue-slot ${stDef.cls}" data-statue="${s.num}" title="${s.name} (${s.author})\n${rawBonus}\nClic : +1 · Clic droit : −1">
        <div class="statue-frame"><img src="${icon}" alt="${s.name}" loading="lazy"></div>
        <div class="statue-plate">${s.name}</div>
        <div class="statue-bonus"><span class="st-label">${stDef.name}${s.author?` · ${s.author}`:''}</span>${bonusHtml}</div>
      </div>`;
    }
    h+='</div></div>';
    const arr=list.map(s=>C.getStatueState(state.col,s.num));
    const g=gatingInfo({['W'+w]:arr})['W'+w];
    const built=arr.filter(v=>v>=1).length, gld=arr.filter(v=>v>=2).length;
    h+=`<p class="statue-meta">${built}/${list.length} construites · ${gld}/${list.length} gildées · `+
       (g.canPlatinize?'✓ platinisation possible':g.canGild?'⚠ toutes construites avant de gilder':'⚠ continue à construire')+'</p>';
  }
  return h;
}
function renderConstruct(){
  const body=$('#constructBody'); if(!body) return;
  document.querySelectorAll('[data-constructtab]').forEach(b=>{
    b.classList.toggle('on', b.dataset.constructtab===constructTab);
    b.classList.toggle('ghost', b.dataset.constructtab!==constructTab);
  });
  const hint=$('#constructHint');
  if(constructTab==='statues'){
    if(hint) hint.textContent='Statues depuis export — clic pour corriger';
    body.innerHTML=renderConstructStatuesHtml();
    return;
  }
  if(constructTab==='research'){
    if(hint) hint.textContent='Vein unlocks + Spawn Rate 2×';
    let html='<div class="tier-block t1"><div class="tier-head"><div class="th-l">Vein Unlocks</div></div>';
    html+=RESEARCH_VEINS.map(v=>{
      const on=C.hasResearchUnlock(state.col,v.id);
      return `<div class="art-row"><div class="art-ico">${artIco(v.icon,'⛏')}</div><div class="art-desc"><b>${v.name}</b></div>
        <div class="art-actions"><button class="pixbtn ${on?'on':''}" data-resu="${v.id}">${on?'UNLOCK':'—'}</button></div></div>`;
    }).join('')+'</div>';
    html+='<div class="tier-block t2" style="margin-top:12px"><div class="tier-head"><div class="th-l">Vein Spawn Rate 2×</div></div>';
    html+=RESEARCH_VEINS.map(v=>{
      const on=C.hasResearchSpawn(state.col,v.id);
      return `<div class="art-row"><div class="art-ico">${artIco(v.icon,'⛏')}</div><div class="art-desc"><b>${v.name} Spawn</b></div>
        <div class="art-actions"><button class="pixbtn ${on?'on':''}" data-ress="${v.id}">${on?'2×':'—'}</button></div></div>`;
    }).join('')+'</div>';
    body.innerHTML=html;
    return;
  }
  if(hint) hint.textContent='Monuments débloquent W2 / W3 / W4';
  body.innerHTML=`<div class="prestige-list">${MONUMENTS.map(m=>{
    const on=((state.col.monuments||{})[m.world]);
    return `<div class="art-row"><div class="art-ico">🏛</div><div class="art-desc"><b>Monument Monde ${m.world}</b> — ${m.cost}</div>
      <div class="art-actions"><button class="pixbtn ${on?'on':''}" data-mon="${m.world}">${on?'CONSTRUIT':'À CONSTRUIRE'}</button></div></div>`;
  }).join('')}</div>`;
}
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-constructtab]');
  if(t){ constructTab=t.dataset.constructtab; renderConstruct(); return; }
  const s=e.target.closest('[data-statue]');
  if(s){
    C.cycleStatue(state.col,+s.dataset.statue);
    C.saveCollections(state.col);renderConstruct();renderRoadmap();
  }
  const m=e.target.closest('[data-mon]');
  if(m){state.col.monuments||={};state.col.monuments[m.dataset.mon]=!state.col.monuments[m.dataset.mon];C.saveCollections(state.col);renderConstruct();renderCards();renderRoadmap();}
  const ru=e.target.closest('[data-resu]');
  if(ru){ C.setResearchUnlock(state.col,ru.dataset.resu,!C.hasResearchUnlock(state.col,ru.dataset.resu)); C.saveCollections(state.col); renderConstruct(); return; }
  const rs=e.target.closest('[data-ress]');
  if(rs){ C.setResearchSpawn(state.col,rs.dataset.ress,!C.hasResearchSpawn(state.col,rs.dataset.ress)); C.saveCollections(state.col); renderConstruct(); }
});
document.addEventListener('contextmenu',e=>{
  const s=e.target.closest('[data-statue]');
  if(s){e.preventDefault();C.setStatueState(state.col,+s.dataset.statue,Math.max(0,C.getStatueState(state.col,+s.dataset.statue)-1));C.saveCollections(state.col);renderConstruct();}
});
document.addEventListener('change',e=>{
  const i=e.target.closest('[data-statuefree]');
  if(i){C.setStatuesFree(state.col,i.dataset.statuefree,i.value);C.saveCollections(state.col);}
});

/* ================= STARS / STARGAZING ================= */
let starTab='stars';
function starExtraCap(id){
  let x=C.getSuperStarUpgrade(state.col,'star_caps');
  if(['aries','gemini','cancer'].includes(id)) x+=2*C.getSuperStarUpgrade(state.col,'agc_cap');
  if(['virgo','aquarius','ophiuchus'].includes(id)) x+=C.getSuperStarUpgrade(state.col,'vao_cap');
  if(['draco','orion'].includes(id) && C.hasBlackHoleBlessing(state.col,'bh_draco_orion')) x+=5;
  return x;
}
function renderStars(){
  const box=$('#starList'); if(!box) return;
  document.querySelectorAll('[data-startab]').forEach(b=>{
    b.classList.toggle('on', b.dataset.startab===starTab);
    b.classList.toggle('ghost', b.dataset.startab!==starTab);
  });
  const hint=$('#starHint');
  if(starTab==='stars'){
    const owned=STARS_FULL.filter(s=>C.getStarLevel(state.col,s.id)>0).length;
    if(hint) hint.textContent=`${owned}/${STARS_FULL.length} unlocked · telescope ${C.getStarUpgrade(state.col,'telescope')}/21`;
    box.innerHTML=STARS_FULL.map(s=>{
      const stored=C.getStarLevel(state.col,s.id);
      const max=Math.max(starEffectiveMax(s, starExtraCap(s.id)), stored);
      const lv=stored;
      const maxed=lv>=max && lv>0;
      const icon=`assets/cards/${s.name}.png`;
      return `<div class="art-row">
        <div class="art-ico"><img src="${icon}" alt="" loading="lazy" style="width:28px;height:28px;image-rendering:pixelated" onerror="this.parentNode.textContent='⭐'"></div>
        <div class="art-desc"><b>${s.name}</b> — ${s.perk}</div>
        <div class="art-stats"><span class="lv">${lv}/${max}</span></div>
        <div class="art-actions">
          <button class="pixbtn ghost" data-starlv="${s.id}" data-d="-1">−</button>
          ${maxed?`<span class="btn-maxed">Maxed</span>`:`<button class="pixbtn" data-starlv="${s.id}" data-d="1">+</button>
            <button class="pixbtn gold" data-starmax="${s.id}">Max</button>`}
        </div>
      </div>`;
    }).join('');
  } else if(starTab==='upgrades'){
    if(hint) hint.textContent='Stargazing Upgrades (wiki)';
    box.innerHTML=STAR_UPGRADES.map(u=>{
      const stored=C.getStarUpgrade(state.col,u.id);
      const lv=stored;
      const maxShown=Math.max(u.max, stored);
      return `<div class="art-row">
        <div class="art-ico">${artIco('assets/stargazing/Telescope.png','🔭')}</div>
        <div class="art-desc"><b>${u.name}</b> — ${u.per}${u.telescope?` <span class="muted">(tel ${u.telescope}+)</span>`:''}</div>
        <div class="art-stats"><span class="lv">${lv}/${maxShown}</span></div>
        <div class="art-actions">
          <button class="pixbtn ghost" data-supg="${u.id}" data-d="-1">−</button>
          ${lv>=maxShown?`<span class="btn-maxed">Maxed</span>`:`<button class="pixbtn" data-supg="${u.id}" data-d="1">+</button>`}
        </div>
      </div>`;
    }).join('');
  } else if(starTab==='super'){
    if(hint) hint.textContent='Super Stars upgrades';
    box.innerHTML=SUPER_STAR_UPGRADES.map(u=>{
      const lv=Math.min(u.max, C.getSuperStarUpgrade(state.col,u.id));
      const maxed=lv>=u.max;
      return `<div class="art-row">
        <div class="art-ico">${artIco('assets/stargazing/Super_Star.png','✨')}</div>
        <div class="art-desc"><b>${u.name}</b> — ${u.per}${u.telescope?` <span class="muted">(tel ${u.telescope}+)</span>`:''}</div>
        <div class="art-stats"><span class="lv">${lv}/${u.max}</span></div>
        <div class="art-actions">
          <button class="pixbtn ghost" data-ssupg="${u.id}" data-d="-1">−</button>
          ${maxed?`<span class="btn-maxed">Maxed</span>`:`<button class="pixbtn" data-ssupg="${u.id}" data-d="1">+</button>`}
        </div>
      </div>`;
    }).join('');
  } else {
    const bhLv=state.profile?.blackHoleLevel;
    if(hint) hint.textContent=bhLv!=null?`Black Hole niveau ${bhLv} — l'export ne liste pas les blessings`:'Black Hole blessings (toggle)';
    box.innerHTML=BLACK_HOLE_BLESSINGS.map(b=>{
      const on=C.hasBlackHoleBlessing(state.col,b.id);
      return `<div class="art-row">
        <div class="art-ico">${artIco('assets/stargazing/BlackHole.png','🕳️')}</div>
        <div class="art-desc">${b.name}</div>
        <div class="art-actions">
          <button class="pixbtn ${on?'on':''}" data-bh="${b.id}">${on?'ACTIF':'—'}</button>
        </div>
      </div>`;
    }).join('');
  }
}
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-startab]');
  if(t){ starTab=t.dataset.startab; renderStars(); return; }
  const sl=e.target.closest('[data-starlv]');
  if(sl){
    const s=STARS_FULL.find(x=>x.id===sl.dataset.starlv);
    const cur=C.getStarLevel(state.col,s.id);
    const max=Math.max(starEffectiveMax(s, starExtraCap(s.id)), cur);
    C.setStarLevel(state.col,s.id,Math.min(max,Math.max(0,cur+ +sl.dataset.d)));
    C.saveCollections(state.col);renderStars(); return;
  }
  const sm=e.target.closest('[data-starmax]');
  if(sm){
    const s=STARS_FULL.find(x=>x.id===sm.dataset.starmax);
    C.setStarLevel(state.col,s.id,starEffectiveMax(s, starExtraCap(s.id)));
    C.saveCollections(state.col);renderStars(); return;
  }
  const u=e.target.closest('[data-supg]');
  if(u){
    const row=STAR_UPGRADES.find(x=>x.id===u.dataset.supg);
    const cur=C.getStarUpgrade(state.col,row.id);
    C.setStarUpgrade(state.col,row.id,Math.min(Math.max(row.max,cur),Math.max(0,cur+ +u.dataset.d)));
    C.saveCollections(state.col);renderStars(); return;
  }
  const ss=e.target.closest('[data-ssupg]');
  if(ss){
    const row=SUPER_STAR_UPGRADES.find(x=>x.id===ss.dataset.ssupg);
    C.setSuperStarUpgrade(state.col,row.id,Math.min(row.max,Math.max(0,C.getSuperStarUpgrade(state.col,row.id)+ +ss.dataset.d)));
    C.saveCollections(state.col);renderStars(); return;
  }
  const bh=e.target.closest('[data-bh]');
  if(bh){ C.toggleBlackHoleBlessing(state.col,bh.dataset.bh); C.saveCollections(state.col); renderStars(); }
});
$('#btnStarMaxTab')?.addEventListener('click',()=>{
  if(starTab==='stars') for(const s of STARS_FULL) C.setStarLevel(state.col,s.id,starEffectiveMax(s,starExtraCap(s.id)));
  else if(starTab==='upgrades') for(const u of STAR_UPGRADES) C.setStarUpgrade(state.col,u.id,u.max);
  else if(starTab==='super') for(const u of SUPER_STAR_UPGRADES) C.setSuperStarUpgrade(state.col,u.id,u.max);
  else for(const b of BLACK_HOLE_BLESSINGS){ state.col.blackHole||={}; state.col.blackHole[b.id]=true; }
  C.saveCollections(state.col);renderStars();
});
$('#btnStarClearTab')?.addEventListener('click',()=>{
  if(starTab==='stars') for(const s of STARS_FULL) C.setStarLevel(state.col,s.id,0);
  else if(starTab==='upgrades') for(const u of STAR_UPGRADES) C.setStarUpgrade(state.col,u.id,0);
  else if(starTab==='super') for(const u of SUPER_STAR_UPGRADES) C.setSuperStarUpgrade(state.col,u.id,0);
  else state.col.blackHole={};
  C.saveCollections(state.col);renderStars();
});

/* ================= HISTORIQUE ================= */
function renderHistory(){
  const h=loadHistory(),sel=$('#histSelect'),out=$('#histOut');
  sel.innerHTML=h.map((x,i)=>`<option value="${i}">${new Date(x.importedAt).toLocaleString('fr')} · ${x.version}</option>`).join('');
  out.innerHTML=h.length<2?'<p class="muted">Importe un 2e export pour comparer.</p>':'';
  if(h.length>=2){
    const d=diffExports(h[1],h[0]);let html='<h3>Évolutions</h3>';
    for(const c of d.changed.slice(0,30))html+=`<div class="statline"><span>${c.key}</span><b>${fmtStat(c.from)} → ${fmtStat(c.to)} ${c.dir==='up'?'📈':'📉'}</b></div>`;
    if(d.added.length)html+=`<h3 class="ok">Nouvelles stats (${d.added.length})</h3><p class="ok" style="font-size:8px">${d.added.map(a=>a.key).join(', ')}</p>`;
    out.innerHTML=html;
  }
}

/* ---------- init ---------- */
(function hydrateCapsFromHistory(){
  const caps=C.getCaps(state.col);
  const h=loadHistory();
  if(!(caps.artifactT4||caps.workshop) && h[0]?.stats){
    C.applyExportCaps(state.col,h[0].stats); C.saveCollections(state.col);
  }
  if(h[0]?.stats && !Object.keys(state.col.droneCore||{}).length){
    applyDronesFromExport(h[0].stats); C.saveCollections(state.col);
  }
  if(h[0]?.stats?.skill_tree_nodes_array && !Object.keys(state.col.skills||{}).length){
    applyExportArrays(state.col, h[0].stats); C.saveCollections(state.col);
  }
})();
renderCards();renderPets();renderArtifacts();renderWorkshop();renderSkills();renderDrones();renderChallenges();renderShop();renderConstruct();renderStars();renderFishing();renderArchaeology();renderHistory();renderDashTools();
show('export');
