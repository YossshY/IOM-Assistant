/* ============================================================
   statsParser.js — Parsing dynamique de exportstats
   Aucune structure rigide : les clés inconnues sont conservées
   et signalées (support des futures versions du jeu).
   ============================================================ */
import { ALL_KNOWN_KEYS, STATS_CATALOG, GAME_VERSIONS, LATEST_KNOWN_VERSION } from './knowledgeBase.js';

/**
 * parseExportStats(rawText) -> { ok, version, stats, unknownKeys, categorized, error }
 * Ne jette rien : tout est conservé.
 */
export function parseExportStats(rawText) {
  let raw;
  try { raw = JSON.parse(rawText); }
  catch (e) { return { ok:false, error:'JSON invalide — vérifie que tu as copié l\'intégralité du résultat d\'exportstats.' }; }

  if (!raw.stats || typeof raw.stats !== 'object')
    return { ok:false, error:'Ce JSON ne contient pas de bloc "stats". Es-tu sûr qu\'il vient de la fonction exportstats ?' };

  const version = typeof raw.version === 'string' ? raw.version : 'inconnue';
  const stats = raw.stats;

  // Détection des clés inconnues (nouvelles stats d'une future version)
  const knownKeys = Object.keys(stats);
  const unknownKeys = knownKeys.filter(k => !ALL_KNOWN_KEYS.has(k));

  // Catégorisation pour l'affichage ; le reste va dans "autres"
  const categorized = {};
  for (const [cat, map] of Object.entries(STATS_CATALOG)) {
    categorized[cat] = {};
    for (const key of Object.keys(map)) if (key in stats) categorized[cat][key] = stats[key];
  }
  categorized.autres = {};
  for (const k of unknownKeys) categorized.autres[k] = stats[k];

  // Statistiques réellement nouvelles par rapport à notre base de connaissances
  const versionKnown = !!GAME_VERSIONS[version];

  return {
    ok: true,
    version,
    versionKnown,
    isNewerThanKB: versionKnown ? false : compareVersions(version, LATEST_KNOWN_VERSION) > 0,
    importedAt: new Date().toISOString(),
    playtimeSeconds: raw.time ?? null,
    rawVersionFields: Object.keys(raw).filter(k => k !== 'stats'),
    stats,
    unknownKeys,
    categorized,
    statCount: knownKeys.length,
  };
}

/** Compare "v2.2.10" vs "v2.2.6" numériquement. Retourne >0 / 0 / <0. */
export function compareVersions(a, b) {
  const pa = a.replace(/^v/, '').split('.').map(Number);
  const pb = b.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i]||0) - (pb[i]||0);
    if (d) return d;
  }
  return 0;
}

/** Dérivations sûres à partir des stats brutes (jamais d'invention :
    si la clé manque, la valeur dérivée est null). */
export function deriveProfile(parsed) {
  const s = parsed.stats;
  const cap = s.xp_level_cap ?? null;
  return {
    version: parsed.version,
    obeliskLevel: cap != null ? PRESTIGE_SAFE.obeliskFromCap(cap) : null,
    xpLevelCap: cap,
    pickaxeDamage: s.pickaxe_damage ?? null,
    bombDamage: s.bomb_damage ?? null,
    ppMulti: s.prestige_point_multi ?? null,
    armorReduction: s.obelisk_armor_reduction ?? null,
    playtimeHours: parsed.playtimeSeconds != null ? +(parsed.playtimeSeconds/3600).toFixed(1) : null,
  };
}
// import tardif évitant la dépendance circulaire à l'exécution
import { PRESTIGE as PRESTIGE_SAFE } from './knowledgeBase.js';
