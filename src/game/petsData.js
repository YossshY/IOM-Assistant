/* ============================================================
   petsData.js — 17 pets (wiki "Pets", v2.2.6) avec skins et quêtes.
   Icônes : assets/pets/{Pet}_{Default|Skin|Quest}.png
   Chaque pet : base + skin (lvl 5 requis) + quest (pet lvl 10).
   ============================================================ */

const P = (id, name, unlockTotal, price, levelBy, bonus, maxLevel = 20, opts = {}) => ({
  id, name, unlockTotal, price, levelBy, bonus, maxLevel,
  iconDefault: `assets/pets/${id}_Default.png`,
  skin: null, quest: null, ...opts,
});

export const PETS_FULL = [
  P('Crab','Crab',0,1,'Tirer une bombe basic',
    'Bomb Cap +3%/niv · Bomb Recharge +1%/niv',25,{
    skin:{ name:'Sizzle McSnaps', price:1000, bonus:'Workshop Upgrade Cap +1 · Crab Level Up Chance +15%' },
    quest:{ name:'Steel Scuttler', price:1500, rankUp:'Trigger Battery Cap Increases', bonus:'Plenty Bomb Multi +0.5x/rank · Exp Bomb Multi +0.5x/rank' }}),

  P('Dwarf','Dwarf',1,350,'Upgrader la pioche > lvl 25',
    'Pickaxe Damage +20%/niv · Ultra Crit Chance +1%/niv',25,{
    skin:{ name:'Torvald the Tiny', price:1100, bonus:'Pickaxe Damage +50% · Dwarf Level Up Chance +15%' },
    quest:{ name:'Sir Dappernoggin', price:2000, rankUp:'Acheter une upgrade de base W2+', bonus:'PP Gain +12%/rank · Floor Clear Req -2%/rank' }}),

  P('Duck','Duck',5,750,'Épuiser une veine (OB19)',
    'XP Gain +12%/niv · Lootbug Spawn Rate +2.5%/niv',20,{
    skin:{ name:'Not A Duck', price:1200, bonus:'Obelisk Armor -10% · Duck Level Up Chance +15%' },
    quest:{ name:'Tony Two-Honks', price:2500, rankUp:'Épuiser des Rainbow Veins via Void Portal', bonus:'Vein Income Multi +2%/rank · Golden Vein Multi +2%/rank' }}),

  P('Rabbit','Rabbit',12,1000,'Compléter un contrat',
    'Contract Upgrade Cost -0.03x/niv',20,{
    skin:{ name:'Fluffy', price:1300, bonus:'Contract Points Rewarded +1 · Rabbit Level Up Chance +15%' },
    quest:{ name:'Bloodwhiskers', price:3000, rankUp:'Contrats 750+', bonus:'5x Contract Point Chance +1%/rank · Contract Upgrade Cost -1%/rank' }}),

  P('Penguin','Penguin',18,1500,'Spawner un golden floor',
    'Golden Floor Multi +0.05x/niv',20,{
    skin:{ name:'Monarch Waddle', price:1400, bonus:'Ore Sell Price +50% · Penguin Level Up Chance +15%' },
    quest:{ name:'Count Waddle', price:3500, rankUp:'Clear des Golden Rainbow Floors', bonus:'Golden Floor Multi +2%/rank · Rainbow Floor Chance +0.25%/rank' }}),

  P('Axolotl','Axolotl',28,1750,'Crafter un lingot World 2',
    'Double Craft Chance +2%/niv · Bar Craft Cost -1%/niv',20,{
    skin:{ name:'Dorp', price:1500, bonus:'Fuel Duration +10% · Axolotl Level Up Chance +15%' },
    quest:{ name:'Snaildog', price:4000, rankUp:'Gagner des Relic Chests', bonus:'Arch Fragment Gain +3%/rank · Star Supernova Multi +3%/rank' }}),

  P('Whale','Whale',40,2000,'Dépenser des gemmes',
    'Pickaxe Damage +10%/niv · Triple Lootbug Chance +3%/niv',20,{
    skin:{ name:'Meltdown Moby', price:1600, bonus:'-2 Gem Lootbug Cost · Whale Level Up Chance +15%' },
    quest:{ name:'Blubbercore', price:4500, rankUp:'Gagner des gemmes via Gem Bomb', bonus:'Gem Bomb Gem Chance +0.10%/rank · Banked Lootbugs +1/rank' }}),

  P('Totem','Totem',56,2250,'Épuiser une golden vein',
    'Vein Spawn Rate +3%/niv · Golden Vein Chance +1%/niv · Golden Vein Multi +1%/niv',25,{
    skin:{ name:'Marshall', price:1700, bonus:'+2% Rainbow Vein Chance · Totem Level Up Chance +15%' },
    quest:{ name:'Teekee', price:5000, rankUp:'Remplir les drones de fuel', bonus:'Drone XP Gain +4%/rank · Chain Drone Grade Cap +2/rank' }}),

  P('Happybot','Happy-Bot',75,2500,'Level up à partir du niveau 100',
    'T4 Artifact Cap +1/niv',20,{
    skin:{ name:'Unhappy-Bot', price:1800, bonus:'Contract Upgrade Cap +1 · Happy-Bot Level Up Chance +15%' },
    quest:{ name:'Yappy-Bot', price:5500, rankUp:'Level up au niveau 225+', bonus:'Poly Ore/Star/Vein Multis +2%/rank · Banked Freebies +1/rank' }}),

  P('Leprechaun','Leprechaun',90,2750,'Clear un rainbow floor',
    'Base Game Speed +1.5%/niv · Golden Floor Multi +1.25%/niv · Rainbow Floor Chance +0.25%/niv',20,{
    skin:{ name:'Plutonium Paddy', price:1900, bonus:'+1% Rainbow Floor Chance · Leprechaun Level Up Chance +15%' },
    quest:{ name:"Jolly O'Fella", price:6000, rankUp:'Golden Ores sur Galactic Rainbow Floors', bonus:'Galactic Floor Multi +4%/rank · Transmuter BoP Mark +2%/rank' }}),

  P('Starfish','Starfish',100,3000,'Attraper une super star',
    'Super Star 10x Chance +0.2%/niv · Super Star Supernova Chance +0.2%/niv',20,{
    skin:{ name:'Storm-51', price:2000, bonus:'+10% Star Spawn Rate · Starfish Level Up Chance +15%' },
    quest:{ name:'Patricia', price:8000, rankUp:'Supernova supergiant super star', bonus:'Novagiant Combo Multi +3%/rank · Capricorn & Ophiuchus Cap +1/rank' }}),

  P('Dino','Dino',140,4000,'Gagner des veines World 3',
    'Pickaxe Damage +0.20x/niv · Rainbow Floor Multi +2.50%/niv',20,{
    skin:{ name:'Drumstick', price:3000, bonus:'+1 Pet Level Cap · Dino Level Up Chance +15%' },
    quest:{ name:'Nugget', price:10000, rankUp:'Stages Archéologie 110+', bonus:'Astraeus/Chione Idol Cap +50/rank · Aphrodite/Tethys Cap +30/rank' }}),

  P('Mr_Nibbles','Mr Nibbles',180,7500,'Attraper un poisson shiny',
    'Shiny Fish Multi +0.03x/niv · Triple Tick Chance +1%/niv',20,{
    skin:{ name:'Dr Cool', price:4500, bonus:'Shiny Fish Chance +2% · Mr Nibbles Level Up Chance +15%' },
    quest:{ name:'Mechalodon', price:12000, rankUp:'Fishing ticks via Angler Drone', bonus:'Angler Drone Grade Cap +1/rank · Tier 2 Dock Power +5%/rank' }}),

  P('Nagini','Nagini',235,15000,'Épuiser un golden ore',
    'Golden Ore Multi +0.05x/niv · All Floor Multi +2%/niv',20,{
    skin:{ name:'Abomination', price:6000, bonus:'Golden Ore Chance +2% · Nagini Level Up Chance +15%' },
    quest:{ name:'Beholder', price:14000, rankUp:'Golden ore dans golden void portal floor 91+', bonus:'Golden Void Portal Chance +0.50%/rank · Multi +5%/rank' }}),

  P('Butterfly','Butterfly',310,250000,'Attraper une Frog',
    'Galactic Floor Chance +0.5% · Lootfrog Triple Chance +0.35% · Rainbow Portal Chance +0.25%',20,{
    skin:{ name:'Scorchwing', price:250000, bonus:'Débloque les Infernal Pet Cards · Level Up Chance +15%' },
    quest:{ name:'Flutterfrost', price:350000, rankUp:'Attraper des golden Frogs', bonus:'Big Lootfrog Chance +0.25% · Prismatic Galactic Multi +10%' }}),

  P('Rhino','Rhino',340,2500000,'Brittle Essence Block spawn (Arcanist)',
    'Essence Brittle Chance +1% · Pickaxe Damage +35% · Chain Drone Grade Cap +3',20,{
    skin:{ name:'Shaun', price:1750000, bonus:'Essence Max Loot +1 · Rhino Level Up Chance +30%' },
    quest:{ name:'Capybara', price:3250000, rankUp:'Shiny Brittle Essence Blocks', bonus:'Essence Shiny Chance +0.50% · Arcanist Spell Power +1.50%' }}),
];

/* Déblocage par total de niveaux : visible si unlockTotal <= total possédé
   (ou monde débloqué assez avancé). On laisse le joueur voir le prochain
   pet verrouillé pour garder l'objectif en vue. */
export function petVisibility(totalLevels){
  return PETS_FULL.map(p => ({ ...p, unlocked: totalLevels >= p.unlockTotal }));
}
