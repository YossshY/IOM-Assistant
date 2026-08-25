/* ============================================================
   progress/evaluate.js — conditions, statuts, confiance, actionable dérivé
   ============================================================ */

import { STATUS, CONFIDENCE, KIND } from './ids.js';
import { COND, always } from './conditions.js';
import { getNode } from './compile.js';

function emptyBags() {
  return {
    knownSatisfied: [],
    knownUnsatisfied: [],
    unknownRequired: [],
    unknownOptional: [],
  };
}

function concatBags(parts) {
  const out = emptyBags();
  for (const p of parts) {
    out.knownSatisfied.push(...p.knownSatisfied);
    out.knownUnsatisfied.push(...p.knownUnsatisfied);
    out.unknownRequired.push(...p.unknownRequired);
    out.unknownOptional.push(...p.unknownOptional);
  }
  return out;
}

function confidenceOf(bags, truth) {
  const reqUnknown = bags.unknownRequired.length > 0;
  const optUnknown = bags.unknownOptional.length > 0;
  const anyKnown = bags.knownSatisfied.length + bags.knownUnsatisfied.length > 0;
  if (!reqUnknown && !optUnknown) return CONFIDENCE.confirmed;
  if (!anyKnown && truth === 'unknown') return CONFIDENCE.unknown;
  return CONFIDENCE.partial;
}

function result(truth, bags) {
  return {
    truth,
    confidence: confidenceOf(bags, truth),
    ...bags,
  };
}

function leafTrue(cond) {
  return result('true', { ...emptyBags(), knownSatisfied: [cond] });
}

function leafFalse(cond) {
  return result('false', { ...emptyBags(), knownUnsatisfied: [cond] });
}

function leafUnknown(cond, required) {
  const bags = emptyBags();
  if (required) bags.unknownRequired = [cond];
  else bags.unknownOptional = [cond];
  return result('unknown', bags);
}

function nodeLevel(player, id) {
  return player?.nodes?.[id] ?? 0;
}

function resourceHave(player, id) {
  const v = player?.resources?.[id];
  return v == null ? 0 : v;
}

function statHave(player, id) {
  if (!player?.stats || !Object.prototype.hasOwnProperty.call(player.stats, id)) return null;
  return player.stats[id];
}

function evalLeaf(graph, player, cond) {
  switch (cond.type) {
    case COND.unknown:
      return leafUnknown(cond, true);
    case COND.node: {
      if (!getNode(graph, cond.id)) return leafUnknown(cond, true);
      return nodeLevel(player, cond.id) >= (cond.min ?? 1) ? leafTrue(cond) : leafFalse(cond);
    }
    case COND.stat: {
      const have = statHave(player, cond.id);
      if (have == null) return leafUnknown(cond, true);
      return have >= cond.min ? leafTrue(cond) : leafFalse(cond);
    }
    case COND.resource: {
      return resourceHave(player, cond.id) >= cond.min ? leafTrue(cond) : leafFalse(cond);
    }
    default:
      return leafUnknown(unknownFallback(cond), true);
  }
}

function unknownFallback(cond) {
  return cond?.type === COND.unknown ? cond : { type: COND.unknown, reason: 'invalid-condition' };
}

function evalAll(parts) {
  if (!parts.length) return result('true', emptyBags());
  const bags = concatBags(parts);
  if (parts.some(p => p.truth === 'false')) return result('false', bags);
  if (parts.some(p => p.truth === 'unknown')) return result('unknown', bags);
  return result('true', bags);
}

function evalAny(parts) {
  if (!parts.length) return result('false', emptyBags());
  const winner = parts.find(p => p.truth === 'true');
  if (winner) {
    const bags = emptyBags();
    bags.knownSatisfied = [...winner.knownSatisfied];
    for (const p of parts) {
      if (p === winner) continue;
      bags.unknownOptional.push(...p.unknownRequired, ...p.unknownOptional);
      /* les branches non retenues ne sont pas des échecs requis */
    }
    return result('true', bags);
  }
  if (parts.every(p => p.truth === 'false')) return result('false', concatBags(parts));
  /* au moins une inconnue, aucune vraie */
  const bags = emptyBags();
  for (const p of parts) {
    if (p.truth === 'unknown') {
      bags.unknownRequired.push(...p.unknownRequired, ...p.unknownOptional);
      bags.knownSatisfied.push(...p.knownSatisfied);
    } else {
      bags.knownUnsatisfied.push(...p.knownUnsatisfied);
    }
  }
  return result('unknown', bags);
}

export function playerView({ nodes = {}, stats = {}, resources = {} } = {}) {
  return { nodes, stats, resources };
}

export function evaluateCondition(graph, player, cond) {
  if (!cond) return result('true', emptyBags());
  if (cond.type === COND.all) {
    return evalAll((cond.items || []).map(c => evaluateCondition(graph, player, c)));
  }
  if (cond.type === COND.any) {
    return evalAny((cond.items || []).map(c => evaluateCondition(graph, player, c)));
  }
  return evalLeaf(graph, player, cond);
}

function attachActionable(base, actionable) {
  return { ...base, actionable: Boolean(actionable) };
}

function nodeBags(unlock, cost, blocked) {
  const parts = [unlock];
  if (cost) parts.push(cost);
  if (blocked) parts.push(blocked);
  return concatBags(parts);
}

function nodeConfidence(unlock, cost) {
  const bags = nodeBags(unlock, cost, null);
  /* coût inconnu = trou pour l'exécution, pas forcément pour l'accès */
  const truth = unlock.truth === 'false' || cost?.truth === 'false' ? 'false'
    : (unlock.truth === 'unknown' || cost?.truth === 'unknown' ? 'unknown' : 'true');
  return confidenceOf(bags, truth);
}

/**
 * Évalue un nœud du graphe.
 * `actionable` est dérivé : available + kind action + coût connu et payable.
 * Il n'est jamais un statut exclusif.
 */
export function evaluateNode(graph, player, id) {
  const n = getNode(graph, id);
  if (!n) {
    return attachActionable({
      id,
      status: STATUS.unknown,
      confidence: CONFIDENCE.unknown,
      kind: null,
      ...emptyBags(),
      unlock: result('unknown', emptyBags()),
      cost: result('true', emptyBags()),
    }, false);
  }

  const ownedMin = 1;
  if (nodeLevel(player, id) >= ownedMin && n.kind !== KIND.milestone) {
    return attachActionable({
      id,
      status: STATUS.unlocked,
      confidence: CONFIDENCE.confirmed,
      kind: n.kind,
      ...emptyBags(),
      knownSatisfied: [{ type: COND.node, id, min: ownedMin }],
      unlock: result('true', emptyBags()),
      cost: result('true', emptyBags()),
    }, false);
  }

  const unlock = evaluateCondition(graph, player, n.unlock || always());
  const cost = n.cost ? evaluateCondition(graph, player, n.cost) : result('true', emptyBags());
  const blocked = n.blockedIf ? evaluateCondition(graph, player, n.blockedIf) : result('false', emptyBags());
  const bags = nodeBags(unlock, n.cost ? cost : null, blocked.truth === 'true' ? blocked : null);

  if (n.kind === KIND.milestone) {
    if (unlock.truth === 'true') {
      return attachActionable({
        id, kind: n.kind,
        status: STATUS.unlocked,
        confidence: unlock.confidence,
        ...bags,
        unlock, cost,
      }, false);
    }
    if (unlock.truth === 'false') {
      return attachActionable({
        id, kind: n.kind,
        status: STATUS.locked,
        confidence: nodeConfidence(unlock, cost),
        ...bags,
        unlock, cost,
      }, false);
    }
    return attachActionable({
      id, kind: n.kind,
      status: STATUS.incomplete,
      confidence: unlock.confidence,
      ...bags,
      unlock, cost,
    }, false);
  }

  if (blocked.truth === 'true') {
    return attachActionable({
      id, kind: n.kind,
      status: STATUS.blocked,
      confidence: blocked.unknownRequired.length || unlock.unknownRequired.length
        ? CONFIDENCE.partial : CONFIDENCE.confirmed,
      ...bags,
      unlock, cost,
    }, false);
  }

  /* unlock connu faux → locked (même si d'autres feuilles sont unknown) */
  if (unlock.truth === 'false') {
    return attachActionable({
      id, kind: n.kind,
      status: STATUS.locked,
      confidence: nodeConfidence(unlock, cost),
      ...bags,
      unlock, cost,
    }, false);
  }

  /* rien de connu ne bloque, mais unlock incomplet */
  if (unlock.truth === 'unknown') {
    return attachActionable({
      id, kind: n.kind,
      status: STATUS.incomplete,
      confidence: unlock.confidence,
      ...bags,
      unlock, cost,
    }, false);
  }

  /* unlock vrai (éventuels trous optionnels seulement) */
  const confidence = nodeConfidence(unlock, cost);
  const canPay = cost.truth === 'true';
  const actionable = n.kind === KIND.action && canPay;
  return attachActionable({
    id, kind: n.kind,
    status: STATUS.available,
    confidence,
    ...bags,
    unlock, cost,
  }, actionable);
}

export { resourceHave, statHave, nodeLevel };
