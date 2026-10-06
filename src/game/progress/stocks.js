/* ============================================================
   progress/stocks.js — stocks manuels (M)
   Absents de exportstats. Pas de producteurs inventés.
   ============================================================ */

import { RESOURCE_SP } from './fragments/skillTree.js';
import { RESOURCE_GEMS } from './fragments/construct.js';
import { fishResource } from './fragments/docks.js';

export const MANUAL_STOCKS = Object.freeze([
  { id: RESOURCE_SP, label: 'Skill Points', hint: 'Lucky Strikes, skills' },
  { id: RESOURCE_GEMS, label: 'Gems', hint: 'monuments' },
  { id: fishResource('golden_trout'), label: 'Golden Trout', hint: 'bateau Desert' },
]);

export function resourcesFromStocks(stocks = {}) {
  const out = {};
  for (const { id } of MANUAL_STOCKS) {
    const n = Number(stocks[id]);
    if (Number.isFinite(n) && n > 0) out[id] = n;
  }
  return out;
}
