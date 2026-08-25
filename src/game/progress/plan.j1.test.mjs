/**
 * J1 — planification sémantique (Graph + PlayerView I → plan).
 * Pas d’optimisation, pas d’UI, pas de producteurs inventés.
 * node src/game/progress/plan.j1.test.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseExportStats, deriveProfile } from '../statsParser.js';
import {
  STATUS, STEP,
  evaluateNode, playerViewFromExport, planNode, walkPlan,
  buildProgressGraph, STAT_OB, RESOURCE_SP,
  skillNodeId, polySystemId,
  fishingFeatureId, FISHING_UNLOCK_OB,
  dockId, boatT1Id, fishResource,
  legendaryId, fishTributeId, LEGENDARY_CATCH_UNKNOWN,
} from './index.js';
import { fxCoreGraph } from './fixtures.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const raw = readFileSync(join(root, 'samples/exportstats-v2.2.6.json'), 'utf8');
const parsed = parseExportStats(raw);
const profile = deriveProfile(parsed);
const graph = buildProgressGraph();
const fx = fxCoreGraph();

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function test(name, fn) {
  try { fn(); passed++; console.log(`  ok  ${name}`); }
  catch (err) { failed++; console.log(`  FAIL ${name}\n       ${err.message}`); }
}

function view(col = {}, extra = {}, ob = null) {
  const prof = ob == null ? profile : { ...profile, obeliskLevel: ob };
  const p = playerViewFromExport({ parsed, profile: prof, collections: col });
  return {
    nodes: { ...p.nodes, ...(extra.nodes || {}) },
    stats: { ...p.stats, ...(extra.stats || {}) },
    resources: { ...p.resources, ...(extra.resources || {}) },
  };
}

function viewOb(ob, col = {}, extra = {}) {
  return view(col, extra, ob);
}

function collect(planOut, pred) {
  const found = [];
  walkPlan(planOut.children || [], n => { if (pred(n)) found.push(n); });
  return found;
}

function countSteps(planOut) {
  let n = 0;
  walkPlan(planOut.children || [], () => { n++; });
  return n;
}

function formatPlan(p) {
  const lines = [];
  const dump = (s, ind) => {
    const bits = [s.step, s.nodeId || '', s.stat ? `${s.stat}>=${s.min}` : '', s.resource ? `${s.resource}>=${s.min}` : '', s.reason || '', s.status, s.actionable ? 'actionable' : ''];
    lines.push(ind + bits.filter(Boolean).join(' '));
    for (const c of s.children || []) dump(c, ind + '  ');
  };
  for (const c of p.children || []) dump(c, '');
  return lines.join('\n');
}

function noInventedFishCatch(out, dump) {
  const bad = collect(out, s => s.step === STEP.Do && s.nodeId && (
    s.nodeId === fishResource('golden_trout')
    || s.nodeId === fishResource('scarabshoe_crab')
    || /^fish\.(?!upgrade\.boat\.|tribute\.|legendary\.|dock\.)/.test(s.nodeId)
  ));
  assert(bad.length === 0, `invented fish Do: ${bad.map(s => s.nodeId)} \n${dump}`);
}

console.log('J1 plan (PlayerView I)');

test('1. objectif déjà atteint : children vides, evaluation unlocked', () => {
  const p = view({ skills: { lucky_strikes: 1, poly_while: 1 } });
  const skill = planNode(graph, p, skillNodeId('lucky_strikes'));
  assert(skill.evaluation.status === STATUS.unlocked, skill.evaluation.status);
  assert(skill.children.length === 0, formatPlan(skill));
  const poly = planNode(graph, p, polySystemId);
  assert(poly.evaluation.status === STATUS.unlocked, poly.evaluation.status);
  assert(poly.children.length === 0, formatPlan(poly));
  const fish = planNode(graph, view(), fishingFeatureId);
  assert(fish.evaluation.status === STATUS.unlocked, fish.evaluation.status);
  assert(fish.children.length === 0, formatPlan(fish));
});

test('2. action immédiate : Do lucky_strikes actionable', () => {
  const p = view({}, { resources: { [RESOURCE_SP]: 1 } });
  const ev = evaluateNode(graph, p, skillNodeId('lucky_strikes'));
  assert(ev.actionable === true, ev.status);
  const out = planNode(graph, p, skillNodeId('lucky_strikes'));
  assert(out.children.length === 1, formatPlan(out));
  assert(out.children[0].step === STEP.Do, formatPlan(out));
  assert(out.children[0].nodeId === skillNodeId('lucky_strikes'));
  assert(out.children[0].actionable === true);
});

test('3. coût insuffisant : Acquire SP + UnknownStep producer, pas de Do', () => {
  const p = view();
  const out = planNode(graph, p, skillNodeId('lucky_strikes'));
  assert(collect(out, s => s.step === STEP.Acquire && s.resource === RESOURCE_SP).length === 1, formatPlan(out));
  assert(collect(out, s => s.reason === 'no-documented-producer').length >= 1, formatPlan(out));
  assert(!collect(out, s => s.step === STEP.Do).length, formatPlan(out));
});

test('4. dépendance directe : Desert commence par le bateau T1.1', () => {
  const p = view();
  const out = planNode(graph, p, dockId('desert'));
  const boat = collect(out, s =>
    (s.step === STEP.Unlock || s.step === STEP.Do) && s.nodeId === boatT1Id(1));
  assert(boat.length === 1, formatPlan(out));
  assert(collect(out, s => s.step === STEP.Acquire && s.resource === fishResource('golden_trout')).length === 1, formatPlan(out));
});

test('5. dépendance indirecte : poly_system traverse poly_while → … → lucky_strikes', () => {
  const p = view({}, { resources: { [RESOURCE_SP]: 1 } });
  const out = planNode(graph, p, polySystemId);
  assert(collect(out, s => s.step === STEP.Unlock && s.nodeId === skillNodeId('poly_while')).length === 1, formatPlan(out));
  assert(collect(out, s => s.step === STEP.Unlock && s.nodeId === skillNodeId('tons_dmg')).length === 1, formatPlan(out));
  assert(collect(out, s => s.step === STEP.Do && s.nodeId === skillNodeId('lucky_strikes') && s.actionable).length === 1, formatPlan(out));
});

test('6. unknown obligatoire : légendaire trout conserve UnknownStep, pas de Do fantôme', () => {
  const p = view();
  const out = planNode(graph, p, legendaryId('rainbow_trout'));
  assert(collect(out, s => s.reason === 'legendary-poly-cards-lake').length >= 1, formatPlan(out));
  assert(collect(out, s => s.reason === LEGENDARY_CATCH_UNKNOWN).length >= 1, formatPlan(out));
  assert(!collect(out, s => s.step === STEP.Do).length, formatPlan(out));
  assert(out.evaluation.status !== STATUS.available, out.evaluation.status);
});

test('7. Reach OB sans progressor', () => {
  const p = viewOb(20);
  const out = planNode(graph, p, fishingFeatureId);
  assert(collect(out, s => s.step === STEP.Reach && s.stat === STAT_OB && s.min === FISHING_UNLOCK_OB).length === 1, formatPlan(out));
  assert(collect(out, s => s.reason === 'no-documented-progressor').length >= 1, formatPlan(out));
  assert(!collect(out, s => s.step === STEP.Do).length, formatPlan(out));
});

test('8. Acquire SP sans producer', () => {
  const p = view();
  const out = planNode(graph, p, skillNodeId('lucky_strikes'));
  const acq = collect(out, s => s.step === STEP.Acquire && s.resource === RESOURCE_SP);
  assert(acq.length === 1, formatPlan(out));
  assert(acq[0].children.some(c => c.reason === 'no-documented-producer'), formatPlan(out));
});

test('9. plusieurs prérequis : poly_while à OB20 = Reach + parents + Acquire SP', () => {
  const p = viewOb(20);
  const out = planNode(graph, p, skillNodeId('poly_while'));
  assert(collect(out, s => s.step === STEP.Reach && s.stat === STAT_OB && s.min === 26).length === 1, formatPlan(out));
  assert(collect(out, s => s.step === STEP.Unlock && s.nodeId === skillNodeId('tons_dmg')).length === 1, formatPlan(out));
  assert(collect(out, s => s.step === STEP.Acquire && s.resource === RESOURCE_SP).length >= 1, formatPlan(out));
});

test('10. cycle : plan borné, UnknownStep cycle (fx)', () => {
  const out = planNode(fx, { nodes: {}, stats: {}, resources: {} }, 'fx.loop_a');
  assert(collect(out, s => s.reason === 'cycle').length >= 1, formatPlan(out));
  assert(countSteps(out) < 20, countSteps(out));
  assert(graph.cycles.length === 0, JSON.stringify(graph.cycles));
});

test('cross : Tribute eelworm → legendary → desert → boat → Acquire trout, pas de Do(fish)', () => {
  const p = view();
  const out = planNode(graph, p, fishTributeId('dunes_eelworm', 1));
  const dump = formatPlan(out);
  assert(countSteps(out) < 400, countSteps(out));
  assert(collect(out, s => s.step === STEP.Unlock && s.nodeId === legendaryId('dunes_eelworm')).length === 1, dump);
  assert(collect(out, s => (s.step === STEP.Unlock || s.step === STEP.Do) && s.nodeId === boatT1Id(1)).length === 1, dump);
  assert(collect(out, s => s.step === STEP.Acquire && s.resource === fishResource('golden_trout')).length === 1, dump);
  assert(collect(out, s => s.reason === 'no-documented-producer').length >= 1, dump);
  assert(collect(out, s => s.reason === 'legendary-poly-cards-desert').length >= 1, dump);
  assert(collect(out, s => s.reason === LEGENDARY_CATCH_UNKNOWN).length >= 1, dump);
  noInventedFishCatch(out, dump);
});

test('cross : Poly/Infernal → skill tree → Reach n’apparaît pas à OB64 ; Acquire SP + Do racine si SP', () => {
  const p = view({}, { resources: { [RESOURCE_SP]: 1 } });
  const out = planNode(graph, p, polySystemId);
  const dump = formatPlan(out);
  assert(collect(out, s => s.step === STEP.Unlock && s.nodeId === skillNodeId('poly_while')).length === 1, dump);
  assert(collect(out, s => s.step === STEP.Do && s.nodeId === skillNodeId('lucky_strikes') && s.actionable).length === 1, dump);
  assert(collect(out, s => s.step === STEP.Reach && s.stat === STAT_OB).length === 0, dump);
  assert(collect(out, s => s.reason === 'no-documented-producer').length >= 1, dump);
});

test('accès dock ≠ producteur : plan(bateau) n’invente pas Do Golden Trout', () => {
  const p = view();
  const out = planNode(graph, p, boatT1Id(1));
  const dump = formatPlan(out);
  assert(collect(out, s => s.step === STEP.Acquire && s.resource === fishResource('golden_trout')).length === 1, dump);
  assert(collect(out, s => s.reason === 'no-documented-producer').length >= 1, dump);
  noInventedFishCatch(out, dump);
});

test('index producersOf / progressorsOf vides sur le graphe IOM', () => {
  assert(Object.keys(graph.producersOf).length === 0, JSON.stringify(graph.producersOf));
  assert(Object.keys(graph.progressorsOf).length === 0, JSON.stringify(graph.progressorsOf));
});

console.log('\n--- plan fish.tribute.dunes_eelworm.t1 (sample OB64, collections vides) ---');
console.log(formatPlan(planNode(graph, view(), fishTributeId('dunes_eelworm', 1))));

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exitCode = 1;
