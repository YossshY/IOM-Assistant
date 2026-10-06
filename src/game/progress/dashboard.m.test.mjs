/**
 * M — stocks manuels (SP / gems / golden_trout) via collections.stocks.
 * Pas de overlay resources. Pas de Do poisson inventé.
 * node src/game/progress/dashboard.m.test.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseExportStats, deriveProfile } from '../statsParser.js';
import {
  STATUS, STEP, RESOURCE_SP, RESOURCE_GEMS,
  skillNodeId, boatT1Id, fishResource, MANUAL_STOCKS,
  playerViewFromExport, evaluateNode,
} from './index.js';
import { ACTIONABLE_NOW } from './phrases.js';
import { DASHBOARD_GOALS, getProgressGraph, progressSnapshot, progressOverview } from './dashboard.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const raw = readFileSync(join(root, 'samples/exportstats-v2.2.6.json'), 'utf8');
const parsed = parseExportStats(raw);
const profile = deriveProfile(parsed);
const graph = getProgressGraph();
const trout = fishResource('golden_trout');

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function test(name, fn) {
  try { fn(); passed++; console.log(`  ok  ${name}`); }
  catch (err) { failed++; console.log(`  FAIL ${name}\n       ${err.message}`); }
}

function walkSteps(steps, visit) {
  for (const s of steps || []) {
    visit(s);
    walkSteps(s.children, visit);
  }
}

console.log('M stocks manuels');

test('1. whitelist = sp, gems, fish.golden_trout', () => {
  const ids = MANUAL_STOCKS.map(s => s.id);
  assert(ids.includes(RESOURCE_SP) && ids.includes(RESOURCE_GEMS) && ids.includes(trout), ids.join(','));
  assert(ids.length === 3, ids.join(','));
});

test('2. collections.stocks.sp=1 → Lucky Strikes actionable (pas d’overlay)', () => {
  const col = { stocks: { [RESOURCE_SP]: 1 } };
  const snap = progressSnapshot({ parsed, profile, collections: col, goalId: skillNodeId('lucky_strikes') });
  assert(snap.evaluation.status === STATUS.available, snap.evaluation.status);
  assert(snap.evaluation.actionable === true, JSON.stringify(snap.evaluation));
  assert(snap.evaluation.nowPhrase === ACTIONABLE_NOW);
  const p = playerViewFromExport({ parsed, profile, collections: col });
  assert(p.resources[RESOURCE_SP] === 1, JSON.stringify(p.resources));
});

test('3. 15 golden_trout → bateau T1.1 actionable à OB64', () => {
  const col = { stocks: { [trout]: 15 } };
  const ev = evaluateNode(graph, playerViewFromExport({ parsed, profile, collections: col }), boatT1Id(1));
  assert(ev.status === STATUS.available, ev.status);
  assert(ev.actionable === true, JSON.stringify(ev));
  const desert = DASHBOARD_GOALS.find(g => g.label === 'Desert').id;
  const snap = progressSnapshot({ parsed, profile, collections: col, goalId: desert });
  let boatDo = false;
  walkSteps(snap.steps, s => {
    if (s.step === STEP.Do && s.nodeId === boatT1Id(1) && s.actionable) boatDo = true;
  });
  assert(boatDo, JSON.stringify(snap.steps));
});

test('4. pas de Do golden_trout (pas de producteur)', () => {
  const col = { stocks: { [trout]: 15, [RESOURCE_SP]: 1 } };
  const snap = progressSnapshot({
    parsed, profile, collections: col,
    goalId: DASHBOARD_GOALS.find(g => g.label === 'Desert').id,
  });
  let bad = false;
  walkSteps(snap.steps, s => {
    if (s.step === STEP.Do && s.nodeId === trout) bad = true;
  });
  assert(!bad, JSON.stringify(snap.steps));
  const rows = progressOverview({ parsed, profile, collections: col });
  assert(!rows.some(r => r.actionable.some(d => d.nodeId === trout)), JSON.stringify(rows.map(r => r.actionable)));
});

test('5. overview : SP via collections.stocks, pas overlay resources', () => {
  const rows = progressOverview({ parsed, profile, collections: { stocks: { [RESOURCE_SP]: 1 } } });
  const lucky = rows.find(r => r.goal.id === skillNodeId('lucky_strikes'));
  assert(lucky.evaluation.actionable === true, JSON.stringify(lucky.evaluation));
  assert(lucky.evaluation.nowPhrase === ACTIONABLE_NOW);
  assert(lucky.actionable[0]?.nodeId === skillNodeId('lucky_strikes'), JSON.stringify(lucky.actionable));
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exitCode = 1;
