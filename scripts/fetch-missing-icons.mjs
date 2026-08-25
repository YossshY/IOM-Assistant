/** Fetch a few known-missing wiki icons. */
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function get(url, n = 0) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'IOM-Assistant/1.0' } }, (r) => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location && n < 8) {
        const next = r.headers.location.startsWith('http')
          ? r.headers.location
          : new URL(r.headers.location, url).href;
        return get(next, n + 1).then(resolve, reject);
      }
      const chunks = [];
      r.on('data', (d) => chunks.push(d));
      r.on('end', () => resolve({
        status: r.statusCode,
        buf: Buffer.concat(chunks),
        ctype: r.headers['content-type'] || '',
      }));
    }).on('error', reject);
  });
}

async function fetchFile(destRel, wikiName) {
  const dest = path.join(ROOT, destRel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const url = 'https://shminer.miraheze.org/wiki/Special:FilePath/' + encodeURIComponent(wikiName);
  const { status, buf, ctype } = await get(url);
  if (status === 200 && buf.length > 200 && /image|png|octet/i.test(ctype)) {
    fs.writeFileSync(dest, buf);
    return `ok ${buf.length}`;
  }
  return `fail ${status} ${buf.length}`;
}

const jobs = [
  ['assets/cards/Misc_Blue_Cow.png', 'Blue_Cow.png'],
  ['assets/cards/Misc_Blue_Cow.png', 'Misc_Blue_Cow.png'],
  ['assets/cards/Blue_Cow.png', 'Blue_Cow.png'],
  ['assets/cards/Transmuter_Bomb.png', 'Transmuter_Bomb.png'],
  ['assets/cards/Veinmorpher_Bomb.png', 'Veinmorpher_Bomb.png'],
  ['assets/cards/Misc_Celios_Hat.png', "Celio's_Hat.png"],
  ['assets/stargazing/Telescope.png', 'Telescope.png'],
  ['assets/stargazing/Super_Star.png', 'Super_Star.png'],
  ['assets/stargazing/Black_Hole.png', 'Black_Hole.png'],
  ['assets/stargazing/Star_Spawn.png', 'Star_Spawn_Rate.png'],
  ['assets/menu/Store_Button.png', 'Store_Button.png'],
  ['assets/menu/Arcanist_Button.png', 'Arcanist_Button.png'],
];

for (const [dest, wiki] of jobs) {
  const r = await fetchFile(dest, wiki);
  console.log(r.startsWith('ok') ? 'OK' : 'FAIL', dest, wiki, r);
}
