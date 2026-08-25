/* ============================================================
   progress/ids.js — constantes du moteur de progression (étape A)
   Aucune donnée Idle Obelisk Miner ici.
   ============================================================ */

export const STATUS = Object.freeze({
  unlocked:   'unlocked',
  available:  'available',
  locked:     'locked',
  blocked:    'blocked',
  incomplete: 'incomplete',
  unknown:    'unknown',
});

export const CONFIDENCE = Object.freeze({
  confirmed: 'confirmed',
  partial:   'partial',
  unknown:   'unknown',
});

export const STEP = Object.freeze({
  Do:          'Do',
  Reach:       'Reach',
  Acquire:     'Acquire',
  Unlock:      'Unlock',
  UnknownStep: 'UnknownStep',
});

export const KIND = Object.freeze({
  action:    'action',
  milestone: 'milestone',
  unlock:    'unlock',
  resource:  'resource',
});

/** Préfixe réservé aux graphes de test (jamais des ids de jeu). */
export const FIXTURE_PREFIX = 'fx.';

export function isFixtureId(id) {
  return typeof id === 'string' && id.startsWith(FIXTURE_PREFIX);
}
