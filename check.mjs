/**
 * Self-check — node check.mjs
 * Vérifie parse + reco sur samples/exportstats-v2.2.6.json
 */
import { readFileSync } from 'fs';
import { parseExportStats, deriveProfile } from './src/game/statsParser.js';
import { generateRecommendations } from './src/game/recommendationEngine.js';
import { OBELISK, ARTIFACTS, artifactEffectiveMax } from './src/game/knowledgeBase.js';
import { workshopEffectiveMax, WORKSHOP_UPGRADES } from './src/game/workshopData.js';
import { estimateFreebieGemEv, estimatePickaxeGap } from './src/game/playerMath.js';
import { ORE_CARDS, BAR_CARDS, MISC_CARDS, VEIN_CARDS, ALL_CARDS } from './src/game/cardsData.js';
import { computeCapSnapshot, liveCaps, petEffectiveMax } from './src/game/capsEngine.js';
import { STORE_GEM_UPGRADES, STORE_GEM_UNLOCKS, STORE_PERKS } from './src/game/storeData.js';
import { PETS_FULL } from './src/game/petsData.js';
import { SITE_STORAGE_KEYS } from './src/game/siteBackup.js';
import { CHALLENGES } from './src/game/challengesData.js';

const raw = readFileSync('./samples/exportstats-v2.2.6.json', 'utf8');
const parsed = parseExportStats(raw);
if (!parsed.ok) throw new Error(parsed.error);

const profile = deriveProfile(parsed);
const assert = (cond, msg) => { if (!cond) throw new Error('FAIL: ' + msg); };

assert(profile.obeliskLevel === 64, `OB expected 64 got ${profile.obeliskLevel}`);
assert(OBELISK.armor(1) === 5, `OB1 armor expected 5 got ${OBELISK.armor(1)}`);
assert(Math.abs(OBELISK.health(61) / 2.025830639297552e33 - 1) < 0.01, 'OB61 health formula');
assert(profile.w4Open === false, 'W4 should be closed');
assert(profile.maxWorld === 3, `maxWorld expected 3 got ${profile.maxWorld}`);
assert(profile.statueStates[1] === 3, 'W1 statue 1 platinized');
assert(profile.statueStates[10] === 3, 'W3 statue 10 platinized');
assert(profile.statueStates[19] === 0, 'W4 statue 19 empty');
assert(profile.canDamageNext === false, 'base pickaxe should be under OB65 armor (items close gaps in-fight)');
assert(parsed.unknownKeys.length === 0, `unknown keys: ${parsed.unknownKeys.join(',')}`);

const recs = generateRecommendations(parsed.stats, profile, {
  statueStates: profile.statueStates,
  monuments: profile.monuments,
});
const titles = recs.map(r => r.title);
assert(titles.some(t => /Monument World 4/i.test(t)), 'should recommend W4 monument');
assert(titles.some(t => /Contexte : écart OB65|Radioactive Slug|Legendary Fish/i.test(t)), 'should give armor context or card lever, not just beat OB');
assert(!titles.some(t => /^Briser l'armure/i.test(t)), 'should NOT top-line "Briser l\'armure" as the goal');
assert(!titles.some(t => /Fueler le drone|Alimenter le drone/i.test(t)), 'no false drone fuel alert');

/* Avec Slug gilded → poly doit être #1 (ou prio 1) */
const recsSlug = generateRecommendations(parsed.stats, profile, {
  statueStates: profile.statueStates,
  monuments: profile.monuments,
  cards: { fish_radioactive_slug: 2 },
});
assert(/Polychromer Radioactive Slug/i.test(recsSlug[0]?.title || ''), `expected poly slug first, got: ${recsSlug[0]?.title}`);

const freebie = estimateFreebieGemEv(parsed.stats);
assert(freebie.gemsPerHour > 0, 'freebie EV should be positive');
const gap = estimatePickaxeGap(parsed.stats, profile);
assert(gap?.blocked === true, 'sample should be blocked on OB65');
assert(gap.needMulti > 1, 'need multi > 1');
assert(gap.noticeLevelsNeeded > 0, 'notice levels estimate');
console.log('Freebie ~', freebie.gemsPerHour, 'g/h · need ×', gap.needMulti, '· notice ~', gap.noticeLevelsNeeded);

const caps = {
  artifact: parsed.stats.artifact_cap_increase,
  artifactT4: parsed.stats.artifact_tier4_cap_increase,
  workshop: parsed.stats.bomb_workshop_cap_increase,
};
assert(artifactEffectiveMax(ARTIFACTS.find(a => a.id === 'pick_t1'), parsed.stats, caps) === 39, 'T1 pick max 32+7');
assert(artifactEffectiveMax(ARTIFACTS.find(a => a.id === 'armorred'), parsed.stats, caps) === 24, 'T3 armor max 17+7');
assert(artifactEffectiveMax(ARTIFACTS.find(a => a.id === 'statue_dmg'), parsed.stats, caps) === 59, 'T4 pick max 32+7+20');
assert(artifactEffectiveMax(ARTIFACTS.find(a => a.id === 'omega_crit'), parsed.stats, caps) === 44, 'T4 omega max 17+7+20');
const ham = WORKSHOP_UPGRADES.find(u => u.id === 'hamburger');
assert(workshopEffectiveMax(ham, caps) === 42, `hamburger max expected 42 got ${workshopEffectiveMax(ham, caps)}`);
const chain = WORKSHOP_UPGRADES.find(u => u.id === 'basic_chain_dmg');
assert(workshopEffectiveMax(chain, caps) === 25, `chain max expected 25 got ${workshopEffectiveMax(chain, caps)}`);

assert(ORE_CARDS.length === 86, `86 ore cards, got ${ORE_CARDS.length}`);
assert(BAR_CARDS.length === 77, `77 bar cards, got ${BAR_CARDS.length}`);
assert(MISC_CARDS.length === 45, `45 misc cards, got ${MISC_CARDS.length}`);
assert(VEIN_CARDS.some(c => c.id === 'veins_volcano'), 'Volcano vein card');
assert(ALL_CARDS.some(c => c.id === 'misc_relic'), 'Relic misc card');
assert(ALL_CARDS.some(c => c.id === 'fish_glacial_shellstealer' && c.icon), 'Glacial icon');

/* Store catalogue + export : niveaux absents, seul le cap total est là */
assert(STORE_PERKS.length === 4, '4 perks');
assert(STORE_GEM_UNLOCKS.length === 4, '4 gem unlocks');
assert(STORE_GEM_UPGRADES.find(u => u.id === 'pickaxe').baseMax === 10, 'pickaxe gem upgrade base 10');
assert(parsed.stats.gem_upgrade_cap_increase === 12, 'sample gem upgrade cap +12');
assert(!('store_pickaxe_level' in parsed.stats), 'store levels not in export');
assert(CHALLENGES.divine.find(c => c.id === 'div_7').exportKey === 'golden_lootfrogs_caught', 'div_7 uses export frogs');
assert(parsed.stats.golden_lootfrogs_caught === 7, 'sample golden frogs 7');
assert(SITE_STORAGE_KEYS.includes('iom_collections'), 'site backup keys');

/* Caps live : export seul */
const fromExport = computeCapSnapshot({}, parsed.stats);
assert(fromExport.artifact.current === 7, `artifact cap export 7 got ${fromExport.artifact.current}`);
assert(fromExport.artifactT4.current === 20, `T4 cap export 20 got ${fromExport.artifactT4.current}`);
assert(fromExport.workshop.current === 17, `workshop cap export 17 got ${fromExport.workshop.current}`);
assert(fromExport.gemUpgrade.current === 12, `gem cap export 12 got ${fromExport.gemUpgrade.current}`);
assert(fromExport.contract.current === 11, `contract cap export 11 got ${fromExport.contract.current}`);

/* Pet Happy-Bot +5 sans export → T4 current 5 (plus de valeur en dur) */
const petCol = { pets: { Happybot: 5 } };
const petSnap = computeCapSnapshot(petCol, {});
assert(petSnap.artifactT4.current === 5, `Happy-Bot 5 → T4 +5 got ${petSnap.artifactT4.current}`);
const crab = PETS_FULL.find(p => p.id === 'Crab');
assert(petEffectiveMax(crab, { stars: { pisces: 2 }, statueStates: { 3: 3, 15: 3 }, challengeShop: { e_pet_cap: 1 }, petUnlocks: { skin_Dino: true } }, {}) === 25 + 8,
  'pet max = base 25 + pisces2 + slaying1 + feline3 + shop1 + dino1');

/* Sources itemisées artefacts = skill + carte poly + slaying plat → 7 */
const artCol = {
  skills: { upgrades_end: 1 },
  cards: { pets_happybot: 3 },
  statueStates: { 3: 3 },
};
const artSnap = computeCapSnapshot(artCol, {});
assert(artSnap.artifact.itemized === 7, `itemized artifact 7 got ${artSnap.artifact.itemized}`);
assert(artSnap.artifact.current === 7, 'current uses itemized when no export');

/* Gem upgrades : hygiene plat + craft plat + minos 5 = 12 */
const gemCol = { statueStates: { 6: 3, 10: 3 }, arch: { idols: { minos: 5 } } };
const gemSnap = computeCapSnapshot(gemCol, {});
assert(gemSnap.gemUpgrade.itemized === 12, `itemized gem 12 got ${gemSnap.gemUpgrade.itemized}`);
const live = liveCaps(gemCol, {});
assert(STORE_GEM_UPGRADES[0].baseMax + live.gemUpgrade === 22, 'pickaxe gem max 10+12');

/* max(itemized, export) : pet 5 n'écrase pas un export T4 à 20 */
assert(computeCapSnapshot(petCol, parsed.stats).artifactT4.current === 20, 'export 20 wins over pet 5');
assert(computeCapSnapshot({ pets: { Happybot: 21 } }, parsed.stats).artifactT4.current === 21, 'post-export pet 21 raises T4');

console.log('OK');
console.log('OB', profile.obeliskLevel, 'W', profile.maxWorld, 'unknown', parsed.unknownKeys.length);
console.log('Recs:');
for (const r of recs) console.log(`  [${r.priority}] ${r.confidence} ${r.title}`);
