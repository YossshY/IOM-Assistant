/* ============================================================
   statsParser.js — Parsing dynamique de exportstats
   ============================================================ */
import {
  ALL_KNOWN_KEYS, STATS_CATALOG, GAME_VERSIONS, LATEST_KNOWN_VERSION,
  PRESTIGE, STATUE_EXPORT, OBELISK,
} from './knowledgeBase.js';

/**
 * parseExportStats(rawText) -> { ok, version, stats, unknownKeys, categorized, error }
 */
export function parseExportStats(rawText) {
  let raw;
  try { raw = JSON.parse(rawText); }
  catch (e) { return { ok:false, error:'JSON invalide — vérifie que tu as copié l\'intégralité du résultat d\'exportstats.' }; }

  if (!raw.stats || typeof raw.stats !== 'object')
    return { ok:false, error:'Ce JSON ne contient pas de bloc "stats". Es-tu sûr qu\'il vient de la fonction exportstats ?' };

  const version = typeof raw.version === 'string' ? raw.version : 'inconnue';
  const stats = raw.stats;

  const knownKeys = Object.keys(stats);
  const unknownKeys = knownKeys.filter(k => !ALL_KNOWN_KEYS.has(k));

  const categorized = {};
  for (const [cat, map] of Object.entries(STATS_CATALOG)) {
    categorized[cat] = {};
    for (const key of Object.keys(map)) if (key in stats) categorized[cat][key] = stats[key];
  }
  categorized.autres = {};
  for (const k of unknownKeys) categorized.autres[k] = stats[k];

  const versionKnown = !!GAME_VERSIONS[version];

  return {
    ok: true,
    version,
    versionKnown,
    isNewerThanKB: versionKnown ? false : compareVersions(version, LATEST_KNOWN_VERSION) > 0,
    importedAt: new Date().toISOString(),
    playtimeSeconds: raw.time ?? null, // secondes du run courant (reset au prestige) — PAS le lifetime
    rawVersionFields: Object.keys(raw).filter(k => k !== 'stats'),
    stats,
    unknownKeys,
    categorized,
    statCount: knownKeys.length,
  };
}

export function compareVersions(a, b) {
  const pa = a.replace(/^v/, '').split('.').map(Number);
  const pb = b.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i]||0) - (pb[i]||0);
    if (d) return d;
  }
  return 0;
}

/**
 * statue_{0-8}_set{1|2|3} → { num:1-27, state:0-3 }
 * set1=W1 (1-9), set2=W3 (10-18), set3=W4 (19-27)
 */
export function parseStatuesFromStats(stats) {
  const out = {};
  for (let i = 0; i < 9; i++) {
    for (const set of [1, 2, 3]) {
      const key = `statue_${i}_set${set}`;
      if (!(key in stats)) continue;
      const num = STATUE_EXPORT.numFrom(i, set);
      out[num] = Math.max(0, Math.min(3, Math.round(+stats[key] || 0)));
    }
  }
  return out;
}

/** Infère monuments / monde max depuis l'export (sans inventer de niveaux artefacts). */
export function inferWorldProgress(stats, statueStates) {
  const hasW3Statue = Object.entries(statueStates).some(([n, st]) => +n >= 10 && +n <= 18 && st >= 1);
  const hasW4Statue = Object.entries(statueStates).some(([n, st]) => +n >= 19 && st >= 1);
  const w4Signal = hasW4Statue
    || (stats.prismatic_floor_chance ?? 0) > 0
    || (stats.prism_fuel_grade ?? 0) > 0
    || stats.is_drone_prism_equipped === true;

  const monuments = {
    2: hasW3Statue || (stats.rainbow_floor_chance ?? 0) > 0 || (stats.fishing_rod_power ?? 0) > 0,
    3: hasW3Statue || (stats.galactic_floor_chance ?? 0) > 0,
    4: w4Signal,
  };
  let maxWorld = 1;
  if (monuments[2]) maxWorld = 2;
  if (monuments[3]) maxWorld = 3;
  if (monuments[4]) maxWorld = 4;
  return { monuments, maxWorld, w4Open: !!w4Signal };
}

export function deriveProfile(parsed) {
  const s = parsed.stats;
  const cap = s.xp_level_cap ?? null;
  const ob = cap != null ? PRESTIGE.obeliskFromCap(cap) : null;
  const armorRed = s.obelisk_armor_reduction ?? 0;
  const pick = s.pickaxe_damage ?? null;
  const nextArmor = ob != null ? OBELISK.effectiveArmor(ob + 1, armorRed) : null;
  const statueStates = parseStatuesFromStats(s);
  const worlds = inferWorldProgress(s, statueStates);

  return {
    version: parsed.version,
    obeliskLevel: ob,
    xpLevelCap: cap,
    pickaxeDamage: pick,
    bombDamage: s.bomb_damage ?? null,
    ppMulti: s.prestige_point_multi ?? null,
    armorReduction: armorRed,
    nextObeliskArmor: nextArmor,
    canDamageNext: pick != null && nextArmor != null ? pick > nextArmor : null,
    /** Durée du prestige / run actuel (raw.time en secondes). Pas le temps de compte. */
    runSeconds: parsed.playtimeSeconds ?? null,
    runHours: parsed.playtimeSeconds != null ? +(parsed.playtimeSeconds / 3600).toFixed(1) : null,
    playtimeHours: parsed.playtimeSeconds != null ? +(parsed.playtimeSeconds / 3600).toFixed(1) : null, // alias legacy
    statueStates,
    monuments: worlds.monuments,
    maxWorld: worlds.maxWorld,
    w4Open: worlds.w4Open,
    hasStonks: (s.stonks_chance ?? 0) > 0,
  };
}
