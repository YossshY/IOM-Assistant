/* ============================================================
   capsEngine.js — Caps d'upgrades : exportstats + saisie site
   currentBonus = max(sources itemisées, total export) pour ne pas double-compter.
   Wiki Stats : Artifact / T4 / Workshop / Gem Upgrade / Contract / Pet Level Cap.
   ============================================================ */
import * as C from './collections.js';
import { PETS_FULL } from './petsData.js';
import { STARS_FULL } from './starsData.js';

function n(v){ return Math.max(0, +v || 0); }

function statueLv(col, num){ return C.getStatueState(col, num) | 0; }

/** byState[0 unused] = built / gilded / plat */
function statueAmt(col, num, byState){
  const st = statueLv(col, num);
  if (st <= 0) return 0;
  return n(byState[st]);
}
function statueMax(byState){ return n(byState[3] ?? byState[2] ?? byState[1]); }

function cardAmt(col, id, values){
  const st = C.getCardState(col, id);
  if (st <= 0) return 0;
  return n(values[Math.min(st, values.length) - 1]);
}

function skillOn(col, id){ return C.hasSkill(col, id) ? 1 : 0; }

function petLv(col, id){ return C.getPetLevel(col, id) | 0; }

function skinOn(col, petId){ return !!(col.petUnlocks || {})['skin_' + petId]; }

function starLv(col, id){ return C.getStarLevel(col, id) | 0; }

function idolLv(col, id){ return C.getArchLv(col, 'idols', id) | 0; }

function shopLv(col, id){ return C.getChallengeShop(col, id) | 0; }

function source(label, current, max, how){
  return { label, current: n(current), max: n(max), how: how || '' };
}

function fold(sources, exportVal, exportKey){
  const itemized = sources.reduce((a, s) => a + s.current, 0);
  const potential = sources.reduce((a, s) => a + s.max, 0);
  const exp = n(exportVal);
  const current = Math.max(itemized, exp);
  return { current, potential, itemized, exportVal: exp, exportKey, sources };
}

function tooltipOf(pack, title){
  const lines = [
    `${title} : +${pack.current} en cours (max possible +${pack.potential})`,
  ];
  if (pack.exportKey) {
    lines.push(`Export ${pack.exportKey} : +${pack.exportVal}`);
    if (pack.itemized !== pack.exportVal) {
      lines.push(`Sources notées sur le site : +${pack.itemized}` +
        (pack.itemized < pack.exportVal
          ? ' — complète pets/statues/skills/cartes pour ventiler le total export.'
          : ' — au-dessus de l\'export (progress post-import).'));
    }
  }
  for (const s of pack.sources) {
    const mark = s.current >= s.max && s.max > 0 ? '✓' : s.current > 0 ? '·' : '○';
    lines.push(`${mark} ${s.label} : +${s.current}/+${s.max}${s.how ? ' — ' + s.how : ''}`);
  }
  return lines.join('\n');
}

/**
 * Snapshot de toutes les caps « +N ».
 * stats = bloc exportstats.stats (optionnel).
 */
export function computeCapSnapshot(col = {}, stats = {}) {
  const exp = {
    artifact: n(stats.artifact_cap_increase ?? col.caps?.artifact),
    artifactT4: n(stats.artifact_tier4_cap_increase ?? col.caps?.artifactT4),
    workshop: n(stats.bomb_workshop_cap_increase ?? col.caps?.workshop),
    gemUpgrade: n(stats.gem_upgrade_cap_increase ?? col.caps?.gemUpgrade),
    contract: n(stats.contract_cap_increase ?? col.caps?.contract),
  };

  const petLevel = fold([
    source('Pisces (Stargazing)', starLv(col, 'pisces'), 2, '+1 / niveau'),
    source('Statue Slaying platinisée', statueLv(col, 3) >= 3 ? 1 : 0, 1, 'uniquement plat'),
    source('Statue Feline', statueAmt(col, 15, [0, 1, 2, 3]), 3, '+1 / +2 / +3'),
    source('Shop Extreme : Pet Level Cap', shopLv(col, 'e_pet_cap') > 0 ? 1 : 0, 1, '+1'),
    source('Skin Dino (Drumstick)', skinOn(col, 'Dino') ? 1 : 0, 1, '+1 Pet Level Cap'),
  ], 0, null);

  const artifact = fold([
    source('Skill « Do These Upgrades Ever End »', skillOn(col, 'upgrades_end'), 1, '+1'),
    source('Carte Happy-Bot', cardAmt(col, 'pets_happybot', [1, 2, 3]), 3, '+1 / +2 / +3'),
    source('Statue Slaying', statueAmt(col, 3, [0, 1, 2, 3]), 3, '+1 / +2 / +3'),
  ], exp.artifact, 'artifact_cap_increase');

  const happyMax = (PETS_FULL.find(p => p.id === 'Happybot')?.maxLevel || 20) + petLevel.potential;
  const artifactT4 = fold([
    source('Pet Happy-Bot', petLv(col, 'Happybot'), happyMax, '+1 T4 / niveau'),
  ], exp.artifactT4, 'artifact_tier4_cap_increase');

  const leo = STARS_FULL.find(s => s.id === 'leo');
  const workshop = fold([
    source('Skill « Do These Upgrades Ever End »', skillOn(col, 'upgrades_end'), 1, '+1'),
    source('Skill « Idle Obelisk Mincer »', skillOn(col, 'ob_mincer'), 1, '+1'),
    source('Skin Crab (Sizzle McSnaps)', skinOn(col, 'Crab') ? 1 : 0, 1, '+1'),
    source('Statue Hygiene', statueAmt(col, 6, [0, 2, 3, 4]), 4, '+2 / +3 / +4'),
    source('Statue Propulsion', statueAmt(col, 11, [0, 1, 2, 3]), 3, '+1 / +2 / +3'),
    source('Statue Nature (W4)', statueLv(col, 22) >= 1 ? 4 : 0, 4, '+4 si construite'),
    source('Leo (Stargazing)', starLv(col, 'leo'), leo?.maxBase || 3, '+1 / niveau'),
    source('Tribute Radioactive Slug 1', (C.getFishLv(col, 'legendary', 'radioactive_slug') | 0) >= 1 ? 3 : 0, 3, '+3 dès rang 1'),
  ], exp.workshop, 'bomb_workshop_cap_increase');

  const gemUpgrade = fold([
    source('Statue Hygiene', statueAmt(col, 6, [0, 1, 2, 4]), 4, '+1 / +2 / +4'),
    source('Statue Craftmanship', statueAmt(col, 10, [0, 1, 2, 3]), 3, '+1 / +2 / +3'),
    source('Idole Minos', Math.min(5, idolLv(col, 'minos')), 5, '+1 / niveau, cap +5'),
  ], exp.gemUpgrade, 'gem_upgrade_cap_increase');

  const contract = fold([
    source('Skill « Idle Obelisk Mincer »', skillOn(col, 'ob_mincer'), 1, '+1'),
    source('Skin Happy-Bot (Unhappy-Bot)', skinOn(col, 'Happybot') ? 1 : 0, 1, '+1'),
    source('Statue Childhood', statueAmt(col, 9, [0, 1, 2, 4]), 4, '+1 / +2 / +4'),
    source('Statue Affluence', statueAmt(col, 16, [0, 1, 2, 3]), 3, '+1 / +2 / +3'),
    source('Idole Hera', idolLv(col, 'hera'), 3, '+1 / niveau, cap 3'),
    source('Idole Hermes', idolLv(col, 'hermes'), 1000, '+1 / niveau, cap 1000'),
  ], exp.contract, 'contract_cap_increase');

  const packs = { artifact, artifactT4, workshop, gemUpgrade, contract, petLevel };
  for (const [k, p] of Object.entries(packs)) {
    p.tooltip = tooltipOf(p, ({
      artifact: 'Cap artefacts (tous tiers)',
      artifactT4: 'Cap artefacts T4 (en plus du général)',
      workshop: 'Cap Workshop',
      gemUpgrade: 'Cap Gem Upgrades (Store)',
      contract: 'Cap upgrades Contrats',
      petLevel: 'Cap niveau pets',
    })[k]);
  }
  return packs;
}

/** Compat getCaps : totaux courants à brancher sur artifactEffectiveMax / workshopEffectiveMax. */
export function liveCaps(col = {}, stats = {}) {
  const s = computeCapSnapshot(col, stats);
  return {
    artifact: s.artifact.current,
    artifactT4: s.artifactT4.current,
    workshop: s.workshop.current,
    gemUpgrade: s.gemUpgrade.current,
    contract: s.contract.current,
    petLevel: s.petLevel.current,
    droneSuit: n(stats.drone_suit_cap ?? col.caps?.droneSuit),
    snapshot: s,
  };
}

export function petEffectiveMax(pet, col = {}, stats = {}) {
  const extra = liveCaps(col, stats).petLevel;
  return (pet.maxLevel || 20) + extra;
}

export function petHardMax(pet, col = {}, stats = {}) {
  const snap = computeCapSnapshot(col, stats);
  return (pet.maxLevel || 20) + snap.petLevel.potential;
}
