/* ============================================================
   exportArrays.js — tableaux exportstats ajoutés après v2.2.6
   (wiki Guides/Working_With_ExportStats, vu sur un export v2.2.30)
   Les index suivent l'ordre du wiki, pas l'ordre d'affichage local
   quand les deux divergent (drones, workshop).
   ============================================================ */
import { SKILL_NODES } from './skillsData.js';
import { WORKSHOP_UPGRADES } from './workshopData.js';
import { PETS_FULL } from './petsData.js';
import {
  NOTICE_UPGRADES_T1, NOTICE_UPGRADES_T2,
  FISH_UPGRADES_T1, FISH_UPGRADES_T2,
  ENHANCE_T1, ENHANCE_T2, LEGENDARY_FISH,
} from './fishingData.js';
import { FISH_CARDS, LEGENDARY_FISH_CARDS } from './cardsData.js';
import { STARS_FULL, STAR_UPGRADES, SUPER_STAR_UPGRADES, BLACK_HOLE_BLESSINGS } from './starsData.js';
import { ARCH_IDOLS } from './archaeologyData.js';
import { DRONE_SUITS } from './dronesData.js';
import { RESEARCH_VEINS } from './constructData.js';
import { CHALLENGE_SHOP } from './challengesData.js';
import { BOAT_T1, BOAT_T2 } from './progress/fragments/docks.js';
import {
  setSkillLevel, setWorkshopLevel, setPetLevel, setPetQuestRank,
  setFishLv, getFishLv, setDockUnlocked, setStarLevel, setStarUpgrade, setSuperStarUpgrade,
  setArchLv, setDroneSuitLv, setResearchUnlock, setResearchSpawn, setChallengeShop,
} from './collections.js';

/** Index JSON du skill-tree (wiki, pas l'ordre SKILL_NODES). */
export const SKILL_EXPORT_ORDER = [
  'lucky_strikes', 'bigger_blasts', 'ore_efficiency', 'swing_harder', 'ingot_intuition',
  'all_round', 'arsenal', 'easy_prog', 'wait_crits', 'pp_go_up',
  'gems_chests', 'super_damage', 'just_wait', 'hefty_hammers', 'relic_rampage',
  'chronokeeper', 'gem_bomb', 'mech_evo', 'treasure_hunter', 'demo_expert',
  'wait_super', 'auto_bomber', 'perfect_gold', 'flamboyant', 'more_ore',
  'free_price', 'wait_ultra', 'upgrades_end', 'optical', 'luckier',
  'stonks', 'gasoline', 'wares', 'veinmorpher', 'rainy_day',
  'whos_asking', 'creative_names', 'tons_dmg', 'ctrl_f_stars', 'poly_power',
  'threes_crowd', 'poly_while', 'fishing_friends', 'friendship_t1', 'pick_pace',
  'fish_summon', 'block_bonker', 'avada', 'please_sir', 'insane_vein',
  'ctrl_c_stars', 'motley', 'completionist', 'flaming_veins', 'astral_forge',
  'lep_legacy', 'lootin_bugs', 'call_void', 'pond_yield', 'frog_frenzy',
  'ob_mincer', 'stars_mining', 'buried_it', 'auto_prestige', 'portal_schmortal',
  'mess_bull', 'yanille', 'fronks',
];

/** Nom wiki d'un index au-delà de SKILL_EXPORT_ORDER (effet pas encore catalogué). */
export const SKILL_EXPORT_EXTRA_NAMES = {
  68: 'Ctrl + S Stars',
};

/**
 * JSON workshop → index WORKSHOP_UPGRADES.
 * Le wiki note un décalage à partir du bloc W2 (Morph / Pick / Gold / Bomb)
 * puis Veinseeker / Transmuter / Golden Void, et Wizard en index JSON 45.
 */
const WORKSHOP_JSON_TO_GAME = {
  18: 19, 19: 20, 20: 21, 21: 18,
  31: 32, 32: 33, 33: 34,
  45: 31,
};

/** Owned / level : Bear, Chain, Midas, Frogger, Elixir, Starburst, Veinseeker, Void, Angler, Prism, Minotaur. */
export const DRONE_SUIT_EXPORT_INDEX = {
  bear: 0, chain: 1, midas: 2, frogger: 3, elixir: 4, starburst: 5,
  veinseeker: 6, void: 7, angler: 8, prism: 9, minotaur: 10,
};

/** challenge_upgrades_array (wiki : challenge_rewards_array) — bornes inclusives. */
const CHALLENGE_SHOP_SPANS = [
  { shop: 'regular', start: 0, end: 17 },
  { shop: 'extreme', start: 18, end: 26 },
  { shop: 'divine', start: 27, end: 51 },
];

function asList(v) {
  return Array.isArray(v) ? v : null;
}

function nAt(arr, i) {
  const v = Number(arr?.[i]);
  return Number.isFinite(v) ? Math.round(v) : 0;
}

function cardRank(raw) {
  return Math.max(0, Math.min(4, raw));
}

/** Quai ouvert par le palier de bateau déjà écrit dans les upgrades. N'enlève pas un quai. */
function unlockDocksFromBoat(col) {
  const t1 = getFishLv(col, 'upgrades', 'u1_boat');
  const t2 = getFishLv(col, 'upgrades', 'u2_boat');
  if (t1 > 0 || t2 > 0) setDockUnlocked(col, 'lake', true);
  for (const row of BOAT_T1) {
    if (t1 >= row.level) setDockUnlocked(col, row.dock, true);
  }
  for (const row of BOAT_T2) {
    if (t2 >= row.level) setDockUnlocked(col, row.dock, true);
  }
}

function applyIndexed(arr, items, setLevel) {
  if (!arr) return 0;
  const n = Math.min(arr.length, items.length);
  for (let i = 0; i < n; i++) setLevel(items[i], nAt(arr, i));
  return n;
}

/** Nœuds du tableau skill absents de SKILL_EXPORT_ORDER, avec un niveau > 0. */
export function listUnmappedSkillNodes(stats = {}) {
  const arr = asList(stats.skill_tree_nodes_array);
  if (!arr) return [];
  const out = [];
  for (let i = SKILL_EXPORT_ORDER.length; i < arr.length; i++) {
    const level = nAt(arr, i);
    if (level <= 0) continue;
    out.push({ index: i, name: SKILL_EXPORT_EXTRA_NAMES[i] || `Skill index ${i}`, level });
  }
  return out;
}

/**
 * Remplit les collections depuis les tableaux. Les exports sans ces clés
 * (v2.2.6) ne touchent à rien.
 */
export function applyExportArrays(col, stats = {}) {
  const skills = asList(stats.skill_tree_nodes_array);
  if (skills) {
    const known = new Set(SKILL_NODES.map(s => s.id));
    applyIndexed(skills, SKILL_EXPORT_ORDER, (id, lv) => {
      if (known.has(id)) setSkillLevel(col, id, lv);
    });
  }

  const workshop = asList(stats.workshop_array);
  if (workshop) {
    const levels = WORKSHOP_UPGRADES.map(() => 0);
    for (let jsonI = 0; jsonI < workshop.length; jsonI++) {
      const gameI = WORKSHOP_JSON_TO_GAME[jsonI] ?? jsonI;
      if (gameI >= 0 && gameI < levels.length) levels[gameI] = nAt(workshop, jsonI);
    }
    WORKSHOP_UPGRADES.forEach((u, i) => setWorkshopLevel(col, u.id, levels[i]));
  }

  const petLv = asList(stats.pet_array);
  const petQuest = asList(stats.pet_quest_array);
  const skinA = asList(stats.pet_skin_set_a_array);
  const skinB = asList(stats.pet_skin_set_b_array);
  if (petLv || petQuest || skinA || skinB) {
    col.petUnlocks = { ...(col.petUnlocks || {}) };
    PETS_FULL.forEach((p, i) => {
      if (petLv) setPetLevel(col, p.id, nAt(petLv, i));
      if (petQuest) setPetQuestRank(col, p.id, nAt(petQuest, i));
      if (skinA) col.petUnlocks['skin_' + p.id] = nAt(skinA, i) > 0;
      if (skinB) col.petUnlocks['quest_' + p.id] = nAt(skinB, i) > 0;
    });
  }

  const notices = asList(stats.fishing_notices_array);
  if (notices) {
    NOTICE_UPGRADES_T1.forEach((u, i) => setFishLv(col, 'notice', u.id, nAt(notices, i)));
    NOTICE_UPGRADES_T2.forEach((u, i) => setFishLv(col, 'notice', u.id, nAt(notices, NOTICE_UPGRADES_T1.length + i)));
  }
  const fishUp = asList(stats.fishing_upgrades_array);
  if (fishUp) {
    FISH_UPGRADES_T1.forEach((u, i) => setFishLv(col, 'upgrades', u.id, nAt(fishUp, i)));
    FISH_UPGRADES_T2.forEach((u, i) => setFishLv(col, 'upgrades', u.id, nAt(fishUp, FISH_UPGRADES_T1.length + i)));
  }
  const enhance = asList(stats.fishing_enhance_array);
  if (enhance) {
    ENHANCE_T1.forEach((u, i) => setFishLv(col, 'enhance', u.id, nAt(enhance, i)));
    ENHANCE_T2.forEach((u, i) => setFishLv(col, 'enhance', u.id, nAt(enhance, ENHANCE_T1.length + i)));
  }
  const regCards = asList(stats.fishing_regular_card_array);
  const legCards = asList(stats.fishing_legendary_card_levels_array);
  if (regCards || legCards) col.cards = { ...(col.cards || {}) };
  if (regCards) {
    FISH_CARDS.forEach((c, i) => {
      col.cards[c.id] = cardRank(nAt(regCards, i));
    });
  }
  if (legCards) {
    LEGENDARY_FISH_CARDS.forEach((c, i) => {
      col.cards[c.id] = cardRank(nAt(legCards, i));
    });
  }
  const legTrib = asList(stats.fishing_legendary_tribute_levels_array);
  if (legTrib) {
    LEGENDARY_FISH.forEach((f, i) => {
      const raw = nAt(legTrib, i);
      // 0 non pêché, 1 pêché, 2 tribute 1, 3 tribute 2 → rang UI 0..2
      setFishLv(col, 'legendary', f.id, Math.max(0, raw - 1));
      setDockUnlocked(col, f.dock, raw >= 1);
    });
  }
  if (fishUp || legTrib) unlockDocksFromBoat(col);

  const starLv = asList(stats.stars_star_level_array);
  if (starLv) STARS_FULL.forEach((s, i) => setStarLevel(col, s.id, nAt(starLv, i)));
  const starUp = asList(stats.stars_regular_upgrades_array);
  if (starUp) STAR_UPGRADES.forEach((u, i) => setStarUpgrade(col, u.id, nAt(starUp, i)));
  const ssUp = asList(stats.stars_super_star_upgrades_array);
  if (ssUp) SUPER_STAR_UPGRADES.forEach((u, i) => setSuperStarUpgrade(col, u.id, nAt(ssUp, i)));

  const idols = asList(stats.idols_array);
  if (idols) {
    col.arch = { ...(col.arch || {}), idols: {} };
    for (const idol of ARCH_IDOLS) {
      if (idol.exportIndex == null) continue;
      setArchLv(col, 'idols', idol.id, nAt(idols, idol.exportIndex));
    }
  }

  if (stats.black_hole_level != null) {
    const owned = Math.max(0, Math.round(+stats.black_hole_level));
    col.blackHole = {};
    BLACK_HOLE_BLESSINGS.forEach((b, i) => {
      if (i < owned) col.blackHole[b.id] = true;
    });
  }

  const suitLv = asList(stats.drones_suit_level_array);
  if (suitLv) {
    for (const s of DRONE_SUITS) {
      const idx = DRONE_SUIT_EXPORT_INDEX[s.id];
      if (idx == null) continue;
      setDroneSuitLv(col, s.id, nAt(suitLv, idx));
    }
  }

  if (stats.vein_researched_array != null && !Array.isArray(stats.vein_researched_array)) {
    const hi = Math.round(+stats.vein_researched_array);
    RESEARCH_VEINS.forEach((v, i) => setResearchUnlock(col, v.id, hi >= i));
  }
  if (stats.vein_2x_spawn_array != null && !Array.isArray(stats.vein_2x_spawn_array)) {
    const hi = Math.round(+stats.vein_2x_spawn_array);
    RESEARCH_VEINS.forEach((v, i) => setResearchSpawn(col, v.id, hi >= i));
  }

  const chal = asList(stats.challenge_upgrades_array) || asList(stats.challenge_rewards_array);
  if (chal) {
    for (const span of CHALLENGE_SHOP_SPANS) {
      const list = CHALLENGE_SHOP[span.shop] || [];
      list.forEach((item, i) => {
        const idx = span.start + i;
        if (idx > span.end || idx >= chal.length) return;
        setChallengeShop(col, item.id, nAt(chal, idx));
      });
    }
  }

  return col;
}
