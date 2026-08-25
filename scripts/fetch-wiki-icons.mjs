/**
 * scripts/fetch-wiki-icons.mjs
 * Télécharge les icônes manquantes / 0 octets depuis le wiki miraheze.
 * Usage: node scripts/fetch-wiki-icons.mjs
 */
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function get(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, { headers: { 'User-Agent': 'IOM-Assistant/1.0 (wiki icon fetch)' } }, (r) => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location && redirects < 8) {
        const next = r.headers.location.startsWith('http')
          ? r.headers.location
          : new URL(r.headers.location, url).href;
        return get(next, redirects + 1).then(resolve, reject);
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

async function fetchFile(destRel, wikiFileName) {
  const dest = path.join(ROOT, destRel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (fs.existsSync(dest) && fs.statSync(dest).size > 100) return 'skip';
  const url = 'https://shminer.miraheze.org/wiki/Special:FilePath/' + encodeURIComponent(wikiFileName);
  try {
    const { status, buf, ctype } = await get(url);
    if (status === 200 && buf.length > 100 && /image|png|octet|webp/i.test(ctype || 'image')) {
      fs.writeFileSync(dest, buf);
      return `ok ${buf.length}`;
    }
    return `fail ${status} ${buf.length} ${ctype}`;
  } catch (e) {
    return `err ${e.message}`;
  }
}

/** Jobs: [localPath, wikiFileName] */
const jobs = [];

/* ---- Pets (fichiers 0 octets) ---- */
const petsDir = path.join(ROOT, 'assets/pets');
if (fs.existsSync(petsDir)) {
  for (const f of fs.readdirSync(petsDir)) {
    const p = path.join(petsDir, f);
    if (fs.statSync(p).isFile() && fs.statSync(p).size === 0) {
      jobs.push([`assets/pets/${f}`, f]);
    }
  }
}

/* ---- Cards référencées dans cardsData (manquantes) ---- */
const cardFiles = [
  'Chain_Bomb.png', 'Exp_Bomb.png', 'MEGABOMB.png', 'Infinity_Bomb.png', 'Gem_Bomb.png',
  'Cherry_Bomb.png', 'Battery_Bomb.png', 'D20_Bomb.png', 'Founders_Bomb.png', 'Veinmorpher_Bomb.png',
  'Transmuter_Bomb.png',
  'Magma_Vein.png', 'Virtual_Vein.png', 'Space_Vein.png', 'Atomic_Vein.png', 'Cloud_Vein.png',
  'Beach_Vein.png', 'Valley_Vein.png', 'Deepsea_Vein.png', 'Jungle_Vein.png', 'Jurassic_Vein.png',
  'Roman_Vein.png', 'Industrial_Vein.png', 'Warfront_Vein.png', 'Neon_Vein.png',
  'Wonderland_Vein.png', 'Enchanted_Vein.png', 'Candyland_Vein.png', 'Arabian_Vein.png', 'Pirate_Vein.png',
  'Taurus.png', 'Gemini.png', 'Cancer.png', 'Leo.png', 'Virgo.png', 'Libra.png', 'Scorpio.png',
  'Sagittarius.png', 'Capricorn.png', 'Pisces.png', 'Ophiuchus.png', 'Orion.png', 'Hercules.png',
  'Draco.png', 'Cetus.png', 'Phoenix.png', 'Eridanus.png', 'Lynx.png', 'Vulpecula.png',
  'Catfish.png', 'Gammangler_Fish.png', 'Lanternfish_Comet.png', 'Lunar_Sunfish.png',
  'Molten_Archerfish.png', 'Planetary_Jellyfish.png', 'Shocksailfish.png',
  'Frostdrip_Spearfish.png', 'Frostshell_Crab.png', 'Scarabshoe_Crab.png',
  'Desert_Legendary_Fish_Head.png', 'Ocean_Legendary_Fish_Head.png', 'Nuclear_Legendary_Fish_Head.png',
  'Abyss_Legendary_Fish_Head.png', 'Cave_Legendary_Fish_Head.png', 'Sky_Legendary_Fish_Head.png',
  'Solaris_Legendary_Fish_Head.png', 'Galaxy_Legendary_Fish_Head.png', 'Tundra_Legendary_Fish_Head.png',
  'Drone_Chain_Icon.png', 'Drone_Midas_Icon.png', 'Drone_Frogger_Icon.png', 'Drone_Veinseeker_Icon.png',
  'Drone_Starburst_Icon.png', 'Drone_Elixir_Icon.png', 'Drone_Void_Icon.png', 'Drone_Angler_Icon.png',
  'Drone_Prism_Icon.png', 'Drone_Minotaur_Icon.png',
  'Dwarf_Default.png', 'Duck_Default.png', 'Starfish_Default.png',
];
for (const f of cardFiles) jobs.push([`assets/cards/${f}`, f]);

/* ---- Drones (menu suits) ---- */
const droneIcons = [
  ['assets/drones/Drone_Bear_Icon.png', 'Drone_Bear_Icon.png'],
  ['assets/drones/Drone_Chain_Icon.png', 'Drone_Chain_Icon.png'],
  ['assets/drones/Drone_Midas_Icon.png', 'Drone_Midas_Icon.png'],
  ['assets/drones/Drone_Frogger_Icon.png', 'Drone_Frogger_Icon.png'],
  ['assets/drones/Drone_Veinseeker_Icon.png', 'Drone_Veinseeker_Icon.png'],
  ['assets/drones/Drone_Starburst_Icon.png', 'Drone_Starburst_Icon.png'],
  ['assets/drones/Drone_Elixir_Icon.png', 'Drone_Elixir_Icon.png'],
  ['assets/drones/Drone_Void_Icon.png', 'Drone_Void_Icon.png'],
  ['assets/drones/Drone_Angler_Icon.png', 'Drone_Angler_Icon.png'],
  ['assets/drones/Drone_Prism_Icon.png', 'Drone_Prism_Icon.png'],
  ['assets/drones/Drone_Minotaur_Icon.png', 'Drone_Minotaur_Icon.png'],
];
jobs.push(...droneIcons);

/* ---- Workshop (noms wiki) ---- */
const workshopIcons = [
  ['assets/workshop/Basic_Bomb.png', 'Basic_Bomb.png'],
  ['assets/workshop/Chain_Bomb.png', 'Chain_Bomb.png'],
  ['assets/workshop/Bomb_of_Plenty.png', 'Bomb_of_Plenty.png'],
  ['assets/workshop/Exp_Bomb.png', 'Exp_Bomb.png'],
  ['assets/workshop/MEGABOMB.png', 'MEGABOMB.png'],
  ['assets/workshop/Infinity_Bomb.png', 'Infinity_Bomb.png'],
  ['assets/workshop/Cherry_Bomb.png', 'Cherry_Bomb.png'],
  ['assets/workshop/D20_Bomb.png', 'D20_Bomb.png'],
  ['assets/workshop/Transmuter_Bomb.png', 'Transmuter_Bomb.png'],
  ['assets/workshop/Gem_Bomb.png', 'Gem_Bomb.png'],
  ['assets/workshop/Pickaxe_Damage.png', 'Pickaxe_Damage.png'],
  ['assets/workshop/Hamburger.png', 'Hamburger.png'],
  ['assets/workshop/Sushi.png', 'Sushi.png'],
  ['assets/workshop/Starfruit.png', 'Starfruit.png'],
  ['assets/workshop/Lootfrog.png', 'Lootfrog.png'],
  ['assets/workshop/Fuel.png', 'Fuel.png'],
  ['assets/workshop/Veinmorpher_Bomb.png', 'Veinmorpher_Bomb.png'],
  ['assets/workshop/Galactic_Void_Portal.png', 'Galactic_Void_Portal.png'],
  ['assets/workshop/Rainbow_Void_Portal.png', 'Rainbow_Void_Portal.png'],
  ['assets/workshop/Drone_Angler_Icon.png', 'Drone_Angler_Icon.png'],
  ['assets/workshop/Drone_Veinseeker_Icon.png', 'Drone_Veinseeker_Icon.png'],
  ['assets/workshop/Wizard_Loot_Multi.png', 'Wizard Loot Multi.png'],
];
jobs.push(...workshopIcons);

/* dédup */
const seen = new Set();
const unique = [];
for (const [dest, wiki] of jobs) {
  const k = dest + '|' + wiki;
  if (seen.has(k)) continue;
  seen.add(k);
  unique.push([dest, wiki]);
}

console.log('jobs', unique.length);
let ok = 0, skip = 0, fail = 0;
for (const [dest, wiki] of unique) {
  const r = await fetchFile(dest, wiki);
  if (r === 'skip') { skip++; continue; }
  if (r.startsWith('ok')) { ok++; console.log('OK', dest, r); }
  else { fail++; console.log('FAIL', dest, wiki, r); }
}
console.log('done ok', ok, 'skip', skip, 'fail', fail);
