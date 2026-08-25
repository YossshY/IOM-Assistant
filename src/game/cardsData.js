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

export const ALL_CARDS = [...ORE_CARDS, ...BAR_CARDS, ...MISC_CARDS];

/* Déblocage par monde : une carte est visible si world <= maxWorld débloqué
   (ou world null => visible dès l'obtention des cards à OB15). */
export function visibleCards(maxWorld) {
  return ALL_CARDS.filter(c => c.world == null || c.world <= maxWorld);
}
