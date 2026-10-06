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
import { applyExportArrays, listUnmappedSkillNodes, SKILL_EXPORT_ORDER, DRONE_SUIT_EXPORT_INDEX } from './src/game/exportArrays.js';
import { SKILL_NODES } from './src/game/skillsData.js';
import { getSkillLevel, getWorkshopLevel, getPetLevel, getFishLv, getCardState, getStarLevel, getStarUpgrade, getDroneSuitLv, getArchLv, hasResearchUnlock, getChallengeShop } from './src/game/collections.js';

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
assert(artifactEffectiveMax(ARTIFACTS.find(a => a.id === 'statue_dmg'), parsed.stats, caps) === 52, 'T4 pick max 52');
assert(artifactEffectiveMax(ARTIFACTS.find(a => a.id === 'omega_crit'), parsed.stats, caps) === 37, 'T4 omega max 37');
const ham = WORKSHOP_UPGRADES.find(u => u.id === 'hamburger');
assert(workshopEffectiveMax(ham, caps) === 42, `hamburger max expected 42 got ${workshopEffectiveMax(ham, caps)}`);
const chain = WORKSHOP_UPGRADES.find(u => u.id === 'basic_chain_dmg');
assert(workshopEffectiveMax(chain, caps) === 25, `chain max expected 25 got ${workshopEffectiveMax(chain, caps)}`);

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
assert(getCardState(col30, 'fish_radioactive_slug') === 3, 'slug poly');
assert(getFishLv(col30, 'legendary', 'radioactive_slug') === 2, 'slug tribute 2');
assert(getFishLv(col30, 'notice', 'n1_pick_bomb') === 28, 'notice pick');
assert(getFishLv(col30, 'notice', 'n2_midas') === 1, 'midas notice');
assert(getFishLv(col30, 'upgrades', 'u1_rod') === 60, 'rod upgrade');
assert(getStarLevel(col30, 'cancer') === 48, 'cancer 48');
assert(getStarUpgrade(col30, 'ss_spawn') === 25, 'ss spawn over base cap');
assert(getDroneSuitLv(col30, 'elixir') === 15, 'elixir suit');
assert(getDroneSuitLv(col30, 'prism') === 0, 'prism suit');
assert(getArchLv(col30, 'idols', 'minos') === 500, 'minos 500');
assert(hasResearchUnlock(col30, 'wonderland') === true, 'wonderland researched');
assert(hasResearchUnlock(col30, 'pirate') === false, 'pirate not researched');
assert(getChallengeShop(col30, 'r_bomb_cap') === 1, 'challenge bomb cap');
assert(getChallengeShop(col30, 'r_bar_craft') === 2, 'challenge bar craft');
assert(getChallengeShop(col30, 'e_gold_floor') === 2, 'extreme gold floor');

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

console.log('OK v2.2.30');
console.log('OB', profile30.obeliskLevel, 'floor', profile30.currentFloor, 'W', profile30.maxWorld, 'BH', profile30.blackHoleLevel);
console.log('Recs v2.2.30:');
for (const r of recs30.filter(r => r.priority > 0).slice(0, 8)) console.log(`  [${r.priority}] ${r.title}`);
