/* ============================================================
   progress/fragments/index.js — assemblage des fragments (B–F, H)
   ============================================================ */

import { compileGraph } from '../compile.js';
import { buildSkillTreeNodes } from './skillTree.js';
import { buildPolyInfernalNodes } from './polyInfernal.js';
import { buildConstructNodes } from './construct.js';
import { buildDocksNodes } from './docks.js';
import { buildFishingNodes } from './fishing.js';

export { buildSkillTreeNodes, skillNodeId, catalogSkillId, skillTreeParentMap, STAT_OB, RESOURCE_SP, SKILL_TREE_UNLOCK_OB } from './skillTree.js';
export { deriveSkillTreeParents, SKILL_TREE_CONNECTORS } from './skillTreeConnectors.js';
export {
  buildPolyInfernalNodes, polychromeCondition, infernalCondition,
  INFERNAL_SET_SOURCES, polySystemId, infernalSetId, tributeId,
  cardsFeatureId, CARDS_FEATURE_OB, POLY_SHARD_COUNT, INFERNAL_SHARD_COUNT,
  cardRankStat, polyShardResource, infernalShardResource,
} from './polyInfernal.js';
export {
  buildConstructNodes, researchVeinId, monumentId, veinResource, barResource,
  VEIN_UNLOCK_CHAIN, MONUMENT_UNLOCKS, constructFeatureId, CONSTRUCT_UNLOCK_OB,
  RESOURCE_GEMS,
} from './construct.js';
export {
  buildDocksNodes, dockId, boatT1Id, boatT2Id, fishResource,
  BOAT_T1, BOAT_T2, fishingFeatureId, FISHING_UNLOCK_OB, STARTER_DOCK,
} from './docks.js';
export {
  buildFishingNodes, legendaryId, fishTributeId, starResource,
  TRIBUTE_COSTS, legendaryPolyUnknown,
  LEGENDARY_CATCH_UNKNOWN, TRIBUTE_BAR_UNKNOWN,
} from './fishing.js';

export function buildProgressGraph() {
  return compileGraph([
    ...buildSkillTreeNodes(),
    ...buildPolyInfernalNodes(),
    ...buildConstructNodes(),
    ...buildDocksNodes(),
    ...buildFishingNodes(),
  ]);
}
