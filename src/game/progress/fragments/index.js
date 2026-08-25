/* ============================================================
   progress/fragments/index.js — assemblage des fragments (étape B = skill tree)
   ============================================================ */

import { compileGraph } from '../compile.js';
import { buildSkillTreeNodes } from './skillTree.js';

export { buildSkillTreeNodes, skillNodeId, catalogSkillId, skillTreeParentMap, STAT_OB, RESOURCE_SP, SKILL_TREE_UNLOCK_OB } from './skillTree.js';
export { deriveSkillTreeParents, SKILL_TREE_CONNECTORS } from './skillTreeConnectors.js';

export function buildProgressGraph() {
  return compileGraph(buildSkillTreeNodes());
}
