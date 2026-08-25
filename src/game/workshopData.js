/* ============================================================
   workshopData.js — upgrades Workshop (wiki Obelisk Miner v2.2.6)
   Niveaux PAS dans exportstats → saisie manuelle.
   Max affiché = maxWiki − (WORKSHOP_WIKI_REF_CAP − bomb_workshop_cap_increase)
   (screens: +17 → max = wiki−5 ; ex. Hamburger 47→42, Chain 30→25).
   ============================================================ */

/** Cap workshop implicite dans les max du wiki v2.2.6 (calibré screenshots). */
export const WORKSHOP_WIKI_REF_CAP = 22;

const U = (id, name, perLevel, unit, maxBase, unlockOb, opts = {}) => ({
  id, name, perLevel, unit, maxBase, unlockOb,
  icon: opts.icon || '🔧',
  unlock: !!opts.unlock,
  world4: !!opts.world4,
});

export const WORKSHOP_UPGRADES = [
  U('bop_unlock', 'Bomb Of Plenty Unlocked!', 1, '', 1, 1, { unlock:true, icon:'💣' }),
  U('basic_chain_dmg', 'Basic & Chain Damage', 0.5, 'x', 30, 1, { icon:'💣' }),
  U('exp_bomb_unlock', 'Experience Bomb Unlocked!', 1, '', 1, 2, { unlock:true, icon:'💚' }),
  U('chain_amount', 'Chain Bomb Amount', 1, '', 26, 2, { icon:'🔗' }),
  U('inf_bomb_unlock', 'Infinity Bomb Unlocked!', 1, '', 1, 3, { unlock:true, icon:'♾️' }),
  U('bop_ore_multi', 'Bomb Of Plenty Ore Multi', 1, 'x', 25, 3, { icon:'⛏️' }),
  U('cherry_unlock', 'Cherry Bomb Unlocked!', 1, '', 1, 5, { unlock:true, icon:'🍒' }),
  U('pick_w1', 'Pickaxe Damage', 3, '%', 42, 6, { icon:'⛏' }),
  U('d20_unlock', 'D20 Bomb Unlocked!', 1, '', 1, 7, { unlock:true, icon:'🎲' }),
  U('exp_bomb_bonus', 'Exp Bomb Bonus', 0.5, 'x', 28, 8, { icon:'📗' }),
  U('mega_dmg', 'Megabomb Damage', 5, 'x', 32, 9, { icon:'💥' }),
  U('d20_charges', 'D20 Max Charges', 1, 'x', 42, 10, { icon:'🎲' }),
  U('cherry_3x', 'Chance for 3x Charges', 0.5, '%', 32, 12, { icon:'🍒' }),
  U('inf_scaling', 'Infinity Scaling', 0.001, '', 32, 14, { icon:'♾️' }),
  U('trans_bar', 'Transmuter Bar Multi', 1, 'x', 27, 18, { icon:'🔮' }),
  U('bomb_dmg_w1', 'Bomb Damage', 35, '%', 42, 19, { icon:'💣' }),
  U('mega_mark', 'Megabomb Damage Mark', 1, 'x', 25, 20, { icon:'💥' }),
  U('trans_bop', 'Transmuter gives BoP', 25, '%', 1, 21, { unlock:true, icon:'🔮' }),
  U('bomb_dmg_w2', 'Bomb Damage', 0.15, 'x', 42, 40, { icon:'💣' }),
  U('morph_chance', 'Morph Chance', 0.1, '%', 47, 40, { icon:'🧪' }),
  U('pick_w2', 'Pickaxe Damage', 0.08, 'x', 47, 42, { icon:'⛏' }),
  U('bop_gold', 'Turns Ores Gold', 0.15, '%', 47, 44, { icon:'✨' }),
  U('hamburger', 'Hamburger Bonus', 0.12, 'x', 47, 45, { icon:'🍔' }),
  U('plenty_multi', 'Plenty Bomb Multi', 0.5, 'x', 47, 48, { icon:'💣' }),
  U('sushi_ticks', 'Sushi Fishing Ticks', 1, '', 42, 55, { icon:'🍣' }),
  U('fish_drone', 'Fishing Drone Power', 0.02, 'x', 52, 60, { icon:'🎣' }),
  U('pick_bomb_w4', 'Pickaxe & Bomb Damage', 0.1, 'x', 52, 62, { world4:true, icon:'⚔' }),
  U('starfruit', 'Starfruit: All Star Multi', 0.5, '%', 52, 63, { world4:true, icon:'⭐' }),
  U('bop_multi_w4', 'Bomb of Plenty Multi', 1, 'x', 52, 64, { world4:true, icon:'💣' }),
  U('bomb_recharge', 'Bomb Recharge Rate', 0.25, '%', 52, 65, { world4:true, icon:'🔋' }),
  U('frog_loot', 'Lootfrog Loot Multi', 0.5, '%', 52, 66, { world4:true, icon:'🐸' }),
  U('wizard_loot', 'Wizard Loot Multi', 0.5, '%', 32, 70, { world4:true, icon:'🧙' }),
  U('vein_grade_cap', 'Veinseeker Drone Grade Cap', 1, '', 32, 70, { world4:true, icon:'🛸' }),
  U('trans_bar_w4', 'Transmuter Bar Multi', 1, 'x', 32, 71, { world4:true, icon:'🔮' }),
  U('gold_void', 'Golden Void Portal Chance', 0.15, '%', 42, 72, { world4:true, icon:'🌀' }),
];

/** Max effectif selon bomb_workshop_cap_increase persisté. */
export function workshopEffectiveMax(u, caps = {}) {
  if (u.unlock || u.maxBase <= 1) return u.maxBase;
  const wc = +(caps.workshop ?? 0);
  return Math.max(1, u.maxBase - WORKSHOP_WIKI_REF_CAP + wc);
}

export function formatWorkshopBonus(u, lv) {
  if (u.unlock) return lv > 0 ? 'Unlocked' : '—';
  if (u.id === 'basic_chain_dmg' || u.id === 'bop_ore_multi' || u.id === 'exp_bomb_bonus'
    || u.id === 'mega_dmg' || u.id === 'd20_charges' || u.id === 'trans_bar' || u.id === 'mega_mark'
    || u.id === 'trans_bar_w4') {
    return `${(1 + u.perLevel * lv).toFixed(u.id === 'inf_scaling' ? 3 : 2)}x`;
  }
  if (u.id === 'fish_drone') return `${(1 + u.perLevel * lv).toFixed(2)}x`;
  const tot = u.perLevel * lv;
  if (u.unit === 'x') return `+${Number(tot.toFixed(2))}x`;
  if (u.unit === '%') return `${tot >= 0 ? '+' : ''}${Number(tot.toFixed(2))}%`;
  if (u.unit === '') return `${tot >= 0 ? '+' : ''}${Number(tot.toFixed(3))}`;
  return String(tot);
}
