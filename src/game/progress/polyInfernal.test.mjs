/**
 * Étape C — Poly / Infernal (gates wiki Cards).
 * node src/game/progress/polyInfernal.test.mjs
 */
import { CARD_SETS } from '../cards.js';
import {
  STATUS, CONFIDENCE, STEP,
  evaluateNode, evaluateCondition, plan, planNode, playerView, walkPlan,
  buildProgressGraph, skillNodeId, STAT_OB, RESOURCE_SP,
  polySystemId, infernalSetId, tributeId, cardsFeatureId, CARDS_FEATURE_OB,
  polychromeCondition, infernalCondition, cardRankStat, polyShardResource,
  infernalShardResource, POLY_SHARD_COUNT, INFERNAL_SET_SOURCES,
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

console.log('poly / infernal fragment');

test('cards.feature : OB15 milestone', () => {
  const low = evaluateNode(graph, playerView({ stats: { [STAT_OB]: 14 } }), cardsFeatureId);
  assert(low.status === STATUS.locked, low.status);
  const ok = evaluateNode(graph, playerView({ stats: { [STAT_OB]: 15 } }), cardsFeatureId);
  assert(ok.status === STATUS.unlocked, ok.status);
  assert(ok.kind === 'milestone');
});

test('poly_system exige skill.poly_while — pas available sans le skill', () => {
  const p = playerView({ stats: { [STAT_OB]: 26 }, resources: { [RESOURCE_SP]: 40 } });
  const ev = evaluateNode(graph, p, polySystemId);
  assert(ev.status === STATUS.locked, ev.status);
  assert(ev.actionable === false);
});

test('poly_system : skill possédé → unlocked', () => {
  const p = playerView({ nodes: { [skillNodeId('poly_while')]: 1 }, stats: { [STAT_OB]: 26 } });
  const ev = evaluateNode(graph, p, polySystemId);
  assert(ev.status === STATUS.unlocked, ev.status);
});

test('plan(poly_system) remonte au skill tree (Do lucky_strikes)', () => {
  const p = playerView({ stats: { [STAT_OB]: 26 }, resources: { [RESOURCE_SP]: 1 } });
  const out = planNode(graph, p, polySystemId);
  const dos = collect(out, s => s.step === STEP.Do && s.nodeId === skillNodeId('lucky_strikes'));
  assert(dos.length === 1, 'expected Do lucky_strikes');
  assert(collect(out, s => s.step === STEP.Unlock && s.nodeId === skillNodeId('poly_while')).length === 1);
});

test('polychrome : gilded + 10 shards + système → condition vraie', () => {
  const key = 'legendary_fish_radioactive_slug';
  const p = playerView({
    nodes: { [skillNodeId('poly_while')]: 1 },
    stats: { [STAT_OB]: 26, [cardRankStat(key)]: 2 },
    resources: { [polyShardResource(key)]: POLY_SHARD_COUNT },
  });
  const ev = evaluateCondition(graph, p, polychromeCondition(key));
  assert(ev.truth === 'true', ev.truth);
});

test('polychrome : pas gilded → Reach/stat locked, pas Do inventé', () => {
  const key = 'ore_tin';
  const p = playerView({
    nodes: { [skillNodeId('poly_while')]: 1 },
    stats: { [STAT_OB]: 26, [cardRankStat(key)]: 1 },
    resources: { [polyShardResource(key)]: 10 },
  });
  const ev = evaluateCondition(graph, p, polychromeCondition(key));
  assert(ev.truth === 'false', ev.truth);
  const out = plan(graph, p, { id: 'poly-tin', condition: polychromeCondition(key) });
  assert(collect(out, s => s.step === STEP.Reach).length >= 1);
  assert(!collect(out, s => s.step === STEP.Do && /tin/i.test(s.nodeId || '')).length);
});

test('infernalCondition : poly rank 3 + shards + set veins', () => {
  const key = 'vein_stone';
  const p = playerView({
    nodes: { [skillNodeId('flaming_veins')]: 1 },
    stats: { [STAT_OB]: 60, [cardRankStat(key)]: 3 },
    resources: { [infernalShardResource(key)]: 10 },
  });
  const ev = evaluateCondition(graph, p, infernalCondition(key, 'veins'));
  assert(ev.truth === 'true', ev.truth);
});

test('infernal veins : flaming_veins possédé → set unlocked (milestone)', () => {
  const p = playerView({ nodes: { [skillNodeId('flaming_veins')]: 1 }, stats: { [STAT_OB]: 60 } });
  const ev = evaluateNode(graph, p, infernalSetId('veins'));
  assert(ev.status === STATUS.unlocked, ev.status);
});

test('infernal stars : sans astral_forge → locked confirmed', () => {
  const p = playerView({ stats: { [STAT_OB]: 60 }, resources: { [RESOURCE_SP]: 99999 } });
  const ev = evaluateNode(graph, p, infernalSetId('stars'));
  assert(ev.status === STATUS.locked, ev.status);
  assert(ev.confidence === CONFIDENCE.confirmed, ev.confidence);
});

test('infernal ores : tribute T1 incomplete (fishing unknown) ; set locked tant que non possédé', () => {
  const p = playerView({ stats: { [STAT_OB]: 60 } });
  const tribute = evaluateNode(graph, p, tributeId(1));
  assert(tribute.status === STATUS.incomplete, tribute.status);
  const ev = evaluateNode(graph, p, infernalSetId('ores'));
  assert(ev.status === STATUS.locked, ev.status);
  assert(ev.actionable === false);
  assert(ev.status !== STATUS.available);
});

test('infernal ores : tribute T1 possédé → set unlocked (inventaire)', () => {
  const p = playerView({ nodes: { [tributeId(1)]: 1 } });
  const ev = evaluateNode(graph, p, infernalSetId('ores'));
  assert(ev.status === STATUS.unlocked, ev.status);
});

test('infernal bombs / arcanist : unknown, jamais available', () => {
  const p = playerView({ stats: { [STAT_OB]: 99 } });
  for (const cat of ['bombs', 'essence', 'runes', 'spells', 'orbs']) {
    const ev = evaluateNode(graph, p, infernalSetId(cat));
    assert(ev.status === STATUS.incomplete || ev.status === STATUS.unknown, `${cat} ${ev.status}`);
    assert(ev.actionable === false);
  }
});

test('infernal pets : scorchwing incomplete ; set locked puis unlocked si possédé', () => {
  const p = playerView({ resources: { gems: 250000 } });
  const skin = evaluateNode(graph, p, 'pets.skin.butterfly.scorchwing');
  assert(skin.status === STATUS.incomplete, skin.status);
  const ev = evaluateNode(graph, p, infernalSetId('pets'));
  assert(ev.status === STATUS.locked, ev.status);
  const owned = evaluateNode(graph, playerView({ nodes: { 'pets.skin.butterfly.scorchwing': 1 } }), infernalSetId('pets'));
  assert(owned.status === STATUS.unlocked, owned.status);
});

test('pas de nœud par carte catalogue (pas une recopie)', () => {
  const cardNodes = Object.keys(graph.nodes).filter(id => id.startsWith('card.') && !id.startsWith('cards.'));
  assert(cardNodes.length === 0, cardNodes.join(','));
});

test('chaque CARD_SETS a un nœud infernal_set', () => {
  for (const s of CARD_SETS) {
    assert(INFERNAL_SET_SOURCES[s.id], `missing source ${s.id}`);
    assert(graph.nodes[infernalSetId(s.id)], `missing set node ${s.id}`);
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exitCode = 1;
