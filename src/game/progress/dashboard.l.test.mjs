/**
 * L — bascule graphe : vue d’ensemble (ordre source, pas de ranking).
 * Reco actuelle non modifiée. Pas de Do inventé.
 * node src/game/progress/dashboard.l.test.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseExportStats, deriveProfile } from '../statsParser.js';
import { STATUS, RESOURCE_SP, skillNodeId, fishingFeatureId, fishResource } from './index.js';
import { ACTIONABLE_NOW, STATUS_PHRASE } from './phrases.js';
import { DASHBOARD_GOALS, progressOverview } from './dashboard.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const raw = readFileSync(join(root, 'samples/exportstats-v2.2.6.json'), 'utf8');
const parsed = parseExportStats(raw);
const profile = deriveProfile(parsed);

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function test(name, fn) {
  try { fn(); passed++; console.log(`  ok  ${name}`); }
  catch (err) { failed++; console.log(`  FAIL ${name}\n       ${err.message}`); }
}

console.log('L progress overview (bascule)');

test('1. un row par objectif, ordre source', () => {
  const rows = progressOverview({ parsed, profile, collections: {} });
  assert(rows.length === DASHBOARD_GOALS.length, rows.length);
  assert(rows.every((r, i) => r.goal.id === DASHBOARD_GOALS[i].id), rows.map(r => r.goal.id).join(','));
});

test('2. sample : lucky_strikes available, pas maintenant', () => {
  const row = progressOverview({ parsed, profile, collections: {} }).find(r => r.goal.id === skillNodeId('lucky_strikes'));
  assert(row.evaluation.status === STATUS.available, row.evaluation.status);
  assert(row.evaluation.actionable === false);
  assert(row.evaluation.nowPhrase == null);
  assert(row.actionable.length === 0, JSON.stringify(row.actionable));
});

test('3. sample : poly_while locked, Il manque Tons Of Damage', () => {
  const row = progressOverview({ parsed, profile, collections: {} }).find(r => r.goal.id === skillNodeId('poly_while'));
  assert(row.evaluation.status === STATUS.locked, row.evaluation.status);
  assert(row.evaluation.phrase.includes('Tons Of Damage'), row.evaluation.phrase);
  assert(row.actionable.length === 0, JSON.stringify(row.actionable));
});

test('4. sample : fishing unlocked', () => {
  const row = progressOverview({ parsed, profile, collections: {} }).find(r => r.goal.id === fishingFeatureId);
  assert(row.evaluation.status === STATUS.unlocked, row.evaluation.status);
  assert(row.evaluation.phrase === STATUS_PHRASE[STATUS.unlocked]);
});

test('5. 1 SP : Do lucky_strikes actionable, pas de ranking extra', () => {
  const rows = progressOverview({ parsed, profile, collections: {}, resources: { [RESOURCE_SP]: 1 } });
  const lucky = rows.find(r => r.goal.id === skillNodeId('lucky_strikes'));
  assert(lucky.evaluation.actionable === true, JSON.stringify(lucky.evaluation));
  assert(lucky.evaluation.nowPhrase === ACTIONABLE_NOW);
  assert(lucky.actionable.length === 1 && lucky.actionable[0].nodeId === skillNodeId('lucky_strikes'), JSON.stringify(lucky.actionable));
});

test('6. pas de Do poisson inventé', () => {
  const rows = progressOverview({ parsed, profile, collections: {}, resources: { [RESOURCE_SP]: 1 } });
  const trout = fishResource('golden_trout');
  const bad = rows.some(r => r.actionable.some(d => d.nodeId === trout));
  assert(!bad, JSON.stringify(rows.map(r => r.actionable)));
});

test('7. PlayerView export non requis pour l’ordre (pas de ranking farm)', () => {
  const a = progressOverview({ parsed, profile, collections: {} }).map(r => r.goal.id);
  const b = progressOverview({ parsed, profile, collections: { skills: { lucky_strikes: 1 } } }).map(r => r.goal.id);
  assert(a.join() === b.join(), `${a} vs ${b}`);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exitCode = 1;
