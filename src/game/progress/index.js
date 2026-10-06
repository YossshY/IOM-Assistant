/* ============================================================
   progress/index.js — API publique (dashboard K ; reco non branchée)
   ============================================================ */

export { STATUS, CONFIDENCE, STEP, KIND, FIXTURE_PREFIX, isFixtureId } from './ids.js';
export {
  COND, all, any, node, stat, resource, unknown, always,
  isCondition, isLeaf, normalizeCost, collectNodeIds, walk,
} from './conditions.js';
export { compileGraph, getNode } from './compile.js';
export { evaluateCondition, evaluateNode, playerView } from './evaluate.js';
export { playerViewFromExport, BOAT_UPGRADE_T1, BOAT_UPGRADE_T2 } from './fromExport.js';
export { MANUAL_STOCKS, resourcesFromStocks } from './stocks.js';
export { plan, planNode, satisfy, walkPlan } from './plan.js';
export {
  STATUS_PHRASE, ACTIONABLE_NOW, UNKNOWN_STEP_PHRASE, CONFIDENCE_LABEL,
  describeEvaluation, formatPlanTree, statusPhrase,
} from './phrases.js';
export {
  getProgressGraph, DASHBOARD_GOALS, DEFAULT_PROGRESS_GOAL, progressSnapshot, progressOverview,
} from './dashboard.js';
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
  buildDocksNodes,
  dockId,
  boatT1Id,
  boatT2Id,
  fishResource,
  BOAT_T1,
  BOAT_T2,
  fishingFeatureId,
  FISHING_UNLOCK_OB,
  STARTER_DOCK,
  buildFishingNodes,
  legendaryId,
  fishTributeId,
  starResource,
  TRIBUTE_COSTS,
  legendaryPolyUnknown,
  LEGENDARY_CATCH_UNKNOWN,
  TRIBUTE_BAR_UNKNOWN,
} from './fragments/index.js';
