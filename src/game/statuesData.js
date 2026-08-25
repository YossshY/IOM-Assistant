/* ============================================================
   statuesData.js — 27 statues (wiki "Construct#Statues", v2.2.6)
   W1 : 9 statues · W2 : aucune · W3 : 9 statues · W4 : 9 statues.
   Progression par statue : built → gilded → platinized (ordre
   ALÉATOIRE dans le jeu ; toutes construites avant de gilder,
   toutes gildées avant de platiniser).
   Icônes : assets/statues/N_Statue_Name_Normal|Gilded.png
   ============================================================ */

const S = (num, id, name, author, world, bonus, gilded, plat) => ({
  num, id, name, author, world,
  iconNormal: `assets/statues/${num}_Statue_${id}_Normal.png`,
  iconGilded: `assets/statues/${num}_Statue_${id}_Gilded.png`,
  // sprite Platinized : existe pour W1/W3 (1-18) ; W4 n'en a pas sur le wiki → fallback Gilded
  iconPlatinum: num <= 18 ? `assets/statues/${num}_Statue_${id}_Platinized.png`
                          : `assets/statues/${num}_Statue_${id}_Gilded.png`,
  hasPlatinumSprite: num <= 18,
  bonus, gildedBonus: gilded, platinumBonus: plat || gilded,
});

export const STATUES = [
  /* ---------- World 1 (1-9) ---------- */
  S(1,'Rhythm','Rhythm','Xanz',1,
    'Pickaxe Damage 3x','Pickaxe Damage 5x',
    'Pickaxe Damage x8 · Floor Clear Req -25%'),
  S(2,'Awareness','Awareness','Tor',1,
    'Bomb Damage 3x','Bomb Damage 5x',
    'Bomb Damage x8 · Bomb Ultra Crit +20%'),
  S(3,'Slaying','Slaying','Dark',1,
    'PP Gain 2x · Artifact Cap +1','PP Gain 3x · Artifact Cap +2',
    'PP Gain x5 · Artifact Cap +3 · Pet Level Cap +1'),
  S(4,'Appetite','Appetite','Frozen',1,
    'Bomb Cap Multi 1.3x','Bomb Cap Multi 1.5x',
    'Bomb Cap Multi 1.75x · Fuel Duration +15%'),
  S(5,'Friendship','Friendship','Caulwik',1,
    'Freebie Gems +1','Freebie Gems +2',
    'Freebie Gems +4 · Freebie Skill Shard +1%'),
  S(6,'Hygiene','Hygiene','Totefm',1,
    'Workshop Cap +2 · Gem Upgrade Cap +1','Workshop Cap +3 · Gem Upgrade Cap +2',
    'Workshop Cap +4 · Gem Upgrades Cap +4'),
  S(7,'Artistry','Artistry','Celio',1,
    'Freebie Pack Loot +3%','Freebie Pack Loot +5%',
    'Freebie Pack Loot +8% · Instant Refresh +1%'),
  S(8,'Randomness','Randomness','Jolly',1,
    'Vein Spawn +30% · Golden Vein +3%','Vein Spawn +50% · Golden Vein +5%',
    'Vein Spawn +75% · Golden Vein +10% · Rainbow Vein +5%'),
  S(9,'Childhood','Childhood','Salutem',1,
    'Contract Upgrade Cap +1','Contract Upgrade Cap +2',
    'Contract Upgrade Cap +4 · Rainbow Floor Chance +1%'),

  /* ---------- World 3 (10-18) ---------- */
  S(10,'Craftmanship','Craftmanship','Vydn',3,
    'Pickaxe Damage 4x · Gem Upgrade Cap +1','Pickaxe Damage 25x · Gem Cap +2 · Fish Income 1.25x',
    'Pickaxe Damage 125x · Gem Cap +3 · Fish Income 1.40x'),
  S(11,'Propulsion','Propulsion','Guard',3,
    'Bomb Damage 4x · Workshop Cap +1','Bomb Damage 25x · Workshop Cap +2 · Golden Vein Multi 1.25x',
    'Bomb Damage 125x · Workshop Cap +3 · Golden Vein Multi 1.50x'),
  S(12,'Safety','Safety','Zuiqiang',3,
    'Golden Ore Chance +3% · Multi +25% · Rainbow Floor +1%','Golden Ore Chance +5% · Multi +35% · Rainbow Floor +2%',
    'Golden Ore Chance +8% · Multi +55% · Rainbow Floor +4%'),
  S(13,'Ignition','Ignition','Julk',3,
    '100x Craft +0.50% · Galactic Floor +2%','100x Craft +1% · Galactic Floor +4%',
    '100x Craft +2.5% · Galactic Floor +6% · Golden Transmuter Bomb'),
  S(14,'Warmth','Warmth','Satio',3,
    'Supergiant +35% · Supernova +2x','Supergiant +55% · Supernova +3x',
    'Supergiant +85% · Supernova +5x · Midas drone cap +25'),
  S(15,'Feline','Feline','Iseburge',3,
    'Pet Level Up +10% · Pet Level Cap +1','Pet Level Up +15% · Pet Level Cap +2',
    'Pet Level Up +25% · Pet Level Cap +3 · Nagini Cap +5'),
  S(16,'Affluence','Affluence','Kohanu',3,
    'Triple Contract +10% · 10x Contract +1% · Contract Cap +1','Triple Contract +15% · 10x +2% · Contract Cap +2',
    'Triple Contract +25% · 10x +4% · Contract Cap +3'),
  S(17,'Eastwood','Eastwood','MLNW',3,
    'Banked Lootbugs/Freebies +2 · Freebie Timer -30s','Banked +4 · Timer -45s · XP 10x',
    'Banked +8 · Timer -1min · XP 100x'),
  S(18,'Soprano','Soprano','Praed',3,
    'All Floors +15% · Freebie Gift +0.5%','All Floors +25% · Gift +0.75% · 100x Gifts 1/35k',
    'All Floors +40% · Gift +1% · 100x Gifts 1/25k'),

  /* ---------- World 4 (19-27) — effets « Per W4 Statue » ---------- */
  S(19,'Comfort','Comfort','Lute',4,
    'All Damage +50%/W4 · All Floor +1%/skin · Scorpio/Capricorn Cap +20',null,null),
  S(20,'Timekeeping','Timekeeping','Karma',4,
    'Star Radiant +0.25%/W4 · Radiant Multis +20% · Hercules Cap +20',null,null),
  S(21,'Combat','Combat','Sans',4,
    'Stonks Chance +0.01%/W4 · Stonks Multis +10% · Ultra Stonks +2%',null,null),
  S(22,'Nature','Nature','Fanq',4,
    'Gem Bomb +0.04%/W4 · Rainbow Vein +10% · Workshop Cap +4',null,null),
  S(23,'Semblance','Semblance','Vak',4,
    'Rainbow Portal +0.5%/W4 · Void Drone Cap +20 · Prism Cap +5',null,null),
  S(24,'Crochet','Crochet','Kripp',4,
    'Golden Ore +3%/W4 · Galactic Floor +5% · Prismatic Floor +3%',null,null),
  S(25,'Antagonism','Antagonism','Loop',4,
    'Frogger Cap +1/W4 · Golden Frog +0.25%/W4 · Frog Multi +5%/W4',null,null),
  S(26,'Fallacy','Fallacy','Berty',4,
    'Prismatic Floor +10%/W4 · Freebie Gems +3/W4 · Veinseeker Cap +5/W4',null,null),
  S(27,'Rodentia','Rodentia','Kromak',4,
    'Pickaxe Damage +60%/W4 · Chain Grade +10/W4 · Super Star Radiant +1%/W4',null,null),
];

/* États d'une statue : 0 = non obtenue, 1 = construite, 2 = gildée, 3 = platinisée */
export const STATUE_STATES = [
  { v:0, name:'Non construite', cls:'ss0' },
  { v:1, name:'Construite',     cls:'ss1' },
  { v:2, name:'Gildée',         cls:'ss2' },
  { v:3, name:'Platinisée',     cls:'ss3' },
];

/* Visibilité : monde débloqué requis (W2 n'existe pas pour les statues). */
export function visibleStatues(maxWorld){
  return STATUES.filter(s => s.world <= maxWorld);
}

/* Règles du wiki : ordre aléatoire, mais paliers globaux :
   - gilding possible seulement si les 9 construites
   - platinizing seulement si les 9 gildées */
export function gatingInfo(statesByWorld){
  // statesByWorld : { W1:[...états], W3:[...], W4:[...] }
  const res = {};
  for(const [w, arr] of Object.entries(statesByWorld)){
    const allBuilt = arr.every(v=>v>=1);
    const allGilded = arr.every(v=>v>=2);
    res[w] = { canGild: allBuilt, canPlatinize: allGilded };
  }
  return res;
}
