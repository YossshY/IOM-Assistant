/* ============================================================
   progress/conditions.js — AST de conditions
   Types : all / any / node / stat / resource / unknown
   ============================================================ */

export const COND = Object.freeze({
  all:      'all',
  any:      'any',
  node:     'node',
  stat:     'stat',
  resource: 'resource',
  unknown:  'unknown',
});

export function all(...items) {
  return { type: COND.all, items: items.flat().filter(Boolean) };
}

export function any(...items) {
  return { type: COND.any, items: items.flat().filter(Boolean) };
}

export function node(id, min = 1) {
  return { type: COND.node, id, min };
}

export function stat(id, min) {
  return { type: COND.stat, id, min };
}

export function resource(id, min) {
  return { type: COND.resource, id, min };
}

export function unknown(reason = '') {
  return { type: COND.unknown, reason };
}

/** Condition toujours vraie (unlock / coût absent). */
export function always() {
  return all();
}

export function isCondition(value) {
  return Boolean(value && typeof value === 'object' && value.type);
}

export function isLeaf(cond) {
  return cond && (cond.type === COND.node || cond.type === COND.stat
    || cond.type === COND.resource || cond.type === COND.unknown);
}

/** Normalise un coût saisi comme AST, { resource, amount } ou liste. */
export function normalizeCost(cost) {
  if (cost == null) return null;
  if (Array.isArray(cost)) {
    const parts = cost.map(c => normalizeCost(c)).filter(Boolean);
    if (!parts.length) return null;
    return parts.length === 1 ? parts[0] : all(...parts);
  }
  if (isCondition(cost)) return cost;
  if (cost.resource != null) return resource(cost.resource, cost.amount ?? cost.min ?? 1);
  return null;
}

export function collectNodeIds(cond, out = []) {
  if (!cond) return out;
  if (cond.type === COND.node && cond.id) out.push(cond.id);
  if (Array.isArray(cond.items)) {
    for (const child of cond.items) collectNodeIds(child, out);
  }
  return out;
}

export function walk(cond, visit) {
  if (!cond) return;
  visit(cond);
  if (Array.isArray(cond.items)) {
    for (const child of cond.items) walk(child, visit);
  }
}
