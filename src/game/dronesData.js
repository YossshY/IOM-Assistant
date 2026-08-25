/* ============================================================
   dronesData.js — Drones wiki v2.2.6 + caps export
   Tabs: Upgrades / Suits / Fuel
   ============================================================ */

export const DRONE_CORE_UPGRADES = [
  { id:'unlock', name:'Unlock Drone', perLevel:1, unit:'', maxBase:1, unlock:true },
  { id:'damage', name:'Drone Damage (Pickaxe %)', perLevel:20, unit:'%', maxBase:10, exportKey:'drone_damage_percent' },
  { id:'radius', name:'Drone Radius', perLevel:12, unit:'%', maxBase:10, exportKey:'drone_radius_percent' },
  { id:'movespeed', name:'Drone Movespeed', perLevel:10, unit:'%', maxBase:10, exportKey:'drone_movespeed_percent' },
  { id:'attack_speed', name:'Drone Attack Speed', perLevel:10, unit:'%', maxBase:10, exportKey:'drone_attack_speed_percent' },
  { id:'triple', name:'Drone Triple Damage Chance', perLevel:2, unit:'%', maxBase:15, exportKey:'drone_triple_damage_chance', unlockOb:1 },
  { id:'rapid', name:'Drone Rapid Fire Chance', perLevel:2, unit:'%', maxBase:15, exportKey:'drone_rapid_fire_chance', unlockOb:2 },
];

/** Suit unlock + upgrade rows (screens: 15/15 with Mechanical Evolution + coal). */
export const DRONE_SUITS = [
  { id:'bear', name:'Bomb Bear', ability:'Auto basic bomb at max capacity', upgrade:'Bomb Damage When Equipped +15%', perLevel:15, unit:'%', unlockOb:2 },
  { id:'chain', name:'Chain Bomber', ability:'Auto chain bomb at max capacity', upgrade:'Chance For 2x Chain Size +4%', perLevel:4, unit:'%', unlockOb:4 },
  { id:'midas', name:'Midas', ability:'10% ore value as gold', upgrade:'Ore Value Gained +1%', perLevel:1, unit:'%', unlockOb:6 },
  { id:'frogger', name:'Frogger', ability:'Random bomb every 30s', upgrade:'Time Between Autofires -1.5s', perLevel:-1.5, unit:'s', unlockOb:8 },
  { id:'veinseeker', name:'Veinseeker', ability:'Vein Spawn Rate +10%', upgrade:'Vein Spawn Rate +2%', perLevel:2, unit:'%', unlockOb:19 },
  { id:'starburst', name:'Starburst', ability:'Triple Star Chance +6%', upgrade:'Triple Star Chance +1%', perLevel:1, unit:'%', unlockOb:23 },
  { id:'elixir', name:'Elixir', ability:'Random buff every 360s', upgrade:'Time Between Buffs -15s', perLevel:-15, unit:'s', unlockOb:23 },
  { id:'void', name:'Void', ability:'Ore Portal Chance 10%', upgrade:'Portal Ore Chance +2%', perLevel:2, unit:'%', unlockOb:23 },
  { id:'angler', name:'Angler', ability:'2 Fishing Ticks / 1140s', upgrade:'Time Between Fishing Ticks -40s', perLevel:-40, unit:'s', unlockOb:37 },
  { id:'prism', name:'Prism', ability:'Galactic Floor Chance +0.25%', upgrade:'Galactic Floor Chance +0.25%', perLevel:0.25, unit:'%', unlockOb:64 },
  { id:'minotaur', name:'Minotaur', ability:'Pickaxe & Bomb Damage +30%', upgrade:'Pickaxe & Bomb Damage +30%', perLevel:30, unit:'%', unlockOb:70 },
];

/** Fuel grades — max wiki absolute ; current from export *_fuel_grade */
export const DRONE_FUEL = [
  { id:'bear', name:'Bomb Bear', gradeKey:'bear_fuel_grade', maxGrade:40, buff:'Lootbug Spawn Rate' },
  { id:'chain', name:'Chain Bomber', gradeKey:'chain_fuel_grade', maxGrade:257, buff:'Golden Floor Multi' },
  { id:'midas', name:'Midas', gradeKey:'midas_fuel_grade', maxGrade:100, buff:'Gold value on ore destroy' },
  { id:'frogger', name:'Frogger', gradeKey:'frogger_fuel_grade', maxGrade:54, buff:'Free bombs / frog chance' },
  { id:'veinseeker', name:'Veinseeker', gradeKey:'veinseeker_fuel_grade', maxGrade:166, buff:'Golden Vein Multi' },
  { id:'starburst', name:'Starburst', gradeKey:'starburst_fuel_grade', maxGrade:60, buff:'Auto-catch / Star Spawn' },
  { id:'elixir', name:'Elixir', gradeKey:'elixir_fuel_grade', maxGrade:45, buff:'Buff Duration' },
  { id:'void', name:'Void', gradeKey:'void_fuel_grade', maxGrade:157, buff:'Portal Resource Multi' },
  { id:'angler', name:'Angler', gradeKey:'angler_fuel_grade', maxGrade:42, buff:'Extra ticks / Legendary Fish' },
  { id:'prism', name:'Prism', gradeKey:'prism_fuel_grade', maxGrade:50, buff:'Prismatic Floor' },
  { id:'minotaur', name:'Minotaur', gradeKey:'minotaur_fuel_grade', maxGrade:45, buff:'Portal Multi / Bomb Recharge' },
];

/** Infer level from export percent when possible. */
export function coreLevelFromExport(u, stats = {}) {
  if (u.unlock) return stats.drone_count > 0 ? 1 : 0;
  if (!u.exportKey) return 0;
  const v = +(stats[u.exportKey] || 0);
  if (!u.perLevel) return 0;
  return Math.max(0, Math.min(u.maxBase, Math.round(v / u.perLevel)));
}

export function suitCapFromExport(stats = {}, colCaps = {}) {
  return Math.max(5, +(stats.drone_suit_cap || colCaps.droneSuit || 5));
}
