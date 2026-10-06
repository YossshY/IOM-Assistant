/* ============================================================
   progress/compile.js — graphe + index (producers / progressors / reverse)
   ============================================================ */

import { KIND } from './ids.js';
import { always, collectNodeIds, normalizeCost } from './conditions.js';

function uniq(list) {
  return [...new Set(list)];
}

function emptyLists() {
  return { producersOf: Object.create(null), progressorsOf: Object.create(null), enabledBy: Object.create(null), dependsOn: Object.create(null) };
}

function pushIndex(map, key, id) {
  if (!key) return;
  if (!map[key]) map[key] = [];
  if (!map[key].includes(id)) map[key].push(id);
}

function findCycles(dependsOn, ids) {
  const cycles = [];
  const color = Object.create(null); // 0 white, 1 gray, 2 black
  const stack = [];

  function dfs(u) {
    color[u] = 1;
    stack.push(u);
    for (const v of dependsOn[u] || []) {
      if (color[v] === 1) {
        const i = stack.indexOf(v);
        if (i >= 0) cycles.push(stack.slice(i).concat(v));
      } else if (color[v] !== 2) {
        if (color[v] == null) color[v] = 0;
        dfs(v);
      }
    }
    stack.pop();
    color[u] = 2;
  }

  for (const id of ids) {
    if (!color[id]) dfs(id);
  }
  return cycles;
}

function normalizeNode(raw) {
  if (!raw || !raw.id) throw new Error('progress.compile: node without id');
  const kind = raw.kind || KIND.action;
  return {
    id: raw.id,
    name: raw.name || raw.id,
    kind,
    unlock: raw.unlock || always(),
    cost: normalizeCost(raw.cost),
    produces: Array.isArray(raw.produces) ? raw.produces.map(p => ({
      resource: p.resource,
      amount: p.amount,
      note: p.note,
    })) : [],
    progresses: Array.isArray(raw.progresses) ? raw.progresses.map(p => ({
      stat: p.stat,
      note: p.note,
    })) : [],
    blockedIf: raw.blockedIf || null,
  };
}

/**
 * Compile une liste de nœuds en graphe indexé.
 * @param {object[]|{ nodes: object[] }} input
 */
export function compileGraph(input) {
  const list = Array.isArray(input) ? input : (input?.nodes || []);
  const nodes = Object.create(null);
  const { producersOf, progressorsOf, enabledBy, dependsOn } = emptyLists();

  for (const raw of list) {
    const node = normalizeNode(raw);
    if (nodes[node.id]) throw new Error(`progress.compile: duplicate id ${node.id}`);
    nodes[node.id] = node;
  }

  for (const node of Object.values(nodes)) {
    dependsOn[node.id] = uniq(collectNodeIds(node.unlock));
    for (const dep of dependsOn[node.id]) {
      pushIndex(enabledBy, dep, node.id);
    }
    for (const p of node.produces) pushIndex(producersOf, p.resource, node.id);
    for (const p of node.progresses) pushIndex(progressorsOf, p.stat, node.id);
  }

  const allIds = uniq([
    ...Object.keys(nodes),
    ...Object.values(dependsOn).flat(),
  ]);
  const cycles = findCycles(dependsOn, allIds);

  return Object.freeze({
    nodes,
    producersOf,
    progressorsOf,
    enabledBy,
    dependsOn,
    cycles,
  });
}

export function getNode(graph, id) {
  return graph?.nodes?.[id] || null;
}
