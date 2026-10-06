/* ============================================================
   progress/fragments/skillTreeConnectors.js
   Connecteurs wiki Skill-Tree (v2.2.6) — 4 colonnes L · LC · RC · R.

   Source : wikitexte https://shminer.miraheze.org/wiki/Skill-Tree
   Templates {{SkillTreeArrow|left|upleft|upright|right|both}}
   + barres verticales « | » (Module:SkillTreeArrow).

   Interprétation (topologie dessinée, pas une mécanique inventée) :
   - « | » dans la colonne C     → l'enfant C vient du skill déjà dans C
   - left / upleft / upright / right (les 4) → L et LC viennent de LC ;
                                                 RC et R viennent de RC
   - upright en S + right en S+1 → les deux enfants viennent du skill en S
   - left + both + right         → les enfants viennent de la colonne « both » (LC)
   - deux « | » sous un unique skill (racine) → les deux enfants viennent de ce skill

   SKILL_TREE_ROWS n'est pas modifié : c'est le layout UI existant.
   ============================================================ */

import { SKILL_TREE_ROWS } from '../../skillsData.js';

/** Tokens wiki par colonne, entre SKILL_TREE_ROWS[afterRow] et [afterRow+1]. */
export const SKILL_TREE_CONNECTORS = [
  { afterRow: 0,  cols: ['', '|', '|', ''] },
  { afterRow: 1,  cols: ['', '|', '|', ''] },
  { afterRow: 2,  cols: ['left', 'upleft', 'upright', 'right'] },
  { afterRow: 3,  cols: ['', '|', '|', ''] },
  { afterRow: 4,  cols: ['left', 'upleft', 'upright', 'right'] },
  { afterRow: 5,  cols: ['left', 'upleft', 'upright', 'right'] },
  { afterRow: 6,  cols: ['', '|', '|', ''] },
  { afterRow: 7,  cols: ['', '|', '|', ''] },
  { afterRow: 8,  cols: ['', '|', '|', ''] },
  { afterRow: 9,  cols: ['', '|', '|', ''] },
  { afterRow: 10, cols: ['', '|', '|', ''] },
  { afterRow: 11, cols: ['', '|', '|', ''] },
  { afterRow: 12, cols: ['', '|', '|', ''] },
  { afterRow: 13, cols: ['left', 'upleft', 'upright', 'right'] },
  { afterRow: 14, cols: ['|', '|', '|', '|'] },
  { afterRow: 15, cols: ['|', '|', '|', '|'] },
  { afterRow: 16, cols: ['left', 'upleft', 'upright', 'right'] },
  { afterRow: 17, cols: ['upright', 'right', '', ''] },
  { afterRow: 18, cols: ['upright', 'right', '', ''] },
  { afterRow: 19, cols: ['upright', 'right', '', ''] },
  { afterRow: 20, cols: ['|', 'upright', 'right', ''] },
  { afterRow: 21, cols: ['upright', 'right', '|', ''] },
  { afterRow: 22, cols: ['left', 'both', 'right', ''] },
  { afterRow: 23, cols: ['|', '|', '|', ''] },
  { afterRow: 24, cols: ['', '|', '', ''] },
];

function onlySkill(row) {
  const ids = row.filter(Boolean);
  return ids.length === 1 ? ids[0] : null;
}

function sourceForRight(prev, tokens, col) {
  for (let j = col - 1; j >= 0; j--) {
    const t = tokens[j];
    if (t === 'upright' || t === 'both' || t === 'upleft' || t === 'left') {
      return prev[j] || null;
    }
  }
  return null;
}

function parentsForCell(prev, tokens, col) {
  const token = tokens[col] || '';
  if (!token) return [];

  if (token === '|') {
    if (prev[col]) return [prev[col]];
    const root = onlySkill(prev);
    return root ? [root] : [];
  }
  if (token === 'left') {
    return prev[1] ? [prev[1]] : [];
  }
  if (token === 'upleft' || token === 'both') {
    if (prev[col]) return [prev[col]];
    return prev[1] ? [prev[1]] : [];
  }
  if (token === 'upright') {
    return prev[col] ? [prev[col]] : [];
  }
  if (token === 'right') {
    const src = sourceForRight(prev, tokens, col);
    return src ? [src] : [];
  }
  return [];
}

/**
 * childCatalogId → parent catalog ids (AND).
 * Racine (lucky_strikes) absente de la map = pas de parent d'arbre.
 */
export function deriveSkillTreeParents(rows = SKILL_TREE_ROWS, connectors = SKILL_TREE_CONNECTORS) {
  const parents = Object.create(null);
  for (const conn of connectors) {
    const prev = rows[conn.afterRow];
    const next = rows[conn.afterRow + 1];
    if (!prev || !next) continue;
    for (let c = 0; c < 4; c++) {
      const child = next[c];
      if (!child) continue;
      const ps = parentsForCell(prev, conn.cols, c);
      if (!ps.length) continue;
      if (!parents[child]) parents[child] = [];
      for (const p of ps) {
        if (p && !parents[child].includes(p)) parents[child].push(p);
      }
    }
  }
  return parents;
}
