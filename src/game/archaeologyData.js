/* ============================================================
   archaeologyData.js — Archaeology wiki (Ascension 0 focus)
   Tabs: Skills · Upgrades · Idols · Stats
   ============================================================ */

export const ARCH_SKILLS = [
  { id:'strength', name:'Strength', effect:'Flat Damage / Damage %' },
  { id:'agility', name:'Agility', effect:'Max Stamina / Stamina Mod Chance' },
  { id:'luck', name:'Luck', effect:'Fragment & Exp farming' },
  { id:'perception', name:'Perception', effect:'Mod Chance / Armor Pen' },
  { id:'intellect', name:'Intellect', effect:'Exp Gain / Mod Chance' },
];

/** Ascension 0 upgrades (wiki) — trackable levels */
export const ARCH_UPGRADES = [
  { id:'a0_stamina_gem', name:'Max Stamina / Stamina Mod (Gems)', per:'+2/+0.05%', max:50 },
  { id:'a0_exp_gem', name:'Arch Exp / Exp Mod (Gems)', per:'+5%/+0.05%', max:25 },
  { id:'a0_frag_gem', name:'Fragment Gain / Loot Mod (Gems)', per:'+2%/+0.05%', max:25 },
  { id:'a0_enrage_unlock', name:'Unlock Ability: Enrage', per:'Unlock', max:3 },
  { id:'a0_flat_dmg', name:'Flat Damage (Common)', per:'+1', max:25 },
  { id:'a0_armor_pen', name:'Armor Penetration (Common)', per:'+1', max:25 },
  { id:'a0_exp_common', name:'Arch Exp Gain (Common)', per:'+2%', max:25 },
  { id:'a0_crit', name:'Crit Chance / Crit Damage', per:'+0.25%/+1%', max:25 },
  { id:'a0_stamina_rare', name:'Max Stamina / Mod Chance (Rare)', per:'+2/+0.05%', max:20 },
  { id:'a0_flat_rare', name:'Flat Damage (Rare)', per:'+2', max:20 },
  { id:'a0_loot_mod', name:'Loot Mod Gain Multi', per:'+0.30x', max:10 },
  { id:'a0_enrage', name:'Enrage Dmg/Crit / CD', per:'+2%/-1s', max:15 },
  { id:'a0_super_crit', name:'Flat Dmg / Super Crit Chance', per:'+2/+0.35%', max:25 },
  { id:'a0_exp_frag', name:'Exp Gain / Fragment Gain', per:'+3%/+2%', max:20 },
  { id:'a0_flurry', name:'Flurry Stamina / CD', per:'+1/-1s', max:10 },
  { id:'a0_stamina_mod', name:'Max Stamina / Stamina Mod Gain', per:'+4/+1', max:5 },
  { id:'a0_strength_buff', name:'Strength Skill Buff', per:'+0.2/+0.1%', max:5 },
  { id:'a0_agility_buff', name:'Agility Skill Buff', per:'+1/+0.02%', max:5 },
  { id:'a0_exp_stam', name:'Exp Gain / Max Stamina', per:'+5%/+1%', max:15 },
  { id:'a0_armor_cd', name:'Armor Pen / Ability CD', per:'+2%/-1s', max:10 },
  { id:'a0_crit_dmg', name:'Crit / Super Crit Damage', per:'+2%/+2%', max:20 },
  { id:'a0_quake', name:'Quake Attacks / CD', per:'+1/-2s', max:10 },
  { id:'a0_perception_buff', name:'Perception Skill Buff', per:'+0.01%/+1', max:5 },
  { id:'a0_intellect_buff', name:'Intellect Skill Buff', per:'+1%/+0.01%', max:5 },
  { id:'a0_dmg_mult', name:'Damage / Armor Pen', per:'+2%/+3', max:20 },
  { id:'a0_ultra_crit', name:'Super / Ultra Crit Chance', per:'+0.35%/+1%', max:20 },
  { id:'a0_exp_mod', name:'EXP Mod Gain / Chance', per:'+0.10x/0.10%', max:20 },
  { id:'a0_instacharge', name:'Ability Instacharge / Max Stamina', per:'+0.30%/+4', max:20 },
  { id:'a0_poly_arch', name:'Polychrome Arch Card Bonus', per:'+15%', max:1 },
  { id:'a0_frag_x', name:'Fragment Gain ×1.25', per:'1.25x', max:1 },
  { id:'a0_stam_mod_gain', name:'Stamina Mod Gain +2', per:'+2', max:1 },
  { id:'a0_all_mod', name:'All Mod Chances', per:'+1.50%', max:1 },
  { id:'a0_exp_cap', name:'Exp Gain / Stat Point Caps', per:'2.00x / +5', max:1 },
];

/**
 * Idoles dans l'ordre d'affichage du jeu (rareté, puis déblocage).
 * exportIndex = case de idols_array. Prouvé sur deux exports maxés :
 * cases 0–18 = les 19 idoles d'ascension 0 d'origine (Astraeus, Chione,
 * Talos, Aphrodite et Tethys ont été ajoutées après, cases 19–23, dans
 * l'ordre d'obélisque 46 → 54). Cases 24–36 = les 13 idoles d'ascension
 * (obélisque 66) ; leur ordre interne n'est pas calé, on ne les relie pas.
 * max = cap wiki de base. Astraeus/Chione +50 et Aphrodite/Tethys +30
 * par rang de quête Dino (le niveau importé peut dépasser ce max).
 */
const OB66 = 'Débloqué à l\'obélisque 66';
export const ARCH_IDOL_RARITIES = ['common', 'rare', 'epic', 'legendary', 'mythic', 'divine'];
export const ARCH_IDOL_RARITY_LABEL = {
  common: 'Common Idol',
  rare: 'Rare Idol',
  epic: 'Epic Idol',
  legendary: 'Legendary Idol',
  mythic: 'Mythic Idol',
  divine: 'Divine Idol',
};

export const ARCH_IDOLS = [
  { id:'athena', name:'Athena', rarity:'common', exportIndex:0, max:500 },
  { id:'cassandra', name:'Cassandra', rarity:'common', exportIndex:1, max:150 },
  { id:'demeter', name:'Demeter', rarity:'common', exportIndex:2, max:100 },
  { id:'eros', name:'Eros', rarity:'common', exportIndex:3, max:50 },
  { id:'hera', name:'Hera', rarity:'common', exportIndex:4, max:3, note:'Contract Upgrade Cap +1/niv' },
  { id:'astraeus', name:'Astraeus', rarity:'common', exportIndex:19, max:500, note:'Cap +50 / rang quête Dino' },
  { id:'hestia', name:'Hestia', rarity:'common', max:3000, note:OB66 },
  { id:'hermes', name:'Hermes', rarity:'common', max:1000, note:OB66 + ' · Contract Upgrade Cap +1/niv' },

  { id:'apollo', name:'Apollo', rarity:'rare', exportIndex:5, max:500 },
  { id:'iris', name:'Iris', rarity:'rare', exportIndex:6, max:100 },
  { id:'minos', name:'Minos', rarity:'rare', exportIndex:7, max:5, note:'Gem Upgrade Cap +1/niv' },
  { id:'leto', name:'Leto', rarity:'rare', exportIndex:8, max:10 },
  { id:'poseidon', name:'Poseidon', rarity:'rare', exportIndex:9, max:20 },
  { id:'chione', name:'Chione', rarity:'rare', exportIndex:20, max:300, note:'Cap +50 / rang quête Dino' },
  { id:'ares', name:'Ares', rarity:'rare', max:5000, note:OB66 },
  { id:'theseus', name:'Theseus', rarity:'rare', max:3000, note:OB66 },

  { id:'pandora', name:'Pandora', rarity:'epic', exportIndex:10, max:500 },
  { id:'cephalus', name:'Cephalus', rarity:'epic', exportIndex:11, max:100 },
  { id:'dionysus', name:'Dionysus', rarity:'epic', exportIndex:12, max:5, note:'Coal Upgrade Cap +1 · Drone Grade Cap +1' },
  { id:'talos', name:'Talos', rarity:'epic', exportIndex:21, max:750 },
  { id:'hephaestus', name:'Hephaestus', rarity:'epic', max:3000, note:OB66 },
  { id:'mnemosyne', name:'Mnemosyne', rarity:'epic', max:5000, note:OB66 },

  { id:'andromeda', name:'Andromeda', rarity:'legendary', exportIndex:13, max:300 },
  { id:'nyx', name:'Nyx', rarity:'legendary', exportIndex:14, max:20 },
  { id:'castor', name:'Castor', rarity:'legendary', exportIndex:15, max:5, note:'Aquarius / Cancer Star Cap' },
  { id:'aphrodite', name:'Aphrodite', rarity:'legendary', exportIndex:22, max:500, note:'Cap +30 / rang quête Dino' },
  { id:'hyperion', name:'Hyperion', rarity:'legendary', max:2500, note:OB66 },
  { id:'themis', name:'Themis', rarity:'legendary', max:5000, note:OB66 },

  { id:'zeus', name:'Zeus', rarity:'mythic', exportIndex:16, max:150 },
  { id:'atlas', name:'Atlas', rarity:'mythic', exportIndex:17, max:10 },
  { id:'xanthe', name:'Xanthe', rarity:'mythic', exportIndex:18, max:5 },
  { id:'tethys', name:'Tethys', rarity:'mythic', exportIndex:23, max:500, note:'Cap +30 / rang quête Dino' },
  { id:'cronus', name:'Cronus', rarity:'mythic', max:2000, note:OB66 },
  { id:'charon', name:'Charon', rarity:'mythic', max:3000, note:OB66 },

  { id:'hades', name:'Hades', rarity:'divine', max:6666, note:OB66 },
  { id:'prometheus', name:'Prometheus', rarity:'divine', max:1000, note:OB66 },
  { id:'sisyphus', name:'Sisyphus', rarity:'divine', max:7777, note:OB66 },
];

export const ARCH_IDOL_MAX = 10;
export function idolMax(idol){ return idol.max ?? ARCH_IDOL_MAX; }
