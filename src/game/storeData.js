/* ============================================================
   storeData.js — Store in-game (wiki Store v2.2.6 / page v2.1.1+)
   Niveaux Store PAS dans exportstats — seulement gem_upgrade_cap_increase.
   https://shminer.miraheze.org/wiki/Store
   ============================================================ */

export const STORE_PERKS = [
  { id:'ore', name:'2x Ore Income', effect:'Ore income ×2' },
  { id:'pp', name:'2x Prestige Point Income', effect:'PP income ×2' },
  { id:'bar', name:'2x Bar Income', effect:'Bar income ×2' },
  { id:'bomb', name:'3x Bomb Damage', effect:'Bomb damage ×3' },
];

export const STORE_PERK_BUNDLES = [
  { id:'ore_pp', name:'Ore + PP Bundle', perks:['ore','pp'], bonus:'525 Gems' },
  { id:'bar_bomb', name:'Bar + Bomb Bundle', perks:['bar','bomb'], bonus:'375 Gems' },
];

export const STORE_GEM_UNLOCKS = [
  { id:'drone', name:'Permanent Drone', cost:200, effect:'Drone offline supplémentaire' },
  { id:'megabomb', name:'MEGABOMB', cost:500, effect:'25× dégâts, court cooldown' },
  { id:'transmuter', name:'Transmuter Bomb', cost:750, effect:'Marque les ores → bars' },
  { id:'battery', name:'Battery Bomb', cost:1000, effect:'Charge 2 bombes · 0.1% +1 bomb cap' },
];

/** Base max wiki. Cap réelle = baseMax + gem_upgrade_cap_increase. */
export const STORE_GEM_UPGRADES = [
  { id:'pickaxe', name:'Pickaxe Damage', effect:'+0.20x / niv', baseMax:10, cost:200 },
  { id:'bomb', name:'Bomb Damage & Bomb Capacity', effect:'+20% dmg · +10 cap / niv', baseMax:10, cost:225 },
  { id:'freebie', name:'Banked Freebie Cap', effect:'+1 freebie / niv', baseMax:2, cost:250 },
  { id:'chest_meter', name:'Chest Meter Fill Rate', effect:'5× / niv (multiplicatif)', baseMax:5, cost:300 },
  { id:'chest_items', name:'Items Contained In Chests', effect:'+1 item / niv', baseMax:5, cost:650 },
  { id:'ore_sell', name:'Ore Sell Price', effect:'+100% / niv', baseMax:2, cost:850 },
];

export const STORE_SPECIAL = [
  { id:'founders', name:'Founders Bundle', kind:'iap',
    effect:'Founders Bomb, VIP, ×1.25 pick/bomb/exp, +100 bomb cap, offline 24h…' },
];

/** Value Packs wiki Store — possession manuelle (pas dans l'export). */
export const STORE_VALUE_PACKS = [
  { id:'vp_perm_drone', name:'Unlocks Permanent Drone!', unlock:'Disparaît si acheté en gemmes' },
  { id:'vp_megabomb', name:'Unlocks MEGABOMB!', unlock:'Disparaît si acheté en gemmes' },
  { id:'vp_transmuter', name:'Unlocks Transmuter Bomb!', unlock:'Disparaît si acheté en gemmes' },
  { id:'vp_battery', name:'Unlocks Battery Bomb!', unlock:'Disparaît si acheté en gemmes' },
  { id:'vp_skill_surge', name:'Skill Surge Bundle!', unlock:'N/A' },
  { id:'vp_investment', name:'Investment Package!', unlock:'N/A' },
  { id:'vp_banker', name:"Banker's Bundle!", unlock:'N/A' },
  { id:'vp_progression', name:'Progression Booster Bundle!', unlock:'OB30' },
  { id:'vp_bomber', name:'Bomber Extraordinaire Bundle!', unlock:'OB30' },
  { id:'vp_singularity', name:'Singularity Bundle!', unlock:'OB60' },
  { id:'vp_void', name:'Void Overdrive Bundle!', unlock:'Golden Void ≥ 1%' },
  { id:'vp_frog', name:'Frog Frenzy Bundle!', unlock:'Black Hole 1' },
  { id:'vp_hauler', name:'Legendary Hauler Bundle!', unlock:'Docks T2' },
  { id:'vp_ceo', name:'Chief Executive Bundle!', unlock:'Super Stonks ≥ 1%' },
  { id:'vp_capitalist', name:'Capitalist Bundle!', unlock:'OB19' },
  { id:'vp_fast', name:'Gotta Go Fast Bundle!', unlock:'N/A' },
  { id:'vp_pet', name:'Pet Trainer Bundle!', unlock:'OB17' },
  { id:'vp_poly', name:'Polychrome Potency Bundle!', unlock:'OB37 + skill poly' },
  { id:'vp_lootbug', name:'Lootbug Bonanza Bundle!', unlock:'OB32' },
  { id:'vp_fisher', name:"Fisher's Bundle!", unlock:'OB37' },
  { id:'vp_gold_lootbug', name:'Golden Lootbug Bundle!', unlock:'N/A' },
  { id:'vp_supernova', name:'Stargazing Supernova Bundle!', unlock:'OB23' },
  { id:'vp_gold_ore', name:'Golden Ore Bundle!', unlock:'Golden Ore Chance' },
  { id:'vp_supergiant', name:'Stargazing Supergiant Bundle!', unlock:'Star Supergiant Chance' },
  { id:'vp_craftmaster', name:'Craftmaster Bundle!', unlock:'OB35' },
  { id:'vp_insider', name:'Insider Trading Bundle!', unlock:'OB34 + Stonks' },
  { id:'vp_double_divine', name:'Double Divine Bundle!', unlock:'N/A' },
  { id:'vp_vein', name:'Vein Extractor Bundle!', unlock:'OB19' },
  { id:'vp_bigger_banker', name:"Bigger Banker's Bundle!", unlock:'N/A' },
  { id:'vp_angler', name:"Angler's Bundle!", unlock:'OB39' },
  { id:'vp_drone_cat', name:'Drone Catalyst Bundle!', unlock:'OB35' },
  { id:'vp_gifts', name:'Gift Lovers Bundle!', unlock:'100 Gifts' },
  { id:'vp_arch', name:'Archaeology Bundle!', unlock:'OB30' },
  { id:'vp_divine_chest', name:'Divine Chest Bundle!', unlock:'N/A' },
  { id:'vp_baller', name:'Baller Skin Bundle!', unlock:'N/A' },
  { id:'vp_skill_galore', name:'Skill Points Galore!', unlock:'OB4' },
  { id:'vp_halfway', name:'Half Way Bundle!', unlock:'50% completion' },
  { id:'vp_ascension', name:'Ascension Bundle!', unlock:'OB66' },
  { id:'vp_arcanist', name:'Arcanist Bundle!', unlock:'OB70' },
  { id:'vp_omniportal', name:'Omniportal Bundle!', unlock:'Galactic Portal ≥ 1%' },
  { id:'vp_three_quarter', name:'Three Quarter Bundle!', unlock:'75% completion' },
];

export const STORE_EXPORT_NOTE =
  "Les niveaux Store (perks, unlocks, gem upgrades, value packs) ne sont pas dans exportstats. Seul le total gem_upgrade_cap_increase y figure.";
