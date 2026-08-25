/* ============================================================
   knowledgeBase.js — Base de connaissances Idle Obelisk Miner
   ------------------------------------------------------------
   Source : wiki officiel (shminer.miraheze.org, v2.2.6) + outils
   communautaires. Toutes les données du jeu vivent ICI, jamais
   dans les composants. Structure pensée pour être étendue :
   - ajouter une entrée dans un registre = nouvelle connaissance
   - les moteurs lisent KB, ne codent rien en dur
   ============================================================ */

export const GAME_VERSIONS = {
  'v2.2.6': { released: '2026-07-28', notes: 'Arcanist updates, fixes' },
  'v2.2.5': { released: '2026-07-20', notes: 'Battery drain fixes, Arcanist balancing' },
  'v2.2.3': { released: '2026-07-15', notes: 'Gilded statues fixes, Lootfrog adjustments' },
};
export const LATEST_KNOWN_VERSION = 'v2.2.6';

/* ---------- Obelisk : armure & santé (wiki "Obelisk") ----------
   OB1..OB60  : armure ×2.8 / niveau ; santé ×2.8 / niveau
   OB61+      : armure ×9.5 / niveau ; santé ×30 / niveau
   (saut combiné à OB61) */
export const OBELISK = {
  armorBefore61: l => Math.round(10 * Math.pow(2.8, l - 1)),
  armorAfter60:  l => Math.round(10 * Math.pow(2.8, 60) * Math.pow(9.5, l - 60)),
  healthBefore61:l => Math.round(1e5 * Math.pow(2.8, l - 1)),
  healthAfter60: l => Math.round(1e5 * Math.pow(2.8, 59) * Math.pow(30, l - 59)),
  armor(level)  { return level <= 60 ? this.armorBefore61(level)  : this.armorAfter60(level); },
  health(level) { return level <= 60 ? this.healthBefore61(level) : this.healthAfter60(level); },
};

/* ---------- Prestige (wiki "Prestige") ---------- */
export const PRESTIGE = {
  // PP sous/niveau 200 et au-dessus
  points(level, gainMulti = 1) {
    let v = 12 * Math.pow(1.084, level - 10);
    if (level > 200) v *= 1 + 0.05 * (level - 200);
    return v * gainMulti;
  },
  levelCapForObelisk(ob) { return 30 + 5 * ob; },
  obeliskFromCap(cap) { return Math.max(0, Math.round((cap - 30) / 5)); },
  minLevelToPrestige: 20,
};

/* ---------- Artefacts par tier (wiki "Prestige/Costs") ---------- */
export const ARTIFACTS = [
  { id:'pick_t1',  tier:1, name:'Pickaxe Damage',              bonus:'+10%/niv', maxBase:32 },
  { id:'xp_t1',    tier:1, name:'Experience Gain Multiplier',  bonus:'+10%/niv', maxBase:27 },
  { id:'pickcost', tier:1, name:'Pickaxe Cost',                bonus:'-3 bars',  maxBase:12 },
  { id:'bomb_t1',  tier:1, name:'Bomb Damage',                 bonus:'+30%/niv', maxBase:32 },
  { id:'pp_t2',    tier:2, name:'Prestige Point Gain Multiplier', bonus:'+5%/niv', maxBase:17, unlockOb:8 },
  { id:'floorreq', tier:2, name:'Floor Clear Requirement',     bonus:'-5%/niv',  maxBase:17, unlockOb:8 },
  { id:'pick_t3',  tier:3, name:'Pickaxe Damage',              bonus:'+60%/niv', maxBase:32, unlockOb:14 },
  { id:'bomb_t3',  tier:3, name:'Bomb Damage',                 bonus:'+80%/niv', maxBase:32, unlockOb:14 },
  { id:'armorred', tier:3, name:'Obelisk Armor Reduction',     bonus:'-2%/niv',  maxBase:17, unlockOb:14 },
  { id:'statue_dmg',tier:4,name:'Pickaxe Damage per Statue Owned', bonus:'+10%/niv', maxBase:52, unlockOb:19 },
  { id:'barout',   tier:4, name:'Bar Output Multiplier',       bonus:'+0.40%/niv', maxBase:37, unlockOb:19 },
];

/* ---------- Skill Tree (wiki "Skill-Tree") ---------- */
export const SKILLS = [
  { id:'gem_bomb',   name:'Gem Bomb',                  cost:5,  sTier:true },
  { id:'auto_bomber',name:'Auto-Bomber',               cost:10, sTier:true },
  { id:'free_price', name:"Free? That's a great price",cost:0,  sTier:true },
  { id:'stonks',     name:'Stonks',                    cost:0,  sTier:true },
  { id:'easy_prog',  name:'Easy Progressor',           cost:3 },
  { id:'auto_prestige',name:'Take It Back Now Yall',   cost:0 },
];

/* ---------- Déblocages par niveau d'Obelisk (wiki "Obelisk/Unlocks") ---------- */
export const OBELISK_UNLOCKS = [
  { ob:1,  feature:'Workshop' },        { ob:2,  feature:'Drones' },
  { ob:4,  feature:'Skill-Tree' },      { ob:10, feature:'Challenges' },
  { ob:12, feature:'Contracts' },       { ob:14, feature:'Artefacts Tier 3' },
  { ob:15, feature:'Cards' },           { ob:17, feature:'Pets' },
  { ob:18, feature:'Drone Fuel' },      { ob:19, feature:'Construct + Tier 4' },
  { ob:23, feature:'Stargazing' },      { ob:30, feature:'Archaeology' },
  { ob:35, feature:'Platinized Statues' }, { ob:37, feature:'Fishing' },
  { ob:42, feature:'Monde 3 (Monument)' }, { ob:64, feature:'Monde 4 (Monument)' },
  { ob:66, feature:'Archaeology Ascension' }, { ob:70, feature:'Arcanist' },
];

/* ---------- Monuments / Mondes (wiki "Construct") ---------- */
export const WORLDS = [
  { world:1, monumentOb:null, bars:['Adamant','Runite'] },
  { world:2, monumentOb:21 },
  { world:3, monumentOb:42 },
  { world:4, monumentOb:64, cost:{ gems:1e6, veins:['Industrial','Warfront','Neon'] } },
];

/* ---------- Statues (wiki "Construct") — noms réels W3/W4.
   NOTE v1 : liste partielle, à compléter depuis la page wiki Statues. ---------- */
export const STATUES = {
  W1: ['Pickaxe Damage','Bomb Damage','Ore Income','Experience','Crit Chance','Bar Output'],
  W2: ['Golden Vein Chance','Vein Spawn Rate','Void Portal Chance','Star Spawn Rate','Contract Points','Ores Per Screen'],
  // W3 : noms à confirmer via le wiki avant d'afficher des choix nommés au joueur.
  W3: null,
  W4: null,
};

/* ---------- Drones (wiki "Drones") ---------- */
export const DRONES = [
  { id:'basic',     suit:'Basic',     fuelKey:'is_drone_basic_equipped' },
  { id:'bear',      suit:'Bear',      fuelKey:'is_drone_bear_equipped',      gradeKey:'bear_fuel_grade' },
  { id:'chain',     suit:'Chain',     fuelKey:'is_drone_chain_equipped',     gradeKey:'chain_fuel_grade' },
  { id:'angler',    suit:'Angler',    fuelKey:'is_drone_angler_equipped',    gradeKey:'angler_fuel_grade',  unlockOb:37 },
  { id:'midas',     suit:'Midas',     fuelKey:'is_drone_midas_equipped',     gradeKey:'midas_fuel_grade',   unlockOb:6 },
  { id:'minotaur',  suit:'Minotaur',  fuelKey:'is_drone_minotaur_equipped',  gradeKey:'minotaur_fuel_grade',unlockOb:70 },
  { id:'prism',     suit:'Prism',     fuelKey:'is_drone_prism_equipped',     gradeKey:'prism_fuel_grade',   unlockOb:64 },
  { id:'starburst', suit:'Starburst', fuelKey:'is_drone_starburst_equipped', gradeKey:'starburst_fuel_grade'},
  { id:'elixir',    suit:'Elixir',    fuelKey:'is_drone_elixir_equipped',    gradeKey:'elixir_fuel_grade' },
  { id:'frogger',   suit:'Frogger',   fuelKey:'is_drone_frogger_equipped',   gradeKey:'frogger_fuel_grade', unlockOb:8 },
  { id:'veinseeker',suit:'Veinseeker',fuelKey:'is_drone_veinseeker_equipped',gradeKey:'veinseeker_fuel_grade', unlockOb:19 },
  { id:'void',      suit:'Void',      fuelKey:'is_drone_void_equipped',      gradeKey:'void_fuel_grade',    unlockOb:23 },
];

/* ---------- Ores / floors de farming (structure pour Best Farming Floor).
   Les données communautaires (Google Sheet "Best Farming Floor") seront
   importées ici au format JSON : floorData[ore] = [{floor, rate}]. ---------- */
export const FARMING = {
  // floors par monde selon le wiki "Floors" (zones)
  worlds: {
    1: [1,42], 2: [43,72], 3: [73,102], 4: [103,132],
  },
  // bestFloorData[oreName] = { floor:number, source:string }
  // Rempli dynamiquement par farmingAnalyzer quand une source est chargée.
  bestFloorData: {},
  registerSource(name, data) {
    Object.assign(this.bestFloorData, data);
    this.sources = this.sources || {};
    this.sources[name] = Object.keys(data).length;
  },
};

/* ---------- Clés exportstats connues, groupées par catégorie.
   Sert à : détecter les stats inconnues (nouvelles versions),
   catégoriser l'affichage, et documenter ce que chaque clé signifie. ---------- */
export const STATS_CATALOG = {
  damage: {
    pickaxe_damage:'Dégâts pioche', bomb_damage:'Dégâts bombes',
    pickaxe_crit_chance:'Pioche crit %', pickaxe_super_crit_chance:'Super crit %',
    pickaxe_omega_crit_chance:'Omega crit %', pickaxe_radius_percent:'Rayon pioche %',
    pickaxe_attack_speed_per_second:'Attaques/s',
  },
  prestige: {
    prestige_point_multi:'Multiplicateur PP', experience_multi:'Multiplicateur XP',
    xp_level_cap:'Cap de niveau', floor_clear_requirement_multi:'Exigence de fin d\'étage (multi)',
  },
  bombs: {
    bomb_capacity:'Capacité bombes', bomb_recharge_speed:'Recharge bombes',
    bomb_free_chance:'Bombes gratuites %',
  },
  drones: {
    drone_count:'Nombre de drones',
  },
  economy: {
    ore_sell_price_multi:'Prix vente minerai', bar_output_multi:'Production lingots',
    vein_income_multi:'Revenu veines', ore_income_multi:'Revenu minerai',
  },
  obelisk: {
    obelisk_armor_reduction:'Réduction armure Obelisk', obelisk_cooldown_multi:'Cooldown Obelisk',
  },
};

/* Toutes les clés connues, à plat (pour la détection d'inconnues) */
export const ALL_KNOWN_KEYS = new Set(
  Object.values(STATS_CATALOG).flatMap(o => Object.keys(o))
);

/* ---------- Sources documentées (traçabilité des règles) ---------- */
export const SOURCES = {
  wiki_prestige: 'https://shminer.miraheze.org/wiki/Prestige',
  wiki_obelisk:  'https://shminer.miraheze.org/wiki/Obelisk',
  wiki_construct:'https://shminer.miraheze.org/wiki/Construct',
  wiki_skilltree:'https://shminer.miraheze.org/wiki/Skill-Tree',
  wiki_external: 'https://shminer.miraheze.org/wiki/External_Resources',
  community_best_floor: '(à importer) Google Sheet Best Farming Floor',
};
