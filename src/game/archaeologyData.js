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

/** Idols — max wiki Cap colonne (défaut 10 si inconnu). */
export const ARCH_IDOLS = [
  { id:'minos', name:'Minos', note:'Gem Upgrade Cap +1/niv', max:5 },
  { id:'dionysus', name:'Dionysus', note:'Early priority · drone/coal caps' },
  { id:'hades', name:'Hades' },
  { id:'hestia', name:'Hestia' },
  { id:'aphrodite', name:'Aphrodite' },
  { id:'tethys', name:'Tethys' },
  { id:'astraeus', name:'Astraeus' },
  { id:'chione', name:'Chione' },
  { id:'nyx', name:'Nyx' },
  { id:'castor', name:'Castor' },
  { id:'mnemosyne', name:'Mnemosyne' },
  { id:'zeus', name:'Zeus' },
  { id:'hera', name:'Hera', note:'Contract Upgrade Cap +1/niv', max:3 },
  { id:'poseidon', name:'Poseidon' },
  { id:'demeter', name:'Demeter' },
  { id:'athena', name:'Athena' },
  { id:'apollo', name:'Apollo' },
  { id:'ares', name:'Ares' },
  { id:'hephaestus', name:'Hephaestus' },
  { id:'hermes', name:'Hermes', note:'Contract Upgrade Cap +1/niv', max:1000 },
  { id:'eros', name:'Eros' },
  { id:'prometheus', name:'Prometheus' },
  { id:'atlas', name:'Atlas' },
  { id:'hyperion', name:'Hyperion' },
  { id:'cronus', name:'Cronus' },
  { id:'themis', name:'Themis' },
  { id:'leto', name:'Leto' },
  { id:'iris', name:'Iris' },
  { id:'pandora', name:'Pandora' },
  { id:'sisyphus', name:'Sisyphus' },
  { id:'theseus', name:'Theseus' },
  { id:'talos', name:'Talos' },
  { id:'charon', name:'Charon' },
  { id:'cephalus', name:'Cephalus' },
  { id:'cassandra', name:'Cassandra' },
  { id:'andromeda', name:'Andromeda' },
  { id:'xanthe', name:'Xanthe' },
].map(x => ({ ...x, max: x.max ?? 10 }));

export const ARCH_IDOL_MAX = 10;
export function idolMax(idol){ return idol.max ?? ARCH_IDOL_MAX; }
