/* ============================================================
   progress/phrases.js — phrases UI §1.1 (étape K)
   Texte figé. Pas de mécaniques inventées.
   ============================================================ */

import { STATUS, CONFIDENCE, STEP } from './ids.js';
import { COND } from './conditions.js';
import { getNode } from './compile.js';
import { STAT_OB } from './fragments/skillTree.js';

export const STATUS_PHRASE = Object.freeze({
  [STATUS.unlocked]: 'Tu as déjà ça.',
  [STATUS.available]: 'Les prérequis d’accès connus sont remplis.',
  [STATUS.locked]: 'Il manque X',
  [STATUS.blocked]: 'Ce n’est plus possible depuis ton état actuel.',
  [STATUS.incomplete]: 'Les conditions connues sont remplies, mais certains prérequis ne sont pas encore documentés dans l’application.',
  [STATUS.unknown]: 'L’application ne connaît pas encore cet élément.',
});

export const ACTIONABLE_NOW = 'Tu peux faire cette action maintenant.';

export const UNKNOWN_STEP_PHRASE = 'Pas encore documenté dans l’application.';

export const CONFIDENCE_LABEL = Object.freeze({
  [CONFIDENCE.confirmed]: 'Confirmé',
  [CONFIDENCE.partial]: 'Partiel',
  [CONFIDENCE.unknown]: 'Inconnu',
});

export function labelCondition(graph, cond) {
  if (!cond || typeof cond !== 'object') return null;
  if (cond.type === COND.stat) {
    const name = cond.id === STAT_OB ? 'OB' : cond.id;
    return `${name} ≥ ${cond.min}`;
  }
  if (cond.type === COND.resource) return `${cond.id} (≥ ${cond.min})`;
  if (cond.type === COND.node) {
    const n = graph ? getNode(graph, cond.id) : null;
    return n?.name || cond.id;
  }
  return null;
}

export function lockedPhrase(graph, ev) {
  const bits = (ev?.knownUnsatisfied || []).map(c => labelCondition(graph, c)).filter(Boolean);
  if (!bits.length) return STATUS_PHRASE[STATUS.locked];
  return `Il manque ${bits.join(', ')}.`;
}

export function statusPhrase(graph, ev) {
  const st = ev?.status;
  if (st === STATUS.locked) return lockedPhrase(graph, ev);
  return STATUS_PHRASE[st] || STATUS_PHRASE[STATUS.unknown];
}

export function describeEvaluation(graph, ev) {
  const actionable = Boolean(ev?.actionable);
  return {
    status: ev?.status ?? STATUS.unknown,
    confidence: ev?.confidence ?? CONFIDENCE.unknown,
    confidenceLabel: CONFIDENCE_LABEL[ev?.confidence] || CONFIDENCE_LABEL[CONFIDENCE.unknown],
    phrase: statusPhrase(graph, ev),
    actionable,
    nowPhrase: actionable ? ACTIONABLE_NOW : null,
  };
}

export function stepCaption(graph, step) {
  if (!step) return '';
  if (step.step === STEP.Do || step.step === STEP.Unlock) {
    const n = graph ? getNode(graph, step.nodeId) : null;
    return n?.name || step.nodeId || '';
  }
  if (step.step === STEP.Reach) {
    const name = step.stat === STAT_OB ? 'OB' : step.stat;
    return `${name} ≥ ${step.min}`;
  }
  if (step.step === STEP.Acquire) return `${step.resource} (≥ ${step.min})`;
  if (step.step === STEP.UnknownStep) return UNKNOWN_STEP_PHRASE;
  return step.step || '';
}

export function formatPlanTree(graph, steps) {
  return (steps || []).map(s => ({
    step: s.step,
    caption: stepCaption(graph, s),
    actionable: Boolean(s.actionable),
    reason: s.reason || null,
    nodeId: s.nodeId || null,
    children: formatPlanTree(graph, s.children),
  }));
}
