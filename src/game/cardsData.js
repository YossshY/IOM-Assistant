/* ============================================================
   cardsData.js — Cards individuelles générées depuis les données
   wiki extraites (77 ores, 77 bars, v2.2.6) + misc cards.
   Chaque carte : { id, name, cat, world, icon, effect:[std,gild,poly,inf] }
   Le monde est dérivé du floor d'apparition de la ressource.
   ============================================================ */
import ORES_RAW from '../data/ores_raw.js';
import BARS_RAW from '../data/bars_raw.js';

export function worldOfFloor(floorRange) {
  if (!floorRange) return null;
  const a = parseInt(floorRange.split('-')[0], 10);
  if (isNaN(a)) return null;
  if (a <= 42) return 1;
  if (a <= 72) return 2;
  if (a <= 102) return 3;
  return 4;
}

/* --- Ore cards : une par minerai, monde selon son floor --- */
export const ORE_CARDS = ORES_RAW.map(o => ({
  id: 'ore_' + o.id.toLowerCase(),
  name: o.id.replace(/([a-z])([A-Z])/g,'$1 $2'), // Beepboopium etc restent lisibles
  cat: 'ores',
  world: worldOfFloor(o.floor),
  icon: 'assets/ores/' + o.id + '.png',
  mod: o.mod || null,
  effect: ['Ore Gain 1.50x', '2x', '4x-21.23x', '+0.12x/+0.02x'],
}));

/* --- Bar cards : une par lingot ; monde dérivé du minerai correspondant --- */
const oreWorldByName = new Map(ORES_RAW.map(o => [o.id.toLowerCase(), worldOfFloor(o.floor)]));
export const BAR_CARDS = BARS_RAW.map(b => {
  const id = b.id ?? b;
  return {
    id: 'bar_' + String(id).toLowerCase(),
    name: id,
    cat: 'bars',
    world: oreWorldByName.get(String(id).toLowerCase()) ?? null,
    icon: 'assets/ores/' + id + '_bar.png',
    effect: ['Bar Gain 1.50x', '2x', '4x-19x', '+0.12x/+0.02x'],
  };
});

/* --- Misc cards (wiki Cards table Misc, v2.2.6) ---
   world = condition de déblocage approximative pour le masquage progressif :
   - world1/2/3/4 : liées au monde
   - null : toujours disponibles dès OB15 (unlock des cards) */
const M = (id, name, e1, e2, e3, extra={}) => ({ id:'misc_'+id, name, cat:'misc', effect:[e1,e2,e3,'+0.02x/+0.0x'], ...extra });
export const MISC_CARDS = [
  M('superstar','Super Star','All Star 1.05x','1.10x','1.20x'),
  M('novagiant','Novagiant Combo','Combo 1.08x','1.16x','1.24x'),
  M('minername','Miner Name','XP 1.10x','1.20x','1.40x'),
  M('lootbug','Lootbug','Loot 1.10x','1.20x','1.30x'),
  M('goldbug','Golden Lootbug','Chance +2%','+4%','+6%'),
  M('prestige','Prestige','Floor Req 0.95x','0.90x','0.80x'),
  M('freebie','Freebie','Gems +1','+2','+4'),
  M('stonks','Stonks','Multi 1.10x','1.20x','1.30x'),
  M('superstonks','Super Stonks','Chance +0.5%','+1%','+2%'),
  M('ultrastonks','Ultra Stonks','Chance +0.5%','+1%','+2%'),
  M('contract','Contract','Points +1','+2','+3'),
  M('void','Void Portal','Multi 1.05x','1.10x','1.20x',{world:2}),
  M('goldvoid','Golden Void Portal','Multi 1.08x','1.16x','1.24x',{world:2}),
  M('rainbowvoid','Rainbow Void Portal','Multi 1.08x','1.16x','1.24x',{world:2}),
  M('galacvoid','Galactic Void Portal','Multi +8%','+16%','+24%',{world:3}),
  M('world1','World 1','Golden Floor 1.06x','1.12x','1.24x',{world:1}),
  M('world2','World 2','Rainbow Floor 1.06x','1.12x','1.24x',{world:2}),
  M('world3','World 3','Galactic Rainbow 1.06x','1.12x','1.24x',{world:3}),
  M('world4','World 4','All Floor 1.06x','1.12x','1.24x',{world:4}),
  M('alex','Alex','Pickaxe Dmg 1.10x','1.20x','1.40x'),
  M('bluecow','Blue Cow','Drone XP 5%','10%','15%'),
  M('goldore','Golden Ore','Multi 1.06x','1.12x','1.24x',{world:2}),
  M('sushi','Sushi','Ticks +5','+10','+20',{world:3}),
  M('archabil','Arch Ability','Cooldown -3%','-6%','-10%',{world:3}),
  M('goldvein','Golden Vein','Multi 1.08x','1.16x','1.24x',{world:2}),
  M('rainbowvein','Rainbow Vein','Multi 1.08x','1.16x','1.24x',{world:2}),
  M('gleamvein','Gleaming Vein','Multi 1.08x','1.16x','1.24x',{world:3}),
  M('fuel','Fuel','Duration 1.02x','1.05x','1.10x',{world:2}),
  M('rod','Fishing Rod','Power 1.02x','1.05x','1.10x',{world:3}),
  M('code','Code','Item Dur 1.01x','1.03x','1.06x'),
  M('frozenara','FrozenAra','10x Contract 0.1%','0.2%','0.3%'),
  M('celio',"Celio's Hat",'PP Gain 1.10x','1.20x','1.40x'),
  M('vydn','Vydn','Coal Cap 1.04x','1.08x','1.12x',{world:2}),
  M('lute','Lute','Rainbow Floor 1.06x','1.12x','1.18x',{world:2}),
  M('julk','Julk','Ore Sell 1.04x','1.08x','1.12x'),
  M('pizza','Yummy Pizza','All Floor 1.01x','1.02x','1.03x'),
  M('lootfrog','Lootfrog','Capacity +1','+2','+4'),
  M('goldfrog','Golden Lootfrog','Chance +0.5%','+1%','+2%'),
  M('bigfrog','Big Lootfrog','Multi 1.09x','1.18x','1.27x'),
  M('massfrog','Massive Lootfrog','Chance +0.2%','+0.4%','+0.6%'),
  M('floor73','Floor 73','Golden Floor 1.02x','1.04x','1.06x',{world:3}),
];

const FX = {
  bombs: ['On Recharge: 50% to Gain 2x Bomb', '2x', '3x', 'N/A'],
  veins: ['Vein Gain 1.50x', '2x', '4x-12.27x', '+0.15x/+0.01x'],
  stars: ['Star Gain 1.50x', '2x', '4x-7.13x', '+0.20x/+0.01x'],
  fish: ['Fish Gain 1.50x', '2x', '4x-9.2x', '+0.08x/+0.005x'],
  drones: ['Drone bonus', 'Gilded', 'Poly', '+0.02x/+0.0x'],
  pets: ['Pet bonus', 'Gilded', 'Poly', '+0.02x/+0.0x'],
};

const C = (cat, id, name, world, iconFile) => ({
  id: `${cat}_${id}`,
  name,
  cat,
  world: world ?? null,
  icon: iconFile ? `assets/cards/${iconFile}` : null,
  effect: FX[cat],
});

/* Bomb cards — wiki Bombs (hors golden variants) */
export const BOMB_CARDS = [
  C('bombs','basic','Basic Bomb',1,'Basic_Bomb.png'),
  C('bombs','chain','Chain Bomb',1,'Chain_Bomb.png'),
  C('bombs','plenty','Bomb of Plenty',1,'Bomb_of_Plenty.png'),
  C('bombs','exp','Exp Bomb',1,'Exp_Bomb.png'),
  C('bombs','mega','MEGABOMB',1,'MEGABOMB.png'),
  C('bombs','infinity','Infinity Bomb',1,'Infinity_Bomb.png'),
  C('bombs','transmuter','Transmuter Bomb',1,null),
  C('bombs','gem','Gem Bomb',1,'Gem_Bomb.png'),
  C('bombs','cherry','Cherry Bomb',1,'Cherry_Bomb.png'),
  C('bombs','battery','Battery Bomb',1,'Battery_Bomb.png'),
  C('bombs','d20','D20 Bomb',1,'D20_Bomb.png'),
  C('bombs','founders','Founders Bomb',1,'Founders_Bomb.png'),
  C('bombs','veinmorpher','Veinmorpher Bomb',2,null),
];

/* Vein cards — Construct / Stargazing costs */
export const VEIN_CARDS = [
  C('veins','stone','Stone Vein',1,'Stone_Vein.png'),
  C('veins','magma','Magma Vein',1,'Magma_Vein.png'),
  C('veins','virtual','Virtual Vein',2,'Virtual_Vein.png'),
  C('veins','space','Space Vein',2,'Space_Vein.png'),
  C('veins','atomic','Atomic Vein',2,'Atomic_Vein.png'),
  C('veins','cloud','Cloud Vein',2,'Cloud_Vein.png'),
  C('veins','beach','Beach Vein',2,'Beach_Vein.png'),
  C('veins','valley','Valley Vein',2,'Valley_Vein.png'),
  C('veins','deepsea','Deepsea Vein',2,'Deepsea_Vein.png'),
  C('veins','jungle','Jungle Vein',2,'Jungle_Vein.png'),
  C('veins','jurassic','Jurassic Vein',3,'Jurassic_Vein.png'),
  C('veins','roman','Roman Vein',3,'Roman_Vein.png'),
  C('veins','industrial','Industrial Vein',3,'Industrial_Vein.png'),
  C('veins','warfront','Warfront Vein',3,'Warfront_Vein.png'),
  C('veins','neon','Neon Vein',3,'Neon_Vein.png'),
  C('veins','wonderland','Wonderland Vein',4,'Wonderland_Vein.png'),
  C('veins','enchanted','Enchanted Vein',4,'Enchanted_Vein.png'),
  C('veins','candyland','Candyland Vein',4,'Candyland_Vein.png'),
  C('veins','arabian','Arabian Vein',4,'Arabian_Vein.png'),
  C('veins','pirate','Pirate Vein',4,'Pirate_Vein.png'),
];

/* Star cards — une par constellation */
export const STAR_CARDS = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius',
  'Capricorn','Aquarius','Pisces','Ophiuchus','Orion','Hercules','Draco','Cetus',
  'Phoenix','Eridanus','Lynx','Vulpecula',
].map((n,i) => C('stars', n.toLowerCase(), n, i < 12 ? 2 : (i < 17 ? 3 : 4), `${n}.png`));

/* Fish cards — commons + legendaries (heads/icons wiki) */
/* Legendary fish cards — effets wiki (pas le template Fish Gain) */
export const LEGENDARY_FISH_CARDS = [
  { id:'fish_rainbow_trout', name:'Rainbow Trout', cat:'fish', world:3, icon:'assets/cards/Lake_Legendary_Fish_Head.png',
    effect:['Rainbow Floor Multi +25%','+50%','+100%','+0.20x/+0.001x'], legendary:true },
  { id:'fish_dunes_eelworm', name:"Dune's Eelworm", cat:'fish', world:3, icon:'assets/cards/Desert_Legendary_Fish_Head.png',
    effect:['Golden Portal Multi +40%','+80%','+140%','+0.20x/+0.001x'], legendary:true },
  { id:'fish_glacial_shellstealer', name:'Glacial Shellstealer', cat:'fish', world:3, icon:null,
    effect:['Rainbow Vein Multi +30%','+60%','+100%','+0.20x/+0.001x'], legendary:true },
  { id:'fish_megalodon', name:'Megalodon', cat:'fish', world:3, icon:'assets/cards/Ocean_Legendary_Fish_Head.png',
    effect:['Star Supernova Multi +35%','+70%','+125%','+0.20x/+0.001x'], legendary:true },
  { id:'fish_radioactive_slug', name:'Radioactive Slug', cat:'fish', world:3, icon:'assets/cards/Nuclear_Legendary_Fish_Head.png',
    effect:['Bomb Damage/Exp Gain +300%','+500%','+1100%','+0.20x/+0.001x'], legendary:true, damageLever:true },
  { id:'fish_cthulhu', name:'Cthulhu', cat:'fish', world:3, icon:'assets/cards/Abyss_Legendary_Fish_Head.png',
    effect:['Divine Relics Cap +1','+2','+4','+0.20x/+0.001x'], legendary:true },
  { id:'fish_glimmering_geoduck', name:'Glimmering Geoduck', cat:'fish', world:3, icon:'assets/cards/Cave_Legendary_Fish_Head.png',
    effect:['Banked Freebie Cap +14%','+28%','+52%','+0.20x/+0.001x'], legendary:true },
  { id:'fish_laviathan', name:'Laviathan', cat:'fish', world:3, icon:'assets/cards/Volcano_Legendary_Fish_Head.png',
    effect:['Bar Output Multiplier +40%','+80%','+140%','+0.20x/+0.001x'], legendary:true },
  { id:'fish_storm_serpent', name:'Storm Serpent', cat:'fish', world:3, icon:'assets/cards/Sky_Legendary_Fish_Head.png',
    effect:['Super Stonks Multiplier +14%','+28%','+56%','+0.20x/+0.001x'], legendary:true },
  { id:'fish_melting_gibbous', name:'Melting Gibbous', cat:'fish', world:4, icon:'assets/cards/Solaris_Legendary_Fish_Head.png',
    effect:['Gems From Freebie +10%','+20%','+30%','+0.20x/+0.001x'], legendary:true },
  { id:'fish_blackened_basker', name:'Blackened Basker', cat:'fish', world:4, icon:'assets/cards/Galaxy_Legendary_Fish_Head.png',
    effect:['Super Stonks Chance +0.15%','+0.30%','+0.60%','+0.20x/+0.001x'], legendary:true },
];

export const FISH_CARDS = [
  C('fish','guppy','Guppy',3,'Guppy.png'),
  C('fish','golden_trout','Golden Trout',3,'Golden_Trout.png'),
  C('fish','catfish','Catfish',3,'Catfish.png'),
  C('fish','gammangler','Gammangler Fish',3,'Gammangler_Fish.png'),
  C('fish','lantern','Lanternfish Comet',3,'Lanternfish_Comet.png'),
  C('fish','lunar','Lunar Sunfish',3,'Lunar_Sunfish.png'),
  C('fish','molten','Molten Archerfish',3,'Molten_Archerfish.png'),
  C('fish','planetary','Planetary Jellyfish',3,'Planetary_Jellyfish.png'),
  C('fish','shock','Shocksailfish',3,'Shocksailfish.png'),
  C('fish','frost_spear','Frostdrip Spearfish',3,'Frostdrip_Spearfish.png'),
  C('fish','frost_crab','Frostshell Crab',3,'Frostshell_Crab.png'),
  C('fish','scarab','Scarabshoe Crab',3,'Scarabshoe_Crab.png'),
  ...LEGENDARY_FISH_CARDS,
];

export const DRONE_CARDS = [
  C('drones','bear','Bomb Bear',1,'Drone_Bear_Icon.png'),
  C('drones','chain','Chain Bomber',1,'Drone_Chain_Icon.png'),
  C('drones','midas','Midas',1,'Drone_Midas_Icon.png'),
  C('drones','frogger','Frogger',1,'Drone_Frogger_Icon.png'),
  C('drones','veinseeker','Veinseeker',2,'Drone_Veinseeker_Icon.png'),
  C('drones','starburst','Starburst',2,'Drone_Starburst_Icon.png'),
  C('drones','elixir','Elixir',2,'Drone_Elixir_Icon.png'),
  C('drones','void','Void',2,'Drone_Void_Icon.png'),
  C('drones','angler','Angler',3,'Drone_Angler_Icon.png'),
  C('drones','prism','Prism',4,'Drone_Prism_Icon.png'),
  C('drones','minotaur','Minotaur',4,'Drone_Minotaur_Icon.png'),
];

export const PET_CARDS = [
  C('pets','crab','Crab',2,'Crab_Default.png'),
  C('pets','dwarf','Dwarf',2,'Dwarf_Default.png'),
  C('pets','duck','Duck',2,'Duck_Default.png'),
  C('pets','rabbit','Rabbit',2,null),
  C('pets','penguin','Penguin',2,null),
  C('pets','axolotl','Axolotl',2,null),
  C('pets','whale','Whale',2,null),
  C('pets','totem','Totem',2,null),
  C('pets','happybot','Happy-Bot',3,null),
  C('pets','leprechaun','Leprechaun',3,null),
  C('pets','starfish','Starfish',3,'Starfish_Default.png'),
  C('pets','dino','Dino',3,null),
  C('pets','mr_nibbles','Mr Nibbles',3,null),
  C('pets','nagini','Nagini',3,null),
  C('pets','butterfly','Butterfly',4,'Butterfly_Skin.png'),
  C('pets','rhino','Rhino',4,null),
];

export const ALL_CARDS = [
  ...ORE_CARDS, ...BAR_CARDS, ...BOMB_CARDS, ...VEIN_CARDS,
  ...STAR_CARDS, ...FISH_CARDS, ...DRONE_CARDS, ...PET_CARDS, ...MISC_CARDS,
];

/* Déblocage par monde : une carte est visible si world <= maxWorld débloqué
   (ou world null => visible dès l'obtention des cards à OB15). */
export function visibleCards(maxWorld) {
  return ALL_CARDS.filter(c => c.world == null || c.world <= maxWorld);
}
