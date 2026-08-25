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

console.log('OK');
console.log('OB', profile.obeliskLevel, 'W', profile.maxWorld, 'unknown', parsed.unknownKeys.length);
console.log('Recs:');
for (const r of recs) console.log(`  [${r.priority}] ${r.confidence} ${r.title}`);
