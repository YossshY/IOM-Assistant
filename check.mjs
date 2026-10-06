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
import { ORE_CARDS, BAR_CARDS, MISC_CARDS, VEIN_CARDS, FISH_CARDS, ALL_CARDS } from './src/game/cardsData.js';
import { computeCapSnapshot, liveCaps, petEffectiveMax, petHardMax, PET_LEVEL_BASE, starCapInfo, noticeT1Max } from './src/game/capsEngine.js';
import { NOTICE_UPGRADES_T1 } from './src/game/fishingData.js';
import { ARCH_IDOLS } from './src/game/archaeologyData.js';
import { STORE_GEM_UPGRADES, STORE_GEM_UNLOCKS, STORE_PERKS } from './src/game/storeData.js';
import { PETS_FULL } from './src/game/petsData.js';
import { STARS_FULL } from './src/game/starsData.js';
import { SITE_STORAGE_KEYS } from './src/game/siteBackup.js';
import { CHALLENGES } from './src/game/challengesData.js';
import { applyExportArrays, listUnmappedSkillNodes, SKILL_EXPORT_ORDER, DRONE_SUIT_EXPORT_INDEX } from './src/game/exportArrays.js';
import { SKILL_NODES } from './src/game/skillsData.js';
import { getSkillLevel, getWorkshopLevel, getPetLevel, getFishLv, getCardState, getStarLevel, getStarUpgrade, getDroneSuitLv, getArchLv, hasResearchUnlock, getChallengeShop, isDockUnlocked, hasBlackHoleBlessing } from './src/game/collections.js';

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
assert(artifactEffectiveMax(ARTIFACTS.find(a => a.id === 'pick_t1'), parsed.stats, caps) === 32, 'T1 pick wiki 32 (cap +7 déjà dans la table)');
assert(artifactEffectiveMax(ARTIFACTS.find(a => a.id === 'armorred'), parsed.stats, caps) === 17, 'T3 armor wiki 17');
assert(artifactEffectiveMax(ARTIFACTS.find(a => a.id === 'statue_dmg'), parsed.stats, caps) === 52, 'T4 pick wiki 52 = 32-7+7+20');
assert(artifactEffectiveMax(ARTIFACTS.find(a => a.id === 'omega_crit'), parsed.stats, caps) === 37, 'T4 omega wiki 37');
assert(artifactEffectiveMax(ARTIFACTS.find(a => a.id === 'pick_t1'), {}, { artifact: 0 }) === 25, 'T1 pick sans cap = 25');
assert(artifactEffectiveMax(ARTIFACTS.find(a => a.id === 'pick_t1'), {}, { artifact: 8 }) === 33, 'T1 pick cap +8 = 33');
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
const crabGlobals = { stars: { pisces: 2 }, statueStates: { 3: 3, 15: 3 }, challengeShop: { e_pet_cap: 1 }, petUnlocks: { skin_Dino: true } };
assert(PET_LEVEL_BASE === 10, 'pet base wiki 10');
assert(petEffectiveMax(crab, crabGlobals, {}) === 10 + 8,
  'crab current = base 10 + pisces2 + slaying1 + feline3 + shop1 + dino1');
assert(petEffectiveMax(crab, { ...crabGlobals, fishing: { legendary: { storm_serpent: 1 } } }, {}) === 10 + 8 + 5,
  'Storm Serpent T1 +5 Crab cap raises current max');
assert(petHardMax(crab, {}, {}) === 10 + 4 + 1 + 3 + 1 + 1 + 5,
  'crab hard = base + pisces4 + slaying + feline + shop + dino + storm5 = 25');

const cancer = STARS_FULL.find(s => s.id === 'cancer');
assert(starCapInfo(cancer, {}).current === 20, 'cancer base 20');
assert(starCapInfo(cancer, { fishing: { legendary: { megalodon: 1 } } }).current === 30,
  'Megalodon T1 +10 Cancer cap');

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

console.log('OK v2.2.6');
console.log('OB', profile.obeliskLevel, 'W', profile.maxWorld, 'unknown', parsed.unknownKeys.length);

/* ---------- export v2.2.30 : tableaux de menus ---------- */
const knownSkillIds = new Set(SKILL_NODES.map(s => s.id));
for (const id of SKILL_EXPORT_ORDER) assert(knownSkillIds.has(id), `skill export id inconnu: ${id}`);
assert(SKILL_EXPORT_ORDER.length === 68, 'skill export order');

const raw30 = readFileSync('./samples/exportstats-v2.2.30.json', 'utf8');
const parsed30 = parseExportStats(raw30);
assert(parsed30.ok, parsed30.error);
assert(parsed30.versionKnown, 'v2.2.30 should be a known version');
assert(parsed30.unknownKeys.length === 0, `v2.2.30 unknown keys: ${parsed30.unknownKeys.join(',')}`);
const profile30 = deriveProfile(parsed30);
assert(profile30.obeliskLevel === 65, `OB30 expected 65 got ${profile30.obeliskLevel}`);
assert(profile30.maxWorld === 4, `W30 expected 4 got ${profile30.maxWorld}`);
assert(profile30.w4Open === true, 'W4 open via worlds_unlocked');
assert(profile30.currentFloor === 102, 'floor 102');
assert(profile30.blackHoleLevel === 10, 'black hole 10');
assert(profile30.w4QuestProgress === 1, 'w4 quests');

const col30 = { statueStates: profile30.statueStates, monuments: profile30.monuments };
applyExportArrays(col30, parsed30.stats);
assert(getSkillLevel(col30, 'gem_bomb') === 1, 'gem bomb from array');
assert(getSkillLevel(col30, 'fishing_friends') === 3, 'fishing friends lv 3');
assert(getSkillLevel(col30, 'stars_mining') === 0, 'stars mining not bought');
assert(getSkillLevel(col30, 'fronks') === 0, 'fronks not bought');
assert(listUnmappedSkillNodes(parsed30.stats).some(x => x.name === 'Ctrl + S Stars' && x.level === 1), 'extra skill');
assert(getWorkshopLevel(col30, 'hamburger') === 43, 'hamburger');
assert(getWorkshopLevel(col30, 'morph_chance') === 43, 'morph remapped');
assert(getWorkshopLevel(col30, 'bomb_dmg_w2') === 38, 'w2 bomb remapped');
assert(getWorkshopLevel(col30, 'basic_chain_dmg') === 26, 'chain dmg');
assert(getWorkshopLevel(col30, 'wizard_loot') === 0, 'wizard still 0');
assert(getPetLevel(col30, 'Leprechaun') === 25, 'leprechaun 25');
assert(FISH_CARDS.length === 44, `44 fish cards, got ${FISH_CARDS.length}`);
assert(FISH_CARDS[0].id === 'fish_guppy' && FISH_CARDS[7].id === 'fish_scarab', 'fish export order lake/desert');
assert(FISH_CARDS[36].id === 'fish_lantern' && FISH_CARDS[43].id === 'fish_dark_dragon', 'fish export order solaris/galaxy');
assert(getCardState(col30, 'fish_guppy') === 3, 'guppy poly');
assert(getCardState(col30, 'fish_molten') === 3, 'molten poly');
assert(getCardState(col30, 'fish_lantern') === 2, 'lantern gilded');
assert(getCardState(col30, 'fish_dark_dragon') === 2, 'galaxy fish gilded');
assert(getCardState(col30, 'fish_radioactive_slug') === 3, 'slug poly');
assert(isDockUnlocked(col30, 'cave'), 'cave dock via T2 boat');
assert(isDockUnlocked(col30, 'sky'), 'sky dock via T2 boat');
assert(isDockUnlocked(col30, 'solaris'), 'solaris dock via T2 boat');
assert(isDockUnlocked(col30, 'galaxy'), 'galaxy dock via T2 boat');
assert(getFishLv(col30, 'legendary', 'radioactive_slug') === 2, 'slug tribute 2');
assert(getFishLv(col30, 'notice', 'n1_pick_bomb') === 28, 'notice pick');
assert(getFishLv(col30, 'notice', 'n1_exp') === 30, 'notice exp 30');
assert(getFishLv(col30, 'notice', 'n1_pet_lvl') === 20, 'notice pet 20');
{
  const byId = id => NOTICE_UPGRADES_T1.find(u => u.id === id);
  assert(noticeT1Max(byId('n1_exp'), col30) === 33, 'exp cap 33');
  assert(noticeT1Max(byId('n1_pet_lvl'), col30) === 23, 'pet cap 23');
  assert(noticeT1Max(byId('n1_pick_bomb'), col30) === 28, 'pick live cap 28');
  assert(noticeT1Max(byId('n1_rainbow_floor'), col30) === 1, 'rainbow floor cap stays 1');
}
assert(getFishLv(col30, 'notice', 'n2_midas') === 1, 'midas notice');
assert(getFishLv(col30, 'upgrades', 'u1_rod') === 60, 'rod upgrade');
assert(getStarLevel(col30, 'cancer') === 48, 'cancer 48');
assert(getStarUpgrade(col30, 'ss_spawn') === 25, 'ss spawn over base cap');
assert(getDroneSuitLv(col30, 'elixir') === 15, 'elixir suit');
assert(getDroneSuitLv(col30, 'prism') === 0, 'prism suit');
{
  const idxs = ARCH_IDOLS.map(i => i.exportIndex).filter(i => i != null);
  assert(new Set(idxs).size === 24 && idxs.length === 24, '24 idol export indexes');
}
assert(getArchLv(col30, 'idols', 'athena') === 500, 'athena 500');
assert(getArchLv(col30, 'idols', 'cassandra') === 150, 'cassandra');
assert(getArchLv(col30, 'idols', 'eros') === 50, 'eros');
assert(getArchLv(col30, 'idols', 'hera') === 3, 'hera 3');
assert(getArchLv(col30, 'idols', 'astraeus') === 1000, 'astraeus');
assert(getArchLv(col30, 'idols', 'minos') === 5, 'minos 5');
assert(getArchLv(col30, 'idols', 'chione') === 800, 'chione');
assert(getArchLv(col30, 'idols', 'talos') === 750, 'talos');
assert(getArchLv(col30, 'idols', 'aphrodite') === 800, 'aphrodite');
assert(getArchLv(col30, 'idols', 'tethys') === 800, 'tethys');
assert(getArchLv(col30, 'idols', 'hestia') === 0, 'hestia ob66');
assert(getArchLv(col30, 'idols', 'hermes') === 0, 'hermes ob66');
assert(hasBlackHoleBlessing(col30, 'bh_frogger'), 'bh tier 1');
assert(hasBlackHoleBlessing(col30, 'bh_t2_dock'), 'bh tier 10');
assert(!hasBlackHoleBlessing(col30, 'bh_rainbow_void'), 'bh tier 11 still locked');
assert(hasResearchUnlock(col30, 'wonderland') === true, 'wonderland researched');
assert(hasResearchUnlock(col30, 'pirate') === false, 'pirate not researched');
assert(getChallengeShop(col30, 'r_bomb_cap') === 1, 'challenge bomb cap');
assert(getChallengeShop(col30, 'r_bar_craft') === 2, 'challenge bar craft');
assert(getChallengeShop(col30, 'e_gold_floor') === 2, 'extreme gold floor');

const dockProbe = {};
applyExportArrays(dockProbe, {
  fishing_upgrades_array: [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
  fishing_legendary_tribute_levels_array: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
});
assert(isDockUnlocked(dockProbe, 'lake'), 'lake via boat');
assert(isDockUnlocked(dockProbe, 'desert'), 'desert at boat 1');
assert(!isDockUnlocked(dockProbe, 'tundra'), 'tundra still locked at boat 1');
assert(isDockUnlocked(dockProbe, 'volcano'), 'volcano at T2 boat 2');
assert(!isDockUnlocked(dockProbe, 'sky'), 'sky locked at T2 boat 2');

const suitProbe = {};
applyExportArrays(suitProbe, { drones_suit_level_array: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] });
assert(getDroneSuitLv(suitProbe, 'bear') === 1, 'bear index 0');
assert(getDroneSuitLv(suitProbe, 'elixir') === DRONE_SUIT_EXPORT_INDEX.elixir + 1, 'elixir index');
assert(getDroneSuitLv(suitProbe, 'starburst') === 6, 'starburst index 5');
assert(getDroneSuitLv(suitProbe, 'veinseeker') === 7, 'veinseeker index 6');

const recs30 = generateRecommendations(parsed30.stats, profile30, col30);
const titles30 = recs30.map(r => r.title);
assert(titles30.some(t => /Statues World 4/i.test(t)), 'should push W4 statues');
assert(!titles30.some(t => /Monument World 4/i.test(t)), 'monument already unlocked');
assert(!titles30.some(t => /Polychromer Radioactive Slug/i.test(t)), 'slug already poly');
assert(!titles30.some(t => /Notice Pickaxe & Bomb/i.test(t)), 'pick notice already at live cap');

console.log('OK v2.2.30');
console.log('OB', profile30.obeliskLevel, 'floor', profile30.currentFloor, 'W', profile30.maxWorld, 'BH', profile30.blackHoleLevel);
console.log('Recs v2.2.30:');
for (const r of recs30.filter(r => r.priority > 0).slice(0, 8)) console.log(`  [${r.priority}] ${r.title}`);
