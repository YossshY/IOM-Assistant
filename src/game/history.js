/* ============================================================
   history.js — Historique local des exports (localStorage)
   Compare deux exports : deltas des stats communes + nouvelles
   statistiques apparues entre les versions.
   ============================================================ */
const KEY = 'iom_assistant_history';
const PROFILE_KEY = 'iom_assistant_profile';

export function loadHistory() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
export function saveImport(parsed) {
  const h = loadHistory();
  h.unshift({
    importedAt: parsed.importedAt,
    version: parsed.version,
    statCount: parsed.statCount,
    unknownKeys: parsed.unknownKeys,
    stats: parsed.stats,
  });
  // garde les 20 derniers
  localStorage.setItem(KEY, JSON.stringify(h.slice(0, 20)));
  return h;
}
export function loadProfileStore() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}'); } catch { return {}; }
}
export function saveProfileStore(p) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

/**
 * diffExports(oldParsed, newParsed) -> {
 *   changed: [{key, label, from, to, dir}],
 *   added:   [{key, value}],   // stats présentes uniquement dans le nouveau
 *   removed: [keys]
 * }
 */
function statEqual(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }
  return a === b;
}

export function diffExports(a, b) {
  const sa = a?.stats || {}, sb = b?.stats || {};
  const changed = [], added = [], removed = [];
  for (const k of Object.keys(sb)) {
    if (!(k in sa)) { added.push({ key:k, value:sb[k] }); continue; }
    if (!statEqual(sa[k], sb[k])) changed.push({ key:k, label:k, from:sa[k], to:sb[k], dir: sb[k] > sa[k] ? 'up' : 'down' });
  }
  for (const k of Object.keys(sa)) if (!(k in sb)) removed.push(k);
  return { changed, added, removed };
}

/** Affiche un scalaire ou un tableau d'export sans le déplier. */
export function fmtStat(v) {
  if (Array.isArray(v)) return `[${v.length}]`;
  if (typeof v === 'boolean') return v ? 'oui' : 'non';
  if (typeof v === 'number') return fmtNum(v);
  return String(v);
}

/** Formate un nombre à la community (k/m/b/t/q/...) pour l'affichage. */
export function fmtNum(n) {
  if (!isFinite(n)) return String(n);
  const u=['','k','m','b','t','q','qi','sx','sp','oc','no','dc'];
  const i=Math.min(Math.floor(Math.log10(Math.abs(n))/3),u.length-1);
  return i<=0 ? String(Math.round(n)) : (n/Math.pow(1e3,i)).toFixed(2)+u[i];
}
