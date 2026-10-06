/* ============================================================
   progress/fragments/polyInfernal.js — étape C
   Gates Polychrome / Infernal (wiki Cards). Pas de nœud par carte.
   Laviathan T1/T2 : nœuds créés par fishing.js (étape H). tributeId() inchangé.
   ============================================================ */

import { KIND } from '../ids.js';
import { all, node, unknown } from '../conditions.js';
import { skillNodeId } from './skillTree.js';

export const CARDS_FEATURE_OB = 15;
export const POLY_SHARD_COUNT = 10;
export const INFERNAL_SHARD_COUNT = 10;

export const cardsFeatureId = 'cards.feature';
export const polySystemId = 'cards.poly_system';

export function infernalSetId(category) {
  return `cards.infernal_set.${category}`;
}

export function tributeId(rank) {
  return rank === 2 ? 'fish.tribute.laviathan.t2' : 'fish.tribute.laviathan.t1';
}

export const INFERNAL_SET_SOURCES = Object.freeze({
  ores: { node: tributeId(1), note: 'Laviathan Tribute 1' },
  bars: { node: tributeId(1), note: 'Laviathan Tribute 1' },
  veins: { node: skillNodeId('flaming_veins'), note: 'Flaming Veins skill' },
  stars: { node: skillNodeId('astral_forge'), note: 'Astral Forge skill' },
  fish: { node: tributeId(2), note: 'Laviathan Tribute 2' },
  legendary_fish: { node: tributeId(2), note: 'Laviathan Tribute 2' },
  pets: { node: 'pets.skin.butterfly.scorchwing', note: 'Scorchwing skin' },
  drones: { node: 'drones.upgrade.infernal_cards', note: 'coal upgrade (fragment drones absent)' },
  misc: { node: 'arch.idol.hestia', note: 'Hestia Common Idol' },
  arch: { node: 'arch.idol.hades', note: 'Hades Divine Idol' },
  bombs: { unknown: 'infernal-bombs-source' },
  essence: { unknown: 'infernal-arcanist-source' },
  runes: { unknown: 'infernal-arcanist-source' },
  spells: { unknown: 'infernal-arcanist-source' },
  orbs: { unknown: 'infernal-arcanist-source' },
});

export function cardRankStat(cardKey) {
  return `card.${cardKey}`;
}

export function polyShardResource(cardKey) {
  return `shard.poly.${cardKey}`;
}

export function infernalShardResource(cardKey) {
  return `shard.infernal.${cardKey}`;
}

/** Condition pour polychromer une carte déjà gilded (wiki Cards). */
export function polychromeCondition(cardKey) {
  return all(
    node(polySystemId),
    { type: 'stat', id: cardRankStat(cardKey), min: 2 },
    { type: 'resource', id: polyShardResource(cardKey), min: POLY_SHARD_COUNT },
  );
}

/** Condition pour ignite infernal d'une carte déjà poly, set débloqué. */
export function infernalCondition(cardKey, category) {
  const src = INFERNAL_SET_SOURCES[category];
  const setPart = src?.unknown
    ? unknown(src.unknown)
    : node(infernalSetId(category));
  return all(
    setPart,
    { type: 'stat', id: cardRankStat(cardKey), min: 3 },
    { type: 'resource', id: infernalShardResource(cardKey), min: INFERNAL_SHARD_COUNT },
  );
}

function stubUnknown(id, name, reason) {
  return {
    id,
    name,
    kind: KIND.unlock,
    unlock: unknown(reason),
  };
}

export function buildPolyInfernalNodes() {
  const nodes = [
    {
      id: cardsFeatureId,
      name: 'Cards',
      kind: KIND.milestone,
      unlock: { type: 'stat', id: 'ob', min: CARDS_FEATURE_OB },
    },
    {
      id: polySystemId,
      name: 'Polychrome Cards',
      kind: KIND.milestone,
      unlock: node(skillNodeId('poly_while')),
    },
    stubUnknown('drones.upgrade.infernal_cards', 'Unlock Drone Infernal Cards', 'drone-coal-upgrades'),
    stubUnknown('arch.idol.hestia', 'Hestia Common Idol', 'archaeology-idols'),
    stubUnknown('arch.idol.hades', 'Hades Divine Idol', 'archaeology-idols'),
    {
      id: 'pets.skin.butterfly.scorchwing',
      name: 'Scorchwing',
      kind: KIND.action,
      unlock: unknown('pets-fragment'),
      cost: { resource: 'gems', amount: 250000 },
    },
  ];

  for (const [cat, src] of Object.entries(INFERNAL_SET_SOURCES)) {
    nodes.push({
      id: infernalSetId(cat),
      name: `Infernal ${cat}`,
      kind: KIND.milestone,
      unlock: src.unknown ? unknown(src.unknown) : node(src.node),
    });
  }

  return nodes;
}
