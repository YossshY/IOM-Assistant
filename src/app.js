/* ============================================================
   app.js — Orchestration UI (logique de jeu dans src/game/*)
   ============================================================ */
import { parseExportStats, deriveProfile } from './game/statsParser.js';
import { detectMissingInformation } from './game/missingInfo.js';
import { generateRecommendations, CONFIDENCE } from './game/recommendationEngine.js';
import { loadHistory, saveImport, diffExports, fmtNum } from './game/history.js';
import { CARD_STATES, CARD_SETS, PETS, STARS } from './game/cards.js';
import { ORE_CARDS, BAR_CARDS, MISC_CARDS, visibleCards } from './game/cardsData.js';
// icônes misc réelles : mapping id → fichier téléchargé depuis le wiki
const MISC_ICONS={superstar:'Misc_Super_Star.png',novagiant:'Misc_Novagiant_Combo.png',minername:'Misc_Miner_Name.png',lootbug:'Misc_Lootbug.png',goldbug:'Golden_Lootbug_Chance.png',prestige:'Misc_Prestige.png',freebie:'Misc_Freebie.png',stonks:'Misc_Stonks.png',superstonks:'Super_Stonks.png',ultrastonks:'Misc_Ultra_Stonks.png',contract:'Misc_Contract.png',void:'Misc_Void.png',goldvoid:'Misc_Golden_Void.png',rainbowvoid:'Rainbow_Void_Portal.png',galacvoid:'Galactic_Void_Portal.png',world1:'Misc_World_1.png',world2:'Misc_World_2.png',world3:'Misc_World_3.png',world4:'Misc_World_4.png',alex:'Misc_Alex.png',bluecow:'Misc_Blue_Cow.png',goldore:'Misc_Golden_Vein.png',sushi:'Misc_Sushi.png',archabil:'Misc_Arch_Ability.png',goldvein:'Misc_Golden_Vein.png',rainbowvein:'Misc_Rainbow_Vein.png',gleamvein:'Misc_Gleaming_Vein.png',fuel:'Misc_Fuel.png',rod:'Misc_Fishing_Rod.png',code:'Misc_Code.png',frozenara:'Misc_FrozenAra.png',celio:"Misc_Celio's_Hat.png",vydn:'Misc_Vydn.png',lute:'Misc_Lute.png',julk:'Misc_Julk.png',pizza:'Misc_Yummy_Pizza.png',lootfrog:'Lootfrogs_Caught.png',goldfrog:'Golden_Lootfrogs_Caught.png',bigfrog:'Misc_Big_Lootfrog.png',massfrog:'Misc_Massive_Lootfrog.png',floor73:'Misc_Floor_73.png'};
import { ARTIFACTS, SKILLS, OBELISK_UNLOCKS } from './game/knowledgeBase.js';
import * as C from './game/collections.js';

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
  state.history=saveImport(parsed);
  el.innerHTML=`✅ ${parsed.version} — ${parsed.statCount} stats`+(parsed.unknownKeys.length?` · <span class="warn">${parsed.unknownKeys.length} inconnues conservées</span>`:'');
  el.className='msg ok';
  renderAll();
}

function renderAll(){renderTop();renderDash();renderRoadmap();renderAllStats();renderFishing();}

function renderTop(){
  if(!state.parsed)return;
  const known=state.parsed.versionKnown?'':' · ⚠ version inconnue de la base';
  $('#topVersion').textContent=`v${state.parsed.version}${known} · OB ${state.profile.obeliskLevel??'?'}`;
}

/* ---------- dashboard ---------- */
function renderDash(){
  const g=$('#dashProfile');
  if(!state.parsed){g.innerHTML='<p class="muted">Aucun import.</p>';return;}
  const p=state.profile;
  g.innerHTML=[
    ['Version',p.version],['Obelisk Level',p.obeliskLevel??'?'],['Cap XP',p.xpLevelCap??'?'],
    ['Temps de jeu',p.playtimeHours!=null?p.playtimeHours+' h':'inconnu'],
    ['Pickaxe Damage',fmtNum(p.pickaxeDamage)],['Multi PP','×'+fmtNum(p.ppMulti??1)],
    ['Cards possédées',C.cardCounts(state.col).owned],
    ['Pets débloqués',Object.values(state.col.pets||{}).filter(v=>v>0).length],
  ].map(c=>`<div class="cell"><span>${c[0]}</span><b>${c[1]}</b></div>`).join('');
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
      <p style="opacity:.6">Source : ${r.source}</p></div></div>`;
  }
  for(const r of recs.filter(r=>r.priority===0))
    h+=`<p class="blocked">${CONFIDENCE.insufficient.icon} ${r.title} — ${r.reason}</p>`;
  box.innerHTML=h||'<p class="muted">Rien à signaler.</p>';
}

/* ---------- toutes les stats ---------- */
function renderAllStats(){
  const box=$('#allStats');
  if(!state.parsed){box.innerHTML='<p class="muted">—</p>';return;}
  const s=state.parsed.stats;
  box.innerHTML=Object.entries(s).map(([k,v])=>
    `<div class="statline"><span>${k}</span><b>${typeof v==='number'?fmtNum(v):v}</b></div>`).join('');
}

function renderFishing(){
  const box=$('#fishingStats');
  const s=state.parsed?.stats||{};
  const keys=Object.keys(s).filter(k=>k.startsWith('fishing_'));
  box.innerHTML=keys.length?keys.map(k=>`<div class="statline"><span>${k}</span><b>${fmtNum(s[k])}</b></div>`).join('')
    :'<p class="muted">Importe un exportstats — les clés fishing_* s\'afficheront ici automatiquement.</p>';
}

/* ================= CARDS =================
   Toutes les cartes individuelles, groupées par catégorie.
   Masquage progressif : une carte liée au monde N n'apparaît que si le
   joueur a débloqué ce monde (monuments cochés dans Construct ou OB requis). */
function maxWorldUnlocked(){
  const mons=state.col.monuments||{};
  if(mons[4])return 4; if(mons[3])return 3; if(mons[2])return 2;
  const ob=state.profile.obeliskLevel;
  if(ob!=null){ if(ob>=64)return Math.max(3,(mons[3]?4:3)); if(ob>=42)return 2+((mons[2])?1:0); }
  return 1;
}
function renderCards(){
  const box=$('#cardSets');
  const maxW=maxWorldUnlocked();
  const cards=visibleCards(maxW);
  let h=`<p class="muted">Monde max détecté : <b>${maxW}</b> — les cartes des mondes supérieurs sont masquées (coche tes Monuments dans Construct ou importe un exportstats pour les révéler).</p>`;

  for(const set of CARD_SETS){
    const setCards=cards.filter(c=>c.cat===set.id);
    if(!setCards.length)continue;
    // boutons bulk par famille
    h+=`<h3 style="display:flex;align-items:center;gap:10px">${set.icon} ${set.name} <span class="muted">(${setCards.length})</span>
      <span style="display:inline-flex;gap:6px;margin-left:auto">
        <button class="pixbtn gold" data-bulkset="${set.id}" data-v="2" style="font-size:7px;padding:5px 8px">Tout Gilded</button>
        <button class="pixbtn poly" data-bulkset="${set.id}" data-v="3" style="font-size:7px;padding:5px 8px">Tout Poly</button>
        <button class="pixbtn inf"  data-bulkset="${set.id}" data-v="4" style="font-size:7px;padding:5px 8px">Tout Infernal</button>
      </span></h3><div class="cardgrid">`;
    for(const c of setCards){
      const st=C.getCardState(state.col,c.id);
      h+=cardTile(c.id,c.icon||'🃏',c.name,st,c.effect,c.world?`W${c.world}`:null,c.mod,st>0);
    }
    h+='</div>';
  }
  // Misc : individuelles avec icônes wiki
  const misc=cards.filter(c=>c.cat==='misc');
  h+=`<h3>🃏 Misc Cards <span class="muted">(${misc.length})</span></h3><div class="cardgrid">`;
  for(const c of misc){
    const st=C.getCardState(state.col,c.id);
    const icon=MISC_ICONS[c.id]?('assets/cards/'+MISC_ICONS[c.id]):'🃏';
    h+=cardTile(c.id,icon,c.name,st,c.effect,c.world?`W${c.world}`:null,null,st>0);
  }
  h+='</div>';
  box.innerHTML=h;
  const cc=C.cardCounts(state.col), total=cards.length;
  $('#cardCounts').textContent=`${cc.owned}/${total} possédées · ${cc.gilded} gilded · ${cc.poly} poly · ${cc.infernal} infernal`;
}
function cardTile(id,img,name,st,effect,worldTag,mod,unlocked=true){
  // fond = dos de carte officiel selon l'état (0 → standard grisé)
  const backings=['Card_Backing_Standard','Card_Backing_Standard','Card_Backing_Gilded','Card_Backing_Polychrome','Card_Backing_Infernal'];
  const bg=`assets/backings/${backings[st]}.png`;
  const eff=effect?effect[Math.min(Math.max(st-1,0),effect.length-1)]:'';
  const icon=img.startsWith('assets/')
    ? `<img class="em" src="${img}" alt="" loading="lazy">`
    : `<span class="em">${img}</span>`;
  return `<div class="card ${unlocked?'':'locked'}" data-card="${id}"
    style="background-image:url('${bg}')"
    title="${name}${mod?' — modificateur : '+mod:''}${worldTag?' ['+worldTag+']':''}\n${CARD_STATES[st].name}${eff&&st>0?' : '+eff:''}\nClic : évoluer">
    ${icon}<span class="nm">${name}</span></div>`;
}
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-card]');
  if(t){C.cycleCard(state.col,t.dataset.card);C.saveCollections(state.col);renderCards();renderDash();}
  const b=e.target.closest('[data-bulk]');
  if(b){C.setAllVisible(state.col,+b.dataset.bulk,visibleCards(maxWorldUnlocked()).map(c=>c.id));C.saveCollections(state.col);renderCards();renderDash();}
  const bs=e.target.closest('[data-bulkset]');
  if(bs){
    const set=bs.dataset.bulkset;
    const ids=visibleCards(maxWorldUnlocked()).filter(c=>c.cat===set).map(c=>c.id);
    C.setAllVisible(state.col,+bs.dataset.v,ids);C.saveCollections(state.col);renderCards();renderDash();
  }
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
    const lv=C.getPetLevel(state.col,p.id);
    const locked = p.unlockTotal>0 && total<p.unlockTotal && lv===0;
    const skinOn=owned['skin_'+p.id], questOn=owned['quest_'+p.id];
    const emoji={Crab:'🦀',Dwarf:'🧔',Duck:'🦆',Rabbit:'🐰',Penguin:'🐧',Axolotl:'🦎',Whale:'🐋'}[p.id]||'🐾';
    return `<div class="petrow ${locked?'locked':''}">
      <img class="pet-em" src="${p.iconDefault}" alt="" loading="lazy" style="width:44px;height:44px;image-rendering:pixelated">
      <div class="pet-info">
        <b>${p.name}</b> <span class="muted">· requis total niv ${p.unlockTotal} · ${p.price} 💎</span>
        <p>${p.levelBy} — ${p.bonus}</p>
        <div class="pet-unlocks">
          <button class="petchip ${skinOn?'on':''}" data-petunlock="skin_${p.id}" title="${p.skin?`${p.skin.name} : ${p.skin.bonus}`:''}">
            🎨 Skin${p.skin?' : '+p.skin.name+' ('+p.skin.price+' 💎)':''}
          </button>
          <button class="petchip ${questOn?'on':''}" data-petunlock="quest_${p.id}" title="${p.quest?`${p.quest.name} — Rank up : ${p.quest.rankUp} — Bonus : ${p.quest.bonus}`:''}">
            🏆 Quête${p.quest?' : '+p.quest.name+' ('+p.quest.price+' 💎)':''}
          </button>
        </div>
      </div>
      <div class="lvbtns">
        <button class="pixbtn ghost" data-pet="${p.id}" data-d="-1">−</button>
        <span class="lvval">${lv}/${p.maxLevel}</span>
        <button class="pixbtn" data-pet="${p.id}" data-d="1">+</button>
      </div></div>`;
  }).join('')+`<p class="muted" style="margin-top:10px">Total niveaux : ${total} · Skins : bonus actif même non équipé, -15→-30% de coût de level up. Quête : disponible au niveau 10 du pet.</p>`;
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-pet]');if(!b)return;
  const pet=PETS_FULL.find(p=>p.id===b.dataset.pet);
  C.setPetLevel(state.col,b.dataset.pet,Math.min(pet.maxLevel,Math.max(0,C.getPetLevel(state.col,b.dataset.pet)+ +b.dataset.d)));
  C.saveCollections(state.col);renderPets();renderDash();
});
document.addEventListener('click',e=>{
  const c=e.target.closest('[data-petunlock]');if(!c)return;
  state.col.petUnlocks=state.col.petUnlocks||{};
  state.col.petUnlocks[c.dataset.petunlock]=!state.col.petUnlocks[c.dataset.petunlock];
  C.saveCollections(state.col);renderPets();
});

/* ================= ARTEFACTS ================= */
function renderArtifacts(){
  $('#artGrid').innerHTML=ARTIFACTS.map(a=>{
    const lv=C.getArtifactLevel(state.col,a.id);
    return `<div class="art"><b>${a.name}</b><small>Tier ${a.tier} · ${a.bonus} · cap ${a.maxBase}${a.unlockOb?' · OB '+a.unlockOb:''}</small>
      <div class="row"><button class="pixbtn ghost" data-art="${a.id}" data-d="-1">−</button>
      <input type="number" min="0" max="${a.maxBase}" value="${lv}" data-artin="${a.id}">
      <button class="pixbtn" data-art="${a.id}" data-d="1">+</button></div></div>`;
  }).join('');
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-art]');if(!b)return;
  const a=ARTIFACTS.find(x=>x.id===b.dataset.art);
  C.setArtifactLevel(state.col,b.dataset.art,Math.min(a.maxBase,Math.max(0,C.getArtifactLevel(state.col,b.dataset.art)+ +b.dataset.d)));
  C.saveCollections(state.col);renderArtifacts();
});
document.addEventListener('input',e=>{
  const i=e.target.closest('[data-artin]');if(!i)return;
  const a=ARTIFACTS.find(x=>x.id===i.dataset.artin);
  C.setArtifactLevel(state.col,i.dataset.artin,Math.min(a.maxBase,Math.max(0,+i.value||0)));
  C.saveCollections(state.col);
});

/* ================= SKILLS ================= */
function renderSkills(){
  $('#skillList').innerHTML=SKILLS.map(s=>
    `<div class="skillrow"><span class="nm">${s.name}</span>
      ${s.sTier?'<span class="tag">S-TIER</span>':''}
      <button class="pixbtn ${C.hasSkill(state.col,s.id)?'on':''}" data-skill="${s.id}">${C.hasSkill(state.col,s.id)?'POSSEDÉE':'ACHETER'}</button></div>`).join('');
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-skill]');if(!b)return;
  C.toggleSkill(state.col,b.dataset.skill);C.saveCollections(state.col);renderSkills();
});

/* ================= STATUES / MONUMENTS =================
   27 statues façon jeu : grille 3x3 par monde, clic pour évoluer
   construite → gildée → platinisée. Icônes réelles du wiki.
   W2 n'a pas de statues (wiki Construct). */
import { STATUES, STATUE_STATES, visibleStatues, gatingInfo } from './game/statuesData.js';

function renderConstruct(){
  const maxW=maxWorldUnlocked();
  let h='';
  for(const w of [1,3,4]){ // pas de statues en W2 (wiki)
    if(w>maxW){ h+=`<h3>Monde ${w} <span class="muted">— verrouillé (Monument requis)</span></h3>`; continue; }
    const list=visibleStatues(maxW).filter(s=>s.world===w);
    h+=`<h3>Statues Monde ${w} <span class="muted">(${list.length})</span></h3><div class="statue-grid">`;
    for(const s of list){
      const st=C.getStatueState(state.col,s.num);
      const stDef=STATUE_STATES[st];
      // icône selon l'état : normal → gilded → platinized (sprite dédié W1/W3)
      const icon=st>=3?s.iconPlatinum:st===2?s.iconGilded:s.iconNormal;
      // bonus affiché ligne par ligne (séparateur " · " → retour à la ligne)
      const rawBonus=st>=3?(s.platinumBonus||s.gildedBonus||s.bonus):st===2?(s.gildedBonus||s.bonus):s.bonus;
      const bonusHtml=rawBonus.split(' · ').map(b=>`<span class="bl">${b}</span>`).join('');
      h+=`<div class="card statue ${stDef.cls}" data-statue="${s.num}" title="${s.name} (${s.author})\n${bonus}\nClic : évoluer · Clic droit : reculer">
        <img src="${icon}" alt="${s.name}" loading="lazy">
        <span class="nm">${s.name}</span>
        <span class="author">${s.author}</span>
        ${w===4?'<span class="wtag">W4</span>':''}
        <span class="st ${stDef.cls}">${stDef.name}</span>
        <small>${bonusHtml}</small></div>`;
    }
    h+='</div>';
    // gating wiki : toutes construites avant gilding, toutes gildées avant platinizing
    const arr=list.map(s=>C.getStatueState(state.col,s.num));
    const g=gatingInfo({['W'+w]:arr})['W'+w];
    const built=arr.filter(v=>v>=1).length, gld=arr.filter(v=>v>=2).length;
    h+=`<p class="muted" style="margin:6px 0 14px">${built}/${list.length} construites · ${gld}/${list.length} gildées · `+
       (g.canPlatinize?'✓ platinisation possible':g.canGild?'⚠ toutes les statues doivent être construites avant de gilder':'⚠ ordre aléatoire : continue à construire')+'</p>';
  }
  $('#statueList').innerHTML=h;

  $('#monumentList').innerHTML=[2,3,4].map(w=>{
    const on=((state.col.monuments||{})[w]);
    return `<div class="skillrow"><span class="nm">Monument Monde ${w}${w===4?' <span class="muted">(1M gemmes + 1q veines Industrial/Warfront/Neon)</span>':''}</span>
     <button class="pixbtn ${on?'on':''}" data-mon="${w}">${on?'CONSTRUIT':'À CONSTRUIRE'}</button></div>`;
  }).join('');
}
document.addEventListener('click',e=>{
  const s=e.target.closest('[data-statue]');
  if(s){
    C.cycleStatue(state.col,+s.dataset.statue);
    C.saveCollections(state.col);renderConstruct();renderRoadmap();
  }
  const m=e.target.closest('[data-mon]');
  if(m){state.col.monuments||={};state.col.monuments[m.dataset.mon]=!state.col.monuments[m.dataset.mon];C.saveCollections(state.col);renderConstruct();}
});
document.addEventListener('contextmenu',e=>{
  const s=e.target.closest('[data-statue]');
  if(s){e.preventDefault();C.setStatueState(state.col,+s.dataset.statue,Math.max(0,C.getStatueState(state.col,+s.dataset.statue)-1));C.saveCollections(state.col);renderConstruct();}
});
document.addEventListener('change',e=>{
  const i=e.target.closest('[data-statuefree]');
  if(i){C.setStatuesFree(state.col,i.dataset.statuefree,i.value);C.saveCollections(state.col);}
});

/* ================= STARS ================= */
function renderStars(){
  $('#starList').innerHTML=STARS.map(s=>
    `<div class="skillrow"><span class="nm">${s.name}</span><span class="muted" style="flex:1">${s.effect}</span>
     <button class="pixbtn ${C.hasStar(state.col,s.id)?'on':''}" data-star="${s.id}">${C.hasStar(state.col,s.id)?'POSSÉDÉE':'—'}</button></div>`).join('');
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-star]');if(!b)return;
  C.toggleStar(state.col,b.dataset.star);C.saveCollections(state.col);renderStars();
});

/* ================= HISTORIQUE ================= */
function renderHistory(){
  const h=loadHistory(),sel=$('#histSelect'),out=$('#histOut');
  sel.innerHTML=h.map((x,i)=>`<option value="${i}">${new Date(x.importedAt).toLocaleString('fr')} · ${x.version}</option>`).join('');
  out.innerHTML=h.length<2?'<p class="muted">Importe un 2e export pour comparer.</p>':'';
  if(h.length>=2){
    const d=diffExports(h[1],h[0]);let html='<h3>Évolutions</h3>';
    for(const c of d.changed.slice(0,30))html+=`<div class="statline"><span>${c.key}</span><b>${fmtNum(c.from)} → ${fmtNum(c.to)} ${c.dir==='up'?'📈':'📉'}</b></div>`;
    if(d.added.length)html+=`<h3 class="ok">Nouvelles stats (${d.added.length})</h3><p class="ok" style="font-size:8px">${d.added.map(a=>a.key).join(', ')}</p>`;
    out.innerHTML=html;
  }
}

/* ---------- gaps (profil) : intégré au dashboard quand import actif ---------- */
function renderGapsInline(){
  if(!state.parsed)return;
  const gaps=detectMissingInformation(state.parsed,state.profile);
  if(!gaps.length)return;
  // simple rappel sur le dashboard
  const box=$('#roadList');
  const p=document.createElement('p');
  p.className='warn';p.style.marginTop='10px';
  p.textContent='ℹ️ Infos manquantes : '+gaps.map(g=>g.label).join(' · ')+' — note-les dans les menus correspondants (Artefacts, Pets, Construct…).';
  box.appendChild(p);
}

/* ---------- init ---------- */
renderCards();renderPets();renderArtifacts();renderSkills();renderConstruct();renderStars();renderHistory();
show('export');
