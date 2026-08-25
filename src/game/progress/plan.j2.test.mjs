/**
 * J2 — état virtuel (coûts des Do) + dédup Reach/Acquire globale.
 * ANY inchangé (toutes les branches, pas de commit). Pas d’UI.
 * node src/game/progress/plan.j2.test.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseExportStats, deriveProfile } from '../statsParser.js';
import {
  STATUS, STEP, KIND,
  all, any, node, stat,
  compileGraph, playerView, playerViewFromExport, plan, planNode, walkPlan,
  buildProgressGraph, STAT_OB, RESOURCE_SP,
  skillNodeId, fishResource,
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

console.log('J2 virtual state + dedup');

test('1. SP=2 : Do lucky_strikes puis Do bigger_blasts (conso virtuelle)', () => {
  const p = viewIom({ resources: { [RESOURCE_SP]: 2 } });
  const out = planNode(iom, p, skillNodeId('bigger_blasts'));
  const dump = formatPlan(out);
  const lucky = collect(out, s => s.step === STEP.Do && s.nodeId === skillNodeId('lucky_strikes') && s.actionable);
  const bigger = collect(out, s => s.step === STEP.Do && s.nodeId === skillNodeId('bigger_blasts') && s.actionable);
  assert(lucky.length === 1, dump);
  assert(bigger.length === 1, dump);
});

test('2. SP=2 : pas de 3e Do swing_harder ; Acquire + UnknownStep', () => {
  const p = viewIom({ resources: { [RESOURCE_SP]: 2 } });
  const out = planNode(iom, p, skillNodeId('swing_harder'));
  const dump = formatPlan(out);
  assert(collect(out, s => s.step === STEP.Do && s.nodeId === skillNodeId('lucky_strikes')).length === 1, dump);
  assert(collect(out, s => s.step === STEP.Do && s.nodeId === skillNodeId('bigger_blasts')).length === 1, dump);
  assert(!collect(out, s => s.step === STEP.Do && s.nodeId === skillNodeId('swing_harder')).length, dump);
  assert(collect(out, s => s.step === STEP.Acquire && s.resource === RESOURCE_SP).length === 1, dump);
  assert(collect(out, s => s.reason === 'no-documented-producer').length >= 1, dump);
});

test('3. PlayerView immuable', () => {
  const p = viewIom({ resources: { [RESOURCE_SP]: 2 } });
  const before = JSON.stringify(p);
  planNode(iom, p, skillNodeId('swing_harder'));
  assert(JSON.stringify(p) === before, 'PlayerView mutated');
});

test('4. conso fish.golden_trout virtuelle (15 → 2e Do impossible)', () => {
  const g = compileGraph([
    { id: 'fx.gt_a', name: 'A', kind: KIND.action, cost: { resource: fishResource('golden_trout'), amount: 10 } },
    { id: 'fx.gt_b', name: 'B', kind: KIND.action, cost: { resource: fishResource('golden_trout'), amount: 10 } },
    { id: 'fx.gt_both', name: 'Both', kind: KIND.action, unlock: all(node('fx.gt_a'), node('fx.gt_b')) },
  ]);
  const p = playerView({ resources: { [fishResource('golden_trout')]: 15 } });
  const out = planNode(g, p, 'fx.gt_both');
  const dump = formatPlan(out);
  assert(collect(out, s => s.step === STEP.Do && s.nodeId === 'fx.gt_a').length === 1, dump);
  assert(!collect(out, s => s.step === STEP.Do && s.nodeId === 'fx.gt_b').length, dump);
  const acq = collect(out, s => s.step === STEP.Acquire && s.resource === fishResource('golden_trout'));
  assert(acq.length === 1, dump);
  assert(acq[0].have === 5, `have=${acq[0].have} ${dump}`);
  assert(collect(out, s => s.reason === 'no-documented-producer').length >= 1, dump);
  assert(JSON.stringify(p.resources) === JSON.stringify({ [fishResource('golden_trout')]: 15 }));
});

test('5. dédup Reach(ob, 64) sur deux branches', () => {
  const g = compileGraph([
    { id: 'fx.ob_a', name: 'A', kind: KIND.action, unlock: stat(STAT_OB, 64) },
    { id: 'fx.ob_b', name: 'B', kind: KIND.action, unlock: stat(STAT_OB, 64) },
    { id: 'fx.ob_both', name: 'Both', kind: KIND.action, unlock: all(node('fx.ob_a'), node('fx.ob_b')) },
  ]);
  const p = playerView({ stats: { [STAT_OB]: 20 } });
  const out = planNode(g, p, 'fx.ob_both');
  const reach = collect(out, s => s.step === STEP.Reach && s.stat === STAT_OB && s.min === 64);
  assert(reach.length === 1, formatPlan(out));
});

test('6. dédup Acquire(sp, 40) sur deux branches', () => {
  const g = compileGraph([
    { id: 'fx.sp_a', name: 'A', kind: KIND.action, cost: { resource: RESOURCE_SP, amount: 40 } },
    { id: 'fx.sp_b', name: 'B', kind: KIND.action, cost: { resource: RESOURCE_SP, amount: 40 } },
    { id: 'fx.sp_both', name: 'Both', kind: KIND.action, unlock: all(node('fx.sp_a'), node('fx.sp_b')) },
  ]);
  const p = playerView({ resources: { [RESOURCE_SP]: 0 } });
  const out = planNode(g, p, 'fx.sp_both');
  const acq = collect(out, s => s.step === STEP.Acquire && s.resource === RESOURCE_SP && s.min === 40);
  assert(acq.length === 1, formatPlan(out));
});

test('7. deux Do différents au même coût restent deux Do', () => {
  const p = viewIom({ resources: { [RESOURCE_SP]: 3 } });
  const out = plan(iom, p, {
    id: 'two-leaves',
    condition: all(node(skillNodeId('bigger_blasts')), node(skillNodeId('ore_efficiency'))),
  });
  const dump = formatPlan(out);
  assert(collect(out, s => s.step === STEP.Do && s.nodeId === skillNodeId('bigger_blasts')).length === 1, dump);
  assert(collect(out, s => s.step === STEP.Do && s.nodeId === skillNodeId('ore_efficiency')).length === 1, dump);
  assert(collect(out, s => s.step === STEP.Do && s.nodeId === skillNodeId('lucky_strikes')).length === 1, dump);
});

test('8. ANY développe toujours les deux branches', () => {
  const g = compileGraph([
    { id: 'fx.any_a', name: 'A', kind: KIND.action, cost: { resource: 'token', amount: 1 } },
    { id: 'fx.any_b', name: 'B', kind: KIND.action, cost: { resource: 'token', amount: 1 } },
    { id: 'fx.any_g', name: 'G', kind: KIND.action, unlock: any(node('fx.any_a'), node('fx.any_b')) },
  ]);
  const p = playerView({ resources: { token: 0 } });
  const out = planNode(g, p, 'fx.any_g');
  const dump = formatPlan(out);
  assert(collect(out, s => s.nodeId === 'fx.any_a').length >= 1, dump);
  assert(collect(out, s => s.nodeId === 'fx.any_b').length >= 1, dump);
});

test('9. cycle toujours borné', () => {
  const out = planNode(fx, playerView({}), 'fx.loop_a');
  assert(collect(out, s => s.reason === 'cycle').length >= 1, formatPlan(out));
  assert(countSteps(out) < 20, countSteps(out));
});

test('évaluation du goal reste sur le PlayerView réel, pas le virtuel', () => {
  const p = viewIom({ resources: { [RESOURCE_SP]: 2 } });
  const out = planNode(iom, p, skillNodeId('bigger_blasts'));
  assert(out.evaluation.status !== STATUS.unlocked, out.evaluation.status);
  assert(p.resources[RESOURCE_SP] === 2);
});

console.log('\n--- plan bigger_blasts SP=2 ---');
console.log(formatPlan(planNode(iom, viewIom({ resources: { [RESOURCE_SP]: 2 } }), skillNodeId('bigger_blasts'))));
console.log('\n--- plan swing_harder SP=2 ---');
console.log(formatPlan(planNode(iom, viewIom({ resources: { [RESOURCE_SP]: 2 } }), skillNodeId('swing_harder'))));

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exitCode = 1;
