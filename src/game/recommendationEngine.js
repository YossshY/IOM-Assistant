/* ============================================================
   recommendationEngine.js — Moteur de recommandations
   Lit stats d'export + collections locales. Pas de conseil inventé.
   ============================================================ */
import { OBELISK, ARTIFACTS, SKILLS, DRONES, SOURCES, artifactEffectiveMax } from './knowledgeBase.js';
import { getArtifactLevel, hasSkill, getStatueState } from './collections.js';

export const CONFIDENCE = {
  confirmed:    { icon:'🟢', label:'Confirmé',          hint:'Données du joueur + base de connaissances suffisantes.' },
  probable:     { icon:'🟡', label:'Probable',          hint:'Certaines informations manquent ; recommandation à valider.' },
  insufficient: { icon:'🔴', label:'Données insuffisantes', hint:'Complète Prestige / Skill-Tree pour affiner.' },
};

/**
 * generateRecommendations(stats, profile, col?)
 * profile = deriveProfile(parsed) ; col = collections locales (artefacts, skills, monuments override)
 */
export function generateRecommendations(stats, profile, col = {}) {
  const recs = [];
  const ob = profile.obeliskLevel ?? null;
  if (ob === null) return [insufficientProfile('Obelisk level (xp_level_cap)')];

  const pick = stats.pickaxe_damage ?? profile.pickaxeDamage ?? null;
  const armorRed = stats.obelisk_armor_reduction ?? profile.armorReduction ?? 0;
  const nextArmorEff = OBELISK.effectiveArmor(ob + 1, armorRed);
  const canDamageNext = pick != null && pick > nextArmorEff;

  /* R1 : drone équipé mais pas fuelé */
  for (const d of DRONES) {
    if (stats[d.equipKey] === true && stats[d.fueledKey] === false) {
      recs.push({
        priority: 1, category: 'drones',
        title: `Fueler le drone ${d.suit}`,
        reason: `${d.suit} est équipé mais pas fuelé — tu perds le bonus actif.`,
        confidence: 'confirmed',
        source: `exportstats: ${d.equipKey}=true & ${d.fueledKey}=false`,
      });
      break;
    }
  }

  /* R2 : mur d'armure (avec réduction) */
  if (pick != null && !canDamageNext) {
    recs.push({
      priority: 2, category: 'damage',
      title: `Briser l'armure de l'Obelisk ${ob + 1}`,
      reason: `Pioche ${fmt(pick)} vs armure effective OB${ob + 1} ${fmt(nextArmorEff)} (−${(armorRed * 100).toFixed(0)}% réduction). Les bombes ne touchent pas l'Obelisk.`,
      confidence: 'confirmed',
      requirements: [{ resource: 'Pickaxe vs Armor', current: pick, required: nextArmorEff }],
      progress: pick / nextArmorEff,
      source: SOURCES.wiki_obelisk,
    });
  } else if (canDamageNext) {
    recs.push({
      priority: 5, category: 'obelisk',
      title: `Pousser l'Obelisk ${ob + 1}`,
      reason: `Ta pioche dépasse l'armure effective OB${ob + 1} (${fmt(nextArmorEff)}). Active items dégâts / crit avant chaque fenêtre — les PV s'accumulent.`,
      confidence: 'confirmed',
      source: SOURCES.wiki_obelisk,
    });
  }

  /* R3 : artefacts depuis Prestige (collections), pas answers fantômes */
  const aStatue = getArtifactLevel(col, 'statue_dmg');
  const aArmor = getArtifactLevel(col, 'armorred');
  const aPick3 = getArtifactLevel(col, 'pick_t3');
  const anyArt = ARTIFACTS.some(a => getArtifactLevel(col, a.id) > 0);

  if (!anyArt && ob >= 14) {
    recs.push({
      priority: 6, category: 'prestige',
      title: 'Renseigner tes artefacts (menu Prestige)',
      reason: 'L\'export donne les caps (+' + (stats.artifact_cap_increase ?? '?') + ' / T4 +' + (stats.artifact_tier4_cap_increase ?? '?') + ') mais pas les niveaux. Note-les sous Prestige pour prioriser les PP.',
      confidence: 'insufficient',
      source: SOURCES.wiki_prestige,
    });
  } else {
    const capStatue = artifactEffectiveMax(ARTIFACTS.find(x => x.id === 'statue_dmg'), stats);
    const capArmor = artifactEffectiveMax(ARTIFACTS.find(x => x.id === 'armorred'), stats);
    const capPick3 = artifactEffectiveMax(ARTIFACTS.find(x => x.id === 'pick_t3'), stats);
    if (aStatue > 0 && aStatue < capStatue) {
      recs.push({
        priority: 3, category: 'artifacts',
        title: 'Continuer Pickaxe Damage per Statue (T4)',
        reason: `Niveau ${aStatue}/${capStatue} (+10%/niv × statues). Fort levier long terme.`,
        confidence: 'confirmed',
        progress: aStatue / capStatue,
        source: SOURCES.wiki_prestige,
      });
    }
    if (aArmor > 0 && aArmor < capArmor) {
      recs.push({
        priority: 4, category: 'artifacts',
        title: 'Continuer Obelisk Armor Reduction (T3)',
        reason: `Niveau ${aArmor}/${capArmor}. Export : −${(armorRed * 100).toFixed(0)}% armure déjà actifs.`,
        confidence: 'confirmed',
        progress: aArmor / capArmor,
        source: SOURCES.wiki_prestige,
      });
    }
    if (aPick3 > 0 && aPick3 < capPick3) {
      recs.push({
        priority: 5, category: 'artifacts',
        title: 'Pickaxe Damage T3',
        reason: `Niveau ${aPick3}/${capPick3}. Utile si tu pousses encore des Obelisks.`,
        confidence: 'probable',
        source: SOURCES.wiki_prestige,
      });
    }
  }

  /* R4 : skills — collections ; Stonks déductible de l'export */
  const skillTouched = SKILLS.some(k => hasSkill(col, k.id));
  if (skillTouched) {
    const missing = SKILLS.filter(k => k.sTier && !hasSkill(col, k.id) && !(k.id === 'stonks' && profile.hasStonks))
      .map(k => k.name);
    if (missing.length) {
      recs.push({
        priority: 4, category: 'skills',
        title: 'Skills S-Tier manquants',
        reason: missing.join(', '),
        confidence: 'confirmed',
        source: SOURCES.wiki_skilltree,
      });
    }
  } else if (!profile.hasStonks) {
    recs.push({
      priority: 7, category: 'skills',
      title: 'Vérifier les skills S-Tier',
      reason: 'Coche ce que tu as dans Skill-Tree (Gem Bomb, Auto-Bomber, Free?, Stonks). L\'export ne liste pas les skills.',
      confidence: 'insufficient',
      source: SOURCES.wiki_skilltree,
    });
  }

  /* R5 : Monument / statues W4 depuis export */
  const mon4 = col.monuments?.[4] ?? profile.monuments?.[4] ?? profile.w4Open;
  const w4StatuesBuilt = countWorldStatues(col, profile, 4, 1);
  if (ob >= 64 && !mon4 && !profile.w4Open) {
    recs.push({
      priority: 2, category: 'construct',
      title: 'Construire le Monument World 4',
      reason: 'OB64 atteint, aucune statue W4 / signal Prismatic dans l\'export. Coût : 1M gemmes + veines Industrial / Warfront / Neon.',
      confidence: 'confirmed',
      requirements: KB_MONUMENT_W4_REQ(),
      source: SOURCES.wiki_construct,
    });
  } else if (ob >= 64 && (mon4 || profile.w4Open) && w4StatuesBuilt < 9) {
    recs.push({
      priority: 2, category: 'construct',
      title: `Construire les statues World 4 (${w4StatuesBuilt}/9)`,
      reason: 'W4 ouvert : priorise les 9 statues (ordre aléatoire). Ne gilde qu\'après les 9 construites.',
      confidence: 'confirmed',
      progress: w4StatuesBuilt / 9,
      source: SOURCES.wiki_construct,
    });
  }

  /* R6 : W1/W3 plat OK → focus late-game utile */
  const w1Plat = countWorldStatues(col, profile, 1, 3);
  const w3Plat = countWorldStatues(col, profile, 3, 3);
  if (w1Plat >= 9 && w3Plat >= 9 && ob >= 64) {
    recs.push({
      priority: 3, category: 'roadmap',
      title: 'Late OB64 : W4 + farming',
      reason: 'W1 et W3 sont platinisés. Enchaîne Monument W4 (si pas fait), veines W4, puis OB66 (Arch Ascension) / OB70 (Arcanist).',
      confidence: 'confirmed',
      source: SOURCES.wiki_progression,
    });
  }

  /* R7 : lootfrogs — big/massive à 0 alors que frogs farmés */
  if ((stats.lootfrogs_caught ?? 0) > 100 && (stats.lootfrog_big_chance ?? 0) === 0) {
    recs.push({
      priority: 6, category: 'lootfrogs',
      title: 'Débloquer Big / Massive Lootfrogs',
      reason: `${Math.round(stats.lootfrogs_caught)} frogs catchés, big/massive chance à 0. Suit le guide Progression (Blackhole → Lootfrogs).`,
      confidence: 'probable',
      source: SOURCES.wiki_progression,
    });
  }

  /* R8 : horizon OB66/70 — une seule fois, priorité basse */
  if (ob >= 64 && ob < 66) {
    recs.push({
      priority: 8, category: 'roadmap',
      title: 'Objectif suivant : OB66',
      reason: 'Archaeology Ascension + Lootfrog Loot Multi. OB70 = Arcanist + Minotaur.',
      confidence: 'confirmed',
      source: SOURCES.wiki_obelisk,
    });
  } else if (ob >= 66 && ob < 70) {
    recs.push({
      priority: 8, category: 'roadmap',
      title: 'Objectif suivant : OB70 Arcanist',
      reason: 'Débloque Arcanist et le suit Minotaur.',
      confidence: 'confirmed',
      source: SOURCES.wiki_obelisk,
    });
  }

  return recs.sort((a, b) => a.priority - b.priority);
}

function countWorldStatues(col, profile, world, minState) {
  const fromExport = profile.statueStates || {};
  const range = world === 1 ? [1, 9] : world === 3 ? [10, 18] : [19, 27];
  let n = 0;
  for (let num = range[0]; num <= range[1]; num++) {
    const st = col.statueStates?.[num] ?? fromExport[num] ?? getStatueState(col, num);
    if (st >= minState) n++;
  }
  return n;
}

function fmt(n) {
  if (!isFinite(n)) return '—';
  const u = ['', 'k', 'm', 'b', 't', 'q', 'qi', 'sx', 'sp', 'oc', 'no', 'dc', 'udc', 'ddc'];
  const i = Math.min(Math.floor(Math.log10(Math.abs(n)) / 3), u.length - 1);
  return i <= 0 ? Math.round(n).toString() : (n / Math.pow(1e3, i)).toFixed(2) + u[i];
}
function insufficientProfile(missing) {
  return {
    priority: 0, category: 'profile', title: 'Profil incomplet',
    reason: `Information manquante : ${missing}.`,
    confidence: 'insufficient',
  };
}
function KB_MONUMENT_W4_REQ() {
  return [
    { resource: 'Gemmes', required: 1e6 },
    { resource: 'Industrial Veins', required: 1e15 },
    { resource: 'Warfront Veins', required: 1e15 },
    { resource: 'Neon Veins', required: 1e15 },
  ];
}
