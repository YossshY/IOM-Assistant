/**
 * Étape D — Monuments / chaîne Research veines.
 * node src/game/progress/construct.test.mjs
 */
import { RESEARCH_VEINS } from '../constructData.js';
import {
  STATUS, CONFIDENCE, STEP,
  evaluateNode, planNode, playerView, walkPlan,
  buildProgressGraph, STAT_OB,
  researchVeinId, monumentId, veinResource, barResource,
  VEIN_UNLOCK_CHAIN, constructFeatureId, CONSTRUCT_UNLOCK_OB, RESOURCE_GEMS,
} from './index.js';

const graph = buildProgressGraph();

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function test(name, fn) {
  try { fn(); passed++; console.log(`  ok  ${name}`); }
  catch (err) { failed++; console.log(`  FAIL ${name}\n       ${err.message}`); }
}

function collect(planOut, pred) {
  const found = [];
  walkPlan(planOut.children || [], n => { if (pred(n)) found.push(n); });
  return found;
}

function formatPlan(p) {
  const lines = [];
  const dump = (s, ind) => {
    const bits = [s.step, s.nodeId || '', s.stat ? `${s.stat}>=${s.min}` : '', s.resource ? `${s.resource}>=${s.min}` : '', s.reason || '', s.status];
    lines.push(ind + bits.filter(Boolean).join(' '));
    for (const c of s.children || []) dump(c, ind + '  ');
  };
  for (const c of p.children || []) dump(c, '');
  return lines.join('\n');
}

console.log('construct / monuments fragment');

test('chaque veine du catalogue research a un nœud', () => {
  for (const v of RESEARCH_VEINS) {
    assert(graph.nodes[researchVeinId(v.id)], `missing ${v.id}`);
  }
});

test('chaîne wiki : magma ← stone ← construct OB19', () => {
  assert((graph.dependsOn[researchVeinId('magma')] || []).includes(researchVeinId('stone')));
  assert((graph.dependsOn[researchVeinId('stone')] || []).includes(constructFeatureId));
});

test('construct.feature locked sous OB19, unlocked à 19', () => {
  const low = evaluateNode(graph, playerView({ stats: { [STAT_OB]: 18 } }), constructFeatureId);
  assert(low.status === STATUS.locked, low.status);
  const ok = evaluateNode(graph, playerView({ stats: { [STAT_OB]: 19 } }), constructFeatureId);
  assert(ok.status === STATUS.unlocked, ok.status);
});

test('stone : OB19, sans lingots → available, pas actionable', () => {
  const p = playerView({ stats: { [STAT_OB]: 19 } });
  const ev = evaluateNode(graph, p, researchVeinId('stone'));
  assert(ev.status === STATUS.available, ev.status);
  assert(ev.actionable === false);
  assert(ev.confidence === CONFIDENCE.confirmed, ev.confidence);
});

test('stone : lingots suffisants → actionable', () => {
  const p = playerView({
    stats: { [STAT_OB]: 19 },
    resources: { [barResource('Adamant')]: 7.5e6, [barResource('Runite')]: 7.5e6 },
  });
  const ev = evaluateNode(graph, p, researchVeinId('stone'));
  assert(ev.status === STATUS.available, ev.status);
  assert(ev.actionable === true);
});

test('magma sans stone research → locked (dépendance)', () => {
  const p = playerView({
    stats: { [STAT_OB]: 19 },
    resources: { [veinResource('stone')]: 1e6, [barResource('Obsidian')]: 1e12, [barResource('Demonite')]: 1e12 },
  });
  const ev = evaluateNode(graph, p, researchVeinId('magma'));
  assert(ev.status === STATUS.locked, ev.status);
});

test('magma : stone research + 1k stone veins + bars → actionable', () => {
  const p = playerView({
    nodes: { [researchVeinId('stone')]: 1 },
    stats: { [STAT_OB]: 19 },
    resources: {
      [veinResource('stone')]: 1000,
      [barResource('Obsidian')]: 11.25e6,
      [barResource('Demonite')]: 11.25e6,
    },
  });
  const ev = evaluateNode(graph, p, researchVeinId('magma'));
  assert(ev.status === STATUS.available, ev.status);
  assert(ev.actionable === true);
});

test('plan(magma) : Unlock stone + Acquire veines + Acquire bars sans producer', () => {
  const p = playerView({ stats: { [STAT_OB]: 19 } });
  const out = planNode(graph, p, researchVeinId('magma'));
  assert(collect(out, s => s.step === STEP.Unlock && s.nodeId === researchVeinId('stone')).length
    + collect(out, s => s.step === STEP.Do && s.nodeId === researchVeinId('stone')).length >= 1, formatPlan(out));
  assert(collect(out, s => s.step === STEP.Acquire && s.resource === veinResource('stone')).length === 1, formatPlan(out));
  assert(collect(out, s => s.reason === 'no-documented-producer').length >= 1);
});

test('monument W2 : gemmes insuffisantes → available pas actionable', () => {
  const p = playerView({
    nodes: {
      [researchVeinId('stone')]: 1,
      [researchVeinId('magma')]: 1,
      [researchVeinId('virtual')]: 1,
    },
    stats: { [STAT_OB]: 19 },
    resources: {
      [RESOURCE_GEMS]: 100,
      [veinResource('stone')]: 2e3,
      [veinResource('magma')]: 2e3,
      [veinResource('virtual')]: 2e3,
    },
  });
  const ev = evaluateNode(graph, p, monumentId(2));
  assert(ev.status === STATUS.available, ev.status);
  assert(ev.actionable === false);
});

test('monument W2 : coûts OK → actionable', () => {
  const p = playerView({
    nodes: {
      [researchVeinId('stone')]: 1,
      [researchVeinId('magma')]: 1,
      [researchVeinId('virtual')]: 1,
    },
    stats: { [STAT_OB]: 19 },
    resources: {
      [RESOURCE_GEMS]: 2000,
      [veinResource('stone')]: 2e3,
      [veinResource('magma')]: 2e3,
      [veinResource('virtual')]: 2e3,
    },
  });
  const ev = evaluateNode(graph, p, monumentId(2));
  assert(ev.status === STATUS.available, ev.status);
  assert(ev.actionable === true);
});

test('monument W3 exige W2 + OB42', () => {
  const p = playerView({
    nodes: {
      [researchVeinId('valley')]: 1,
      [researchVeinId('jungle')]: 1,
      [researchVeinId('volcano')]: 1,
    },
    stats: { [STAT_OB]: 42 },
    resources: {
      [RESOURCE_GEMS]: 7500,
      [veinResource('valley')]: 750e3,
      [veinResource('jungle')]: 750e3,
      [veinResource('volcano')]: 750e3,
    },
  });
  const ev = evaluateNode(graph, p, monumentId(3));
  assert(ev.status === STATUS.locked, ev.status);
  const p2 = playerView({
    ...p,
    nodes: { ...p.nodes, [monumentId(2)]: 1 },
  });
  const ev2 = evaluateNode(graph, p2, monumentId(3));
  assert(ev2.status === STATUS.available, ev2.status);
  assert(ev2.actionable === true);
});

test('monument W4 : 1e15 veines (q wiki) + OB64 + W3', () => {
  const p = playerView({
    nodes: {
      [monumentId(3)]: 1,
      [researchVeinId('industrial')]: 1,
      [researchVeinId('warfront')]: 1,
      [researchVeinId('neon')]: 1,
    },
    stats: { [STAT_OB]: 64 },
    resources: {
      [RESOURCE_GEMS]: 1e6,
      [veinResource('industrial')]: 1e15,
      [veinResource('warfront')]: 1e15,
      [veinResource('neon')]: 1e15,
    },
  });
  const ev = evaluateNode(graph, p, monumentId(4));
  assert(ev.status === STATUS.available, ev.status);
  assert(ev.actionable === true);
});

test('wonderland : veines 1.25q connues, lingots oc en coût unknown → available pas actionable', () => {
  const p = playerView({
    nodes: { [researchVeinId('neon')]: 1 },
    stats: { [STAT_OB]: 19 },
    resources: { [veinResource('neon')]: 1.25e15 },
  });
  const ev = evaluateNode(graph, p, researchVeinId('wonderland'));
  assert(ev.status === STATUS.available, ev.status);
  assert(ev.actionable === false);
  assert(ev.confidence === CONFIDENCE.partial, ev.confidence);
});

test('suffixes qi/oc non convertis : enchanted incomplete (vein cost unknown)', () => {
  const p = playerView({
    nodes: { [researchVeinId('arabian')]: 1 },
    stats: { [STAT_OB]: 70 },
    resources: { [barResource('Carriagum')]: 1e99, [barResource('Crystal-Rose')]: 1e99 },
  });
  const ev = evaluateNode(graph, p, researchVeinId('enchanted'));
  assert(ev.status === STATUS.incomplete, ev.status);
  assert(ev.actionable === false);
});

test('VEIN_UNLOCK_CHAIN couvre le catalogue', () => {
  const ids = new Set(VEIN_UNLOCK_CHAIN.map(r => r.id));
  for (const v of RESEARCH_VEINS) assert(ids.has(v.id), v.id);
});

test('pas de cycle construct', () => {
  const ids = new Set(Object.keys(graph.nodes).filter(id => id.startsWith('research.') || id.startsWith('monument.') || id === constructFeatureId));
  for (const c of graph.cycles) {
    assert(!c.some(id => ids.has(id)), JSON.stringify(c));
  }
});

console.log('\n--- plan research.vein.magma (OB19, vide) ---');
console.log(formatPlan(planNode(graph, playerView({ stats: { [STAT_OB]: 19 } }), researchVeinId('magma'))));

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exitCode = 1;
