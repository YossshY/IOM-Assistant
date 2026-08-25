/* ============================================================
   progress/fragments/fishing.js — étape F
   Légendaires + tributes (sauf Laviathan, stubs C). Catalogues non modifiés.
   Notices / Enhance / upgrades hors bateau : hors graphe.
   ============================================================ */

import { KIND } from '../ids.js';
import { all, node, resource, unknown } from '../conditions.js';
import { LEGENDARY_FISH } from '../../fishingData.js';
import { dockId, fishResource } from './docks.js';
import { veinResource } from './construct.js';

export const SKIP_TRIBUTE_IDS = Object.freeze(['laviathan']);

export function legendaryId(catalogId) {
  return `fish.legendary.${catalogId}`;
}

export function fishTributeId(catalogId, rank) {
  return `fish.tribute.${catalogId}.t${rank}`;
}

export function starResource(catalogId) {
  return `star.${catalogId}`;
}

export function legendaryPolyUnknown(dock) {
  return unknown(`legendary-poly-cards-${dock}`);
}

export const LEGENDARY_CATCH_UNKNOWN = 'legendary-catch-chance-100';
export const TRIBUTE_BAR_UNKNOWN = 'tribute-bar-suffix';

/**
 * Coûts wiki Fishing#Tributes.
 * k/m/b/t/q convertis (comme Construct). qi/sx/oc/no/sp → unknown dans le coût.
 * Laviathan volontairement absent (nœuds C inchangés).
 */
export const TRIBUTE_COSTS = [
  { id: 'rainbow_trout', t1: { gems: 25e3, star: 'aries', starN: 50e6, vein: 'stone', veinN: 20e9, fish: 'golden_trout', fishN: 15e6 },
    t2: { gems: 125e3, star: 'virgo', starN: 250e6, vein: 'virtual', veinN: 100e9, fish: 'golden_trout', fishN: 75e6 } },
  { id: 'dunes_eelworm', t1: { gems: 50e3, star: 'leo', starN: 250e6, vein: 'deepsea', veinN: 40e9, fish: 'scarabshoe_crab', fishN: 80e6 },
    t2: { gems: 150e3, star: 'capricorn', starN: 1.25e9, vein: 'jungle', veinN: 200e9, fish: 'scarabshoe_crab', fishN: 400e6 } },
  { id: 'glacial_shellstealer', t1: { gems: 80e3, star: 'scorpio', starN: 750e6, vein: 'beach', veinN: 80e9, fish: 'auroreel', fishN: 100e6 },
    t2: { gems: 300e3, star: 'ophiuchus', starN: 3.75e9, vein: 'volcano', veinN: 400e9, fish: 'auroreel', fishN: 500e6 } },
  { id: 'megalodon', t1: { gems: 100e3, star: 'sagittarius', starN: 2e9, vein: 'deepsea', veinN: 125e9, fish: 'gem_whale', fishN: 120e6 },
    t2: { gems: 400e3, star: 'cetus', starN: 10e9, vein: 'valley', veinN: 600e9, fish: 'gem_whale', fishN: 600e6 } },
  { id: 'radioactive_slug', t1: { gems: 150e3, star: 'orion', starN: 3e9, vein: 'jurassic', veinN: 250e9, fish: 'wastefish', fishN: 150e6 },
    t2: { gems: 500e3, star: 'hercules', starN: 15e9, vein: 'roman', veinN: 1.25e12, fish: 'wastefish', fishN: 600e6 } },
  { id: 'cthulhu', t1: { gems: 175e3, star: 'pisces', starN: 4e9, vein: 'volcano', veinN: 400e9, fish: 'wreckshell_pilferer', fishN: 200e6 },
    t2: { gems: 750e3, star: 'draco', starN: 20e9, vein: 'warfront', veinN: 2e12, fish: 'wreckshell_pilferer', fishN: 1e9 } },
  { id: 'glimmering_geoduck', t1: { gems: 225e3, star: 'hercules', starN: 8e9, vein: 'neon', veinN: 10e12, fish: 'arapaim_al', fishN: 300e6 },
    t2: { gems: 1.1e6, star: 'cetus', starN: 35e9, vein: 'neon', veinN: 50e12, fish: 'arapaim_al', fishN: 1.5e9 } },
  { id: 'storm_serpent', t1: { gems: 275e3, star: 'phoenix', starN: 40e9, vein: 'valley', veinN: 250e12, fish: 'lunar_sunfish', fishN: 999e6 },
    t2: { gems: 1.38e6, star: 'orion', starN: 150e9, vein: 'warfront', veinN: 700e12, fish: 'lunar_sunfish', fishN: 9.99e9 } },
  { id: 'melting_gibbous', t1: { gems: 650e3, star: 'draco', starN: 5e12, vein: 'wonderland', veinN: 425e12, fish: 'planetary_jellyfish', fishN: 40e9 },
    t2: { gems: 1.65e6, star: 'hercules', starN: 50e12, vein: 'pirate', veinN: 1.25e15, fish: 'planetary_jellyfish', fishN: 140e9 } },
  { id: 'blackened_basker', t1: { gems: 850e3, star: 'hercules', starN: 8e12, vein: 'arabian', veinN: 950e12, fish: 'dark_matter_blackdragon', fishN: 100e9 },
    t2: { gems: 2.45e6, star: 'phoenix', starN: 95e12, vein: 'arabian', veinN: 4e15, fish: 'dark_matter_blackdragon', fishN: 250e9 } },
];

function tributeCost(row) {
  return all(
    resource('gems', row.gems),
    resource(starResource(row.star), row.starN),
    resource(veinResource(row.vein), row.veinN),
    resource(fishResource(row.fish), row.fishN),
    unknown(TRIBUTE_BAR_UNKNOWN),
  );
}

function legendaryUnlock(dock) {
  return all(
    node(dockId(dock)),
    legendaryPolyUnknown(dock),
    unknown(LEGENDARY_CATCH_UNKNOWN),
  );
}

export function buildFishingNodes() {
  const nodes = [];

  for (const fish of LEGENDARY_FISH) {
    nodes.push({
      id: legendaryId(fish.id),
      name: fish.name,
      kind: KIND.unlock,
      unlock: legendaryUnlock(fish.dock),
    });
  }

  for (const row of TRIBUTE_COSTS) {
    const t1 = fishTributeId(row.id, 1);
    nodes.push({
      id: t1,
      name: `${row.id} Tribute 1`,
      kind: KIND.action,
      unlock: node(legendaryId(row.id)),
      cost: tributeCost(row.t1),
    });
    nodes.push({
      id: fishTributeId(row.id, 2),
      name: `${row.id} Tribute 2`,
      kind: KIND.action,
      unlock: node(t1),
      cost: tributeCost(row.t2),
    });
  }

  return nodes;
}
