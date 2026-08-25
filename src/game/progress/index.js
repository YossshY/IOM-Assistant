/* ============================================================
   progress/index.js — API publique additive (non branchée à l'UI)
   ============================================================ */

export { STATUS, CONFIDENCE, STEP, KIND, FIXTURE_PREFIX, isFixtureId } from './ids.js';
export {
  COND, all, any, node, stat, resource, unknown, always,
  isCondition, isLeaf, normalizeCost, collectNodeIds, walk,
} from './conditions.js';
export { compileGraph, getNode } from './compile.js';
export { evaluateCondition, evaluateNode, playerView } from './evaluate.js';
export { plan, planNode, satisfy, walkPlan } from './plan.js';
export {
  buildProgressGraph,
  buildSkillTreeNodes,
  skillNodeId,
  catalogSkillId,
  skillTreeParentMap,
  deriveSkillTreeParents,
  SKILL_TREE_CONNECTORS,
  STAT_OB,
  RESOURCE_SP,
  SKILL_TREE_UNLOCK_OB,
  buildPolyInfernalNodes,
  polychromeCondition,
  infernalCondition,
  INFERNAL_SET_SOURCES,
  polySystemId,
  infernalSetId,
  tributeId,
  cardsFeatureId,
  CARDS_FEATURE_OB,
  cardRankStat,
  polyShardResource,
  infernalShardResource,
  POLY_SHARD_COUNT,
  INFERNAL_SHARD_COUNT,
  buildConstructNodes,
  researchVeinId,
  monumentId,
  veinResource,
  barResource,
  VEIN_UNLOCK_CHAIN,
  MONUMENT_UNLOCKS,
  constructFeatureId,
  CONSTRUCT_UNLOCK_OB,
  RESOURCE_GEMS,
} from './fragments/index.js';
