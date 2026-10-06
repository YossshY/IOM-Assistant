/**
 * J3 — choix d’une branche any.
 * Pas d’optimisation farm, pas d’UI, pas de producteurs inventés.
 * node src/game/progress/plan.j3.test.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseExportStats, deriveProfile } from '../statsParser.js';
import {
  STEP, KIND,
  all, any, node, stat, unknown,
  compileGraph, playerView, playerViewFromExport, plan, planNode, walkPlan,
  buildProgressGraph, RESOURCE_SP,
  skillNodeId,
} from './index.js';
import { fxCoreGraph } from './fixtures.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const raw = readFileSync(join(root, 'samples/exportstats-v2.2.6.json'), 'utf8');
const parsed = parseExportStats(raw);
const profile = deriveProfile(parsed);
const iom = buildProgressGraph();
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
    const bits = [s.step, s.nodeId || '', s.stat ? `${s.stat}>=${s.min}` : '', s.resource ? `${s.resource}>=${s.min}` : '', s.have != null ? `have:${s.have}` : '', s.reason || '', s.status, s.actionable ? 'actionable' : ''];
    lines.push(ind + bits.filter(Boolean).join(' '));
    for (const c of s.children || []) dump(c, ind + '  ');
  };
  for (const c of p.children || []) dump(c, '');
  return lines.join('\n');
}

function viewIom(extra = {}) {
  const p = playerViewFromExport({ parsed, profile, collections: extra.collections || {} });
  return {
    nodes: { ...p.nodes, ...(extra.nodes || {}) },
    stats: { ...p.stats, ...(extra.stats || {}) },
    resources: { ...p.resources, ...(extra.resources || {}) },
  };
}

console.log('J3 any-branch choice');

test('1. any(A,B) known, token=0 → 1re branche seulement', () => {
  const g = compileGraph([
    { id: 'fx.any_a', name: 'A', kind: KIND.action, cost: { resource: 'token', amount: 1 } },
    { id: 'fx.any_b', name: 'B', kind: KIND.action, cost: { resource: 'token', amount: 1 } },
    { id: 'fx.any_g', name: 'G', kind: KIND.action, unlock: any(node('fx.any_a'), node('fx.any_b')) },
  ]);
  const p = playerView({ resources: { token: 0 } });
  const out = planNode(g, p, 'fx.any_g');
  const dump = formatPlan(out);
  assert(collect(out, s => s.nodeId === 'fx.any_a').length >= 1, dump);
  assert(!collect(out, s => s.nodeId === 'fx.any_b').length, dump);
});

test('2. token assez pour A → Do A, pas B', () => {
  const g = compileGraph([
    { id: 'fx.any_a', name: 'A', kind: KIND.action, cost: { resource: 'token', amount: 1 } },
    { id: 'fx.any_b', name: 'B', kind: KIND.action, cost: { resource: 'token', amount: 1 } },
    { id: 'fx.any_g', name: 'G', kind: KIND.action, unlock: any(node('fx.any_a'), node('fx.any_b')) },
  ]);
  const p = playerView({ resources: { token: 1 } });
  const out = planNode(g, p, 'fx.any_g');
  const dump = formatPlan(out);
  assert(collect(out, s => s.step === STEP.Do && s.nodeId === 'fx.any_a' && s.actionable).length === 1, dump);
  assert(!collect(out, s => s.nodeId === 'fx.any_b').length, dump);
});

test('3. any(node, unknown) → plan known + UnknownStep, pas de Do inventé', () => {
  const out = planNode(fx, playerView({ resources: { token: 0 } }), 'fx.or_gap');
  const dump = formatPlan(out);
  assert(collect(out, s => s.nodeId === 'fx.alpha').length >= 1, dump);
  assert(collect(out, s => s.reason === 'maybe-other-branch').length >= 1, dump);
  assert(!collect(out, s => s.step === STEP.Do && s.nodeId && s.nodeId !== 'fx.alpha' && s.nodeId !== 'fx.or_gap').length, dump);
});

test('4. ANY déjà vrai → enfants vides', () => {
  const p = playerView({ nodes: { 'fx.alpha': 1 }, resources: { token: 0 } });
  const out = plan(fx, p, { id: 'any-done', condition: any(node('fx.alpha'), node('fx.beta')) });
  assert(out.children.length === 0, formatPlan(out));
});

test('5. toutes les branches unknown → UnknownStep, pas de Do', () => {
  const g = compileGraph([
    { id: 'fx.u_g', name: 'U', kind: KIND.action, unlock: any(unknown('gap-a'), unknown('gap-b')) },
  ]);
  const out = planNode(g, playerView({}), 'fx.u_g');
  const dump = formatPlan(out);
  assert(collect(out, s => s.reason === 'gap-a').length >= 1, dump);
  assert(collect(out, s => s.reason === 'gap-b').length >= 1, dump);
  assert(!collect(out, s => s.step === STEP.Do).length, dump);
});

test('6. préfère un Do actionable à un sibling locked', () => {
  const g = compileGraph([
    { id: 'fx.j3_locked', name: 'Locked', kind: KIND.action, unlock: stat('power', 99) },
    { id: 'fx.j3_ready', name: 'Ready', kind: KIND.action },
    { id: 'fx.j3_g', name: 'G', kind: KIND.action, unlock: any(node('fx.j3_locked'), node('fx.j3_ready')) },
  ]);
  const p = playerView({ stats: { power: 0 } });
  const out = planNode(g, p, 'fx.j3_g');
  const dump = formatPlan(out);
  assert(collect(out, s => s.step === STEP.Do && s.nodeId === 'fx.j3_ready' && s.actionable).length === 1, dump);
  assert(!collect(out, s => s.nodeId === 'fx.j3_locked').length, dump);
});

test('7. PlayerView immuable', () => {
  const p = playerView({ resources: { token: 1 } });
  const before = JSON.stringify(p);
  planNode(fx, p, 'fx.either');
  assert(JSON.stringify(p) === before, 'PlayerView mutated');
});

test('8. cycle toujours borné', () => {
  const out = planNode(fx, playerView({}), 'fx.loop_a');
  assert(collect(out, s => s.reason === 'cycle').length >= 1, formatPlan(out));
  assert(countSteps(out) < 20, countSteps(out));
});

test('9. J2 all : conso SP séquentielle inchangée', () => {
  const p = viewIom({ resources: { [RESOURCE_SP]: 2 } });
  const out = planNode(iom, p, skillNodeId('bigger_blasts'));
  const dump = formatPlan(out);
  assert(collect(out, s => s.step === STEP.Do && s.nodeId === skillNodeId('lucky_strikes') && s.actionable).length === 1, dump);
  assert(collect(out, s => s.step === STEP.Do && s.nodeId === skillNodeId('bigger_blasts') && s.actionable).length === 1, dump);
});

test('10. commit : any consomme, la suite all voit le stock virtuel', () => {
  const g = compileGraph([
    { id: 'fx.j3_a', name: 'A', kind: KIND.action, cost: { resource: 'token', amount: 1 } },
    { id: 'fx.j3_b', name: 'B', kind: KIND.action, cost: { resource: 'token', amount: 1 } },
    { id: 'fx.j3_c', name: 'C', kind: KIND.action, cost: { resource: 'token', amount: 1 } },
    { id: 'fx.j3_seq', name: 'Seq', kind: KIND.action, unlock: all(any(node('fx.j3_a'), node('fx.j3_b')), node('fx.j3_c')) },
  ]);
  const p = playerView({ resources: { token: 1 } });
  const out = planNode(g, p, 'fx.j3_seq');
  const dump = formatPlan(out);
  assert(collect(out, s => s.step === STEP.Do && s.nodeId === 'fx.j3_a').length === 1, dump);
  assert(!collect(out, s => s.nodeId === 'fx.j3_b').length, dump);
  assert(!collect(out, s => s.step === STEP.Do && s.nodeId === 'fx.j3_c').length, dump);
  const acq = collect(out, s => s.step === STEP.Acquire && s.resource === 'token');
  assert(acq.length === 1, dump);
  assert(acq[0].have === 0, `have=${acq[0].have} ${dump}`);
});

test('11. pas le chemin le moins cher (pas d’optimisation farm)', () => {
  const g = compileGraph([
    { id: 'fx.j3_dear', name: 'Dear', kind: KIND.action, cost: { resource: 'token', amount: 5 } },
    { id: 'fx.j3_cheap', name: 'Cheap', kind: KIND.action, cost: { resource: 'token', amount: 1 } },
    { id: 'fx.j3_g', name: 'G', kind: KIND.action, unlock: any(node('fx.j3_dear'), node('fx.j3_cheap')) },
  ]);
  const p = playerView({ resources: { token: 10 } });
  const out = planNode(g, p, 'fx.j3_g');
  const dump = formatPlan(out);
  assert(collect(out, s => s.step === STEP.Do && s.nodeId === 'fx.j3_dear').length === 1, dump);
  assert(!collect(out, s => s.nodeId === 'fx.j3_cheap').length, dump);
});

test('12. or_gap token=1 : Do alpha + alternative unknown, pas de Do inventé', () => {
  const out = planNode(fx, playerView({ resources: { token: 1 } }), 'fx.or_gap');
  const dump = formatPlan(out);
  assert(collect(out, s => s.step === STEP.Do && s.nodeId === 'fx.alpha').length === 1, dump);
  assert(collect(out, s => s.reason === 'maybe-other-branch').length >= 1, dump);
  const extra = collect(out, s => s.step === STEP.Do && s.nodeId !== 'fx.alpha' && s.nodeId !== 'fx.or_gap');
  assert(!extra.length, dump);
});

test('13. commit any : le parent devient Do, pas un Unlock stale', () => {
  const g = compileGraph([
    { id: 'fx.j3_locked', name: 'Locked', kind: KIND.action, unlock: stat('power', 99) },
    { id: 'fx.j3_ready', name: 'Ready', kind: KIND.action },
    { id: 'fx.j3_g', name: 'G', kind: KIND.action, unlock: any(node('fx.j3_locked'), node('fx.j3_ready')) },
  ]);
  const out = planNode(g, playerView({ stats: { power: 0 } }), 'fx.j3_g');
  const dump = formatPlan(out);
  assert(collect(out, s => s.step === STEP.Do && s.nodeId === 'fx.j3_ready' && s.actionable).length === 1, dump);
  assert(collect(out, s => s.step === STEP.Do && s.nodeId === 'fx.j3_g' && s.actionable).length === 1, dump);
  assert(!collect(out, s => s.step === STEP.Unlock && s.nodeId === 'fx.j3_g').length, dump);
});

console.log('\n--- fx.or_gap token=0 ---');
console.log(formatPlan(planNode(fx, playerView({ resources: { token: 0 } }), 'fx.or_gap')));
console.log('\n--- any locked vs ready ---');
console.log(formatPlan(planNode(compileGraph([
  { id: 'fx.j3_locked', name: 'Locked', kind: KIND.action, unlock: stat('power', 99) },
  { id: 'fx.j3_ready', name: 'Ready', kind: KIND.action },
  { id: 'fx.j3_g', name: 'G', kind: KIND.action, unlock: any(node('fx.j3_locked'), node('fx.j3_ready')) },
]), playerView({ stats: { power: 0 } }), 'fx.j3_g')));

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exitCode = 1;
