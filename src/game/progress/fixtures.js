/* ============================================================
   progress/fixtures.js — graphes FICTIFS pour tests (préfixe fx.)
   Aucune donnée / dépendance Idle Obelisk Miner.
   ============================================================ */

import { KIND } from './ids.js';
import { all, any, node, stat, resource, unknown } from './conditions.js';
import { compileGraph } from './compile.js';

/** Nœuds de base : dépendances, ALL/ANY, cycle, coût, inconnues. Pas de producers/progressors. */
export const FX_CORE_NODES = [
  {
    id: 'fx.alpha',
    name: 'Alpha',
    kind: KIND.action,
    cost: { resource: 'token', amount: 1 },
  },
  {
    id: 'fx.beta',
    name: 'Beta',
    kind: KIND.action,
    unlock: node('fx.alpha'),
    cost: { resource: 'token', amount: 5 },
  },
  {
    id: 'fx.gamma',
    name: 'Gamma',
    kind: KIND.action,
    unlock: all(node('fx.beta'), stat('power', 8)),
    cost: { resource: 'token', amount: 10 },
  },
  {
    id: 'fx.shop',
    name: 'Shop',
    kind: KIND.action,
    cost: { resource: 'token', amount: 100 },
  },
  {
    id: 'fx.mystery',
    name: 'Mystery',
    kind: KIND.action,
    unlock: all(stat('power', 5), unknown('wiki-gap')),
    cost: { resource: 'token', amount: 1 },
  },
  {
    id: 'fx.either',
    name: 'Either',
    kind: KIND.action,
    unlock: any(node('fx.alpha'), node('fx.beta')),
  },
  {
    id: 'fx.or_gap',
    name: 'Or with gap',
    kind: KIND.action,
    unlock: any(node('fx.alpha'), unknown('maybe-other-branch')),
  },
  {
    id: 'fx.loop_a',
    name: 'Loop A',
    kind: KIND.action,
    unlock: node('fx.loop_b'),
  },
  {
    id: 'fx.loop_b',
    name: 'Loop B',
    kind: KIND.action,
    unlock: node('fx.loop_a'),
  },
  {
    id: 'fx.path_a',
    name: 'Path A',
    kind: KIND.action,
    blockedIf: node('fx.path_b'),
  },
  {
    id: 'fx.path_b',
    name: 'Path B',
    kind: KIND.action,
  },
  {
    id: 'fx.power_gate',
    name: 'Power 10',
    kind: KIND.milestone,
    unlock: stat('power', 10),
  },
  {
    id: 'fx.gate',
    name: 'Gate',
    kind: KIND.action,
    unlock: all(
      stat('power', 10),
      node('fx.gamma'),
      unknown('other-parents'),
      resource('token', 20),
    ),
    cost: { resource: 'token', amount: 20 },
  },
];

/** Moyens documentés fictifs — uniquement pour tester les index, pas le jeu réel. */
export const FX_MEANS_NODES = [
  {
    id: 'fx.farm',
    name: 'Farm',
    kind: KIND.action,
    produces: [{ resource: 'token', amount: 10 }],
  },
  {
    id: 'fx.drill',
    name: 'Drill',
    kind: KIND.action,
    progresses: [{ stat: 'power' }],
  },
];

export function fxCoreGraph() {
  return compileGraph(FX_CORE_NODES);
}

export function fxMeansGraph() {
  return compileGraph([...FX_CORE_NODES, ...FX_MEANS_NODES]);
}
