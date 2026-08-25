/* ============================================================
   progress/fragments/skillTree.js
   Fragment graphe : nœuds skill + parents wiki + OB + coût SP niv.1
   Ne modifie pas skillsData.js / l'UI.
   ============================================================ */

import { SKILL_NODES } from '../../skillsData.js';
import { KIND } from '../ids.js';
import { all, node, stat, unknown, always } from '../conditions.js';
import { deriveSkillTreeParents } from './skillTreeConnectors.js';

export const SKILL_NS = 'skill.';
export const STAT_OB = 'ob';
export const RESOURCE_SP = 'sp';

/** Wiki : « The Skill Tree is unlocked at Obelisk Level 4. » */
export const SKILL_TREE_UNLOCK_OB = 4;

export function skillNodeId(catalogId) {
  return SKILL_NS + catalogId;
}

export function catalogSkillId(nodeId) {
  return nodeId.startsWith(SKILL_NS) ? nodeId.slice(SKILL_NS.length) : nodeId;
}

function firstLevelCost(s) {
  if (s.cost == null) return null;
  const amount = Array.isArray(s.cost) ? s.cost[0] : s.cost;
  return { resource: RESOURCE_SP, amount };
}

function unlockCondition(s, parentMap) {
  const parts = [];
  if (s.id === 'lucky_strikes') {
    parts.push(stat(STAT_OB, SKILL_TREE_UNLOCK_OB));
  } else if (s.unlockOb) {
    parts.push(stat(STAT_OB, s.unlockOb));
  }
  if (s.id !== 'lucky_strikes') {
    const parents = parentMap[s.id];
    if (!parents || !parents.length) {
      parts.push(unknown('skill-tree-parent'));
    } else {
      for (const p of parents) parts.push(node(skillNodeId(p)));
    }
  }
  if (!parts.length) return always();
  return parts.length === 1 ? parts[0] : all(...parts);
}

export function buildSkillTreeNodes() {
  const parentMap = deriveSkillTreeParents();
  return SKILL_NODES.map(s => ({
    id: skillNodeId(s.id),
    name: s.name,
    kind: KIND.action,
    unlock: unlockCondition(s, parentMap),
    cost: firstLevelCost(s),
    /* niveaux 2+ : catalogue connu, pas de nœuds séparés à cette étape */
  }));
}

export function skillTreeParentMap() {
  return deriveSkillTreeParents();
}
