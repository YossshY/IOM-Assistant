/* ============================================================
   progress/fragments/index.js — assemblage des fragments (B + C + D)
   ============================================================ */

import { compileGraph } from '../compile.js';
import { buildSkillTreeNodes } from './skillTree.js';
import { buildPolyInfernalNodes } from './polyInfernal.js';
import { buildConstructNodes } from './construct.js';

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

export function buildProgressGraph() {
  return compileGraph([
    ...buildSkillTreeNodes(),
    ...buildPolyInfernalNodes(),
    ...buildConstructNodes(),
  ]);
}
