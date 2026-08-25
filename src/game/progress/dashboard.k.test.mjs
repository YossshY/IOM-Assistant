/**
 * K — phrases §1.1 + snapshot dashboard (evaluate/plan).
 * Reco actuelle non branchée. Pas de Do inventé.
 * node src/game/progress/dashboard.k.test.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseExportStats, deriveProfile } from '../statsParser.js';
import {
  STATUS, STEP, RESOURCE_SP, skillNodeId, legendaryId, fishingFeatureId,
  playerViewFromExport, evaluateNode, fishResource,
} from './index.js';
import {
  STATUS_PHRASE, ACTIONABLE_NOW, describeEvaluation,
} from './phrases.js';
import {
  DASHBOARD_GOALS, DEFAULT_PROGRESS_GOAL, getProgressGraph, progressSnapshot,
} from './dashboard.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const raw = readFileSync(join(root, 'samples/exportstats-v2.2.6.json'), 'utf8');
const parsed = parseExportStats(raw);
const profile = deriveProfile(parsed);
const graph = getProgressGraph();

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function test(name, fn) {
  try { fn(); passed++; console.log(`  ok  ${name}`); }
  catch (err) { failed++; console.log(`  FAIL ${name}\n       ${err.message}`); }
}

function view(col = {}, extra = {}) {
  const p = playerViewFromExport({ parsed, profile, collections: col });
  return {
    nodes: { ...p.nodes, ...(extra.nodes || {}) },
    stats: { ...p.stats, ...(extra.stats || {}) },
    resources: { ...p.resources, ...(extra.resources || {}) },
  };
}

function walkSteps(steps, visit) {
  for (const s of steps || []) {
    visit(s);
    walkSteps(s.children, visit);
  }
}

console.log('K dashboard phrases + snapshot');

test('1. phrases §1.1 exactes', () => {
  assert(STATUS_PHRASE[STATUS.unlocked] === 'Tu as déjà ça.');
  assert(STATUS_PHRASE[STATUS.available] === 'Les prérequis d’accès connus sont remplis.');
  assert(STATUS_PHRASE[STATUS.locked] === 'Il manque X');
  assert(STATUS_PHRASE[STATUS.blocked] === 'Ce n’est plus possible depuis ton état actuel.');
  assert(STATUS_PHRASE[STATUS.incomplete] === 'Les conditions connues sont remplies, mais certains prérequis ne sont pas encore documentés dans l’application.');
  assert(STATUS_PHRASE[STATUS.unknown] === 'L’application ne connaît pas encore cet élément.');
  assert(ACTIONABLE_NOW === 'Tu peux faire cette action maintenant.');
});

test('2. chaque objectif dashboard est dans le graphe', () => {
  for (const g of DASHBOARD_GOALS) {
    assert(graph.nodes[g.id], g.id);
  }
  assert(DEFAULT_PROGRESS_GOAL === skillNodeId('poly_while'));
});

test('3. sample + poly_while : locked, Il manque Tons Of Damage, pas actionable', () => {
  const snap = progressSnapshot({ parsed, profile, collections: {}, goalId: skillNodeId('poly_while') });
  assert(snap.evaluation.status === STATUS.locked, snap.evaluation.status);
  assert(snap.evaluation.actionable === false);
  assert(snap.evaluation.nowPhrase == null);
  assert(snap.evaluation.phrase.startsWith('Il manque '), snap.evaluation.phrase);
  assert(snap.evaluation.phrase.includes('Tons Of Damage'), snap.evaluation.phrase);
});

test('4. sample + lucky_strikes : available, pas « maintenant »', () => {
  const snap = progressSnapshot({ parsed, profile, collections: {}, goalId: skillNodeId('lucky_strikes') });
  assert(snap.evaluation.status === STATUS.available, snap.evaluation.status);
  assert(snap.evaluation.actionable === false);
  assert(snap.evaluation.phrase === STATUS_PHRASE[STATUS.available]);
  assert(snap.evaluation.nowPhrase == null);
});

test('5. lucky_strikes + 1 SP : actionable + phrase maintenant', () => {
  const p = view({}, { resources: { [RESOURCE_SP]: 1 } });
  const ev = evaluateNode(graph, p, skillNodeId('lucky_strikes'));
  const d = describeEvaluation(graph, ev);
  assert(d.actionable === true, JSON.stringify(d));
  assert(d.nowPhrase === ACTIONABLE_NOW);
  assert(d.phrase === STATUS_PHRASE[STATUS.available]);
});

test('6. skill possédé → Tu as déjà ça', () => {
  const snap = progressSnapshot({
    parsed, profile,
    collections: { skills: { lucky_strikes: 1 } },
    goalId: skillNodeId('lucky_strikes'),
  });
  assert(snap.evaluation.status === STATUS.unlocked, snap.evaluation.status);
  assert(snap.evaluation.phrase === STATUS_PHRASE[STATUS.unlocked]);
  assert(snap.steps.length === 0, JSON.stringify(snap.steps));
});

test('7. légendaire trout : incomplete, UnknownStep, pas de Do', () => {
  const snap = progressSnapshot({ parsed, profile, collections: {}, goalId: legendaryId('rainbow_trout') });
  assert(snap.evaluation.status === STATUS.incomplete, snap.evaluation.status);
  assert(snap.evaluation.phrase === STATUS_PHRASE[STATUS.incomplete]);
  assert(snap.evaluation.actionable === false);
  let unknown = 0;
  let dos = 0;
  walkSteps(snap.steps, s => {
    if (s.step === STEP.UnknownStep) unknown++;
    if (s.step === STEP.Do) dos++;
  });
  assert(unknown >= 1, JSON.stringify(snap.steps));
  assert(dos === 0, JSON.stringify(snap.steps));
});

test('8. fishing à OB64 : unlocked', () => {
  const snap = progressSnapshot({ parsed, profile, collections: {}, goalId: fishingFeatureId });
  assert(snap.evaluation.status === STATUS.unlocked, snap.evaluation.status);
  assert(snap.evaluation.phrase === STATUS_PHRASE[STATUS.unlocked]);
});

test('9. pas de Do poisson inventé (desert)', () => {
  const snap = progressSnapshot({ parsed, profile, collections: {}, goalId: DASHBOARD_GOALS.find(g => g.label === 'Desert').id });
  let bad = false;
  walkSteps(snap.steps, s => {
    if (s.step === STEP.Do && s.nodeId === fishResource('golden_trout')) bad = true;
  });
  assert(!bad, JSON.stringify(snap.steps));
});

test('10. goal inconnu → défaut poly_while', () => {
  const snap = progressSnapshot({ parsed, profile, collections: {}, goalId: 'not-a-goal' });
  assert(snap.goal.id === DEFAULT_PROGRESS_GOAL, snap.goal.id);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exitCode = 1;
