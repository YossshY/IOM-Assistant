/* ============================================================
   progress/dashboard.js — snapshot evaluate/plan pour le dashboard (K)
   Reco actuelle non branchée. Pas de producteurs inventés.
   ============================================================ */

import { getNode } from './compile.js';
import { playerViewFromExport } from './fromExport.js';
import { planNode } from './plan.js';
import { describeEvaluation, formatPlanTree } from './phrases.js';
import { buildProgressGraph, skillNodeId, polySystemId, monumentId, dockId, legendaryId, fishingFeatureId } from './fragments/index.js';

let cachedGraph = null;

export function getProgressGraph() {
  if (!cachedGraph) cachedGraph = buildProgressGraph();
  return cachedGraph;
}

export const DASHBOARD_GOALS = Object.freeze([
  { id: skillNodeId('lucky_strikes'), label: 'Lucky Strikes' },
  { id: skillNodeId('poly_while'), label: 'This Is Gonna Take A While..' },
  { id: polySystemId, label: 'Polychrome Cards' },
  { id: monumentId(4), label: 'World 4 Monument' },
  { id: dockId('desert'), label: 'Desert' },
  { id: legendaryId('rainbow_trout'), label: 'Rainbow Trout' },
  { id: fishingFeatureId, label: 'Fishing' },
]);

export const DEFAULT_PROGRESS_GOAL = skillNodeId('poly_while');

export function progressSnapshot({ parsed, profile, collections, goalId } = {}) {
  const graph = getProgressGraph();
  const id = DASHBOARD_GOALS.some(g => g.id === goalId) ? goalId : DEFAULT_PROGRESS_GOAL;
  const goal = DASHBOARD_GOALS.find(g => g.id === id);
  const player = playerViewFromExport({ parsed, profile, collections });
  const plan = planNode(graph, player, id);
  const node = getNode(graph, id);
  return {
    goal: { id: goal.id, label: goal.label, name: node?.name || goal.label },
    evaluation: describeEvaluation(graph, plan.evaluation),
    steps: formatPlanTree(graph, plan.children),
  };
}
