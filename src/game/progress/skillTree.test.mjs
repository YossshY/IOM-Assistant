/**
 * Étape B — fragment Skill Tree parents (données wiki, pas fx.*).
 * node src/game/progress/skillTree.test.mjs
 */
import { SKILL_NODES } from '../skillsData.js';
import {
  STATUS, CONFIDENCE, STEP,
  evaluateNode, planNode, playerView, walkPlan,
  buildProgressGraph, skillNodeId, skillTreeParentMap,
  STAT_OB, RESOURCE_SP, SKILL_TREE_UNLOCK_OB,
} from './index.js';

const graph = buildProgressGraph();
const parents = skillTreeParentMap();
const byId = Object.fromEntries(SKILL_NODES.map(s => [s.id, s]));

let passed = 0;
let failed = 0;

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
    console.log(`  FAIL ${name}`);
    console.log(`       ${err.message}`);
  }
}

function collect(plan, pred) {
  const found = [];
  walkPlan(plan.children || [], n => { if (pred(n)) found.push(n); });
  return found;
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

function unlockOb(id) {
  if (id === 'lucky_strikes') return SKILL_TREE_UNLOCK_OB;
  return byId[id]?.unlockOb ?? SKILL_TREE_UNLOCK_OB;
}

console.log('skill tree fragment');

test('chaque skill du catalogue a un nœud skill.*', () => {
  for (const s of SKILL_NODES) {
    assert(graph.nodes[skillNodeId(s.id)], `missing ${s.id}`);
  }
  assert(Object.keys(graph.nodes).length === SKILL_NODES.length, 'node count');
});

test('lucky_strikes est la unique racine (pas de parent d’arbre)', () => {
  assert(parents['lucky_strikes'] == null, JSON.stringify(parents['lucky_strikes']));
  const roots = SKILL_NODES.filter(s => !parents[s.id]);
  assert(roots.length === 1 && roots[0].id === 'lucky_strikes', roots.map(s => s.id).join(','));
});

test('tous les autres skills ont au moins un parent documenté (pas unknown parent)', () => {
  const missing = [];
  for (const s of SKILL_NODES) {
    if (s.id === 'lucky_strikes') continue;
    if (!parents[s.id]?.length) missing.push(s.id);
  }
  assert(missing.length === 0, `parents manquants: ${missing.join(',')}`);
  for (const s of SKILL_NODES) {
    const ev = evaluateNode(graph, playerView({ stats: { [STAT_OB]: 99 }, resources: { [RESOURCE_SP]: 999999 } }), skillNodeId(s.id));
    const unk = (ev.unknownRequired || []).filter(c => c.reason === 'skill-tree-parent');
    assert(unk.length === 0, `${s.id} still has unknown parent`);
  }
});

test('chaque parent existe dans le catalogue', () => {
  for (const [child, ps] of Object.entries(parents)) {
    for (const p of ps) {
      assert(byId[p], `${child} → ${p} unknown catalog id`);
    }
  }
});

test('OB parent <= OB enfant (sinon la topologie wiki serait injouable à l’OB indiqué)', () => {
  const bad = [];
  for (const [child, ps] of Object.entries(parents)) {
    for (const p of ps) {
      if (unlockOb(p) > unlockOb(child)) bad.push(`${p}(OB${unlockOb(p)}) → ${child}(OB${unlockOb(child)})`);
    }
  }
  assert(bad.length === 0, bad.join(' ; '));
});

test('pas de cycle dans le graphe compilé', () => {
  assert(graph.cycles.length === 0, JSON.stringify(graph.cycles));
});

test('arêtes wiki stables (échantillon documenté)', () => {
  const expect = {
    bigger_blasts: ['lucky_strikes'],
    ore_efficiency: ['lucky_strikes'],
    swing_harder: ['bigger_blasts'],
    arsenal: ['swing_harder'],
    all_round: ['swing_harder'],
    wait_crits: ['ingot_intuition'],
    easy_prog: ['ingot_intuition'],
    veinmorpher: ['gasoline'],
    fishing_friends: ['gasoline'],
    whos_asking: ['veinmorpher'],
    tons_dmg: ['whos_asking'],
    poly_while: ['tons_dmg'],
    block_bonker: ['tons_dmg'],
    avada: ['ctrl_f_stars'],
    threes_crowd: ['ctrl_f_stars'],
    poly_power: ['poly_while'],
    ctrl_c_stars: ['insane_vein'],
    fronks: ['yanille'],
  };
  for (const [child, ps] of Object.entries(expect)) {
    assert(JSON.stringify(parents[child]) === JSON.stringify(ps), `${child}: got ${JSON.stringify(parents[child])}`);
  }
});

test('chemin indirect veinmorpher → … → poly_while', () => {
  let id = 'poly_while';
  const chain = [id];
  while (parents[id]?.[0]) {
    id = parents[id][0];
    chain.push(id);
    if (chain.length > 40) break;
  }
  assert(chain.includes('tons_dmg'), chain.join(' ← '));
  assert(chain.includes('veinmorpher'), chain.join(' ← '));
  assert(chain.includes('gasoline'), chain.join(' ← '));
  assert(chain[chain.length - 1] === 'lucky_strikes', chain.join(' ← '));
});

test('poly_while : OB26 + SP40 sans parent → locked confirmed, pas available', () => {
  const p = playerView({ stats: { [STAT_OB]: 26 }, resources: { [RESOURCE_SP]: 40 } });
  const ev = evaluateNode(graph, p, skillNodeId('poly_while'));
  assert(ev.status === STATUS.locked, ev.status);
  assert(ev.confidence === CONFIDENCE.confirmed, ev.confidence);
  assert(ev.actionable === false);
  assert(ev.status !== STATUS.available);
  assert(ev.status !== STATUS.incomplete);
});

test('poly_while : parent tons_dmg possédé + OB26 + SP40 → available actionable', () => {
  const p = playerView({
    nodes: { [skillNodeId('tons_dmg')]: 1 },
    stats: { [STAT_OB]: 26 },
    resources: { [RESOURCE_SP]: 40 },
  });
  const ev = evaluateNode(graph, p, skillNodeId('poly_while'));
  assert(ev.status === STATUS.available, ev.status);
  assert(ev.confidence === CONFIDENCE.confirmed, ev.confidence);
  assert(ev.actionable === true);
});

test('poly_while : conditions connues OK mais motley (fausse piste) ne débloque pas', () => {
  const p = playerView({
    nodes: { [skillNodeId('motley')]: 1 },
    stats: { [STAT_OB]: 26 },
    resources: { [RESOURCE_SP]: 40 },
  });
  const ev = evaluateNode(graph, p, skillNodeId('poly_while'));
  assert(ev.status === STATUS.locked, ev.status);
});

test('lucky_strikes : OB4 + 1 SP → available actionable (plus de parent unknown)', () => {
  const p = playerView({ stats: { [STAT_OB]: 4 }, resources: { [RESOURCE_SP]: 1 } });
  const ev = evaluateNode(graph, p, skillNodeId('lucky_strikes'));
  assert(ev.status === STATUS.available, ev.status);
  assert(ev.actionable === true);
  assert(ev.confidence === CONFIDENCE.confirmed, ev.confidence);
});

test('lucky_strikes : OB3 → locked (arbre encore fermé)', () => {
  const p = playerView({ stats: { [STAT_OB]: 3 }, resources: { [RESOURCE_SP]: 10 } });
  const ev = evaluateNode(graph, p, skillNodeId('lucky_strikes'));
  assert(ev.status === STATUS.locked, ev.status);
  assert(ev.actionable === false);
});

test('available mais SP insuffisant (poly)', () => {
  const p = playerView({
    nodes: { [skillNodeId('tons_dmg')]: 1 },
    stats: { [STAT_OB]: 26 },
    resources: { [RESOURCE_SP]: 10 },
  });
  const ev = evaluateNode(graph, p, skillNodeId('poly_while'));
  assert(ev.status === STATUS.available, ev.status);
  assert(ev.actionable === false);
});

test('plan(poly_while) : Do immédiat + Reach OB + Acquire SP + Unlock indirect + pas de Do(ob)', () => {
  const p = playerView({ stats: { [STAT_OB]: 20 }, resources: { [RESOURCE_SP]: 1 } });
  const out = planNode(graph, p, skillNodeId('poly_while'));
  const dos = collect(out, s => s.step === STEP.Do);
  assert(dos.some(s => s.nodeId === skillNodeId('lucky_strikes') && s.actionable), formatPlan(out));
  assert(collect(out, s => s.step === STEP.Unlock && s.nodeId === skillNodeId('tons_dmg')).length === 1, formatPlan(out));
  assert(collect(out, s => s.step === STEP.Unlock && s.nodeId === skillNodeId('veinmorpher')).length === 1, formatPlan(out));
  assert(collect(out, s => s.step === STEP.Reach && s.stat === STAT_OB && s.min === 26).length === 1, formatPlan(out));
  assert(collect(out, s => s.step === STEP.UnknownStep && s.reason === 'no-documented-progressor').length >= 1, formatPlan(out));
  assert(collect(out, s => s.step === STEP.UnknownStep && s.reason === 'no-documented-producer').length >= 1, formatPlan(out));
  assert(!collect(out, s => s.step === STEP.Do && /ob/i.test(s.nodeId || '')).length);
  assert(!collect(out, s => s.reason === 'skill-tree-parent').length, 'parent unknown should be gone');
});

test('producersOf / progressorsOf restent vides (pas de mécanique SP/OB inventée)', () => {
  assert(Object.keys(graph.producersOf).length === 0, JSON.stringify(graph.producersOf));
  assert(Object.keys(graph.progressorsOf).length === 0, JSON.stringify(graph.progressorsOf));
});

test('enabledBy inverse : tons_dmg habilite poly_while', () => {
  const en = graph.enabledBy[skillNodeId('tons_dmg')] || [];
  assert(en.includes(skillNodeId('poly_while')), JSON.stringify(en));
  assert(en.includes(skillNodeId('block_bonker')), JSON.stringify(en));
});

test('niveaux 2+ : le nœud représente le skill possédé (lvl>=1), pas un Do par palier', () => {
  const n = graph.nodes[skillNodeId('fishing_friends')];
  assert(n.cost.type === 'resource' && n.cost.id === RESOURCE_SP && n.cost.min === 40, JSON.stringify(n.cost));
});

console.log('\n--- parents dérivés ---');
for (const s of SKILL_NODES) {
  const ps = parents[s.id];
  console.log(`  ${s.id.padEnd(22)} ← ${ps ? ps.join(', ') : '(racine)'}`);
}

console.log('\n--- plan poly_while (OB20, 1 SP) ---');
const demo = planNode(graph, playerView({ stats: { [STAT_OB]: 20 }, resources: { [RESOURCE_SP]: 1 } }), skillNodeId('poly_while'));
console.log(formatPlan(demo));

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exitCode = 1;
