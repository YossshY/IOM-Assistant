/**
 * Étape I — ExportStats + collections → PlayerView.
 * node src/game/progress/fromExport.test.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseExportStats, deriveProfile } from '../statsParser.js';
import {
  STATUS, KIND,
  evaluateNode, evaluateCondition, playerViewFromExport, playerView,
  buildProgressGraph, STAT_OB, RESOURCE_SP,
  skillNodeId, polySystemId, cardRankStat,
  monumentId, researchVeinId,
  dockId, boatT1Id, boatT2Id, STARTER_DOCK,
  legendaryId, fishTributeId, tributeId,
  BOAT_UPGRADE_T1, BOAT_UPGRADE_T2,
} from './index.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const raw = readFileSync(join(root, 'samples/exportstats-v2.2.6.json'), 'utf8');
const parsed = parseExportStats(raw);
const profile = deriveProfile(parsed);
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

function view(col = {}) {
  return playerViewFromExport({ parsed, profile, collections: col });
}

console.log('export → PlayerView');

test('sample parse OK (prérequis I)', () => {
  assert(parsed.ok, parsed.error);
  assert(profile.obeliskLevel === 64, String(profile.obeliskLevel));
  assert(profile.maxWorld === 3, String(profile.maxWorld));
  assert(profile.w4Open === false);
  assert((parsed.stats.fishing_rod_power ?? 0) > 0, 'sample has fishing stats');
});

test('OB depuis xp_level_cap ; ressources vides', () => {
  const p = view();
  assert(p.stats[STAT_OB] === 64, JSON.stringify(p.stats));
  assert(Object.keys(p.resources).length === 0, JSON.stringify(p.resources));
});

test('fishing_rod_power n’ouvre aucun bateau / dock hors Lake', () => {
  const p = view();
  assert(p.nodes[dockId(STARTER_DOCK)] === 1, 'Lake via OB37');
  assert(!p.nodes[boatT1Id(1)], 'no T1 boat');
  assert(!p.nodes[dockId('desert')]);
  assert(!p.nodes[boatT2Id(1)]);
  const desert = evaluateNode(graph, p, dockId('desert'));
  assert(desert.status === STATUS.locked, desert.status);
});

test('toggle UI dock sans bateau : Desert reste locked', () => {
  const p = view({ fishing: { docks: { desert: true, galaxy: true } } });
  assert(!p.nodes[dockId('desert')]);
  assert(!p.nodes[dockId('galaxy')]);
  assert(evaluateNode(graph, p, dockId('desert')).status === STATUS.locked);
});

test('u1_boat=2 → T1.1 + T1.2 et docks Desert/Tundra (derived)', () => {
  const p = view({ fishing: { upgrades: { [BOAT_UPGRADE_T1]: 2 } } });
  assert(p.nodes[boatT1Id(1)] === 1);
  assert(p.nodes[boatT1Id(2)] === 1);
  assert(!p.nodes[boatT1Id(3)]);
  assert(p.nodes[dockId('desert')] === 1);
  assert(p.nodes[dockId('tundra')] === 1);
  assert(!p.nodes[dockId('ocean')]);
  assert(evaluateNode(graph, p, dockId('desert')).status === STATUS.unlocked);
  assert(evaluateNode(graph, p, dockId('tundra')).status === STATUS.unlocked);
  assert(evaluateNode(graph, p, dockId('ocean')).status === STATUS.locked);
});

test('u2_boat=2 → Cave + Volcano, pas Galaxy', () => {
  const p = view({ fishing: { upgrades: { [BOAT_UPGRADE_T2]: 2 } } });
  assert(p.nodes[boatT2Id(1)] === 1);
  assert(p.nodes[boatT2Id(2)] === 1);
  assert(p.nodes[dockId('cave')] === 1);
  assert(p.nodes[dockId('volcano')] === 1);
  assert(!p.nodes[dockId('galaxy')]);
});

test('skills renseignés → nœuds ; absent = non possédé', () => {
  const empty = view();
  assert(!empty.nodes[skillNodeId('poly_while')]);
  const p = view({ skills: { poly_while: 1, lucky_strikes: true } });
  assert(p.nodes[skillNodeId('poly_while')] === 1);
  assert(p.nodes[skillNodeId('lucky_strikes')] === 1);
  assert(evaluateNode(graph, p, polySystemId).status === STATUS.unlocked);
});

test('cartes renseignées → stats card.* ; clé absente = unknown', () => {
  const p = view({ cards: { fish_radioactive_slug: 2 } });
  assert(p.stats[cardRankStat('fish_radioactive_slug')] === 2);
  assert(!Object.prototype.hasOwnProperty.call(p.stats, cardRankStat('ore_tin')));
  const missing = evaluateCondition(graph, p, { type: 'stat', id: cardRankStat('ore_tin'), min: 1 });
  assert(missing.truth === 'unknown', missing.truth);
  const gilded = evaluateCondition(graph, p, { type: 'stat', id: cardRankStat('fish_radioactive_slug'), min: 2 });
  assert(gilded.truth === 'true', gilded.truth);
});

test('légendaire lv 0 / 1 / 2 (pas d’état catch-sans-tribut)', () => {
  const z = view({ fishing: { legendary: { laviathan: 0, rainbow_trout: 1 } } });
  assert(!z.nodes[legendaryId('laviathan')]);
  assert(z.nodes[legendaryId('rainbow_trout')] === 1);
  assert(z.nodes[fishTributeId('rainbow_trout', 1)] === 1);
  assert(!z.nodes[fishTributeId('rainbow_trout', 2)]);
  const two = view({ fishing: { legendary: { laviathan: 2 } } });
  assert(two.nodes[legendaryId('laviathan')] === 1);
  assert(two.nodes[tributeId(1)] === 1);
  assert(two.nodes[tributeId(2)] === 1);
});

test('research unlock → research.vein.* ; spawn 2× ignoré', () => {
  const p = view({ research: { unlock: { stone: true, magma: true }, spawn: { stone: true } } });
  assert(p.nodes[researchVeinId('stone')] === 1);
  assert(p.nodes[researchVeinId('magma')] === 1);
  assert(!p.nodes[researchVeinId('virtual')]);
});

test('monuments depuis inférence export, pas le toggle UI', () => {
  const p = view({ monuments: { 4: true } });
  assert(p.nodes[monumentId(2)] === 1, 'W2 inferred');
  assert(p.nodes[monumentId(3)] === 1, 'W3 inferred');
  assert(!p.nodes[monumentId(4)], 'W4 not inferred; UI toggle ignored');
  assert(evaluateNode(graph, p, monumentId(2)).status === STATUS.unlocked);
});

test('fishing.feature unlocked à OB64 ; tribute trout locked sans catch', () => {
  const p = view();
  assert(evaluateNode(graph, p, 'fishing.feature').status === STATUS.unlocked);
  const trout = evaluateNode(graph, p, legendaryId('rainbow_trout'));
  assert(trout.status === STATUS.incomplete, trout.status);
  assert(evaluateNode(graph, p, fishTributeId('rainbow_trout', 1)).status === STATUS.locked);
});

test('lv≥1 : T1 unlocked ; T2 available pas actionable', () => {
  const p = view({ fishing: { legendary: { rainbow_trout: 1 } } });
  assert(evaluateNode(graph, p, fishTributeId('rainbow_trout', 1)).status === STATUS.unlocked);
  const t2 = evaluateNode(graph, p, fishTributeId('rainbow_trout', 2));
  assert(t2.status === STATUS.available, t2.status);
  assert(t2.actionable === false);
});

test('bateau T1.1 à OB64 sans poisson : available pas actionable', () => {
  const p = view();
  const ev = evaluateNode(graph, p, boatT1Id(1));
  assert(ev.status === STATUS.available, ev.status);
  assert(ev.actionable === false);
});

test('pas de nœud notice / enhance inventé depuis collections', () => {
  const p = view({
    fishing: { notice: { n1_gold_floor: 40 }, enhance: { e1_rod: 20 }, upgrades: { u1_rod: 60 } },
  });
  assert(!Object.keys(p.nodes).some(id => /notice|enhance|u1_rod/.test(id)), JSON.stringify(p.nodes));
});

test('profile omis : deriveProfile(parsed)', () => {
  const p = playerViewFromExport({ parsed, collections: {} });
  assert(p.stats[STAT_OB] === 64);
});

test('SP absent : lucky_strikes available pas actionable (OB64, racine)', () => {
  const p = view();
  const ev = evaluateNode(graph, p, skillNodeId('lucky_strikes'));
  assert(ev.status === STATUS.available, ev.status);
  assert(ev.actionable === false);
  assert(ev.kind === KIND.action);
  const withSp = playerView({ ...p, resources: { [RESOURCE_SP]: 1 } });
  assert(evaluateNode(graph, withSp, skillNodeId('lucky_strikes')).actionable === true);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exitCode = 1;
