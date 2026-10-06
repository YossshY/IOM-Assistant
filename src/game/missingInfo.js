/* ============================================================
   missingInfo.js — Gaps vraiment absents de l'export
   (statues / mondes sont désormais dérivés de exportstats)
   ============================================================ */

export function detectMissingInformation(parsed, profile) {
  const s = parsed.stats;
  const gaps = [];

  if (s.artifact_cap_increase !== undefined) {
    gaps.push({
      id: 'artifacts_t34',
      label: 'Niveaux artefacts (Prestige)',
      question: 'Niveaux T3 Armor Reduction / T4 Pickaxe per Statue ?',
      type: 'numbers',
      relevantWhen: p => (p.obeliskLevel ?? 0) >= 14,
      reason: 'Caps visibles dans l\'export, pas les niveaux — à noter dans Prestige.',
    });
  }

  if (!profile.hasStonks) {
    gaps.push({
      id: 'skills_sTier',
      label: 'Skills S-Tier',
      question: 'Gem Bomb / Auto-Bomber / Free? / Stonks ?',
      type: 'bools',
      relevantWhen: () => true,
      reason: 'Aucun signal Stonks. Les exports récents remplissent le Skill-Tree via skill_tree_nodes_array.',
    });
  }

  if ((profile.obeliskLevel ?? 0) >= 64 && !profile.w4Open) {
    gaps.push({
      id: 'monument_w4',
      label: 'Monument World 4',
      question: 'Monument W4 construit ?',
      type: 'bool',
      relevantWhen: p => (p.obeliskLevel ?? 0) >= 64 && !p.w4Open,
      reason: 'OB64 atteint, aucun signal W4 dans l\'export (statues set3 / prismatic / prism).',
    });
  }

  return gaps.filter(g => !g.relevantWhen || g.relevantWhen(profile));
}
