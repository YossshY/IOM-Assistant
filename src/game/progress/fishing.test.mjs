/**
 * Étape F — légendaires + tributes (sauf Laviathan).
 * node src/game/progress/fishing.test.mjs
 */
import { LEGENDARY_FISH } from '../fishingData.js';
import {
  STATUS, CONFIDENCE, STEP, KIND,
  evaluateNode, planNode, playerView, walkPlan,
  buildProgressGraph, STAT_OB, tributeId, FISHING_UNLOCK_OB,
  dockId, boatT1Id, legendaryId, fishTributeId, fishResource, starResource,
  veinResource, TRIBUTE_COSTS, SKIP_TRIBUTE_IDS,
  LEGENDARY_CATCH_UNKNOWN, TRIBUTE_BAR_UNKNOWN,
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

console.log('fishing legendaries / tributes fragment');

test('11 légendaires du catalogue, kind unlock (inventaire catch)', () => {
  for (const f of LEGENDARY_FISH) {
    const n = graph.nodes[legendaryId(f.id)];
    assert(n, `missing ${f.id}`);
    assert(n.kind === KIND.unlock, `${f.id} ${n.kind}`);
  }
});

test('20 tributes (11×2 − Laviathan C)', () => {
  const skip = new Set(SKIP_TRIBUTE_IDS);
  let n = 0;
  for (const f of LEGENDARY_FISH) {
    if (skip.has(f.id)) continue;
    assert(graph.nodes[fishTributeId(f.id, 1)], `${f.id} t1`);
    assert(graph.nodes[fishTributeId(f.id, 2)], `${f.id} t2`);
    n += 2;
  }
  assert(n === 20, n);
  assert(TRIBUTE_COSTS.length === 10, TRIBUTE_COSTS.length);
  assert(graph.nodes[tributeId(1)], 'C laviathan t1 still present');
  assert(graph.nodes[tributeId(2)], 'C laviathan t2 still present');
});

test('Lake unlocked OB37 : trout incomplete (poly + catch unknown), jamais available', () => {
  const p = playerView({ stats: { [STAT_OB]: FISHING_UNLOCK_OB } });
  const ev = evaluateNode(graph, p, legendaryId('rainbow_trout'));
  assert(ev.status === STATUS.incomplete, ev.status);
  assert(ev.actionable === false);
  assert(ev.status !== STATUS.available);
  const reasons = (ev.unknownRequired || []).map(c => c.reason);
  assert(reasons.includes('legendary-poly-cards-lake'), JSON.stringify(reasons));
  assert(reasons.includes(LEGENDARY_CATCH_UNKNOWN), JSON.stringify(reasons));
});

test('dock manquant : eelworm locked (Desert)', () => {
  const p = playerView({ stats: { [STAT_OB]: FISHING_UNLOCK_OB } });
  const ev = evaluateNode(graph, p, legendaryId('dunes_eelworm'));
  assert(ev.status === STATUS.locked, ev.status);
});

test('Desert ouvert : eelworm incomplete (unknown restant)', () => {
  const p = playerView({
    nodes: { [boatT1Id(1)]: 1 },
    stats: { [STAT_OB]: FISHING_UNLOCK_OB },
  });
  assert(evaluateNode(graph, p, dockId('desert')).status === STATUS.unlocked);
  const ev = evaluateNode(graph, p, legendaryId('dunes_eelworm'));
  assert(ev.status === STATUS.incomplete, ev.status);
  assert(ev.actionable === false);
});

test('tribute T1 locked si légendaire non attrapé', () => {
  const p = playerView({ stats: { [STAT_OB]: FISHING_UNLOCK_OB } });
  const ev = evaluateNode(graph, p, fishTributeId('rainbow_trout', 1));
  assert(ev.status === STATUS.locked, ev.status);
});

test('tribute T1 : légendaire attrapé → available, pas actionable (suffixe lingot)', () => {
  const p = playerView({
    nodes: { [legendaryId('rainbow_trout')]: 1 },
    stats: { [STAT_OB]: FISHING_UNLOCK_OB },
    resources: {
      gems: 1e12,
      [starResource('aries')]: 1e12,
      [veinResource('stone')]: 1e12,
      [fishResource('golden_trout')]: 1e12,
    },
  });
  const ev = evaluateNode(graph, p, fishTributeId('rainbow_trout', 1));
  assert(ev.status === STATUS.available, ev.status);
  assert(ev.actionable === false);
  assert(ev.confidence === CONFIDENCE.partial, ev.confidence);
});

test('T2 sans T1 → locked', () => {
  const p = playerView({
    nodes: { [legendaryId('rainbow_trout')]: 1 },
    stats: { [STAT_OB]: 99 },
    resources: { gems: 1e12 },
  });
  const ev = evaluateNode(graph, p, fishTributeId('rainbow_trout', 2));
  assert(ev.status === STATUS.locked, ev.status);
});

test('T2 après T1 → available pas actionable', () => {
  const p = playerView({
    nodes: {
      [legendaryId('rainbow_trout')]: 1,
      [fishTributeId('rainbow_trout', 1)]: 1,
    },
    stats: { [STAT_OB]: 99 },
  });
  const ev = evaluateNode(graph, p, fishTributeId('rainbow_trout', 2));
  assert(ev.status === STATUS.available, ev.status);
  assert(ev.actionable === false);
});

test('Laviathan T1 C reste incomplete (non recâblé)', () => {
  const p = playerView({
    nodes: { [legendaryId('laviathan')]: 1, [boatT1Id(5)]: 1 },
    stats: { [STAT_OB]: 99 },
  });
  const ev = evaluateNode(graph, p, tributeId(1));
  assert(ev.status === STATUS.incomplete, ev.status);
  assert((ev.unknownRequired || []).some(c => c.reason === 'fishing-dock-chain'));
});

test('pas de nœud notice / enhance / rod / guppy', () => {
  const bad = Object.keys(graph.nodes).filter(id =>
    /notice|enhance|guppy|fish\.upgrade\.(?!boat)/i.test(id)
    || id.startsWith('fish.rod')
    || id === 'fish.guppy');
  assert(bad.length === 0, bad.join(','));
});

test('plan(tribute trout t1) : Unlock legendary + UnknownStep, pas de Do(star/vein/fish producteur)', () => {
  const p = playerView({ stats: { [STAT_OB]: FISHING_UNLOCK_OB } });
  const out = planNode(graph, p, fishTributeId('rainbow_trout', 1));
  assert(collect(out, s => s.step === STEP.Unlock && s.nodeId === legendaryId('rainbow_trout')).length === 1, formatPlan(out));
  assert(collect(out, s => s.reason === 'legendary-poly-cards-lake').length >= 1, formatPlan(out));
  assert(collect(out, s => s.reason === LEGENDARY_CATCH_UNKNOWN).length >= 1, formatPlan(out));
  assert(!collect(out, s => s.step === STEP.Do && /star\.|vein\.|guppy|monument/.test(s.nodeId || '')).length, formatPlan(out));
});

test('plan(trout t1) légendaire attrapé : Acquire + no-documented-producer + unknown suffixe', () => {
  const p = playerView({
    nodes: { [legendaryId('rainbow_trout')]: 1 },
    stats: { [STAT_OB]: FISHING_UNLOCK_OB },
  });
  const out = planNode(graph, p, fishTributeId('rainbow_trout', 1));
  assert(collect(out, s => s.reason === 'no-documented-producer').length >= 1, formatPlan(out));
  assert(collect(out, s => s.reason === TRIBUTE_BAR_UNKNOWN).length >= 1, formatPlan(out));
  assert(collect(out, s => s.step === STEP.Acquire && s.resource === starResource('aries')).length === 1, formatPlan(out));
  assert(collect(out, s => s.step === STEP.Acquire && s.resource === veinResource('stone')).length === 1, formatPlan(out));
});

test('pas de prérequis monument W3 sur tributes', () => {
  for (const row of TRIBUTE_COSTS) {
    const deps = graph.dependsOn[fishTributeId(row.id, 1)] || [];
    assert(!deps.some(id => id.startsWith('monument.')), `${row.id} ${JSON.stringify(deps)}`);
  }
});

test('pas de cycle fishing F', () => {
  const ids = new Set(Object.keys(graph.nodes).filter(id =>
    id.startsWith('fish.legendary.') || (id.startsWith('fish.tribute.') && !id.includes('laviathan'))));
  for (const c of graph.cycles) {
    assert(!c.some(id => ids.has(id)), JSON.stringify(c));
  }
});

console.log('\n--- plan fish.tribute.rainbow_trout.t1 (OB37, vide) ---');
console.log(formatPlan(planNode(graph, playerView({ stats: { [STAT_OB]: FISHING_UNLOCK_OB } }), fishTributeId('rainbow_trout', 1))));

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exitCode = 1;
