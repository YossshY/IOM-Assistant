/* ============================================================
   recommendationEngine.js — Leviers actionnables (wiki + External Resources)
   Sources : Gem Spending Guide OB60–65, Fishing tributes/cards, Progression Guide.
   « Battre OB N » = contexte. Le coach dit COMMENT combler l'écart.
   ============================================================ */
import { OBELISK, ARTIFACTS, SKILLS, DRONES, SOURCES, EXTERNAL_TOOLS, artifactEffectiveMax } from './knowledgeBase.js';
import { getArtifactLevel, hasSkill, getStatueState, getCaps, getCardState, getFishLv } from './collections.js';
import { LEGENDARY_FISH_CARDS } from './cardsData.js';
import { LEGENDARY_FISH, NOTICE_UPGRADES_T1 } from './fishingData.js';

export const CONFIDENCE = {
  confirmed:    { icon:'🟢', label:'Confirmé',          hint:'Données du joueur + base de connaissances suffisantes.' },
  probable:     { icon:'🟡', label:'Probable',          hint:'Certaines informations manquent ; recommandation à valider.' },
  insufficient: { icon:'🔴', label:'Données insuffisantes', hint:'Complète Cards / Prestige / Fishing pour affiner.' },
};

/**
 * generateRecommendations(stats, profile, col?)
 */
export function generateRecommendations(stats, profile, col = {}) {
  const recs = [];
  const ob = profile.obeliskLevel ?? null;
  if (ob === null) return [insufficientProfile('Obelisk level (xp_level_cap)')];

  const pick = stats.pickaxe_damage ?? profile.pickaxeDamage ?? null;
  const armorRed = stats.obelisk_armor_reduction ?? profile.armorReduction ?? 0;
  const nextArmorEff = OBELISK.effectiveArmor(ob + 1, armorRed);
  const canDamageNext = pick != null && pick > nextArmorEff;
  const blocked = pick != null && !canDamageNext;
  const gapRatio = pick != null && nextArmorEff > 0 ? pick / nextArmorEff : 1;
  const fishes = (stats.fishing_rod_power ?? 0) > 0;

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

  /* R2 : mur d'armure → leviers wiki (pas « bats l'OB ») */
  if (blocked) {
    pushArmorUnlockLevers(recs, col, stats, profile, gapRatio, fishes, armorRed);
  } else if (canDamageNext) {
    recs.push({
      priority: 5, category: 'obelisk',
      title: `Fenêtre OB${ob + 1} : items dégâts / crit`,
      reason: `Pioche > armure eff. (${fmt(nextArmorEff)}). Active items avant chaque fenêtre — les PV s'accumulent entre les hits. Vérifie le timing avec ${EXTERNAL_TOOLS.obeliskFight.name}.`,
      confidence: 'confirmed',
      source: EXTERNAL_TOOLS.obeliskFight.url,
    });
  }

  /* R3 : artefacts — si renseignés */
  const anyArt = ARTIFACTS.some(a => getArtifactLevel(col, a.id) > 0);
  if (!anyArt && ob >= 14) {
    recs.push({
      priority: 6, category: 'prestige',
      title: 'Renseigner tes artefacts (menu Prestige)',
      reason: 'Sans niveaux Prestige, le coach ne peut pas prioriser T3 Armor / T4 Statue — note-les pour des leviers PP concrets.',
      confidence: 'insufficient',
      source: SOURCES.wiki_prestige,
    });
  }

  /* R4 : skills prioritaires manquants */
  const skillTouched = SKILLS.some(k => hasSkill(col, k.id));
  if (skillTouched) {
    const missing = SKILLS.filter(k => k.sTier && !hasSkill(col, k.id) && !(k.id === 'stonks' && profile.hasStonks))
      .map(k => k.name);
    if (missing.length) {
      recs.push({
        priority: 4, category: 'skills',
        title: 'Acheter : ' + missing[0],
        reason: missing.length > 1
          ? `Prioritaires wiki encore ouverts : ${missing.join(', ')}.`
          : `${missing[0]} — levier permanent (Skill-Tree).`,
        confidence: 'confirmed',
        source: SOURCES.wiki_skilltree,
      });
    }
  } else if (!profile.hasStonks) {
    recs.push({
      priority: 7, category: 'skills',
      title: 'Coche tes skills prioritaires (Skill-Tree)',
      reason: 'Gem Bomb / Auto-Bomber / Free? / Stonks — sans ça le coach ne sait pas ce qu\'il te reste.',
      confidence: 'insufficient',
      source: SOURCES.wiki_skilltree,
    });
  }

  /* R5 : Monument / statues W4 */
  const mon4 = col.monuments?.[4] ?? profile.monuments?.[4] ?? profile.w4Open;
  const w4StatuesBuilt = countWorldStatues(col, profile, 4, 1);
  if (ob >= 64 && !mon4 && !profile.w4Open) {
    recs.push({
      priority: 2, category: 'construct',
      title: 'Construire le Monument World 4',
      reason: 'OB64+ sans W4 : 1M gemmes + veines Industrial / Warfront / Neon. Débloque contenu + farming qui pousse la pioche.',
      confidence: 'confirmed',
      requirements: KB_MONUMENT_W4_REQ(),
      source: SOURCES.wiki_construct,
    });
  } else if (ob >= 64 && (mon4 || profile.w4Open) && w4StatuesBuilt < 9) {
    recs.push({
      priority: 2, category: 'construct',
      title: `Statues World 4 (${w4StatuesBuilt}/9)`,
      reason: 'W4 ouvert : finis les 9 statues avant de gilder. Bonus permanentes pour la suite.',
      confidence: 'confirmed',
      progress: w4StatuesBuilt / 9,
      source: SOURCES.wiki_construct,
    });
  }

  /* R6 : lootfrogs */
  if ((stats.lootfrogs_caught ?? 0) > 100 && (stats.lootfrog_big_chance ?? 0) === 0) {
    recs.push({
      priority: 6, category: 'lootfrogs',
      title: 'Débloquer Big / Massive Lootfrogs',
      reason: `${Math.round(stats.lootfrogs_caught)} frogs, big/massive à 0 — Black Hole / Progression wiki.`,
      confidence: 'probable',
      source: SOURCES.wiki_progression,
    });
  }

  /* R7 : OB60+ checklist stars (outil externe) */
  if (ob >= 60 && ob < 66 && blocked) {
    recs.push({
      priority: 7, category: 'stargazing',
      title: 'Checklist stars OB60+ (Late W3)',
      reason: `Coche la checklist communautaire pour ne pas rater de leviers star → pioche. ${EXTERNAL_TOOLS.starOb60.name}.`,
      confidence: 'probable',
      source: EXTERNAL_TOOLS.starOb60.url,
    });
  }

  /* R8 : contexte mur d'armure — bas de liste, jamais #1 */
  if (blocked) {
    recs.push({
      priority: 9, category: 'context',
      title: `Contexte : écart OB${ob + 1}`,
      reason: `Pioche ${fmt(pick)} vs armure eff. ${fmt(nextArmorEff)} (${(gapRatio * 100).toFixed(1)}%, −${(armorRed * 100).toFixed(0)}% armure). Les bombes ne touchent pas l'Obelisk — les leviers ci-dessus (cards, tributes, notices, prestige) comblent l'écart. Simulateur : ${EXTERNAL_TOOLS.obeliskFight.name}.`,
      confidence: 'confirmed',
      progress: gapRatio,
      source: EXTERNAL_TOOLS.obeliskFight.url,
    });
  }

  /* R9 : horizon */
  if (ob >= 64 && ob < 66) {
    recs.push({
      priority: 8, category: 'roadmap',
      title: 'Horizon : OB66 (Arch Ascension)',
      reason: 'Après le mur actuel : Archaeology Ascension + Lootfrog multi. OB70 = Arcanist.',
      confidence: 'confirmed',
      source: SOURCES.wiki_obelisk,
    });
  } else if (ob >= 66 && ob < 70) {
    recs.push({
      priority: 8, category: 'roadmap',
      title: 'Horizon : OB70 Arcanist',
      reason: 'Débloque Arcanist + suit Minotaur.',
      confidence: 'confirmed',
      source: SOURCES.wiki_obelisk,
    });
  }

  return recs.sort((a, b) => a.priority - b.priority);
}

/**
 * Leviers pour combler l'armure — Gem Guide OB60–65 + Fishing wiki.
 * Ordre d'impact : Poly Slug → Tribute Slug T1 → Notice Pick/Bomb → Prestige → noter données.
 */
function pushArmorUnlockLevers(recs, col, stats, profile, gapRatio, fishes, armorRed) {
  const gapHint = gapRatio < 1 ? ` (tu es à ${(gapRatio * 100).toFixed(1)}% de l'armure OB suivante)` : '';
  const w3Built = countWorldStatues(col, profile, 3, 1);
  const fishingTouched = fishingCollectionsTouched(col);

  /* Gem Guide : 9 statues W3 avant tributes */
  if (w3Built < 9) {
    recs.push({
      priority: 2, category: 'construct',
      title: `Finir les statues World 3 (${w3Built}/9)`,
      reason: 'Gem Spending Guide OB60–65 : les 9 statues W3 avant de pousser les tributes fishing.',
      confidence: 'confirmed',
      progress: w3Built / 9,
      source: SOURCES.wiki_gems,
    });
  }

  /* --- Radioactive Slug card (Bomb/Exp +500%→+1100%) --- */
  const slugCard = LEGENDARY_FISH_CARDS.find(c => c.id === 'fish_radioactive_slug');
  const slugSt = slugCard ? getCardState(col, slugCard.id) : 0;
  if (slugCard && slugSt < 3) {
    const next = slugSt + 1;
    const from = slugCard.effect[Math.max(0, slugSt - 1)] || 'absent';
    const to = slugCard.effect[next - 1];
    const action = slugSt === 0
      ? 'Obtenir / noter Radioactive Slug (Nuclear)'
      : slugSt === 1
        ? 'Gilder Radioactive Slug'
        : 'Polychromer Radioactive Slug';
    const detail = slugSt === 0
      ? `Carte absente. Gilded = +500% Bomb/Exp → Poly = +1100% (+600 pts). Catch : poly cards du dock Nuclear + 100% power sur le 4e fish.`
      : slugSt === 1
        ? `Standard ${from} → Gilded ${to}. Ensuite Poly = +1100%.`
        : `Gilded ${from} → Polychrome ${to} : +600 pts Bomb Damage/Exp Gain. Gros levier farming → PP → pioche.`;
    recs.push({
      priority: slugSt === 2 ? 1 : 2,
      category: 'cards',
      title: action,
      reason: detail + gapHint,
      confidence: slugSt === 0 ? 'probable' : 'confirmed',
      progress: slugSt / 3,
      source: SOURCES.wiki_fishing,
    });
  }

  /* --- Slug Tribute 1 : Bomb Crit ×2 + Workshop Cap +3 --- */
  const slugFish = LEGENDARY_FISH.find(f => f.id === 'radioactive_slug');
  const slugTribute = getFishLv(col, 'legendary', 'radioactive_slug');
  if (slugFish && slugTribute < 1 && (slugSt >= 1 || fishingTouched)) {
    recs.push({
      /* Poly card d'abord si gilded ; tribute dès que poly (ou gilded) noté */
      priority: slugSt >= 3 ? 1 : 2,
      category: 'fishing',
      title: 'Tribute 1 Radioactive Slug',
      reason: `${slugFish.tributes[0]}. Wiki Fishing — boost bomb crit ×2 (farming) + workshop cap. Note le rang sous Fishing → Legendary.`,
      confidence: slugSt >= 1 ? 'confirmed' : 'probable',
      progress: slugTribute / 2,
      source: SOURCES.wiki_fishing,
    });
  } else if (slugFish && slugTribute === 1) {
    recs.push({
      priority: 4, category: 'fishing',
      title: 'Tribute 2 Radioactive Slug (optionnel)',
      reason: slugFish.tributes[1],
      confidence: 'probable',
      source: SOURCES.wiki_fishing,
    });
  }

  /* --- Notice Pickaxe & Bomb Damage (1.15× / niv) — levier pioche DIRECT --- */
  const noticePick = NOTICE_UPGRADES_T1.find(u => u.id === 'n1_pick_bomb');
  const noticeBucket = (col.fishing || {}).notice || {};
  const noticeNoted = Object.prototype.hasOwnProperty.call(noticeBucket, 'n1_pick_bomb');
  const noticeLv = noticeNoted ? (noticeBucket.n1_pick_bomb | 0) : 0;
  if (noticePick && noticeLv < noticePick.max) {
    if (noticeNoted) {
      recs.push({
        priority: 1, category: 'fishing',
        title: `Notice Pickaxe & Bomb Damage → ${Math.min(noticePick.max, noticeLv + 1)}/${noticePick.max}`,
        reason: `${noticePick.per} / niveau — multi pioche + bombes. Gem Guide OB60–65 + Notices wiki. Priorise ça pour l'armure OB.${gapHint}`,
        confidence: 'confirmed',
        progress: noticeLv / noticePick.max,
        source: SOURCES.wiki_fishing,
      });
    } else if (fishes) {
      recs.push({
        priority: 2, category: 'fishing',
        title: 'Noter Notice « Pickaxe & Bomb Damage »',
        reason: `Tu fishes (rod power export > 0). Ce notice est ${noticePick.per}/niv jusqu'à ${noticePick.max} — levier pioche direct vs armure OB. Menu Fishing → Notices.`,
        confidence: 'insufficient',
        source: SOURCES.wiki_fishing,
      });
    }
  }

  /* Autres légendaires gilded → poly */
  for (const c of LEGENDARY_FISH_CARDS) {
    if (c.id === 'fish_radioactive_slug') continue;
    const st = getCardState(col, c.id);
    if (st === 2) {
      recs.push({
        priority: 3, category: 'cards',
        title: `Polychromer ${c.name}`,
        reason: `Gilded ${c.effect[1]} → Poly ${c.effect[2]}.`,
        confidence: 'confirmed',
        source: SOURCES.wiki_fishing,
      });
    }
  }

  /* Prestige damage / armor */
  pushArtifactLevers(recs, col, stats, armorRed);

  /* Outils externes pour mesurer l'impact */
  recs.push({
    priority: 5, category: 'tools',
    title: 'Mesurer l\'impact (Pickaxe Calculator)',
    reason: `Avant de dump des gemmes : ${EXTERNAL_TOOLS.pickaxeDamage.name} pour voir ce qui bouge vraiment la pioche. Pour les gems fishing : ${EXTERNAL_TOOLS.fishingGems.name}.`,
    confidence: 'confirmed',
    source: EXTERNAL_TOOLS.pickaxeDamage.url,
  });

  if (fishes) {
    recs.push({
      priority: 5, category: 'tools',
      title: 'Optimiser gems Fishing',
      reason: `${EXTERNAL_TOOLS.fishingGems.name} — meilleur ROI gem par upgrade fishing (Enhance / docks). Guide : Gem Spending OB60–65.`,
      confidence: 'confirmed',
      source: EXTERNAL_TOOLS.fishingGems.url,
    });
  }
}

function fishingCollectionsTouched(col) {
  const f = col.fishing || {};
  if (Object.keys(f.docks || {}).length) return true;
  for (const bucket of ['notice', 'enhance', 'legendary']) {
    const o = f[bucket] || {};
    if (Object.values(o).some(v => (v | 0) > 0)) return true;
  }
  return LEGENDARY_FISH_CARDS.some(c => getCardState(col, c.id) > 0);
}

function pushArtifactLevers(recs, col, stats, armorRed) {
  const caps = getCaps(col);
  const aStatue = getArtifactLevel(col, 'statue_dmg');
  const aArmor = getArtifactLevel(col, 'armorred');
  const capStatue = artifactEffectiveMax(ARTIFACTS.find(x => x.id === 'statue_dmg'), stats, caps);
  const capArmor = artifactEffectiveMax(ARTIFACTS.find(x => x.id === 'armorred'), stats, caps);
  if (aStatue > 0 && aStatue < capStatue) {
    recs.push({
      priority: 3, category: 'prestige',
      title: `Prestige T4 Pickaxe/Statue → ${aStatue + 1}/${capStatue}`,
      reason: `+10%/niv × statues — levier pioche direct pour l'armure OB.`,
      confidence: 'confirmed',
      progress: aStatue / capStatue,
      source: SOURCES.wiki_prestige,
    });
  }
  if (aArmor > 0 && aArmor < capArmor) {
    recs.push({
      priority: 3, category: 'prestige',
      title: `Prestige T3 Obelisk Armor → ${aArmor + 1}/${capArmor}`,
      reason: `Réduit l'armure OB (déjà −${(armorRed * 100).toFixed(0)}% actifs). Plus efficace que « taper plus fort » si tu es loin.`,
      confidence: 'confirmed',
      progress: aArmor / capArmor,
      source: SOURCES.wiki_prestige,
    });
  }
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
