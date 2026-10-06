/* ============================================================
   progress/fragments/construct.js — étape D
   Research veines (chaîne wiki) + monuments. Catalogues non modifiés.
   ============================================================ */

import { KIND } from '../ids.js';
import { all, node, stat, resource, unknown } from '../conditions.js';

export const CONSTRUCT_UNLOCK_OB = 19;
export const constructFeatureId = 'construct.feature';
export const RESOURCE_GEMS = 'gems';

export function researchVeinId(catalogId) {
  return `research.vein.${catalogId}`;
}

export function monumentId(world) {
  return `monument.w${world}`;
}

export function veinResource(catalogId) {
  return `vein.${catalogId}`;
}

export function barResource(name) {
  return `bar.${String(name).toLowerCase()}`;
}

/**
 * Chaîne Research → Vein unlocks (wiki Construct#Vein_unlocks).
 * prev = veine précédente à débloquer ; prevVeins = coût en veines de ce type.
 * bars = coûts lingots documentés (pas de producteurs à cette étape).
 */
export const VEIN_UNLOCK_CHAIN = [
  { id: 'stone', prev: null, prevVeins: null, bars: [['Adamant', 7.5e6], ['Runite', 7.5e6]] },
  { id: 'magma', prev: 'stone', prevVeins: 1e3, bars: [['Obsidian', 11.25e6], ['Demonite', 11.25e6]] },
  { id: 'virtual', prev: 'magma', prevVeins: 1.5e3, bars: [['VR-Demonite', 16.85e6], ['VR-ERROR', 16.85e6]] },
  { id: 'space', prev: 'virtual', prevVeins: 2.25e3, bars: [['Meteorite', 25.25e6], ['Singularity', 25.25e6]] },
  { id: 'cloud', prev: 'space', prevVeins: 3.3e3, bars: [['Angelite', 37.75e6], ['Elysium', 37.75e6]] },
  { id: 'atomic', prev: 'cloud', prevVeins: 5.06e3, bars: [['Radion-73', 56.65e6], ['Cranium', 56.65e6]] },
  { id: 'deepsea', prev: 'atomic', prevVeins: 7.55e3, bars: [['Lapis', 82.25e6], ['Quartz', 82.25e6]] },
  { id: 'beach', prev: 'deepsea', prevVeins: 11.28e3, bars: [['Sandcasium', 125.5e6], ['Clamite', 125.5e6]] },
  { id: 'valley', prev: 'beach', prevVeins: 16.96e3, bars: [['Hailstone', 195.5e6], ['Frostbite', 195.5e6]] },
  { id: 'jungle', prev: 'valley', prevVeins: 385e3, bars: [['Macawrock', 2.85e9], ['Cocore', 2.85e9]] },
  { id: 'volcano', prev: 'jungle', prevVeins: 585e3, bars: [['Infernite', 8.55e9], ['Blood-Onyx', 8.55e9]] },
  { id: 'jurassic', prev: 'volcano', prevVeins: 5.5e6, bars: [['Omeletite', 750e9], ['Resinite', 750e9]] },
  { id: 'roman', prev: 'jurassic', prevVeins: 20.5e6, bars: [['Duelysium', 7.5e12], ['Arcusite', 7.5e12]] },
  { id: 'industrial', prev: 'roman', prevVeins: 92.5e6, bars: [['Cognite', 52.5e12], ['Telophite', 52.5e12]] },
  { id: 'warfront', prev: 'industrial', prevVeins: 250e6, bars: [['Dynamite', 5.5e15], ['Genevium', 5.5e15]] },
  { id: 'neon', prev: 'warfront', prevVeins: 550.5e6, bars: [['Vaporium', 25.12e15], ['Palmite', 25.12e15]] },
  { id: 'wonderland', prev: 'neon', prevVeins: 1.25e15, bars: 'unknown-suffix' },
  { id: 'pirate', prev: 'wonderland', prevVeins: 150.5e12, bars: 'unknown-suffix' },
  { id: 'arabian', prev: 'pirate', prevVeins: 2.5e15, bars: 'unknown-suffix' },
  { id: 'enchanted', prev: 'arabian', prevVeins: 'qi', bars: 'unknown-suffix' },
  { id: 'candyland', prev: 'enchanted', prevVeins: 'qi', bars: 'unknown-suffix' },
];

/** Wiki Construct#Monuments. W3/W4 OB : knowledgeBase FEATURES / WORLDS. */
export const MONUMENT_UNLOCKS = [
  {
    world: 2,
    gems: 2000,
    veins: [['stone', 2e3], ['magma', 2e3], ['virtual', 2e3]],
    ob: null,
    requiresMonument: null,
  },
  {
    world: 3,
    gems: 7500,
    veins: [['valley', 750e3], ['jungle', 750e3], ['volcano', 750e3]],
    ob: 42,
    requiresMonument: 2,
  },
  {
    world: 4,
    gems: 1e6,
    veins: [['industrial', 1e15], ['warfront', 1e15], ['neon', 1e15]],
    ob: 64,
    requiresMonument: 3,
  },
];

function barCost(bars) {
  if (bars === 'unknown-suffix') return unknown('research-bar-cost-suffix');
  return bars.map(([name, amount]) => resource(barResource(name), amount));
}

export function buildConstructNodes() {
  const nodes = [
    {
      id: constructFeatureId,
      name: 'Construct',
      kind: KIND.milestone,
      unlock: stat('ob', CONSTRUCT_UNLOCK_OB),
    },
  ];

  for (const row of VEIN_UNLOCK_CHAIN) {
    const parts = [node(constructFeatureId)];
    if (row.prev) {
      parts.push(node(researchVeinId(row.prev)));
      if (row.prevVeins === 'qi') parts.push(unknown('vein-cost-qi-suffix'));
      else parts.push(resource(veinResource(row.prev), row.prevVeins));
    }
    nodes.push({
      id: researchVeinId(row.id),
      name: `${row.id} Veins`,
      kind: KIND.action,
      unlock: all(...parts),
      cost: barCost(row.bars),
    });
  }

  for (const m of MONUMENT_UNLOCKS) {
    const parts = [node(constructFeatureId)];
    if (m.requiresMonument) parts.push(node(monumentId(m.requiresMonument)));
    if (m.ob) parts.push(stat('ob', m.ob));
    for (const [vein] of m.veins) parts.push(node(researchVeinId(vein)));
    nodes.push({
      id: monumentId(m.world),
      name: `World ${m.world} Monument`,
      kind: KIND.action,
      unlock: all(...parts),
      cost: [
        { resource: RESOURCE_GEMS, amount: m.gems },
        ...m.veins.map(([id, n]) => ({ resource: veinResource(id), amount: n })),
      ],
    });
  }

  return nodes;
}
