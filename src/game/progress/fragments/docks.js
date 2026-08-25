/* ============================================================
   progress/fragments/docks.js — étape E
   Docks + upgrades Boat (wiki Fishing). Catalogues non modifiés.
   Mapping bateau → dock : derived (contraintes documentées), pas explicit.
   ============================================================ */

import { KIND } from '../ids.js';
import { node, stat, resource } from '../conditions.js';

export const FISHING_UNLOCK_OB = 37;
export const fishingFeatureId = 'fishing.feature';
export const STARTER_DOCK = 'lake';

export function dockId(catalogId) {
  return `fish.dock.${catalogId}`;
}

export function boatT1Id(level) {
  return `fish.upgrade.boat.t1.${level}`;
}

export function boatT2Id(level) {
  return `fish.upgrade.boat.t2.${level}`;
}

export function fishResource(id) {
  return `fish.${id}`;
}

/**
 * Bateau T1. Coûts : wiki Fishing#Upgrade_Boat (explicit).
 * Dock ouvert par le palier : derived (poisson 4 du dock précédent
 * = coût du palier ; le palier « unlock new docks » ; 6 T1 / 5 paliers).
 */
export const BOAT_T1 = [
  { level: 1, dock: 'desert', fromDock: 'lake', fish: 'golden_trout', amount: 15 },
  { level: 2, dock: 'tundra', fromDock: 'desert', fish: 'scarabshoe_crab', amount: 45 },
  { level: 3, dock: 'ocean', fromDock: 'tundra', fish: 'auroreel', amount: 135 },
  { level: 4, dock: 'nuclear', fromDock: 'ocean', fish: 'gem_whale', amount: 405 },
  { level: 5, dock: 'abyss', fromDock: 'nuclear', fish: 'wastefish', amount: 1215 },
];

/**
 * Bateau T2. Palier 1 exige bateau T1 niv.5 (wiki, explicit).
 * Docks Cave→Galaxy : derived, même raisonnement que T1.
 */
export const BOAT_T2 = [
  { level: 1, dock: 'cave', fromDock: 'abyss', fish: 'wreckshell_pilferer', amount: 2e6, requireBoatT1: 5 },
  { level: 2, dock: 'volcano', fromDock: 'cave', fish: 'arapaim_al', amount: 3e6 },
  { level: 3, dock: 'sky', fromDock: 'volcano', fish: 'basalturtle', amount: 4.5e6 },
  { level: 4, dock: 'solaris', fromDock: 'sky', fish: 'lunar_sunfish', amount: 6.75e6 },
  { level: 5, dock: 'galaxy', fromDock: 'solaris', fish: 'planetary_jellyfish', amount: 10.1e6 },
];

export function buildDocksNodes() {
  const nodes = [
    {
      id: fishingFeatureId,
      name: 'Fishing',
      kind: KIND.milestone,
      unlock: stat('ob', FISHING_UNLOCK_OB),
    },
    {
      id: dockId(STARTER_DOCK),
      name: 'Lake',
      kind: KIND.milestone,
      unlock: node(fishingFeatureId),
    },
  ];

  for (const row of BOAT_T1) {
    const boat = boatT1Id(row.level);
    nodes.push({
      id: boat,
      name: `Upgrade Boat ${row.level}`,
      kind: KIND.action,
      unlock: node(dockId(row.fromDock)),
      cost: resource(fishResource(row.fish), row.amount),
    });
    nodes.push({
      id: dockId(row.dock),
      name: row.dock[0].toUpperCase() + row.dock.slice(1),
      kind: KIND.milestone,
      unlock: node(boat),
    });
  }

  for (const row of BOAT_T2) {
    const boat = boatT2Id(row.level);
    nodes.push({
      id: boat,
      name: `Upgrade Tier 2 Boat ${row.level}`,
      kind: KIND.action,
      unlock: row.requireBoatT1
        ? node(boatT1Id(row.requireBoatT1))
        : node(dockId(row.fromDock)),
      cost: resource(fishResource(row.fish), row.amount),
    });
    nodes.push({
      id: dockId(row.dock),
      name: row.dock[0].toUpperCase() + row.dock.slice(1),
      kind: KIND.milestone,
      unlock: node(boat),
    });
  }

  return nodes;
}
