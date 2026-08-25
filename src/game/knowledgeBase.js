/* ============================================================
   knowledgeBase.js — Base de connaissances Idle Obelisk Miner
   Source : wiki officiel (shminer.miraheze.org, v2.2.6) + EXPORTSTATS réel.
   ============================================================ */

export const GAME_VERSIONS = {
  'v2.2.6': { released: '2026-07-28', notes: 'Arcanist updates, fixes' },
  'v2.2.5': { released: '2026-07-20', notes: 'Battery drain fixes, Arcanist balancing' },
  'v2.2.3': { released: '2026-07-15', notes: 'Gilded statues fixes, Lootfrog adjustments' },
};
export const LATEST_KNOWN_VERSION = 'v2.2.6';

/* ---------- Obelisk : armure & santé (wiki "Obelisk") ----------
   OB1 exception : half expected → round(5 * 2.8^(L-1)) via special case.
   OB1..OB60  : armure/santé ×2.8 / niveau
   OB61+      : armure ×9.5 ; santé ×30 (saut combiné à OB61) */
export const OBELISK = {
  armorBefore61(l) {
    if (l <= 1) return 5;
    return Math.round(10 * Math.pow(2.8, l - 1));
  },
  armorAfter60: l => Math.round(10 * Math.pow(2.8, 60) * Math.pow(9.5, l - 60)),
  healthBefore61: l => Math.round(1e5 * Math.pow(2.8, l - 1)),
  healthAfter60: l => Math.round(1e5 * Math.pow(2.8, 60) * Math.pow(30, l - 60)),
  armor(level)  { return level <= 60 ? this.armorBefore61(level)  : this.armorAfter60(level); },
  health(level) { return level <= 60 ? this.healthBefore61(level) : this.healthAfter60(level); },
  /** Armure effective après réduction (export: 0.12 = −12 %). */
  effectiveArmor(level, reduction = 0) {
    const r = Math.min(0.95, Math.max(0, Number(reduction) || 0));
    return this.armor(level) * (1 - r);
  },
};

/* ---------- Prestige (wiki "Prestige") ---------- */
export const PRESTIGE = {
  points(level, gainMulti = 1) {
    let v = 12 * Math.pow(1.084, level - 10);
    if (level > 200) v *= 1 + 0.05 * (level - 200);
    return v * gainMulti;
  },
  levelCapForObelisk(ob) { return 30 + 5 * ob; },
  obeliskFromCap(cap) { return Math.max(0, Math.round((cap - 30) / 5)); },
  minLevelToPrestige: 20,
};

/* ---------- Artefacts (wiki Prestige/Costs + UI jeu v2.2.6)
   maxBase = max wiki AVANT cap increase.
   T4 : max affiché = maxBase + artifact_tier4_cap_increase (export).
   perStatue : bonus/niv = perLevel × somme des états statues (plat=3). */
export const ARTIFACTS = [
  /* Tier 1 */
  { id:'pick_t1',     tier:1, name:'Pickaxe Damage',           icon:'⛏', perLevel:10,   unit:'%',     maxBase:32 },
  { id:'pickcost',    tier:1, name:'Pickaxe Cost',             icon:'📉', perLevel:-3,   unit:' Bars', maxBase:12 },
  { id:'xp_t1',       tier:1, name:'Experience Gain',          icon:'⭐', perLevel:10,   unit:'%',     maxBase:27 },
  { id:'freecraft',   tier:1, name:'Free Craft Chance',        icon:'🔧', perLevel:2,    unit:'%',     maxBase:17 },
  { id:'triplecraft', tier:1, name:'Triple Craft Chance',      icon:'3️⃣', perLevel:2,    unit:'%',     maxBase:17 },
  { id:'radius',      tier:1, name:'Pickaxe Radius',           icon:'⭕', perLevel:12,   unit:'%',     maxBase:12 },
  { id:'oresell',     tier:1, name:'Ore Sell Price',           icon:'💰', perLevel:12,   unit:'%',     maxBase:17 },
  { id:'itemdur',     tier:1, name:'Item Duration',            icon:'🍗', perLevel:6,    unit:'%',     maxBase:17 },
  { id:'bomb_t1',     tier:1, name:'Bomb Damage',              icon:'💣', perLevel:30,   unit:'%',     maxBase:32 },
  { id:'obcd',        tier:1, name:'Obelisk Cooldown',         icon:'⏱️', perLevel:-3,   unit:'%',     maxBase:17 },
  /* Tier 2 — OB8 */
  { id:'pick_t2',     tier:2, name:'Pickaxe Damage',           icon:'⛏', perLevel:25,   unit:'%',     maxBase:32, unlockOb:8 },
  { id:'bomb_t2',     tier:2, name:'Bomb Damage',              icon:'💣', perLevel:50,   unit:'%',     maxBase:32, unlockOb:8 },
  { id:'pp_t2',       tier:2, name:'Prestige Point Gain',      icon:'💎', perLevel:5,    unit:'%',     maxBase:17, unlockOb:8 },
  { id:'superscrit',  tier:2, name:'Pickaxe Super Crit Chance',icon:'✨', perLevel:1,    unit:'%',     maxBase:17, unlockOb:8 },
  { id:'floorreq',    tier:2, name:'Floor Clear Requirement',  icon:'🚪', perLevel:-5,   unit:'%',     maxBase:17, unlockOb:8 },
  /* Tier 3 — OB14 */
  { id:'pick_t3',     tier:3, name:'Pickaxe Damage',           icon:'⛏', perLevel:60,   unit:'%',     maxBase:32, unlockOb:14 },
  { id:'bomb_t3',     tier:3, name:'Bomb Damage',              icon:'💣', perLevel:80,   unit:'%',     maxBase:32, unlockOb:14 },
  { id:'bombscrit',   tier:3, name:'Bomb Super Crit Chance',   icon:'💥', perLevel:2,    unit:'%',     maxBase:17, unlockOb:14 },
  { id:'armorred',    tier:3, name:'Obelisk Armor',            icon:'🛡️', perLevel:-2,   unit:'%',     maxBase:17, unlockOb:14 },
  { id:'bombcap',     tier:3, name:'Bomb Capacity',            icon:'🎒', perLevel:3,    unit:'',      maxBase:17, unlockOb:14 },
  /* Tier 4 — OB19 ; maxBase = avant tier4_cap_increase */
  { id:'statue_dmg',  tier:4, name:'Pickaxe Damage',           icon:'🗿', perLevel:10,   unit:'%',     maxBase:32, unlockOb:19, perStatue:true },
  { id:'statue_bomb', tier:4, name:'Bomb Damage',              icon:'🗿', perLevel:15,   unit:'%',     maxBase:32, unlockOb:19, perStatue:true },
  { id:'omega_crit',  tier:4, name:'Pickaxe Omega Crit Chance',icon:'⚡', perLevel:1,    unit:'%',     maxBase:17, unlockOb:19 },
  { id:'barout',      tier:4, name:'Bar Output Multiplier',    icon:'🧱', perLevel:0.4,  unit:'%',     maxBase:17, unlockOb:19 },
  { id:'veinspawn',   tier:4, name:'Vein Spawn Rate',          icon:'💠', perLevel:4,    unit:'%',     maxBase:17, unlockOb:19 },
];

/** Max effectif selon caps export persistés ou stats brutes. */
export function artifactEffectiveMax(a, stats = {}, caps = null) {
  const t4 = caps?.artifactT4 ?? stats.artifact_tier4_cap_increase ?? 0;
  if (a.tier === 4) return a.maxBase + (+t4 || 0);
  return a.maxBase;
}

/* ---------- Skill Tree — liste complète dans skillsData.js ---------- */
export { SKILL_NODES as SKILLS } from './skillsData.js';
import { SKILL_NODES } from './skillsData.js';
/** alias reco (S-Tier) */
export const SKILLS_STIER = SKILL_NODES.filter(s => s.sTier);

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

export const WORLDS = [
  { world:1, monumentOb:null },
  { world:2, monumentOb:null },
  { world:3, monumentOb:42 },
  { world:4, monumentOb:64, cost:{ gems:1e6, veins:['Industrial','Warfront','Neon'] } },
];

/* Statues détail : statuesData.js. Export : statue_{0-8}_set{1|2|3} → W1/W3/W4. */
export const STATUE_EXPORT = {
  /** set index dans exportstats → monde Construct */
  setToWorld: { 1:1, 2:3, 3:4 },
  /** numéro wiki (1-27) depuis index 0-8 + set */
  numFrom(index, set) {
    const base = { 1:1, 2:10, 3:19 }[set];
    return base + index;
  },
};

export const DRONES = [
  { id:'basic',     suit:'Basic',     equipKey:'is_drone_basic_equipped',     fueledKey:'is_drone_basic_equipped_and_fueled' },
  { id:'bear',      suit:'Bear',      equipKey:'is_drone_bear_equipped',      fueledKey:'is_drone_bear_equipped_and_fueled',      gradeKey:'bear_fuel_grade' },
  { id:'chain',     suit:'Chain',     equipKey:'is_drone_chain_equipped',     fueledKey:'is_drone_chain_equipped_and_fueled',     gradeKey:'chain_fuel_grade' },
  { id:'angler',    suit:'Angler',    equipKey:'is_drone_angler_equipped',    fueledKey:'is_drone_angler_equipped_and_fueled',    gradeKey:'angler_fuel_grade',  unlockOb:37 },
  { id:'midas',     suit:'Midas',     equipKey:'is_drone_midas_equipped',     fueledKey:'is_drone_midas_equipped_and_fueled',     gradeKey:'midas_fuel_grade',   unlockOb:6 },
  { id:'minotaur',  suit:'Minotaur',  equipKey:'is_drone_minotaur_equipped',  fueledKey:'is_drone_minotaur_equipped_and_fueled',  gradeKey:'minotaur_fuel_grade',unlockOb:70 },
  { id:'prism',     suit:'Prism',     equipKey:'is_drone_prism_equipped',     fueledKey:'is_drone_prism_equipped_and_fueled',     gradeKey:'prism_fuel_grade',   unlockOb:64 },
  { id:'starburst', suit:'Starburst', equipKey:'is_drone_starburst_equipped', fueledKey:'is_drone_starburst_equipped_and_fueled', gradeKey:'starburst_fuel_grade'},
  { id:'elixir',    suit:'Elixir',    equipKey:'is_drone_elixir_equipped',    fueledKey:'is_drone_elixir_equipped_and_fueled',    gradeKey:'elixir_fuel_grade' },
  { id:'frogger',   suit:'Frogger',   equipKey:'is_drone_frogger_equipped',   fueledKey:'is_drone_frogger_equipped_and_fueled',   gradeKey:'frogger_fuel_grade', unlockOb:8 },
  { id:'veinseeker',suit:'Veinseeker',equipKey:'is_drone_veinseeker_equipped',fueledKey:'is_drone_veinseeker_equipped_and_fueled',gradeKey:'veinseeker_fuel_grade', unlockOb:19 },
  { id:'void',      suit:'Void',      equipKey:'is_drone_void_equipped',      fueledKey:'is_drone_void_equipped_and_fueled',      gradeKey:'void_fuel_grade',    unlockOb:23 },
];

export const FARMING = {
  worlds: { 1:[1,42], 2:[43,72], 3:[73,102], 4:[103,132] },
  bestFloorData: {},
  registerSource(name, data) {
    Object.assign(this.bestFloorData, data);
    this.sources = this.sources || {};
    this.sources[name] = Object.keys(data).length;
  },
};

/* Catalogue aligné sur un EXPORTSTATS v2.2.6 réel */
export const STATS_CATALOG = {
  damage: {
    pickaxe_damage:'Dégâts pioche', bomb_damage:'Dégâts bombes',
    pickaxe_crit_chance:'Pioche crit %', pickaxe_crit_damage:'Pioche crit dmg',
    pickaxe_super_crit_chance:'Super crit %', pickaxe_super_crit_damage:'Super crit dmg',
    pickaxe_ultra_crit_chance:'Ultra crit %', pickaxe_ultra_crit_damage:'Ultra crit dmg',
    pickaxe_omega_crit_chance:'Omega crit %', pickaxe_omega_crit_damage:'Omega crit dmg',
    pickaxe_radius_percent:'Rayon pioche %', pickaxe_attack_speed_per_second:'Attaques/s',
  },
  prestige: {
    prestige_point_multi:'Multi PP', experience_multi:'Multi XP',
    xp_level_cap:'Cap de niveau', floor_clear_requirement_multi:'Exigence étage',
    artifact_cap_increase:'Cap artefacts +', artifact_tier4_cap_increase:'Cap T4 +',
  },
  bombs: {
    bomb_capacity:'Capacité bombes', bomb_cap_multiplier:'Multi cap bombes',
    bomb_recharge_speed:'Recharge bombes', bomb_free_chance:'Bombes gratuites %',
    bomb_crit_chance:'Bomb crit %', bomb_crit_damage:'Bomb crit dmg',
    bomb_super_crit_chance:'Bomb super crit %', bomb_super_crit_damage:'Bomb super crit dmg',
    bomb_ultra_crit_chance:'Bomb ultra crit %', bomb_ultra_crit_damage:'Bomb ultra crit dmg',
    bomb_omega_crit_chance:'Bomb omega crit %', bomb_omega_crit_damage:'Bomb omega crit dmg',
    bomb_of_plenty_multi:'Bomb of Plenty multi', bomb_of_plenty_make_gold_chance:'BoP gold %',
    bomb_transmuter_multi:'Transmuter multi', bomb_trans_apply_bop_chance:'Trans→BoP %',
    bomb_cherry3x_chance:'Cherry 3x %', bomb_additional_multiplier:'Bomb multi add.',
    bomb_battery_cap_increases:'Battery cap increases', bomb_workshop_cap_increase:'Workshop bomb cap +',
  },
  drones: {
    drone_count:'Nombre de drones', drone_suit_cap:'Cap suits',
    drone_damage_percent:'Drone dmg %', drone_attack_speed_percent:'Drone atk speed %',
    drone_movespeed_percent:'Drone move %', drone_radius_percent:'Drone radius %',
    drone_rapid_fire_chance:'Rapid fire %', drone_triple_damage_chance:'Triple dmg %',
    coal_drone_exp_multi:'Drone exp multi', coal_fuel_duration_multi:'Fuel duration multi',
    coal_fuel_save_chance:'Fuel save %', coal_capacity_multi:'Coal cap multi',
    coal_generation_seconds:'Coal gen (s)',
    bear_fuel_grade:'Bear grade', chain_fuel_grade:'Chain grade', midas_fuel_grade:'Midas grade',
    frogger_fuel_grade:'Frogger grade', veinseeker_fuel_grade:'Veinseeker grade',
    starburst_fuel_grade:'Starburst grade', elixir_fuel_grade:'Elixir grade',
    void_fuel_grade:'Void grade', angler_fuel_grade:'Angler grade',
    prism_fuel_grade:'Prism grade', minotaur_fuel_grade:'Minotaur grade',
    elixir_crit_chance:'Elixir crit %', elixir_crit_multi:'Elixir crit multi',
    is_drone_basic_equipped:'Basic équipé',
    is_drone_bear_equipped:'Bear équipé', is_drone_bear_equipped_and_fueled:'Bear fuelé',
    is_drone_chain_equipped:'Chain équipé', is_drone_chain_equipped_and_fueled:'Chain fuelé',
    is_drone_midas_equipped:'Midas équipé', is_drone_midas_equipped_and_fueled:'Midas fuelé',
    is_drone_frogger_equipped:'Frogger équipé', is_drone_frogger_equipped_and_fueled:'Frogger fuelé',
    is_drone_veinseeker_equipped:'Veinseeker équipé', is_drone_veinseeker_equipped_and_fueled:'Veinseeker fuelé',
    is_drone_starburst_equipped:'Starburst équipé', is_drone_starburst_equipped_and_fueled:'Starburst fuelé',
    is_drone_elixir_equipped:'Elixir équipé', is_drone_elixir_equipped_and_fueled:'Elixir fuelé',
    is_drone_void_equipped:'Void équipé', is_drone_void_equipped_and_fueled:'Void fuelé',
    is_drone_angler_equipped:'Angler équipé', is_drone_angler_equipped_and_fueled:'Angler fuelé',
    is_drone_prism_equipped:'Prism équipé', is_drone_prism_equipped_and_fueled:'Prism fuelé',
    is_drone_minotaur_equipped:'Minotaur équipé', is_drone_minotaur_equipped_and_fueled:'Minotaur fuelé',
  },
  economy: {
    ore_sell_price_multi:'Prix vente minerai', bar_output_multi:'Production lingots',
    vein_income_multi:'Revenu veines', ore_income_multi:'Revenu minerai',
    ores_per_screen:'Ores / écran', vein_spawn_rate_multi:'Spawn veines',
    bar_craft_cost_multi:'Coût craft lingots', bar_upgrade_cost_reduction:'Réduc. upgrade bars',
    free_craft_chance:'Free craft %', double_craft_chance:'Double craft %',
    triple_craft_chance:'Triple craft %', craft_5x_chance:'Craft 5x %',
    craft_10x_chance:'Craft 10x %', craft_20x_chance:'Craft 20x %', craft_100x_chance:'Craft 100x %',
  },
  floors: {
    golden_floor_chance:'Golden floor %', golden_floor_multi:'Golden floor multi',
    rainbow_floor_chance:'Rainbow floor %', rainbow_floor_multi:'Rainbow floor multi',
    galactic_floor_chance:'Galactic floor %', galactic_floor_multi:'Galactic floor multi',
    prismatic_floor_chance:'Prismatic floor %', prismatic_floor_multi:'Prismatic floor multi',
    all_floor_multipliers:'All floor multi', multi_rock_chance:'Multi rock %',
    golden_ore_chance:'Golden ore %', golden_ore_multi:'Golden ore multi',
    golden_vein_chance:'Golden vein %', golden_vein_multi:'Golden vein multi',
    rainbow_vein_chance:'Rainbow vein %', rainbow_vein_multi:'Rainbow vein multi',
    gleaming_vein_chance:'Gleaming vein %', gleaming_vein_multi:'Gleaming vein multi',
  },
  portals: {
    void_portal_chance:'Void portal %', void_portal_multi:'Void portal multi',
    void_portal_base_multi:'Void portal base multi',
    golden_void_portal_chance:'Golden void %', golden_void_portal_multi:'Golden void multi',
    rainbow_void_portal_chance:'Rainbow void %', rainbow_void_portal_multi:'Rainbow void multi',
    galactic_void_portal_chance:'Galactic void %', galactic_void_portal_multi:'Galactic void multi',
    all_void_portal_multi:'All void portal multi',
  },
  stargazing: {
    star_spawn_rate:'Star spawn', star_auto_catch_chance:'Auto-catch %',
    star_double_spawn_chance:'Double star %', star_triple_spawn_chance:'Triple star %',
    star_supergiant_chance:'Supergiant %', star_supergiant_multi:'Supergiant multi',
    star_supernova_chance:'Supernova %', star_supernova_multi:'Supernova multi',
    star_radiant_chance:'Radiant %', star_radiant_multi:'Radiant multi',
    super_star_spawn_multi:'Super star spawn', super_star_10x_chance:'Super star 10x %',
    super_star_triple_chance:'Super star triple %',
    super_star_supergiant_chance:'SS supergiant %', super_star_supergiant_multi:'SS supergiant multi',
    super_star_supernova_chance:'SS supernova %', super_star_supernova_multi:'SS supernova multi',
    super_star_radiant_chance:'SS radiant %', super_star_radiant_multi:'SS radiant multi',
    all_star_multi:'All star multi', novagiant_combo_multi:'Novagiant combo',
  },
  fishing: {
    fishing_rod_power:'Rod power', fishing_income_multi:'Fish income',
    fishing_tick_speed:'Tick speed', fishing_tick_reduction_seconds:'Tick −s',
    fishing_double_tick_chance:'Double tick %', fishing_triple_tick_chance:'Triple tick %',
    fishing_5x_tick_chance:'5x tick %', fishing_drone_capacity:'Fish drones',
    fishing_drone_power:'Fish drone power', fishing_drone_multiplier:'Fish drone multi',
    fishing_shiny_chance:'Shiny %', fishing_shiny_multi:'Shiny multi',
    fishing_super_shiny_chance:'Super shiny %', fishing_super_shiny_multi:'Super shiny multi',
    fishing_notice_requirement:'Notice req', fishing_tiny_notice_chance:'Tiny notice %',
    fishing_tier2_dock_multi:'Tier2 dock multi', fishing_token_multi:'Token multi',
  },
  freebie: {
    freebie_gems_bonus:'Freebie gems +', freebie_cooldown_seconds:'Freebie CD (s)',
    freebie_bank_cap:'Freebie bank', freebie_refresh_chance:'Instant refresh %',
    freebie_5x_chance:'Freebie 5x %',
    stonks_chance:'Stonks %', stonks_multi:'Stonks multi',
    super_stonks_chance:'Super Stonks %', super_stonks_multi:'Super Stonks multi',
    ultra_stonks_chance:'Ultra Stonks %', ultra_stonks_multi:'Ultra Stonks multi',
  },
  loot: {
    lootbug_spawn_rate:'Lootbug spawn', lootbug_bank_cap:'Lootbug bank',
    lootbug_gem_cost_reduction:'Lootbug gem −', lootbug_golden_chance:'Golden lootbug %',
    lootbug_loot_multi:'Lootbug loot multi', lootbug_triple_chance:'Lootbug triple %',
    lootfrog_capacity:'Lootfrog cap', lootfrogs_caught:'Lootfrogs caught',
    golden_lootfrogs_caught:'Golden frogs caught', lootfrog_golden_chance:'Golden frog %',
    lootfrog_golden_multi:'Golden frog multi', lootfrog_triple_spawn_chance:'Frog triple %',
    lootfrog_10x_spawn_chance:'Frog 10x %', lootfrog_big_chance:'Big frog %',
    lootfrog_big_multi:'Big frog multi', lootfrog_massive_chance:'Massive frog %',
    lootfrog_massive_multi:'Massive frog multi', lootfrog_loot_multi:'Frog loot multi',
    lootfrog_lanterns_used:'Lanterns used',
  },
  contracts: {
    contract_points_rewarded:'Contract points', contract_cap_increase:'Contract cap +',
    contract_cost_reduction:'Contract cost −', contract_upgrade_cost_reduction:'Upgrade cost multi',
    contract_double_points_chance:'2x points %', contract_triple_points_chance:'3x points %',
    contract_5x_points_chance:'5x points %', contract_10x_points_chance:'10x points %',
  },
  obelisk: {
    obelisk_armor_reduction:'Réduction armure', obelisk_cooldown_multi:'Cooldown OB',
    obelisk_timer_add:'Timer OB +s',
  },
  misc: {
    game_speed_multi:'Game speed', item_duration_multi:'Durée items',
    chest_double_chance:'Chest double %', chest_items_bonus:'Chest items +',
    chest_meter_multi:'Chest meter multi', gem_upgrade_cap_increase:'Gem upgrade cap +',
    pet_levelup_chance_multi:'Pet level-up multi', infernal_card_multi:'Infernal card multi',
    steak_eaten:'Steaks', candy_eaten:'Candies', pizzas_eaten:'Pizzas',
  },
  statues: {
    statue_0_set1:'Statue 0 W1', statue_1_set1:'Statue 1 W1', statue_2_set1:'Statue 2 W1',
    statue_3_set1:'Statue 3 W1', statue_4_set1:'Statue 4 W1', statue_5_set1:'Statue 5 W1',
    statue_6_set1:'Statue 6 W1', statue_7_set1:'Statue 7 W1', statue_8_set1:'Statue 8 W1',
    statue_0_set2:'Statue 0 W3', statue_1_set2:'Statue 1 W3', statue_2_set2:'Statue 2 W3',
    statue_3_set2:'Statue 3 W3', statue_4_set2:'Statue 4 W3', statue_5_set2:'Statue 5 W3',
    statue_6_set2:'Statue 6 W3', statue_7_set2:'Statue 7 W3', statue_8_set2:'Statue 8 W3',
    statue_0_set3:'Statue 0 W4', statue_1_set3:'Statue 1 W4', statue_2_set3:'Statue 2 W4',
    statue_3_set3:'Statue 3 W4', statue_4_set3:'Statue 4 W4', statue_5_set3:'Statue 5 W4',
    statue_6_set3:'Statue 6 W4', statue_7_set3:'Statue 7 W4', statue_8_set3:'Statue 8 W4',
  },
};

export const ALL_KNOWN_KEYS = new Set(
  Object.values(STATS_CATALOG).flatMap(o => Object.keys(o))
);

export const SOURCES = {
  wiki_prestige: 'https://shminer.miraheze.org/wiki/Prestige',
  wiki_obelisk:  'https://shminer.miraheze.org/wiki/Obelisk',
  wiki_construct:'https://shminer.miraheze.org/wiki/Construct',
  wiki_skilltree:'https://shminer.miraheze.org/wiki/Skill-Tree',
  wiki_fishing: 'https://shminer.miraheze.org/wiki/Fishing',
  wiki_cards: 'https://shminer.miraheze.org/wiki/Cards',
  wiki_progression: 'https://shminer.miraheze.org/wiki/Guides/Progression_Guide',
  wiki_gems: 'https://shminer.miraheze.org/wiki/Guides/Gem_Spending_Guide',
  wiki_external: 'https://shminer.miraheze.org/wiki/External_Resources',
};

/** Calculateurs Discord / wiki External_Resources — pour les recos « comment mesurer ». */
export const EXTERNAL_TOOLS = {
  pickaxeDamage: {
    name: 'Pickaxe Damage Calculator',
    url: 'https://docs.google.com/spreadsheets/d/1IHgJtGmvgRwF7UzIqPF9aM2S4dzNOREdHF_XyhXS39M/edit?usp=sharing',
  },
  fishingGems: {
    name: 'Fishing Gem Spending Calculator',
    url: 'https://docs.google.com/spreadsheets/d/18_K3KlY_ewqjb26oirX8qVdWVPhGBC-qVrUdKQ1KedE/edit?usp=sharing',
  },
  obeliskFight: {
    name: 'Obelisk Fight Calc',
    url: 'https://docs.google.com/spreadsheets/d/1GughZm85kNggKfgluRk36ZpkQYHLVFd1Ox9OysdIONY/edit?usp=sharing',
  },
  starOb60: {
    name: 'Star Gain Checklist OB60+',
    url: 'https://docs.google.com/spreadsheets/d/1SeNOHMbM8lmy6pCNPn2N_B5RBnxwHaIow0t5nca7v8w/edit?gid=0#gid=0',
  },
  ultimateGems: {
    name: 'Ultimate Gem Calculator 2.2',
    url: 'https://docs.google.com/spreadsheets/d/1XscDMDkk59Btu1fQld09GQGmGpWxxNIszSFR1ujj_wE/edit?usp=sharing',
  },
};
