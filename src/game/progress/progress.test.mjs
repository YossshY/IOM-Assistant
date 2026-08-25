/**
 * Tests unitaires du moteur de progression — données fictives fx.* uniquement.
 * node src/game/progress/progress.test.mjs
 */
import {
  STATUS, CONFIDENCE, STEP, KIND,
  all, any, node, stat, resource, unknown,
  compileGraph, evaluateNode, evaluateCondition, playerView, plan, planNode, walkPlan,
} from './index.js';
import { fxCoreGraph, fxMeansGraph } from './fixtures.js';

const g = fxCoreGraph();
const gm = fxMeansGraph();

let passed = 0;
let failed = 0;
const failures = [];

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ok  ${name}`);
  } catch (err) {
    failed++;
    failures.push({ name, err });
    console.log(`  FAIL ${name}`);
    console.log(`       ${err.message}`);
  }
}

function collect(planOrNodes, pred) {
  const found = [];
  const roots = Array.isArray(planOrNodes) ? planOrNodes : (planOrNodes.children || []);
  walkPlan(roots, n => { if (pred(n)) found.push(n); });
  return found;
}

function formatStep(s, indent = '') {
  const bits = [s.step];
  if (s.nodeId) bits.push(s.nodeId);
  if (s.stat) bits.push(`${s.stat}>=${s.min} (have ${s.have})`);
  if (s.resource) bits.push(`${s.resource}>=${s.min} (have ${s.have})`);
  if (s.reason) bits.push(JSON.stringify(s.reason));
  bits.push(`status=${s.status}`, `conf=${s.confidence}`, `actionable=${s.actionable}`);
  const lines = [`${indent}${bits.join(' ')}`];
  for (const c of s.children || []) lines.push(formatStep(c, indent + '  '));
  return lines.join('\n');
}

function formatPlan(p) {
  const ev = p.evaluation || {};
  const head = `goal=${p.goal} eval.status=${ev.status} eval.conf=${ev.confidence} eval.actionable=${ev.actionable}`;
  return [head, ...p.children.map(c => formatStep(c))].join('\n');
}

console.log('progress engine');

test('ALL: unlock faux si une branche manque', () => {
  const p = playerView({ stats: { power: 20 }, resources: { token: 50 } });
  const ev = evaluateNode(g, p, 'fx.gamma');
  assert(ev.status === STATUS.locked, `expected locked, got ${ev.status}`);
  assert(ev.confidence === CONFIDENCE.confirmed, `expected confirmed, got ${ev.confidence}`);
  assert(ev.actionable === false, 'ALL fail must not be actionable');
  assert(ev.unlock.truth === 'false', 'unlock should be false (missing beta)');
});

test('ALL: toutes les branches connues vraies → available', () => {
  const p = playerView({
    nodes: { 'fx.beta': 1, 'fx.alpha': 1 },
    stats: { power: 20 },
    resources: { token: 50 },
  });
  const ev = evaluateNode(g, p, 'fx.gamma');
  assert(ev.status === STATUS.available, `expected available, got ${ev.status}`);
  assert(ev.confidence === CONFIDENCE.confirmed, ev.confidence);
  assert(ev.actionable === true, 'cost met → actionable');
});

test('ANY: une branche suffit', () => {
  const p = playerView({ nodes: { 'fx.alpha': 1 }, resources: { token: 0 } });
  const ev = evaluateNode(g, p, 'fx.either');
  assert(ev.status === STATUS.available, ev.status);
  assert(ev.actionable === true, 'either has no cost');
  assert(ev.confidence === CONFIDENCE.confirmed, ev.confidence);
});

test('ANY: aucune branche → locked', () => {
  const p = playerView({ nodes: {}, resources: { token: 0 } });
  const ev = evaluateNode(g, p, 'fx.either');
  assert(ev.status === STATUS.locked, ev.status);
  assert(ev.actionable === false);
});

test('dépendances indirectes: plan(gamma) contient Do(alpha)', () => {
  const p = playerView({ stats: { power: 20 }, resources: { token: 1 } });
  const out = planNode(g, p, 'fx.gamma');
  const dos = collect(out, s => s.step === STEP.Do && s.nodeId === 'fx.alpha');
  assert(dos.length === 1, `expected Do(fx.alpha), got ${collect(out, s => s.step === STEP.Do).map(s => s.nodeId)}`);
  assert(dos[0].actionable === true, 'alpha should be immediately doable');
  const unlocks = collect(out, s => s.step === STEP.Unlock).map(s => s.nodeId);
  assert(unlocks.includes('fx.gamma'), 'root unlock gamma');
  assert(unlocks.includes('fx.beta'), 'indirect unlock beta');
});

test('données inconnues: incomplete, jamais available/actionable', () => {
  const p = playerView({ stats: { power: 9 }, resources: { token: 1 } });
  const ev = evaluateNode(g, p, 'fx.mystery');
  assert(ev.status === STATUS.incomplete, `expected incomplete, got ${ev.status}`);
  assert(ev.confidence === CONFIDENCE.partial, ev.confidence);
  assert(ev.actionable === false);
  assert(ev.status !== STATUS.available);
});

test('inconnues + condition connue fausse → locked / partial', () => {
  const p = playerView({ stats: { power: 2 }, resources: { token: 1 } });
  const ev = evaluateNode(g, p, 'fx.mystery');
  assert(ev.status === STATUS.locked, ev.status);
  assert(ev.confidence === CONFIDENCE.partial, ev.confidence);
  assert(ev.actionable === false);
});

test('cycle detection à la compilation', () => {
  assert(g.cycles.length >= 1, 'expected at least one cycle');
  const flat = g.cycles.flat();
  assert(flat.includes('fx.loop_a') && flat.includes('fx.loop_b'), JSON.stringify(g.cycles));
});

test('cycle detection au plan: pas de boucle infinie, UnknownStep cycle', () => {
  const p = playerView({});
  const out = planNode(g, p, 'fx.loop_a');
  const cycles = collect(out, s => s.step === STEP.UnknownStep && s.reason === 'cycle');
  assert(cycles.length >= 1, formatPlan(out));
});

test('available mais coût insuffisant', () => {
  const p = playerView({ resources: { token: 3 } });
  const ev = evaluateNode(g, p, 'fx.shop');
  assert(ev.status === STATUS.available, ev.status);
  assert(ev.confidence === CONFIDENCE.confirmed, ev.confidence);
  assert(ev.actionable === false, 'cannot claim doable');
  const out = planNode(g, p, 'fx.shop');
  const acq = collect(out, s => s.step === STEP.Acquire && s.resource === 'token');
  assert(acq.length === 1, formatPlan(out));
  assert(acq[0].min === 100 && acq[0].have === 3, JSON.stringify(acq[0]));
});

test('actionable confirmé', () => {
  const p = playerView({ resources: { token: 1 } });
  const ev = evaluateNode(g, p, 'fx.alpha');
  assert(ev.status === STATUS.available, ev.status);
  assert(ev.confidence === CONFIDENCE.confirmed, ev.confidence);
  assert(ev.actionable === true);
  const out = planNode(g, p, 'fx.alpha');
  assert(out.children.length === 1 && out.children[0].step === STEP.Do, formatPlan(out));
  assert(out.children[0].nodeId === 'fx.alpha');
  assert(out.children[0].actionable === true);
});

test('Reach sans moyen documenté', () => {
  const p = playerView({ stats: { power: 3 } });
  const out = plan(g, p, { id: 'reach-power', condition: stat('power', 10) });
  assert(out.children[0].step === STEP.Reach, formatPlan(out));
  assert(out.children[0].stat === 'power' && out.children[0].min === 10);
  assert(out.children[0].children.some(c => c.reason === 'no-documented-progressor'), formatPlan(out));
  assert(!collect(out, s => s.step === STEP.Do).length, 'must not invent Do(power)');
});

test('Acquire sans producteur documenté', () => {
  const p = playerView({ resources: { relic: 0 } });
  const out = plan(g, p, { id: 'need-relic', condition: resource('relic', 5) });
  assert(out.children[0].step === STEP.Acquire, formatPlan(out));
  assert(out.children[0].resource === 'relic' && out.children[0].min === 5 && out.children[0].have === 0);
  assert(out.children[0].children.some(c => c.reason === 'no-documented-producer'), formatPlan(out));
  assert(!collect(out, s => s.step === STEP.Do).length, 'must not invent a producer action');
});

test('nœud absent du graphe → unknown', () => {
  const ev = evaluateNode(g, playerView({}), 'fx.does-not-exist');
  assert(ev.status === STATUS.unknown, ev.status);
  assert(ev.confidence === CONFIDENCE.unknown, ev.confidence);
  assert(ev.actionable === false);
});

test('déjà possédé → unlocked', () => {
  const ev = evaluateNode(g, playerView({ nodes: { 'fx.alpha': 1 } }), 'fx.alpha');
  assert(ev.status === STATUS.unlocked, ev.status);
  assert(ev.actionable === false);
});

test('node(milestone) suit le seuil, pas player.nodes', () => {
  const g2 = compileGraph([
    { id: 'fx.power_gate', kind: KIND.milestone, unlock: stat('power', 10) },
    { id: 'fx.after_gate', kind: KIND.action, unlock: node('fx.power_gate') },
  ]);
  const ok = evaluateNode(g2, playerView({ stats: { power: 10 } }), 'fx.after_gate');
  assert(ok.status === STATUS.available, ok.status);
  const low = evaluateNode(g2, playerView({ stats: { power: 9 } }), 'fx.after_gate');
  assert(low.status === STATUS.locked, low.status);
});

test('milestone Reach, jamais Do', () => {
  const p = playerView({ stats: { power: 4 } });
  const ev = evaluateNode(g, p, 'fx.power_gate');
  assert(ev.status === STATUS.locked, ev.status);
  assert(ev.kind === KIND.milestone);
  assert(ev.actionable === false);
  const out = planNode(g, p, 'fx.power_gate');
  assert(out.children[0].step === STEP.Reach, formatPlan(out));
  assert(!collect(out, s => s.step === STEP.Do && s.nodeId === 'fx.power_gate').length);
});

test('blockedIf irréversible documenté', () => {
  const p = playerView({ nodes: { 'fx.path_b': 1 } });
  const ev = evaluateNode(g, p, 'fx.path_a');
  assert(ev.status === STATUS.blocked, ev.status);
  assert(ev.actionable === false);
});

test('ANY avec trou optionnel: available + partial, actionable possible', () => {
  const p = playerView({ nodes: { 'fx.alpha': 1 } });
  const ev = evaluateNode(g, p, 'fx.or_gap');
  assert(ev.status === STATUS.available, ev.status);
  assert(ev.confidence === CONFIDENCE.partial, ev.confidence);
  assert(ev.actionable === true, 'known sufficient branch');
  assert(ev.unknownOptional.length >= 1);
});

test('plan fx.gate: Do + Reach + Acquire + Unlock indirect + UnknownStep', () => {
  const p = playerView({ stats: { power: 6 }, resources: { token: 8 } });
  const out = planNode(g, p, 'fx.gate');
  const ev = evaluateNode(g, p, 'fx.gate');
  assert(ev.status === STATUS.locked, ev.status);
  assert(ev.confidence === CONFIDENCE.partial, ev.confidence);
  assert(ev.actionable === false);
  assert(collect(out, s => s.step === STEP.Do && s.nodeId === 'fx.alpha').length === 1, formatPlan(out));
  assert(collect(out, s => s.step === STEP.Reach && s.stat === 'power' && s.min === 10).length === 1, formatPlan(out));
  assert(collect(out, s => s.step === STEP.Acquire && s.resource === 'token' && s.min === 20).length === 1, formatPlan(out));
  assert(collect(out, s => s.step === STEP.Unlock && s.nodeId === 'fx.gamma').length === 1, formatPlan(out));
  assert(collect(out, s => s.step === STEP.UnknownStep && /other-parents/.test(s.reason || '')).length === 1, formatPlan(out));
  const power8 = collect(out, s => s.step === STEP.Reach && s.stat === 'power' && s.min === 8);
  assert(power8.length === 0, `Reach(power,8) should be absorbed:\n${formatPlan(out)}`);
});

test('incomplete à l’objectif: conditions connues OK, parent unknown', () => {
  const p = playerView({
    nodes: { 'fx.alpha': 1, 'fx.beta': 1, 'fx.gamma': 1 },
    stats: { power: 12 },
    resources: { token: 50 },
  });
  const ev = evaluateNode(g, p, 'fx.gate');
  assert(ev.status === STATUS.incomplete, ev.status);
  assert(ev.confidence === CONFIDENCE.partial, ev.confidence);
  assert(ev.actionable === false);
  const out = planNode(g, p, 'fx.gate');
  assert(!collect(out, s => s.step === STEP.Do && s.nodeId === 'fx.gate').length, formatPlan(out));
});

test('index producersOf / progressorsOf vides sur le graphe core', () => {
  assert(Object.keys(g.producersOf).length === 0, JSON.stringify(g.producersOf));
  assert(Object.keys(g.progressorsOf).length === 0, JSON.stringify(g.progressorsOf));
});

test('moyens documentés fictifs: Acquire suit le producer, Reach le progressor', () => {
  const p = playerView({ stats: { power: 1 }, resources: { token: 0 } });
  const acq = plan(gm, p, { id: 'tok', condition: resource('token', 4) });
  assert(collect(acq, s => s.step === STEP.Do && s.nodeId === 'fx.farm').length === 1, formatPlan(acq));
  const rch = plan(gm, p, { id: 'pow', condition: stat('power', 10) });
  assert(collect(rch, s => s.step === STEP.Do && s.nodeId === 'fx.drill').length === 1, formatPlan(rch));
});

test('reverse enabledBy: alpha habilite beta', () => {
  assert((g.enabledBy['fx.alpha'] || []).includes('fx.beta'));
  assert((g.enabledBy['fx.beta'] || []).includes('fx.gamma'));
});

test('evaluateCondition ALL / ANY unitaires', () => {
  const p = playerView({ nodes: { 'fx.alpha': 1 }, stats: { power: 3 } });
  const a = evaluateCondition(g, p, all(node('fx.alpha'), stat('power', 10)));
  assert(a.truth === 'false', a.truth);
  const b = evaluateCondition(g, p, any(node('fx.alpha'), stat('power', 10)));
  assert(b.truth === 'true', b.truth);
  const c = evaluateCondition(g, p, all(node('fx.alpha'), unknown('gap')));
  assert(c.truth === 'unknown', c.truth);
});

test('compile refuse un id dupliqué', () => {
  let threw = false;
  try { compileGraph([{ id: 'fx.x' }, { id: 'fx.x' }]); }
  catch { threw = true; }
  assert(threw, 'expected duplicate id error');
});

console.log('\nexemples de sorties\n');

const demoPlayer = playerView({ stats: { power: 6 }, resources: { token: 8 } });
console.log('--- evaluate fx.shop (coût insuffisant) ---');
console.log(JSON.stringify(evaluateNode(g, demoPlayer, 'fx.shop'), null, 2));
console.log('\n--- evaluate fx.alpha (actionable) ---');
console.log(JSON.stringify(evaluateNode(g, playerView({ resources: { token: 1 } }), 'fx.alpha'), null, 2));
console.log('\n--- evaluate fx.mystery (incomplete) ---');
console.log(JSON.stringify(evaluateNode(g, playerView({ stats: { power: 9 }, resources: { token: 1 } }), 'fx.mystery'), null, 2));
console.log('\n--- plan fx.gate ---');
console.log(formatPlan(planNode(g, demoPlayer, 'fx.gate')));
console.log('\n--- plan Reach(power,10) sans progressor ---');
console.log(formatPlan(plan(g, demoPlayer, { id: 'reach', condition: stat('power', 10) })));
console.log('\n--- plan Acquire(relic,5) sans producer ---');
console.log(formatPlan(plan(g, demoPlayer, { id: 'acq', condition: resource('relic', 5) })));

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) {
  process.exitCode = 1;
}
