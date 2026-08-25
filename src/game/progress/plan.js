/* ============================================================
   progress/plan.js — Do / Reach / Acquire / Unlock / UnknownStep
   J2 : état virtuel (coûts des Do) + dédup Reach/Acquire globale.
   ANY non committé (J3). PlayerView appelant immuable.
   ============================================================ */

import { STATUS, CONFIDENCE, STEP, KIND } from './ids.js';
import { COND, always, walk } from './conditions.js';
import { getNode } from './compile.js';
import { evaluateCondition, evaluateNode, resourceHave, statHave } from './evaluate.js';

function clonePlayer(player) {
  return {
    nodes: { ...(player?.nodes || {}) },
    stats: { ...(player?.stats || {}) },
    resources: { ...(player?.resources || {}) },
  };
}

function viewOf(ctx, player) {
  return ctx?.virtual || player;
}

/** Applique le coût documenté d’un Do sur l’état virtuel. Pas d’effets inventés. */
function applyDo(virtual, n) {
  virtual.nodes[n.id] = Math.max(virtual.nodes[n.id] ?? 0, 1);
  if (!n.cost) return;
  walk(n.cost, c => {
    if (c.type === COND.resource) {
      virtual.resources[c.id] = resourceHave(virtual, c.id) - (c.min ?? 0);
    }
  });
}

function makeDo(id, ev) {
  return planNodeBase(STEP.Do, {
    status: STATUS.available,
    confidence: ev.confidence,
    actionable: true,
    children: [],
    why: 'action-now',
    fields: { nodeId: id },
  });
}

function planNodeBase(step, extra) {
  return {
    step,
    status: extra.status ?? STATUS.locked,
    confidence: extra.confidence ?? CONFIDENCE.confirmed,
    actionable: Boolean(extra.actionable),
    children: extra.children || [],
    why: extra.why || undefined,
    ...extra.fields,
  };
}

function unknownStep(regarding, reason, extra = {}) {
  return planNodeBase(STEP.UnknownStep, {
    status: STATUS.incomplete,
    confidence: extra.confidence ?? CONFIDENCE.unknown,
    actionable: false,
    children: extra.children || [],
    why: reason,
    fields: { regarding, reason },
  });
}

function mergeCovered(covered, adds) {
  const stats = { ...covered.stats };
  const resources = { ...covered.resources };
  for (const [k, v] of Object.entries(adds.stats || {})) {
    stats[k] = Math.max(stats[k] ?? 0, v);
  }
  for (const [k, v] of Object.entries(adds.resources || {})) {
    resources[k] = Math.max(resources[k] ?? 0, v);
  }
  return { stats, resources };
}

function coveredFromSteps(steps) {
  const adds = { stats: {}, resources: {} };
  for (const s of steps) {
    if (s.step === STEP.Reach) adds.stats[s.stat] = Math.max(adds.stats[s.stat] ?? 0, s.min);
    if (s.step === STEP.Acquire) adds.resources[s.resource] = Math.max(adds.resources[s.resource] ?? 0, s.min);
  }
  return adds;
}

function mergeSameLevel(steps) {
  const out = [];
  const reachAt = Object.create(null);
  const acquireAt = Object.create(null);
  const seenUnlock = new Set();
  const seenDo = new Set();
  const seenUnknown = new Set();

  for (const s of steps) {
    if (s.step === STEP.Reach) {
      const i = reachAt[s.stat];
      if (i == null) { reachAt[s.stat] = out.length; out.push(s); }
      else if (s.min > out[i].min) out[i] = s;
      continue;
    }
    if (s.step === STEP.Acquire) {
      const i = acquireAt[s.resource];
      if (i == null) { acquireAt[s.resource] = out.length; out.push(s); }
      else if (s.min > out[i].min) out[i] = s;
      continue;
    }
    if (s.step === STEP.Unlock) {
      if (seenUnlock.has(s.nodeId)) continue;
      seenUnlock.add(s.nodeId);
      out.push(s);
      continue;
    }
    if (s.step === STEP.Do) {
      if (seenDo.has(s.nodeId)) continue;
      seenDo.add(s.nodeId);
      out.push(s);
      continue;
    }
    if (s.step === STEP.UnknownStep) {
      const key = `${s.reason}|${JSON.stringify(s.regarding)}`;
      if (seenUnknown.has(key)) continue;
      seenUnknown.add(key);
      out.push(s);
      continue;
    }
    out.push(s);
  }
  return out;
}

function dominated(step, covered) {
  if (step.step === STEP.Reach && (covered.stats[step.stat] ?? 0) >= step.min) return true;
  if (step.step === STEP.Acquire && (covered.resources[step.resource] ?? 0) >= step.min) return true;
  return false;
}

function withChildrenCovered(step, covered) {
  if (!step.children?.length) return step;
  const selfCover = mergeCovered(covered, coveredFromSteps([step]));
  const nextCover = mergeCovered(selfCover, coveredFromSteps(step.children));
  return {
    ...step,
    children: step.children
      .filter(c => !dominated(c, selfCover))
      .map(c => withChildrenCovered(c, nextCover)),
  };
}

function condEvalStatus(ev) {
  if (ev.truth === 'true') return STATUS.unlocked;
  if (ev.truth === 'false') return STATUS.locked;
  return STATUS.incomplete;
}

function satisfyNode(graph, player, id, ctx) {
  if (ctx.stack.has(id)) {
    return [unknownStep({ type: COND.node, id }, 'cycle', { confidence: CONFIDENCE.confirmed })];
  }
  const n = getNode(graph, id);
  if (!n) {
    return [unknownStep({ type: COND.node, id }, 'node-not-in-graph')];
  }

  const virtual = viewOf(ctx, player);
  const ev = evaluateNode(graph, virtual, id);
  if (ev.status === STATUS.unlocked) return [];

  ctx.stack.add(id);
  try {
    if (n.kind === KIND.milestone) {
      return satisfy(graph, player, n.unlock || always(), ctx);
    }

    if (n.kind === KIND.action && ev.actionable) {
      applyDo(virtual, n);
      return [makeDo(id, ev)];
    }

    const unlockKids = satisfy(graph, player, n.unlock || always(), ctx);
    const ev2 = evaluateNode(graph, virtual, id);
    if (ev2.status === STATUS.unlocked) return unlockKids;

    if (n.kind === KIND.action && ev2.actionable) {
      applyDo(virtual, n);
      return mergeSameLevel([...unlockKids, makeDo(id, ev2)]);
    }

    const costKids = n.cost ? satisfy(graph, player, n.cost, ctx) : [];
    const children = mergeSameLevel([...unlockKids, ...costKids]);
    return [planNodeBase(STEP.Unlock, {
      status: ev2.status,
      confidence: ev2.confidence,
      actionable: false,
      children,
      why: n.kind === KIND.action ? 'need-node-then-do' : 'need-node',
      fields: { nodeId: id },
    })];
  } finally {
    ctx.stack.delete(id);
  }
}

function satisfyStat(graph, player, cond, ctx) {
  const virtual = viewOf(ctx, player);
  const ev = evaluateCondition(graph, virtual, cond);
  if (ev.truth === 'true') return [];
  const have = statHave(virtual, cond.id);
  const haveVal = have == null ? 0 : have;
  const progressors = graph.progressorsOf[cond.id] || [];
  const children = [];
  if (!progressors.length) {
    children.push(unknownStep(cond, 'no-documented-progressor'));
  } else {
    for (const pid of progressors) {
      children.push(...satisfyNode(graph, player, pid, ctx));
    }
  }
  return [planNodeBase(STEP.Reach, {
    status: ev.truth === 'false' ? STATUS.locked : STATUS.incomplete,
    confidence: ev.confidence,
    actionable: false,
    children,
    why: 'threshold',
    fields: { stat: cond.id, min: cond.min, have: haveVal },
  })];
}

function satisfyResource(graph, player, cond, ctx) {
  const virtual = viewOf(ctx, player);
  const ev = evaluateCondition(graph, virtual, cond);
  if (ev.truth === 'true') return [];
  const have = resourceHave(virtual, cond.id);
  const producers = graph.producersOf[cond.id] || [];
  const children = [];
  if (!producers.length) {
    children.push(unknownStep(cond, 'no-documented-producer'));
  } else {
    for (const pid of producers) {
      children.push(...satisfyNode(graph, player, pid, ctx));
    }
  }
  return [planNodeBase(STEP.Acquire, {
    status: ev.truth === 'false' ? STATUS.locked : STATUS.incomplete,
    confidence: ev.confidence,
    actionable: false,
    children,
    why: 'resource',
    fields: { resource: cond.id, min: cond.min, have },
  })];
}

export function satisfy(graph, player, cond, ctx) {
  if (!cond) return [];
  if (!ctx.virtual) ctx.virtual = clonePlayer(player);
  if (cond.type === COND.all) {
    const kids = [];
    for (const child of cond.items || []) kids.push(...satisfy(graph, player, child, ctx));
    return mergeSameLevel(kids);
  }
  if (cond.type === COND.any) {
    const virtual = viewOf(ctx, player);
    const ev = evaluateCondition(graph, virtual, cond);
    if (ev.truth === 'true') return [];
    /* J2 : toutes les branches, sans committer la conso (J3 choisira). */
    const saved = clonePlayer(virtual);
    const kids = [];
    for (const child of cond.items || []) {
      ctx.virtual = clonePlayer(saved);
      kids.push(...satisfy(graph, player, child, ctx));
    }
    ctx.virtual = saved;
    return mergeSameLevel(kids);
  }
  if (cond.type === COND.unknown) {
    return [unknownStep(cond, cond.reason || 'unknown-condition')];
  }
  if (cond.type === COND.node) return satisfyNode(graph, player, cond.id, ctx);
  if (cond.type === COND.stat) return satisfyStat(graph, player, cond, ctx);
  if (cond.type === COND.resource) return satisfyResource(graph, player, cond, ctx);
  return [unknownStep(cond, 'invalid-condition')];
}

function newCtx(player) {
  return { stack: new Set(), virtual: clonePlayer(player) };
}

function conditionOfGoal(goal) {
  if (!goal) return always();
  if (goal.condition) return goal.condition;
  if (goal.type) return goal;
  if (typeof goal === 'string') return { type: COND.node, id: goal, min: 1 };
  if (goal.nodeId) return { type: COND.node, id: goal.nodeId, min: goal.min ?? 1 };
  return always();
}

function evaluationForGoal(graph, player, goal, condition) {
  if (typeof goal === 'string') return evaluateNode(graph, player, goal);
  if (goal?.nodeId) return evaluateNode(graph, player, goal.nodeId);
  if (condition?.type === COND.node) return evaluateNode(graph, player, condition.id);
  const ev = evaluateCondition(graph, player, condition);
  return {
    ...ev,
    status: condEvalStatus(ev),
    actionable: false,
    kind: null,
  };
}

/**
 * @param {object} graph compileGraph(...)
 * @param {object} player { nodes, stats, resources }
 * @param {object|string} goal Condition | { id, label, condition } | nodeId
 */
function hoistReachAcquire(steps) {
  const reach = Object.create(null);
  const acquire = Object.create(null);

  function collect(list) {
    for (const s of list || []) {
      if (s.step === STEP.Reach) {
        const prev = reach[s.stat];
        if (!prev || s.min > prev.min) reach[s.stat] = s;
      } else if (s.step === STEP.Acquire) {
        const prev = acquire[s.resource];
        if (!prev || s.min > prev.min) acquire[s.resource] = s;
      }
      collect(s.children);
    }
  }

  function strip(list) {
    const out = [];
    for (const s of list || []) {
      if (s.step === STEP.Reach || s.step === STEP.Acquire) continue;
      out.push({ ...s, children: strip(s.children) });
    }
    return out;
  }

  collect(steps);
  return mergeSameLevel([...Object.values(reach), ...Object.values(acquire), ...strip(steps)]);
}

function dedupUnlock(steps) {
  const seen = new Map();
  function walkList(list) {
    const out = [];
    for (const s of list || []) {
      const kids = walkList(s.children);
      if (s.step === STEP.Unlock) {
        if (seen.has(s.nodeId)) {
          const first = seen.get(s.nodeId);
          first.children = mergeSameLevel([...(first.children || []), ...kids]);
          continue;
        }
        const copy = { ...s, children: kids };
        seen.set(s.nodeId, copy);
        out.push(copy);
        continue;
      }
      out.push({ ...s, children: kids });
    }
    return out;
  }
  return walkList(steps);
}

export function plan(graph, player, goal) {
  const condition = conditionOfGoal(goal);
  const ctx = newCtx(player);
  const raw = satisfy(graph, player, condition, ctx);
  const merged = mergeSameLevel(raw);
  const covered = merged.map(s => withChildrenCovered(s, mergeCovered({ stats: {}, resources: {} }, coveredFromSteps(merged))));
  const children = hoistReachAcquire(dedupUnlock(covered));
  const evaluation = evaluationForGoal(graph, player, goal, condition);
  return {
    goal: typeof goal === 'string' ? goal : (goal?.id ?? null),
    label: typeof goal === 'object' && goal && 'label' in goal ? goal.label : null,
    evaluation,
    children,
  };
}

export function planNode(graph, player, nodeId) {
  return plan(graph, player, { id: nodeId, condition: { type: COND.node, id: nodeId, min: 1 } });
}

export function walkPlan(nodes, visit) {
  const list = Array.isArray(nodes) ? nodes : (nodes?.children || []);
  for (const n of list) {
    visit(n);
    if (n.children?.length) walkPlan(n.children, visit);
  }
}
