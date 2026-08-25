/* ============================================================
   cards.js — Données Cards (wiki "Cards", v2.2.6)
   États d'une carte : 0=non obtenue, 1=standard, 2=gilded,
   3=polychrome, 4=infernal.
   Chaque entrée : id, name, cat, effect (par état), unlock (obligatoire ?).
   Liste extensible : ajouter une ligne = la carte apparaît dans l'app.
   ============================================================ */

export const CARD_STATES = [
  { v:0, name:'Non obtenue',  cls:'st0' },
  { v:1, name:'Standard',     cls:'st1' },
  { v:2, name:'Gilded',       cls:'st2' },
  { v:3, name:'Polychrome',   cls:'st3' },
  { v:4, name:'Infernal',     cls:'st4' },
];

/* Ordre wiki Cards/Card Effects (tabber) */
export const CARD_SETS = [
  { id:'ores',  name:'Ore Cards',   icon:'⛏', effect:['Gain 1.50x','2x','4x-21.23x','+0.12x/+0.02x'] },
  { id:'bars',  name:'Bar Cards',   icon:'🧱', effect:['Gain 1.50x','2x','4x-19x','+0.12x/+0.02x'] },
  { id:'bombs', name:'Bomb Cards',  icon:'💣', effect:['Recharge: 50% 2x bombes','2x','3x','N/A'] },
  { id:'misc',  name:'Misc Cards',  icon:'🃏', effect:['Varié','—','—','+0.02x'] },
  { id:'drones',name:'Drone Cards', icon:'🛸', effect:['Per drone','—','—','+0.02x/+0.0x'] },
  { id:'pets',  name:'Pet Cards',   icon:'🐾', effect:['Per pet','—','—','+0.02x/+0.0x'] },
  { id:'veins', name:'Vein Cards',  icon:'💠', effect:['Gain 1.50x','2x','4x-12.27x','+0.15x/+0.01x'] },
  { id:'stars', name:'Star Cards',  icon:'⭐', effect:['Gain 1.50x','2x','4x-7.13x','+0.20x/+0.01x'] },
  { id:'arch',  name:'Archaeology', icon:'🦴', effect:['Per block','—','—','+0.02x/+0.0x'] },
  { id:'fish',  name:'Fish Cards',  icon:'🐟', effect:['Gain 1.50x','2x','4x-9.2x','+0.08x/+0.005x'] },
  { id:'legendary_fish', name:'Legendary Fish', icon:'🐋', effect:['Varié','—','—','+0.20x/+0.001x'] },
  { id:'essence',name:'Essence',    icon:'🟣', effect:['Arcanist','—','—','+0.02x/+0.0x'] },
  { id:'runes', name:'Runes',       icon:'🔮', effect:['Arcanist','—','—','+0.02x/+0.0x'] },
  { id:'spells',name:'Spells',      icon:'✨', effect:['Arcanist','—','—','+0.02x/+0.0x'] },
  { id:'orbs',  name:'Orbs',        icon:'⚪', effect:['Arcanist','—','—','+0.02x/+0.0x'] },
];

/* Misc cards individuelles (wiki "Cards", table Misc) */
export const MISC_CARDS = [
  { id:'superstar', name:'Super Star',        effect:['All Star 1.05x','1.10x','1.20x','+0.02x'] },
  { id:'novagiant', name:'Novagiant Combo',   effect:['Combo 1.08x','1.16x','1.24x','+0.02x'] },
  { id:'minername', name:'Miner Name',        effect:['XP 1.10x','1.20x','1.40x','+0.02x'] },
  { id:'lootbug',   name:'Lootbug',           effect:['Loot 1.10x','1.20x','1.30x','+0.02x'] },
  { id:'goldbug',   name:'Golden Lootbug',    effect:['Chance +2%','+4%','+6%','+0.02x'] },
  { id:'prestige',  name:'Prestige',          effect:['Floor Req 0.95x','0.90x','0.80x','+0.02x'] },
  { id:'freebie',   name:'Freebie',           effect:['Gems +1','+2','+4','+0.02x'] },
  { id:'stonks',    name:'Stonks',            effect:['Multi 1.10x','1.20x','1.30x','+0.02x'] },
  { id:'superstonks',name:'Super Stonks',     effect:['Chance +0.5%','+1%','+2%','+0.02x'] },
  { id:'ultrastonks',name:'Ultra Stonks',     effect:['Chance +0.5%','+1%','+2%','+0.02x'] },
  { id:'contract',  name:'Contract',          effect:['Points +1','+2','+3','+0.02x'] },
  { id:'void',      name:'Void Portal',       effect:['Multi 1.05x','1.10x','1.20x','+0.02x'] },
  { id:'goldvoid',  name:'Golden Void Portal',effect:['Multi 1.08x','1.16x','1.24x','+0.02x'] },
  { id:'rainbowvoid',name:'Rainbow Void',     effect:['Multi 1.08x','1.16x','1.24x','+0.02x'] },
  { id:'galacvoid', name:'Galactic Void',     effect:['Multi +8%','+16%','+24%','+0.02x'] },
  { id:'world1',    name:'World 1',           effect:['Golden Floor 1.06x','1.12x','1.24x','+0.02x'] },
  { id:'world2',    name:'World 2',           effect:['Rainbow Floor 1.06x','1.12x','1.24x','+0.02x'] },
  { id:'world3',    name:'World 3',           effect:['Galactic Rainbow 1.06x','1.12x','1.24x','+0.02x'] },
  { id:'world4',    name:'World 4',           effect:['All Floor 1.06x','1.12x','1.24x','+0.02x'] },
  { id:'alex',      name:'Alex',              effect:['Pickaxe Dmg 1.10x','1.20x','1.40x','+0.02x'] },
  { id:'bluecow',   name:'Blue Cow',          effect:['Drone XP 5%','10%','15%','+0.02x'] },
  { id:'goldore',   name:'Golden Ore',        effect:['Multi 1.06x','1.12x','1.24x','+0.02x'] },
  { id:'sushi',     name:'Sushi',             effect:['Ticks +5','+10','+20','+0.02x'] },
  { id:'archabil',  name:'Arch Ability',      effect:['Cooldown -3%','-6%','-10%','+0.02x'] },
  { id:'goldvein',  name:'Golden Vein',       effect:['Multi 1.08x','1.16x','1.24x','+0.02x'] },
  { id:'rainbowvein',name:'Rainbow Vein',     effect:['Multi 1.08x','1.16x','1.24x','+0.02x'] },
  { id:'gleamvein', name:'Gleaming Vein',     effect:['Multi 1.08x','1.16x','1.24x','+0.02x'] },
  { id:'fuel',      name:'Fuel',              effect:['Duration 1.02x','1.05x','1.10x','+0.02x'] },
  { id:'rod',       name:'Fishing Rod',       effect:['Power 1.02x','1.05x','1.10x','+0.02x'] },
  { id:'code',      name:'Code',              effect:['Item Dur 1.01x','1.03x','1.06x','+0.02x'] },
  { id:'frozenara', name:'FrozenAra',         effect:['10x Contract 0.1%','0.2%','0.3%','+0.02x'] },
  { id:'celio',     name:"Celio's Hat",       effect:['PP Gain 1.10x','1.20x','1.40x','+0.02x'] },
  { id:'vydn',      name:'Vydn',              effect:['Coal Cap 1.04x','1.08x','1.12x','+0.02x'] },
  { id:'lute',      name:'Lute',              effect:['Rainbow Floor 1.06x','1.12x','1.18x','+0.02x'] },
  { id:'julk',      name:'Julk',              effect:['Ore Sell 1.04x','1.08x','1.12x','+0.02x'] },
  { id:'pizza',     name:'Yummy Pizza',       effect:['All Floor 1.01x','1.02x','1.03x','+0.02x'] },
  { id:'lootfrog',  name:'Lootfrog',          effect:['Capacity +1','+2','+4','+0.02x'] },
  { id:'goldfrog',  name:'Golden Lootfrog',   effect:['Chance +0.5%','+1%','+2%','+0.02x'] },
  { id:'bigfrog',   name:'Big Lootfrog',      effect:['Multi 1.09x','1.18x','1.27x','+0.02x'] },
  { id:'massfrog',  name:'Massive Lootfrog',  effect:['Chance +0.2%','+0.4%','+0.6%','+0.02x'] },
  { id:'floor73',   name:'Floor 73',          effect:['Golden Floor 1.02x','1.04x','1.06x','+0.02x'] },
];

/* ============================================================
   pets.js inclus ici — wiki "Pets" (v2.2.6)
   ============================================================ */
export const PETS = [
  { id:'crab',   name:'Crab',    unlockTotal:0,  price:1,    levelBy:'Tirer une bombe basic',            bonus:'Bomb Cap +3%/niv · Recharge +1%/niv', maxLevel:25 },
  { id:'dwarf',  name:'Dwarf',   unlockTotal:1,  price:350,  levelBy:'Upgrade pioche > lvl 25',          bonus:'Pickaxe Dmg +20%/niv · Ultra Crit +1%/niv', maxLevel:25 },
  { id:'duck',   name:'Duck',    unlockTotal:5,  price:750,  levelBy:'Épuiser une veine',                bonus:'XP +12%/niv · Lootbug Spawn +2.5%/niv', maxLevel:20, skin:'Not A Duck : Obelisk Armor -10%' },
  { id:'rabbit', name:'Rabbit',  unlockTotal:12, price:1000, levelBy:'Compléter un contrat',             bonus:'Contract Cost -0.03x/niv', maxLevel:20 },
  { id:'penguin',name:'Penguin', unlockTotal:18, price:1500, levelBy:'Spawner un golden floor',          bonus:'Golden Floor Multi +0.05x/niv', maxLevel:20 },
  { id:'axolotl',name:'Axolotl', unlockTotal:28, price:1750, levelBy:'Crafter un lingot W2',             bonus:'Double Craft +2%/niv · Craft Cost -1%/niv', maxLevel:20 },
  { id:'whale',  name:'Whale',   unlockTotal:40, price:2000, levelBy:'Dépenser des gemmes',              bonus:'Pickaxe Dmg +10%/niv · Triple Lootbug +3%/niv', maxLevel:20 },
];

/* Stargazing — catalogue complet dans starsData.js */
export { STARS_FULL as STARS } from './starsData.js';

/* Fishing — structure (wiki "Fishing") */
export const FISHING = {
  note:'Détails complets à importer depuis le wiki Fishing. Stats exportstats disponibles : fishing_rod_power, fishing_income_multi, fishing_tick_speed, etc.',
};
