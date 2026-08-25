/* ============================================================
   recommendationEngine.js — Moteur de recommandations
   Retourne des objets structurés, JAMAIS de conseil inventé :
   chaque règle déclare ses prérequis de données et son niveau
   de confiance (confirmed / probable / insufficient).
   ============================================================ */
import { OBELISK, PRESTIGE, ARTIFACTS, SKILLS, DRONES, SOURCES } from './knowledgeBase.js';

export const CONFIDENCE = {
  confirmed:    { icon:'🟢', label:'Confirmé',          hint:'Données du joueur + base de connaissances suffisantes.' },
  probable:     { icon:'🟡', label:'Probable',          hint:'Certaines informations manquent ; recommandation à valider.' },
  insufficient: { icon:'🔴', label:'Données insuffisantes', hint:'Réponds aux questions du profil pour permettre une recommandation fiable.' },
};

/**
 * generateRecommendations(parsedStats, profile) -> [ rec, ... ] triées par priorité.
 * profile = fusion(deriveProfile(parsed), réponses du questionnaire).
 */
export function generateRecommendations(stats, profile) {
  const recs = [];
  const ob = profile.obeliskLevel ?? null;
  if (ob === null) return [insufficientProfile('Obelisk level')];

  const nextArmor = OBELISK.armor(ob + 1);
  const nextHealth = OBELISK.health(ob + 1);
  const pick = stats.pickaxe_damage ?? null;
  const canDamageNext = pick != null && pick > nextArmor;

  /* ---------- R1 : drones équipés non alimentés (donnée directe) ---------- */
  for (const d of DRONES) {
    if (stats[d.fuelKey] === true && d.gradeKey && (stats[d.gradeKey] ?? 0) === 0) {
      recs.push({
        priority: 1, category: 'drones',
        title: `Alimenter le drone ${d.suit}`,
        reason: `Le drone ${d.suit} est équipé mais son grade de carburant est à 0 : son bonus actif est perdu.`,
        confidence: 'confirmed',
        source: 'exportstats: is_' + d.id + '_equipped=true & ' + d.gradeKey + '=0',
      });
      break; // une seule reco drone suffit
    }
  }

  /* ---------- R2 : mur d'armure Obelisk ---------- */
  if (pick != null && !canDamageNext) {
    const ratio = +(nextArmor / pick).toFixed(2);
    recs.push({
      priority: canDamageNext ? 5 : 2,
      category: 'damage',
      title: `Briser l'armure de l'Obelisk ${ob + 1}`,
      reason: `Ta pioche (${fmt(pick)}) est ${ratio}× sous l'armure OB${ob+1} (${fmt(nextArmor)}). Les bombes ne font aucun dégât à l'Obelisk : seule la pioche compte.`,
      confidence: 'confirmed',
      requirements: [{ resource:'Pickaxe damage vs Armor', current:pick, required:nextArmor }],
      progress: pick / nextArmor,
      source: 'wiki Obelisk (armure ×9.5/niveau au-delà de OB60)',
    });
  } else if (canDamageNext) {
    recs.push({
      priority: 3, category: 'obelisk',
      title: `Attaquer l'Obelisk ${ob + 1}`,
      reason: `Ta pioche dépasse l'armure OB${ob+1}. Les dégâts s'accumulent entre tentatives — active tes items dégâts avant chaque fenêtre de combat.`,
      confidence: 'confirmed',
      source: S_WIKI_OBELISK,
    });
  }

  /* ---------- R3 : artefacts dégâts (dépend du profil joueur) ---------- */
  const aStatue = numOrNull(profile.answers?.a_statue);
  const aArmor  = numOrNull(profile.answers?.a_armorred);
  if (aStatue == null || aArmor == null) {
    recs.push(insufficientRec('Prioriser les artefacts T3/T4',
      'Indique tes niveaux T4 Pickaxe per Statue et T3 Armor Reduction dans le profil pour savoir où investir tes PP.',
      ['artifacts_t34']));
  } else if (aStatue < capOf('statue_dmg') ) {
    recs.push({
      priority: 2, category: 'artifacts',
      title: 'Monter Pickaxe Damage per Statue (T4)',
      reason: `Niveau actuel ${aStatue}/${capOf('statue_dmg')} : meilleur multiplicateur long terme (+10%/niv × statues possédées).`,
      confidence: 'probable', // dépend aussi des statues possédées (questionnaire)
      requirements:[{ resource:`Artefact niveau`, current:aStatue, required:capOf('statue_dmg') }],
      progress: aStatue / capOf('statue_dmg'),
      source: 'wiki Prestige/Costs Tier 4',
    });
  }
  if (aArmor != null && aArmor < capOf('armorred')) {
    recs.push({
      priority: 3, category: 'artifacts',
      title: 'Continuer Obelisk Armor Reduction (T3)',
      reason: `Niveau ${aArmor}/${capOf('armorred')} (-2%/niv). Chaque niveau réduit l'armure à percer sur tous les futurs Obelisks.`,
      confidence: 'confirmed',
      requirements:[{ resource:'Niveau artefact', current:aArmor, required:capOf('armorred') }],
      progress: aArmor / capOf('armorred'),
      source: 'wiki Prestige/Costs Tier 3',
    });
  }

  /* ---------- R4 : skills S-Tier manquants ---------- */
  const missingSkills = SKILLS.filter(k => k.sTier && profile.answers?.[skillKey(k.id)] !== true)
                              .map(k => k.name);
  if (missingSkills.length) {
    recs.push({
      priority: 4, category: 'skills',
      title: 'Acquérir les skills S-Tier manquants',
      reason: `Manquants d'après ton profil : ${missingSkills.join(', ')}.`,
      confidence: Object.values(profile.answers||{}).some((v,k)=>String(k).startsWith('sk_')) ? 'confirmed' : 'insufficient',
      needsAnswers: ['skills_sTier'],
      source: 'wiki Skill-Tree (stratégie)',
    });
  }

  /* ---------- R5 : Monument W4 si pas construit ---------- */
  if (ob >= 64 && profile.answers?.monument_w4 === false) {
    recs.push({
      priority: 2, category: 'construct',
      title: 'Construire le Monument World 4',
      reason: 'Débloqué à OB64 : ouvre le Monde 4 (floors 103-132), nouvelles statues, upgrades Workshop W4.',
      confidence: 'confirmed',
      requirements: KB_MONUMENT_W4_REQ(),
      source: 'wiki Construct/Monuments',
    });
  }

  /* ---------- R6 : après OB65/66/70 ---------- */
  if (ob >= 64) {
    recs.push({
      priority: 8, category: 'roadmap',
      title: 'Préparer OB66 → Archaeology Ascension',
      reason: 'OB66 déblocque Arch Ascension + Lootfrog Loot Multi ; OB70 ouvre l\'Arcanist.',
      confidence: 'confirmed',
      source: 'wiki Obelisk/Unlocks',
    });
  }

  return recs.sort((a,b)=>a.priority-b.priority);
}

/* ---------- helpers ---------- */
const S_WIKI_OBELISK = SOURCES.wiki_obelisk;
function capOf(id){ const a=ARTIFACTS.find(x=>x.id===id); return a ? a.maxBase : Infinity; }
function skillKey(id){ return 'sk_'+id.replace(/^sk_/,''); } // sk_gem_bomb -> gem_bomb key mapping
function numOrNull(v){ return (v===''||v==null) ? null : Math.max(0,+v)||0; }
function fmt(n){
  if(!isFinite(n))return '—';
  const u=['','k','m','b','t','q','qi','sx','sp','oc','no','dc'];
  const i=Math.min(Math.floor(Math.log10(Math.abs(n))/3),u.length-1);
  return i<=0?Math.round(n).toString():(n/Math.pow(1e3,i)).toFixed(2)+u[i];
}
function insufficientRec(title,reason,gaps){
  return { priority:0, category:'profile', title, reason, confidence:'insufficient', needsAnswers:gaps };
}
function insufficientProfile(missing){ 
  return { priority:0, category:'profile', title:'Profil incomplet',
    reason:`Information manquante : ${missing}. Réponds aux questions pour activer l'analyse.`,
    confidence:'insufficient' }; }
function KB_MONUMENT_W4_REQ(){
  return [
    { resource:'Gemmes', required:1e6 },
    { resource:'Industrial Veins', required:1e15 },
    { resource:'Warfront Veins',  required:1e15 },
    { resource:'Neon Veins',      required:1e15 },
  ];
}
