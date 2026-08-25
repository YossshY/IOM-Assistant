/* ============================================================
   starsData.js — Stargazing wiki v2.2.6
   Tabs: Stars / Upgrades / Super Stars / Black Hole
   ============================================================ */

export const STARS_FULL = [
  { id:'aries', name:'Aries', perk:'Vein Spawn Rate +3% · Golden Vein Chance +1%', maxBase:20, order:1 },
  { id:'taurus', name:'Taurus', perk:'Pickaxe Damage +12% · Auto catch Stars +2%', maxBase:20, order:2 },
  { id:'gemini', name:'Gemini', perk:'Golden Floor Multi 1.02x · Star Spawn Rate +2%', maxBase:20, order:3 },
  { id:'cancer', name:'Cancer', perk:'Double Contract Point Chance +1% · Contract Upgrade Cost -1%', maxBase:20, order:4 },
  { id:'leo', name:'Leo', perk:'Workshop Cap +1 · Triple Super Star Chance +4%', maxBase:3, order:5 },
  { id:'virgo', name:'Virgo', perk:'Bomb Recharge Rate +1% · Super Star Spawn Rate +1%', maxBase:25, order:6 },
  { id:'libra', name:'Libra', perk:'Prestige Points Gain +5% · Triple Lootbug Chance +1%', maxBase:20, order:7 },
  { id:'scorpio', name:'Scorpio', perk:'Pickaxe Damage +15% · All Star Multi +0.5%', maxBase:50, order:8 },
  { id:'sagittarius', name:'Sagittarius', perk:'Lootbug Spawn Rate +2% · Triple Star Chance +1%', maxBase:15, order:9 },
  { id:'capricorn', name:'Capricorn', perk:'Experience Gain +15% · Item Duration +1%', maxBase:20, order:10 },
  { id:'aquarius', name:'Aquarius', perk:'Bar Craft Costs -1% · Golden Lootbug Chance +1%', maxBase:10, order:11 },
  { id:'pisces', name:'Pisces', perk:'Pet Level Cap +1 · Rainbow Floor Multi +10x', maxBase:2, order:12 },
  { id:'ophiuchus', name:'Ophiuchus', perk:'Banked Freebie Cap +1 · Banked Lootbug Cap +1', maxBase:2, order:13 },
  { id:'orion', name:'Orion', perk:'100x Craft Chance +0.10% · Golden Ore Chance +0.25%', maxBase:20, order:14 },
  { id:'hercules', name:'Hercules', perk:'Star Supernova Chance +0.15% · Golden Ore Multi +8%', maxBase:20, order:15 },
  { id:'draco', name:'Draco', perk:'Galactic Rainbow Chance +0.25% · Multi +10%', maxBase:20, order:16 },
  { id:'cetus', name:'Cetus', perk:'Poly Ore Card Multi +0.15x · Fish Income +2%', maxBase:20, order:17 },
  { id:'phoenix', name:'Phoenix', perk:'Chain/Midas/Veinseeker/Starburst grade caps +1', maxBase:18, order:18 },
  { id:'eridanus', name:'Eridanus', perk:'All Floor Multi +2% · Stonks Multi +2% · Super Stonks +0.10%', maxBase:20, order:19 },
  { id:'lynx', name:'Lynx', perk:'Star Radiant Multi +1% · Infernal Card Bonus +0.25%', maxBase:48, order:20 },
  { id:'vulpecula', name:'Vulpecula', perk:'Galactic Portal Chance +0.25% · Multi +1%', maxBase:38, order:21 },
];

/** Caps vus screens joueur (Aries 28, Taurus 22) — bonus au-delà du base wiki. */
export function starEffectiveMax(s, extraCap = 0) {
  return s.maxBase + (+extraCap || 0);
}

export const STAR_UPGRADES = [
  { id:'telescope', name:'Upgrade Telescope', per:'+1 discover Stars', max:21 },
  { id:'auto_catch', name:'Auto-catch Stars', per:'+4%', max:15 },
  { id:'spawn_rate', name:'Star Spawn Rate', per:'+5%', max:20 },
  { id:'double_star', name:'Double Star Chance', per:'+5%', max:20 },
  { id:'ss_spawn', name:'Super Star Spawn Rate', per:'+2%', max:20 },
  { id:'supernova', name:'Star Supernova Chance', per:'+0.5%', max:20, telescope:10 },
  { id:'ss_10x', name:'Super Star 10x Chance', per:'+0.2%', max:20, telescope:12 },
  { id:'supergiant', name:'Star Supergiant Chance', per:'+0.2%', max:20, telescope:14 },
  { id:'capper', name:'Capper Upper', per:'Cap + previous four', max:5, telescope:17 },
  { id:'ss_sgi', name:'Super Star Supergiant Chance', per:'+0.15%', max:20, telescope:18 },
  { id:'all_star', name:'All Star Multiplier', per:'+0.01x', max:30, telescope:18 },
  { id:'ss_radiant', name:'Super Star Radiant Chance', per:'+0.15%', max:25, telescope:19 },
  { id:'radiant_multi', name:'Star Radiant Multi', per:'+1%', max:25, telescope:20 },
  { id:'novagiant', name:'Novagiant Combo Multi', per:'+1.5%', max:30, telescope:21 },
];

export const SUPER_STAR_UPGRADES = [
  { id:'rainbow_vein', name:'Rainbow Vein Chance', per:'+1%', max:10 },
  { id:'dbl_contract', name:'Double Contract Points', per:'+2%', max:10 },
  { id:'ss_exp', name:'Experience', per:'+25%', max:10 },
  { id:'ss_item', name:'Item duration', per:'+3%', max:10 },
  { id:'ss_speed', name:'Game speed', per:'+2%', max:10 },
  { id:'star_caps', name:'Star Level Caps', per:'+1', max:2 },
  { id:'agc_cap', name:'Aries, Gemini, Cancer Cap', per:'+2', max:3 },
  { id:'vao_cap', name:'Virgo, Aqua, Ophi Cap', per:'+1', max:3 },
  { id:'sgi_multi', name:'Supergiant Star Multiplier', per:'+10%', max:20, telescope:14 },
  { id:'gold_ore_multi', name:'Golden Ore Multiplier', per:'+0.06x', max:15, telescope:17 },
  { id:'banked', name:'Banked Freebies & Lootbugs', per:'+1', max:5, telescope:17 },
  { id:'elixir_void_cap', name:'Elixir & Void Grade Cap', per:'+2', max:5, telescope:17 },
  { id:'black_hole', name:'Unlock the Black Hole', per:'Unlock', max:1, telescope:18 },
  { id:'lootbug_loot', name:'Lootbug Loot Multiplier', per:'+1.5%', max:20, telescope:18 },
  { id:'ss_nova', name:'Novagiant Combo Multiplier', per:'+2%', max:15, telescope:18 },
  { id:'fish_income', name:'Fish Income Multiplier', per:'+1.25%', max:15, telescope:18 },
  { id:'gal_floor', name:'Galactic Floor Chance', per:'+0.25%', max:20, telescope:19 },
  { id:'gold_ore_chance', name:'Golden Ore Chance', per:'+0.3%', max:20, telescope:19 },
  { id:'radiant_chance', name:'Star Radiant Chance', per:'+0.1%', max:20, telescope:19 },
  { id:'gal_portal', name:'Galactic Portal Multi', per:'+2%', max:20, telescope:20 },
  { id:'mana', name:'Arcanist Mana Regen', per:'+1.25%', max:20, telescope:21 },
];

/** Blessings Black Hole (wiki Stargazing — 22 niveaux). */
export const BLACK_HOLE_BLESSINGS = [
  { id:'bh_frogger', name:'Frogger Drone Enhancement' },
  { id:'bh_lep', name:'Leprechaun Pet Cap +2' },
  { id:'bh_super_stonks', name:'Super Stonks Chance +2%' },
  { id:'bh_strawberries', name:'Unlock Golden Strawberries' },
  { id:'bh_gal_floor', name:'Galactic Floor Chance +3%' },
  { id:'bh_gold_frog', name:'Golden Lootfrog Chance +2%' },
  { id:'bh_draco_orion', name:'Draco and Orion Star Cap +5' },
  { id:'bh_lootbug_bank', name:'Lootbug Banked Cap 1.20x' },
  { id:'bh_bear', name:'Bear Drone Cap +10' },
  { id:'bh_t2_dock', name:'Tier 2 Dock Power +25%' },
  { id:'bh_rainbow_void', name:'Rainbow Void Portal Chance +5%' },
  { id:'bh_nibbles', name:'Mr Nibbles Pet Cap +2' },
  { id:'bh_primal', name:'Unlock Golden Primal Meat' },
  { id:'bh_gleaming', name:'Gleaming Vein Chance +5%' },
  { id:'bh_scorpio', name:'Scorpio Star Cap +40' },
  { id:'bh_veinmorpher', name:'Unlock Golden Veinmorpher' },
  { id:'bh_ultra_stonks', name:'Ultra Stonks Chance +2%' },
  { id:'bh_lollipop', name:'Unlock Golden Lollipop' },
  { id:'bh_gal_portal', name:'Galactic Portal Chance +3%' },
  { id:'bh_radiancy', name:'Unlock Spell: Radiancy (OB70)' },
  { id:'bh_party', name:'Party Wizard Chance +3%' },
  { id:'bh_prismism', name:'Unlock Spell: Prismism' },
];
