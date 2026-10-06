/* ============================================================
   fishingData.js — Fishing wiki (v2.1.5+, docks/legendaries v2.2.x)
   Tabs UI : Stats (export) · Notices · Upgrades/Docks · Enhance · Legendary
   ============================================================ */

export const FISHING_DOCKS = [
  { id:'lake', name:'Lake', ticks:5, tier:1 },
  { id:'desert', name:'Desert', ticks:8, tier:1 },
  { id:'tundra', name:'Tundra', ticks:12, tier:1 },
  { id:'ocean', name:'Ocean', ticks:16, tier:1 },
  { id:'nuclear', name:'Nuclear', ticks:22, tier:1 },
  { id:'abyss', name:'Abyss', ticks:30, tier:1 },
  { id:'cave', name:'Cave', ticks:40, tier:2 },
  { id:'volcano', name:'Volcano', ticks:50, tier:2 },
  { id:'sky', name:'Sky', ticks:60, tier:2 },
  { id:'solaris', name:'Solaris', ticks:70, tier:2 },
  { id:'galaxy', name:'Galaxy', ticks:80, tier:2 },
];

/** max = base wiki (avant GetT1NoticeCap). Le cap affiché ajoute le pack live.
 *  fixed : le cap bonus ne s'applique pas (reste à 1). */
export const NOTICE_UPGRADES_T1 = [
  { id:'n1_gold_floor', name:'Golden Floor Multiplier', per:'1.02x', max:25 },
  { id:'n1_rainbow_vein', name:'Rainbow Vein Multiplier', per:'1.05x', max:25 },
  { id:'n1_pick_bomb', name:'Pickaxe & Bomb Damage', per:'1.15x', max:25 },
  { id:'n1_all_star', name:'All Star Multiplier', per:'+1%', max:20 },
  { id:'n1_rainbow_floor', name:'Rainbow Floor Chance', per:'+2%', max:1, fixed:true },
  { id:'n1_exp', name:'Experience Gain', per:'1.20x', max:30 },
  { id:'n1_triple_contract', name:'Triple Contract Chance', per:'+1%', max:15 },
  { id:'n1_pet_lvl', name:'Pet Level Up Chance', per:'+0.50%', max:20 },
  { id:'n1_ss_supernova', name:'Super Star Supernova Multi', per:'+4%', max:15 },
  { id:'n1_all_floor', name:'All Floor Multiplier', per:'+20%', max:1, fixed:true },
  { id:'n1_bomb_recharge', name:'Bomb Recharge Rate', per:'+0.50%', max:20 },
  { id:'n1_gold_vein', name:'Golden Vein Multiplier', per:'1.04x', max:25 },
  { id:'n1_supernova', name:'Star Supernova Multiplier', per:'+1x', max:3 },
  { id:'n1_10x_craft', name:'10x Craft Chance', per:'+0.5%', max:10 },
  { id:'n1_w3_speed', name:'Remove World 3 -30% Game Speed', per:'+30%', max:1, fixed:true },
];

export const NOTICE_UPGRADES_T2 = [
  { id:'n2_10x_contract', name:'10x Contract Chance', per:'+0.1%', max:30 },
  { id:'n2_veinseeker', name:'Veinseeker Grade Cap', per:'+1', max:30 },
  { id:'n2_100x_craft', name:'100x Craft Chance', per:'+0.1%', max:20 },
  { id:'n2_sgi', name:'Star Supergiant Chance', per:'+0.2%', max:30 },
  { id:'n2_midas', name:'Midas Drone Enhancement', per:'Unlock + grade cap', max:1 },
  { id:'n2_jackpot', name:'Freebie Jackpot Chance', per:'+0.1%', max:30 },
  { id:'n2_t1_cap', name:'Tier 1 Notice Upgrade Cap', per:'+1', max:10 },
  { id:'n2_lasagna', name:'Lasagna: Golden Ore Multi', per:'+0.15x', max:30 },
];

export const ENHANCE_T1 = [
  { id:'e1_fish_multi', name:'Fish Multiplier', per:'+0.05x', max:255 },
  { id:'e1_drone', name:'Fishing Drone', per:'+1', max:25 },
  { id:'e1_rod', name:'Rod Multiplier', per:'+0.05x', max:20 },
  { id:'e1_tick', name:'Tick Speed', per:'-0.5s', max:20 },
  { id:'e1_drone_multi', name:'Drone Multiplier', per:'+0.08x', max:25 },
  { id:'e1_token', name:'Token Multiplier', per:'+0.05x', max:20 },
  { id:'e1_dbl_tick', name:'Double Tick Chance', per:'+0.5%', max:20 },
  { id:'e1_tiny', name:'Tiny Notice Chance', per:'+0.5%', max:20 },
  { id:'e1_shiny', name:'Shiny Multiplier', per:'+0.05x', max:20 },
  { id:'e1_drone3', name:'Fishing Drone +3', per:'+3', max:20 },
];

export const ENHANCE_T2 = [
  { id:'e2_dock_ticks', name:'Tier 2 Dock Ticks', per:'-1', max:10 },
  { id:'e2_triple', name:'Triple Tick Chance', per:'+0.4%', max:20 },
  { id:'e2_super_shiny', name:'Super Shiny Multi', per:'+0.05x', max:20 },
  { id:'e2_5x', name:'5x Tick Chance', per:'+0.25%', max:20 },
  { id:'e2_t2_dock', name:'Tier 2 Dock Power', per:'+0.05x', max:20 },
];

/** Fishing Upgrades (fish currency) — wiki Fishing#Upgrades */
export const FISH_UPGRADES_T1 = [
  { id:'u1_rod', name:'Fishing Rod', per:'x1.16 power', max:60 },
  { id:'u1_drone', name:'Fishing Drone +1', per:'+1 drone', max:50 },
  { id:'u1_boat', name:'Upgrade Boat', per:'+1 boat level', max:5 },
  { id:'u1_tick', name:'Tick Speed', per:'+0.50s', max:40 },
  { id:'u1_fish_multi', name:'Fish Multiplier', per:'+0.03x', max:30 },
  { id:'u1_rod_multi', name:'Rod Multiplier', per:'+0.04x', max:20 },
  { id:'u1_drone_multi', name:'Drone Multiplier', per:'+0.06x', max:20 },
  { id:'u1_dbl_tick', name:'Double Tick Chance', per:'+0.50%', max:30 },
  { id:'u1_drone2', name:'Fishing Drone +2', per:'+2 drones', max:30 },
  { id:'u1_shiny', name:'Shiny Fish Chance', per:'+0.50%', max:25 },
  { id:'u1_drone_base', name:'Drone Base Power', per:'+0.25', max:30 },
  { id:'u1_triple', name:'Triple Tick Chance', per:'+0.35%', max:25 },
];

export const FISH_UPGRADES_T2 = [
  { id:'u2_boat', name:'Upgrade Tier 2 Boat', per:'+1 T2 boat', max:5 },
  { id:'u2_shiny_multi', name:'Shiny Multiplier', per:'+0.05x', max:20 },
  { id:'u2_dock_power', name:'Tier 2 Dock Power', per:'+0.05x', max:20 },
  { id:'u2_super_shiny', name:'Super Shiny Chance', per:'+1%', max:20 },
  { id:'u2_poly', name:'Poly Card Multi', per:'+0.08x', max:25 },
  { id:'u2_cloner', name:'Drone Cloner', per:'+0.05x drones', max:30 },
];

/** Legendary fish — tribute ranks 0..2 (wiki Fishing#Tributes) */
export const LEGENDARY_FISH = [
  { id:'rainbow_trout', name:'Rainbow Trout', dock:'lake', card:'Rainbow Floor Multi',
    icon:'assets/cards/Lake_Legendary_Fish_Head.png',
    tributes:['Leprechaun Cap +3 · Rainbow Floor Multi 1.15x','Mr Nibbles Cap +3 · All Floor Multis 1.10x'] },
  { id:'dunes_eelworm', name:"Dune's Eelworm", dock:'desert', card:'Golden Portal Multi',
    icon:'assets/cards/Desert_Legendary_Fish_Head.png',
    tributes:['Golden Void Portal Chance 5% · Hercules/Draco Cap +3','Elixir Crit +10% · Golden Void Portal Multi 1.50x'] },
  { id:'glacial_shellstealer', name:'Glacial Shellstealer', dock:'tundra', card:'Rainbow Vein Multi',
    icon:'assets/cards/Tundra_Legendary_Fish_Head.png',
    tributes:['Gleaming Vein Chance +5% · Totem Cap +5','Gleaming Vein Multi +10x · Void Drone Cap +15'] },
  { id:'megalodon', name:'Megalodon', dock:'ocean', card:'Star Supernova Multi',
    icon:'assets/cards/Ocean_Legendary_Fish_Head.png',
    tributes:['Cancer Cap +10 · Triple Star +5% · Galactic Floor 1.15x','All Supernova Multis 1.25x · SS 10x +5%'] },
  { id:'radioactive_slug', name:'Radioactive Slug', dock:'nuclear', card:'Bomb Dmg / Exp', damageLever:true,
    icon:'assets/cards/Nuclear_Legendary_Fish_Head.png',
    tributes:['All Bomb Crit Multis 2.00x · Workshop Cap +3','Unlock Golden Plenty Bomb!'] },
  { id:'cthulhu', name:'Cthulhu', dock:'abyss', card:'Divine Relics Cap',
    icon:'assets/cards/Abyss_Legendary_Fish_Head.png',
    tributes:['All Dock Ticks −10% · Super Shiny Multi +3x','Unlock +1 Mining Drone!'] },
  { id:'glimmering_geoduck', name:'Glimmering Geoduck', dock:'cave', card:'Banked Freebie Cap',
    icon:'assets/cards/Cave_Legendary_Fish_Head.png',
    tributes:['Frag/Mythic Chest +0.25% · Poly Star Card Multi 1.25x','Unlock Golden Gem Bomb · Poly Ore Card 1.30x'] },
  { id:'laviathan', name:'Laviathan', dock:'volcano', card:'Bar Output Multi',
    icon:'assets/cards/Volcano_Legendary_Fish_Head.png',
    tributes:['Unlock Infernal Ore/Bar Cards','Unlock Infernal Fish + Legendary Fish Cards'] },
  { id:'storm_serpent', name:'Storm Serpent', dock:'sky', card:'Super Stonks Multi',
    icon:'assets/cards/Sky_Legendary_Fish_Head.png',
    tributes:['Golden Exp Bomb · Crab Cap +5 · Lootbug Bank +10','Golden Eye of Newt · Cetus Cap +10'] },
  { id:'melting_gibbous', name:'Melting Gibbous', dock:'solaris', card:'Gems From Freebie',
    icon:'assets/cards/Solaris_Legendary_Fish_Head.png',
    tributes:['All Star Multi 1.20x · Notice Cap +5','Pet Quest Cap +1 · Golden Lootbug Lantern'] },
  { id:'blackened_basker', name:'Blackened Basker', dock:'galaxy', card:'Super Stonks Chance',
    icon:'assets/cards/Galaxy_Legendary_Fish_Head.png',
    tributes:['All Drone Grade Caps +5 · Unlock Golden Hamburger','Unlock +1 Mining Drone'] },
];

/**
 * Gem Spending Guide ~OB60–65 (ordre Discord / wiki).
 * Leviers qui débloquent la pioche / farming avant « taper OB ».
 */
export const GEM_PATH_OB60 = [
  { id:'w3_statues', label:'9 statues World 3 construites', note:'Avant tributes fishing.' },
  { id:'leg_early', label:'Tributes early + gild Trout/Eel', note:'Dock1 T1 → Dock2 card/T1 → gild Trout/Eel → Dock1 T2.' },
  { id:'w3_gild_plat', label:'Gild W3 + 2–4 plats', note:'Dino pet lvl 10 attendu.' },
  { id:'slug_card', label:'Radioactive Slug card → Poly', note:'Bomb/Exp +500%→+1100%.' },
  { id:'slug_t1', label:'Radioactive Slug Tribute 1', note:'Bomb Crit Multis ×2 + Workshop Cap +3.' },
  { id:'notice_pick', label:'Notice Pickaxe & Bomb Damage', note:'1.15× / niv — levier pioche direct.' },
  { id:'enhance', label:'Fishing Enhance (gems)', note:'Utiliser Fishing Gem Spending Calculator.' },
];

export const FISHING_EXPORT_KEYS = [
  'fishing_rod_power', 'fishing_income_multi', 'fishing_tick_speed',
  'fishing_tick_reduction_seconds', 'fishing_double_tick_chance',
  'fishing_triple_tick_chance', 'fishing_5x_tick_chance',
  'fishing_drone_capacity', 'fishing_drone_power', 'fishing_drone_multiplier',
  'fishing_shiny_chance', 'fishing_shiny_multi',
  'fishing_super_shiny_chance', 'fishing_super_shiny_multi',
  'fishing_tier2_dock_multi', 'fishing_token_multi',
  'fishing_tiny_notice_chance', 'fishing_notice_requirement',
];
