/* ============================================================
   siteBackup.js — import / export / reset des données locales du site
   (indépendant du JSON exportstats du jeu)
   ============================================================ */
export const SITE_STORAGE_KEYS = [
  'iom_collections',
  'iom_assistant_history',
  'iom_assistant_profile',
];

export function exportSiteData() {
  const storage = {};
  for (const k of SITE_STORAGE_KEYS) {
    const raw = localStorage.getItem(k);
    if (raw == null) continue;
    try { storage[k] = JSON.parse(raw); }
    catch { storage[k] = raw; }
  }
  return {
    kind: 'iom-assistant-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    storage,
  };
}

export function importSiteData(obj) {
  if (!obj || obj.kind !== 'iom-assistant-backup' || !obj.storage || typeof obj.storage !== 'object') {
    throw new Error('Fichier invalide — attendu un backup IOM Assistant (pas un exportstats).');
  }
  for (const k of SITE_STORAGE_KEYS) {
    if (!(k in obj.storage)) continue;
    const v = obj.storage[k];
    localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
  }
}

export function resetSiteData() {
  for (const k of SITE_STORAGE_KEYS) localStorage.removeItem(k);
}
