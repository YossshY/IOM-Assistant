/* ============================================================
   capsEngine.js — Caps d'upgrades : exportstats + saisie site
   currentBonus = max(sources itemisées, total export) pour ne pas double-compter.
   Wiki Pets « Level Caps » : base 10 + sources globales (+10) + extras spécifiques.
   Wiki Stargazing « Star Level Caps » / Store Gem Upgrades.
   ============================================================ */
import * as C from './collections.js';
import { SUPER_STAR_UPGRADES } from './starsData.js';

function n(v){ return Math.max(0, +v || 0); }

function statueLv(col, num){ return C.getStatueState(col, num) | 0; }

/** byState[0 unused] = built / gilded / plat */
function statueAmt(col, num, byState){
  const st = statueLv(col, num);
  if (st <= 0) return 0;
  return n(byState[st]);
}

function cardAmt(col, id, values){
  const st = C.getCardState(col, id);
  if (st <= 0) return 0;
  return n(values[Math.min(st, values.length) - 1]);
}

function skillOn(col, id){ return C.hasSkill(col, id) ? 1 : 0; }
function skillLv(col, id){ return C.getSkillLevel(col, id) | 0; }
function petLv(col, id){ return C.getPetLevel(col, id) | 0; }
function skinOn(col, petId){ return !!(col.petUnlocks || {})['skin_' + petId]; }
function starLv(col, id){ return C.getStarLevel(col, id) | 0; }
function idolLv(col, id){ return C.getArchLv(col, 'idols', id) | 0; }
function shopLv(col, id){ return C.getChallengeShop(col, id) | 0; }
function ssLv(col, id){ return C.getSuperStarUpgrade(col, id) | 0; }
function ssMax(id){ return SUPER_STAR_UPGRADES.find(u => u.id === id)?.max || 0; }
function tribute(col, id){ return C.getFishLv(col, 'legendary', id) | 0; }
function questRank(col, id){ return C.getPetQuestRank(col, id) | 0; }

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
    if (s.max <= 0 && s.current <= 0) continue;
    const mark = s.current >= s.max && s.max > 0 ? '✓' : s.current > 0 ? '·' : '○';
    lines.push(`${mark} ${s.label} : +${s.current}/+${s.max}${s.how ? ' — ' + s.how : ''}`);
  }
  return lines.join('\n');
}

/** Wiki Pets : base in-game avant tout bonus de cap. */
export const PET_LEVEL_BASE = 10;

function piscesCapMax(){ return 2 + ssMax('star_caps'); }
function leoCapMax(){ return 3 + ssMax('star_caps'); }

function petLevelSources(col){
  return [
    source('Pisces (Stargazing)', starLv(col, 'pisces'), piscesCapMax(), '+1 / niveau (étoile, cap 2 + Star Level Caps)'),
    source('Statue Slaying platinisée', statueLv(col, 3) >= 3 ? 1 : 0, 1, 'uniquement plat'),
    source('Statue Feline', statueAmt(col, 15, [0, 1, 2, 3]), 3, '+1 / +2 / +3 (tous pets)'),
    source('Shop Extreme : Pet Level Cap', shopLv(col, 'e_pet_cap') > 0 ? 1 : 0, 1, '+1'),
    source('Skin Dino (Drumstick)', skinOn(col, 'Dino') ? 1 : 0, 1, '+1 Pet Level Cap'),
  ];
}

function petSpecificSources(petId, col){
  const t = (id) => tribute(col, id);
  const xanthe = Math.min(5, idolLv(col, 'xanthe'));
  switch (petId) {
    case 'Crab':
      return [source('Storm Serpent Tribute 1', t('storm_serpent') >= 1 ? 5 : 0, 5, 'Crab Cap +5')];
    case 'Dwarf':
      return [source('Shop Divine : Dwarf Pet Cap', shopLv(col, 'd_dwarf_prism') > 0 ? 5 : 0, 5, '+5')];
    case 'Totem':
      return [source('Glacial Shellstealer Tribute 1', t('glacial_shellstealer') >= 1 ? 5 : 0, 5, 'Totem Cap +5')];
    case 'Leprechaun':
      return [
        source('Rainbow Trout Tribute 1', t('rainbow_trout') >= 1 ? 3 : 0, 3, 'Leprechaun Cap +3'),
        source('Black Hole 2', C.hasBlackHoleBlessing(col, 'bh_lep') ? 2 : 0, 2, 'Leprechaun Pet Cap +2'),
      ];
    case 'Starfish':
      return [source('Idole Xanthe', xanthe, 5, '+1 / niveau, cap +5')];
    case 'Dino':
      return [source('Idole Xanthe', xanthe, 5, '+1 / niveau, cap +5')];
    case 'Mr_Nibbles':
      return [
        source('Rainbow Trout Tribute 2', t('rainbow_trout') >= 2 ? 3 : 0, 3, 'Mr Nibbles Cap +3'),
        source('Black Hole 12', C.hasBlackHoleBlessing(col, 'bh_nibbles') ? 2 : 0, 2, 'Mr Nibbles Pet Cap +2'),
      ];
    case 'Nagini':
      return [source('Statue Feline platinisée (extra)', statueLv(col, 15) >= 3 ? 5 : 0, 5, 'Nagini Cap +5 en plus du cap global')];
    case 'Butterfly':
      return [source('World Quests', 0, 5, 'Butterfly Cap +5 — non suivi sur le site (coche le max à la main si besoin)')];
    default:
      return [];
  }
}

function starExtraSources(starId, col){
  const sources = [
    source('Super Stars : Star Level Caps', ssLv(col, 'star_caps'), ssMax('star_caps'), '+1 / niveau, tous'),
  ];
  if (['aries', 'gemini', 'cancer'].includes(starId)) {
    sources.push(source('Super Stars : Aries/Gemini/Cancer Cap', 2 * ssLv(col, 'agc_cap'), 2 * ssMax('agc_cap'), '+2 / niveau'));
  }
  if (['virgo', 'aquarius', 'ophiuchus'].includes(starId)) {
    sources.push(source('Super Stars : Virgo/Aqua/Ophi Cap', ssLv(col, 'vao_cap'), ssMax('vao_cap'), '+1 / niveau'));
  }
  if (starId === 'gemini') {
    sources.push(source('Skill « Why Are There Stars In My Mining Game »', 2 * skillLv(col, 'stars_mining'), 6, '+2 / niveau'));
    sources.push(source('Arcanist Gemini Star Cap', 0, 20, 'OB70 — pas encore suivi'));
  }
  if (starId === 'cancer') {
    sources.push(source('Idole Castor', Math.min(10, idolLv(col, 'castor')), 10, '+1 / niveau'));
    sources.push(source('Megalodon Tribute 1', tribute(col, 'megalodon') >= 1 ? 10 : 0, 10, 'Cancer Cap +10'));
  }
  if (starId === 'scorpio') {
    sources.push(source('Black Hole 15', C.hasBlackHoleBlessing(col, 'bh_scorpio') ? 40 : 0, 40, 'Scorpio Star Cap +40'));
    sources.push(source('Statue Comfort (W4)', statueLv(col, 19) >= 1 ? 30 : 0, 30, 'Scorpio/Capricorn Cap +30 wiki'));
    sources.push(source('Skill « Idle Obelisk Mincer »', skillOn(col, 'ob_mincer') ? 5 : 0, 5, 'Scorpio +5'));
  }
  if (starId === 'capricorn') {
    sources.push(source('Statue Comfort (W4)', statueLv(col, 19) >= 1 ? 30 : 0, 30, 'Scorpio/Capricorn Cap +30 wiki'));
    sources.push(source('Skill « Why Are There Stars In My Mining Game »', 3 * skillLv(col, 'stars_mining'), 9, '+3 / niveau'));
    sources.push(source('Quête Starfish (Patricia)', questRank(col, 'Starfish'), 10, '+1 / rank'));
  }
  if (starId === 'aquarius') {
    sources.push(source('Idole Castor', Math.min(10, idolLv(col, 'castor')), 10, '+1 / niveau'));
  }
  if (starId === 'ophiuchus') {
    sources.push(source('Quête Starfish (Patricia)', questRank(col, 'Starfish'), 10, '+1 / rank'));
  }
  if (starId === 'orion') {
    sources.push(source('Black Hole 7', C.hasBlackHoleBlessing(col, 'bh_draco_orion') ? 5 : 0, 5, 'Draco and Orion Star Cap +5'));
    sources.push(source('Idole Atlas', Math.min(10, idolLv(col, 'atlas')), 10, '+1 / niveau'));
    sources.push(source('Skill « Ctrl+C Ctrl+V Stars »', 2 * skillLv(col, 'ctrl_c_stars'), 6, '+2 / niveau'));
  }
  if (starId === 'hercules') {
    sources.push(source('Idole Atlas', Math.min(10, idolLv(col, 'atlas')), 10, '+1 / niveau'));
    sources.push(source('Statue Timekeeping (W4)', statueLv(col, 20) >= 1 ? 30 : 0, 30, 'Hercules Cap +30 wiki'));
    sources.push(source("Dune's Eelworm Tribute 1", tribute(col, 'dunes_eelworm') >= 1 ? 3 : 0, 3, 'Hercules/Draco Cap +3'));
  }
  if (starId === 'draco') {
    sources.push(source('Black Hole 7', C.hasBlackHoleBlessing(col, 'bh_draco_orion') ? 5 : 0, 5, 'Draco and Orion Star Cap +5'));
    sources.push(source('Idole Hyperion', Math.min(10, idolLv(col, 'hyperion')), 10, '+1 / niveau'));
    sources.push(source("Dune's Eelworm Tribute 1", tribute(col, 'dunes_eelworm') >= 1 ? 3 : 0, 3, 'Hercules/Draco Cap +3'));
  }
  if (starId === 'cetus') {
    sources.push(source('Storm Serpent Tribute 2', tribute(col, 'storm_serpent') >= 2 ? 10 : 0, 10, 'Cetus Cap +10'));
  }
  if (starId === 'eridanus') {
    sources.push(source('Statue Timekeeping gildée', statueLv(col, 20) >= 2 ? 18 : 0, 18, 'Gilded Timekeeping +18'));
  }
  return sources;
}

function noticeT1Sources(col){
  return [
    source('Melting Gibbous Tribute 1', tribute(col, 'melting_gibbous') >= 1 ? 5 : 0, 5, 'Notice Cap +5'),
    source('Notice T2 : Tier 1 Notice Upgrade Cap', C.getFishLv(col, 'notice', 'n2_t1_cap'), 10, '+1 / niveau'),
  ];
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

  const petLevel = fold(petLevelSources(col), 0, null);

  const artifact = fold([
    source('Skill « Do These Upgrades Ever End »', skillOn(col, 'upgrades_end'), 1, '+1'),
    source('Carte Happy-Bot', cardAmt(col, 'pets_happybot', [1, 2, 3]), 3, '+1 / +2 / +3'),
    source('Statue Slaying', statueAmt(col, 3, [0, 1, 2, 3]), 3, '+1 / +2 / +3'),
  ], exp.artifact, 'artifact_cap_increase');

  const happySpec = fold(petSpecificSources('Happybot', col), 0, null);
  const happyMax = PET_LEVEL_BASE + petLevel.potential + happySpec.potential;
  const artifactT4 = fold([
    source('Pet Happy-Bot', petLv(col, 'Happybot'), happyMax, '+1 T4 / niveau'),
  ], exp.artifactT4, 'artifact_tier4_cap_increase');

  const workshop = fold([
    source('Skill « Do These Upgrades Ever End »', skillOn(col, 'upgrades_end'), 1, '+1'),
    source('Skill « Idle Obelisk Mincer »', skillOn(col, 'ob_mincer'), 1, '+1'),
    source('Skin Crab (Sizzle McSnaps)', skinOn(col, 'Crab') ? 1 : 0, 1, '+1'),
    source('Statue Hygiene', statueAmt(col, 6, [0, 2, 3, 4]), 4, '+2 / +3 / +4'),
    source('Statue Propulsion', statueAmt(col, 11, [0, 1, 2, 3]), 3, '+1 / +2 / +3'),
    source('Statue Nature (W4)', statueLv(col, 22) >= 1 ? 4 : 0, 4, '+4 si construite'),
    source('Leo (Stargazing)', starLv(col, 'leo'), leoCapMax(), '+1 / niveau'),
    source('Tribute Radioactive Slug 1', tribute(col, 'radioactive_slug') >= 1 ? 3 : 0, 3, '+3 dès rang 1'),
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
      petLevel: 'Cap niveau pets (tous)',
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

export function petSpecificPack(petId, col = {}) {
  const pack = fold(petSpecificSources(petId, col), 0, null);
  pack.tooltip = tooltipOf(pack, `Cap spécifique ${petId}`);
  return pack;
}

export function petCapInfo(pet, col = {}, stats = {}) {
  const snap = computeCapSnapshot(col, stats);
  const spec = petSpecificPack(pet?.id, col);
  const current = PET_LEVEL_BASE + snap.petLevel.current + spec.current;
  const hard = PET_LEVEL_BASE + snap.petLevel.potential + spec.potential;
  const tooltip = [
    `${pet?.name || pet?.id || 'Pet'} : ${current} en cours (Max ${hard}) · base ${PET_LEVEL_BASE}`,
    '',
    snap.petLevel.tooltip,
    spec.sources.length ? '\n' + spec.tooltip : '',
  ].filter(Boolean).join('\n');
  return { current, hard, spec, tooltip };
}

export function petEffectiveMax(pet, col = {}, stats = {}) {
  return petCapInfo(pet, col, stats).current;
}

export function petHardMax(pet, col = {}, stats = {}) {
  return petCapInfo(pet, col, stats).hard;
}

export function starExtraPack(starId, col = {}) {
  const pack = fold(starExtraSources(starId, col), 0, null);
  pack.tooltip = tooltipOf(pack, `Cap extra ${starId}`);
  return pack;
}

export function starCapInfo(star, col = {}) {
  const extra = starExtraPack(star.id, col);
  const current = (star.maxBase || 0) + extra.current;
  const hard = (star.maxBase || 0) + extra.potential;
  const tooltip = [
    `${star.name} : ${current} en cours (Max ${hard}) · base ${star.maxBase}`,
    extra.tooltip,
  ].join('\n');
  return { current, hard, extra, tooltip };
}

export function noticeT1Pack(col = {}) {
  const pack = fold(noticeT1Sources(col), 0, null);
  pack.tooltip = tooltipOf(pack, 'Cap extra Notices T1');
  return pack;
}

export function noticeT1Max(u, col = {}) {
  return (u.max || 0) + noticeT1Pack(col).current;
}

export function noticeT1Hard(u, col = {}) {
  return (u.max || 0) + noticeT1Pack(col).potential;
}
