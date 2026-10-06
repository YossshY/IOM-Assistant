/**
 * Étape E — fragment Docks (bateaux wiki). Tests A–D non modifiés.
 * node src/game/progress/docks.test.mjs
 */
import { FISHING_DOCKS } from '../fishingData.js';
import {
  STATUS, CONFIDENCE, STEP, KIND,
  evaluateNode, planNode, playerView, walkPlan,
  buildProgressGraph, STAT_OB, tributeId,
  fishingFeatureId, FISHING_UNLOCK_OB, STARTER_DOCK,
  dockId, boatT1Id, boatT2Id, fishResource,
  BOAT_T1, BOAT_T2,
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

console.log('docks fragment');

test('chaque dock du catalogue a un nœud fish.dock.*', () => {
  for (const d of FISHING_DOCKS) {
    assert(graph.nodes[dockId(d.id)], `missing ${d.id}`);
    assert(graph.nodes[dockId(d.id)].kind === KIND.milestone, d.id);
  }
});

test('chaîne derived T1 : desert ← boat.1 ← lake ← fishing OB37', () => {
  assert((graph.dependsOn[dockId('desert')] || []).includes(boatT1Id(1)));
  assert((graph.dependsOn[boatT1Id(1)] || []).includes(dockId(STARTER_DOCK)));
  assert((graph.dependsOn[dockId(STARTER_DOCK)] || []).includes(fishingFeatureId));
  assert((graph.dependsOn[fishingFeatureId] || []).length === 0);
});

test('T2 boat 1 exige bateau T1 niv.5 (wiki explicit)', () => {
  assert((graph.dependsOn[boatT2Id(1)] || []).includes(boatT1Id(5)));
  assert((graph.dependsOn[dockId('cave')] || []).includes(boatT2Id(1)));
});

test('fishing.feature locked sous OB37, unlocked à 37', () => {
  const low = evaluateNode(graph, playerView({ stats: { [STAT_OB]: 36 } }), fishingFeatureId);
  assert(low.status === STATUS.locked, low.status);
  const ok = evaluateNode(graph, playerView({ stats: { [STAT_OB]: FISHING_UNLOCK_OB } }), fishingFeatureId);
  assert(ok.status === STATUS.unlocked, ok.status);
});

test('Lake : milestone à OB37, pas une action', () => {
  const p = playerView({ stats: { [STAT_OB]: FISHING_UNLOCK_OB } });
  const ev = evaluateNode(graph, p, dockId(STARTER_DOCK));
  assert(ev.status === STATUS.unlocked, ev.status);
  assert(ev.kind === KIND.milestone);
  assert(ev.actionable === false);
});

test('dock verrouillé : Desert sans bateau 1', () => {
  const p = playerView({ stats: { [STAT_OB]: FISHING_UNLOCK_OB } });
  const ev = evaluateNode(graph, p, dockId('desert'));
  assert(ev.status === STATUS.locked, ev.status);
  assert(ev.actionable === false);
});

test('bateau T1.1 : available, coût insuffisant → pas actionable', () => {
  const p = playerView({ stats: { [STAT_OB]: FISHING_UNLOCK_OB } });
  const ev = evaluateNode(graph, p, boatT1Id(1));
  assert(ev.status === STATUS.available, ev.status);
  assert(ev.actionable === false);
  assert(ev.confidence === CONFIDENCE.confirmed, ev.confidence);
});

test('bateau T1.1 : 15 Golden Trout → actionable', () => {
  const p = playerView({
    stats: { [STAT_OB]: FISHING_UNLOCK_OB },
    resources: { [fishResource('golden_trout')]: 15 },
  });
  const ev = evaluateNode(graph, p, boatT1Id(1));
  assert(ev.status === STATUS.available, ev.status);
  assert(ev.actionable === true);
});

test('prérequis manquant : bateau T1.2 sans Desert', () => {
  const p = playerView({
    stats: { [STAT_OB]: FISHING_UNLOCK_OB },
    resources: { [fishResource('scarabshoe_crab')]: 45 },
  });
  const ev = evaluateNode(graph, p, boatT1Id(2));
  assert(ev.status === STATUS.locked, ev.status);
});

test('Desert unlocked dès que bateau 1 est possédé', () => {
  const p = playerView({
    nodes: { [boatT1Id(1)]: 1 },
    stats: { [STAT_OB]: FISHING_UNLOCK_OB },
  });
  const ev = evaluateNode(graph, p, dockId('desert'));
  assert(ev.status === STATUS.unlocked, ev.status);
});

test('T2 boat 1 sans bateau T1.5 → locked', () => {
  const p = playerView({
    stats: { [STAT_OB]: 99 },
    resources: { [fishResource('wreckshell_pilferer')]: 1e12 },
  });
  const ev = evaluateNode(graph, p, boatT2Id(1));
  assert(ev.status === STATUS.locked, ev.status);
});

test('T2 boat 1 après T1.5, sans Wreckshell → available pas actionable', () => {
  const p = playerView({
    nodes: { [boatT1Id(5)]: 1 },
    stats: { [STAT_OB]: 99 },
  });
  const ev = evaluateNode(graph, p, boatT2Id(1));
  assert(ev.status === STATUS.available, ev.status);
  assert(ev.actionable === false);
});

test('T2 boat 1 : T1.5 + 2m Wreckshell → actionable', () => {
  const p = playerView({
    nodes: { [boatT1Id(5)]: 1 },
    stats: { [STAT_OB]: 99 },
    resources: { [fishResource('wreckshell_pilferer')]: 2e6 },
  });
  const ev = evaluateNode(graph, p, boatT2Id(1));
  assert(ev.status === STATUS.available, ev.status);
  assert(ev.actionable === true);
});

test('plan(desert) : Unlock/Do bateau 1 + Acquire + UnknownStep producer, pas de Do(fish)', () => {
  const p = playerView({ stats: { [STAT_OB]: FISHING_UNLOCK_OB } });
  const out = planNode(graph, p, dockId('desert'));
  assert(collect(out, s => s.step === STEP.Unlock && s.nodeId === boatT1Id(1)).length
    + collect(out, s => s.step === STEP.Do && s.nodeId === boatT1Id(1)).length >= 1, formatPlan(out));
  assert(collect(out, s => s.step === STEP.Acquire && s.resource === fishResource('golden_trout')).length === 1, formatPlan(out));
  assert(collect(out, s => s.reason === 'no-documented-producer').length >= 1, formatPlan(out));
  assert(!collect(out, s => s.step === STEP.Do && /^fish\.(?!upgrade)/.test(s.nodeId || '')).length);
});

test('plan(volcano) à OB20 : Reach OB + chaîne bateaux + UnknownStep progressor/producer', () => {
  const p = playerView({ stats: { [STAT_OB]: 20 } });
  const out = planNode(graph, p, dockId('volcano'));
  assert(collect(out, s => s.step === STEP.Reach && s.stat === STAT_OB && s.min === FISHING_UNLOCK_OB).length === 1, formatPlan(out));
  assert(collect(out, s => s.reason === 'no-documented-progressor').length >= 1, formatPlan(out));
  assert(collect(out, s => s.nodeId === boatT1Id(1)).length >= 1, formatPlan(out));
  assert(collect(out, s => s.nodeId === boatT1Id(5)).length >= 1, formatPlan(out));
  assert(collect(out, s => s.nodeId === boatT2Id(1)).length >= 1, formatPlan(out));
  assert(collect(out, s => s.nodeId === boatT2Id(2)).length >= 1, formatPlan(out));
  assert(collect(out, s => s.reason === 'no-documented-producer').length >= 1, formatPlan(out));
  assert(!collect(out, s => s.step === STEP.Do && /monument|guppy|producer/i.test(s.nodeId || '')).length);
});

test('Galaxy n’exige pas monument W4 (carte world:4 n’est pas un unlock dock)', () => {
  const deps = graph.dependsOn[dockId('galaxy')] || [];
  assert(!deps.some(id => id.startsWith('monument.')), JSON.stringify(deps));
  const p = playerView({
    nodes: { [boatT2Id(5)]: 1 },
    stats: { [STAT_OB]: FISHING_UNLOCK_OB },
  });
  const ev = evaluateNode(graph, p, dockId('galaxy'));
  assert(ev.status === STATUS.unlocked, ev.status);
});

test('Laviathan T1 locked tant que le catch n’est pas en inventaire (H)', () => {
  const p = playerView({
    nodes: { [boatT2Id(2)]: 1 },
    stats: { [STAT_OB]: 99 },
  });
  const ev = evaluateNode(graph, p, tributeId(1));
  assert(ev.status === STATUS.locked, ev.status);
  assert(ev.actionable === false);
  assert(!(ev.unknownRequired || []).some(c => c.reason === 'fishing-dock-chain'));
});

test('pas de nœud par poisson aquarium / notice / enhance', () => {
  const extra = Object.keys(graph.nodes).filter(id =>
    id.startsWith('fish.')
    && !id.startsWith('fish.dock.')
    && !id.startsWith('fish.upgrade.boat.')
    && !id.startsWith('fish.tribute.')
    && !id.startsWith('fish.legendary.'));
  assert(extra.length === 0, extra.join(','));
});

test('BOAT_T1/T2 couvrent le catalogue hors Lake', () => {
  const docks = new Set([STARTER_DOCK, ...BOAT_T1.map(r => r.dock), ...BOAT_T2.map(r => r.dock)]);
  for (const d of FISHING_DOCKS) assert(docks.has(d.id), d.id);
  assert(docks.size === FISHING_DOCKS.length);
});

test('pas de cycle docks/bateaux', () => {
  const ids = new Set(Object.keys(graph.nodes).filter(id =>
    id === fishingFeatureId || id.startsWith('fish.dock.') || id.startsWith('fish.upgrade.boat.')));
  for (const c of graph.cycles) {
    assert(!c.some(id => ids.has(id)), JSON.stringify(c));
  }
});

console.log('\n--- plan fish.dock.desert (OB37, vide) ---');
console.log(formatPlan(planNode(graph, playerView({ stats: { [STAT_OB]: FISHING_UNLOCK_OB } }), dockId('desert'))));

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exitCode = 1;
