/**
 * Lance les tests du moteur (étapes A–M).
 * node src/game/progress/run-tests.mjs
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = dirname(fileURLToPath(import.meta.url));
const files = ['progress.test.mjs', 'skillTree.test.mjs', 'polyInfernal.test.mjs', 'construct.test.mjs', 'docks.test.mjs', 'fishing.test.mjs', 'fromExport.test.mjs', 'plan.j1.test.mjs', 'plan.j2.test.mjs', 'plan.j3.test.mjs', 'dashboard.k.test.mjs', 'dashboard.l.test.mjs', 'dashboard.m.test.mjs'];
let failed = false;
for (const f of files) {
  console.log(`\n>>> ${f}`);
  const r = spawnSync(process.execPath, [join(dir, f)], { stdio: 'inherit' });
  if (r.status) failed = true;
}
process.exit(failed ? 1 : 0);
