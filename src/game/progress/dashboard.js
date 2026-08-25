/* ============================================================
   progress/dashboard.js — snapshot + vue d’ensemble (K/L)
   Reco actuelle = hint jusqu’à bascule. Pas de producteurs inventés.
   ============================================================ */

import { STEP } from './ids.js';
import { getNode } from './compile.js';
import { playerViewFromExport } from './fromExport.js';
import { planNode, walkPlan } from './plan.js';
import { describeEvaluation, formatPlanTree, stepCaption } from './phrases.js';
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

function playerForDashboard({ parsed, profile, collections, resources } = {}) {
  const base = playerViewFromExport({ parsed, profile, collections });
  return {
    nodes: { ...base.nodes },
    stats: { ...base.stats },
    resources: { ...base.resources, ...(resources || {}) },
  };
}

function actionableDos(graph, steps) {
  const out = [];
  const seen = new Set();
  walkPlan(steps || [], n => {
    if (n.step !== STEP.Do || !n.actionable || !n.nodeId || seen.has(n.nodeId)) return;
    seen.add(n.nodeId);
    out.push({ nodeId: n.nodeId, caption: stepCaption(graph, n) });
  });
  return out;
}

export function progressSnapshot({ parsed, profile, collections, resources, goalId } = {}) {
  const graph = getProgressGraph();
  const id = DASHBOARD_GOALS.some(g => g.id === goalId) ? goalId : DEFAULT_PROGRESS_GOAL;
  const goal = DASHBOARD_GOALS.find(g => g.id === id);
  const player = playerForDashboard({ parsed, profile, collections, resources });
  const plan = planNode(graph, player, id);
  const node = getNode(graph, id);
  return {
    goal: { id: goal.id, label: goal.label, name: node?.name || goal.label },
    evaluation: describeEvaluation(graph, plan.evaluation),
    steps: formatPlanTree(graph, plan.children),
  };
}

/** Vue d’ensemble : un row par objectif dashboard, ordre source. Pas de ranking. */
export function progressOverview({ parsed, profile, collections, resources } = {}) {
  const graph = getProgressGraph();
  const player = playerForDashboard({ parsed, profile, collections, resources });
  return DASHBOARD_GOALS.map(goal => {
    const plan = planNode(graph, player, goal.id);
    return {
      goal: { id: goal.id, label: goal.label },
      evaluation: describeEvaluation(graph, plan.evaluation),
      actionable: actionableDos(graph, plan.children),
    };
  });
}
