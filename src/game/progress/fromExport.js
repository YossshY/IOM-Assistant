/* ============================================================
   progress/fromExport.js — étape I
   ExportStats + collections → PlayerView. Non branché à app.js.
   ============================================================ */

import { deriveProfile } from '../statsParser.js';
import { SKILL_NODES } from '../skillsData.js';
import { LEGENDARY_FISH } from '../fishingData.js';
import { getSkillLevel, getFishLv, hasResearchUnlock } from '../collections.js';
import { playerView } from './evaluate.js';
import { skillNodeId, STAT_OB } from './fragments/skillTree.js';
import { cardRankStat } from './fragments/polyInfernal.js';
import { monumentId, researchVeinId, VEIN_UNLOCK_CHAIN } from './fragments/construct.js';
import {
  dockId, boatT1Id, boatT2Id, BOAT_T1, BOAT_T2,
  STARTER_DOCK, FISHING_UNLOCK_OB,
} from './fragments/docks.js';
import { legendaryId, fishTributeId } from './fragments/fishing.js';

export const BOAT_UPGRADE_T1 = 'u1_boat';
export const BOAT_UPGRADE_T2 = 'u2_boat';

function own(nodes, id) {
  nodes[id] = 1;
}

function boatLevel(col, id, max) {
  const n = getFishLv(col, 'upgrades', id) | 0;
  return Math.max(0, Math.min(max, n));
}

/**
 * @param {{ parsed?: object, profile?: object, collections?: object }} input
 *   parsed = sortie de parseExportStats (ou { stats }).
 *   profile = deriveProfile(parsed) si omis.
 *   collections = état local (skills, cards, fishing, research).
 */
export function playerViewFromExport({ parsed, profile, collections } = {}) {
  const col = collections || {};
  const prof = profile || (parsed?.stats ? deriveProfile(parsed) : null);

  const stats = {};
  if (prof?.obeliskLevel != null) stats[STAT_OB] = prof.obeliskLevel;

  for (const [id, v] of Object.entries(col.cards || {})) {
    stats[cardRankStat(id)] = v | 0;
  }

  const nodes = {};

  for (const s of SKILL_NODES) {
    const lv = getSkillLevel(col, s.id);
    if (lv > 0) own(nodes, skillNodeId(s.id));
  }

  const t1 = boatLevel(col, BOAT_UPGRADE_T1, BOAT_T1.length);
  const t2 = boatLevel(col, BOAT_UPGRADE_T2, BOAT_T2.length);
  for (const row of BOAT_T1) {
    if (t1 >= row.level) {
      own(nodes, boatT1Id(row.level));
      own(nodes, dockId(row.dock));
    }
  }
  for (const row of BOAT_T2) {
    if (t2 >= row.level) {
      own(nodes, boatT2Id(row.level));
      own(nodes, dockId(row.dock));
    }
  }
  /* Lake : starter dérivé de fishing.feature (OB), pas d’un bateau ni d’un toggle UI. */
  if ((stats[STAT_OB] ?? 0) >= FISHING_UNLOCK_OB) own(nodes, dockId(STARTER_DOCK));

  const monuments = prof?.monuments || {};
  for (const world of [2, 3, 4]) {
    if (monuments[world]) own(nodes, monumentId(world));
  }

  for (const row of VEIN_UNLOCK_CHAIN) {
    if (hasResearchUnlock(col, row.id)) own(nodes, researchVeinId(row.id));
  }

  for (const f of LEGENDARY_FISH) {
    const lv = getFishLv(col, 'legendary', f.id);
    if (lv >= 1) {
      own(nodes, legendaryId(f.id));
      own(nodes, fishTributeId(f.id, 1));
    }
    if (lv >= 2) own(nodes, fishTributeId(f.id, 2));
  }

  /* ressources absentes de exportstats : {} → 0 à l’évaluation */
  return playerView({ nodes, stats, resources: {} });
}
