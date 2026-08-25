/* ============================================================
   playerMath.js — Estimateurs joueur (mécaniques wiki / jeu)
   Inspiration outils communautaires ; formules re-dérivées + exportstats.
   Pas une copie de code tiers. Valeurs approximatives 🟡.
   ============================================================ */
import { OBELISK } from './knowledgeBase.js';

/** Chance export : 6 → 6 %, 0.06 → déjà fraction. */
function pct(v) {
  const n = Number(v) || 0;
  if (n <= 0) return 0;
  return n > 1 ? n / 100 : n;
}

/**
 * Freebie gems/h (approx.) depuis exportstats.
 * Mécaniques : cooldown, refresh géométrique, 5× gems, Stonks (+200 gems × multi).
 * Ne couvre pas Founder / Gem Bomb / Cherry (→ ObeliskFarm pour le détail).
 */
export function estimateFreebieGemEv(stats = {}) {
  const base = +(stats.freebie_gems_bonus ?? 5);
  const cd = Math.max(1, +(stats.freebie_cooldown_seconds ?? 600));
  const refreshP = Math.min(0.99, pct(stats.freebie_refresh_chance));
  const fiveXP = Math.min(0.99, pct(stats.freebie_5x_chance));
  const stonksP = Math.min(0.99, pct(stats.stonks_chance));
  const stonksMulti = Math.max(1, +(stats.stonks_multi ?? 1));
  const STONKS_BONUS = 200; // constante jeu (skill Stonks)

  const claimsPerHour = 3600 / cd;
  const refreshMulti = 1 / (1 - refreshP);
  /* 5× gems : (1−p)·1 + p·5 = 1 + 4p */
  const fiveXMulti = 1 + 4 * fiveXP;
  const gemsPerClaim = base * fiveXMulti + stonksP * STONKS_BONUS * stonksMulti;
  const gemsPerHour = claimsPerHour * refreshMulti * gemsPerClaim;

  return {
    gemsPerHour: +gemsPerHour.toFixed(1),
    claimsPerHour: +claimsPerHour.toFixed(2),
    refreshMulti: +refreshMulti.toFixed(3),
    fiveXMulti: +fiveXMulti.toFixed(3),
    gemsPerClaim: +gemsPerClaim.toFixed(2),
    cooldownSec: cd,
    baseGems: base,
    confidence: 'probable',
    note: 'Freebies seulement (sans Founder / bombs). Pour le détail → ObeliskFarm Gem EV.',
  };
}

/**
 * Lootbug « 2× Game Speed » 10 min — rentable vs coût gems ?
 * Wiki Gem Spending Guide (Lootbug 2x Speed calculator).
 */
export function estimateLootbug2xWorth(stats = {}, freebieEv = null) {
  const ev = freebieEv || estimateFreebieGemEv(stats);
  const cost = Math.max(1, 15 - (+(stats.lootbug_gem_cost_reduction) || 0));
  const cd = ev.cooldownSec;
  /* Pendant 600 s de 2×, CD freebie ÷2 → claims en plus ≈ 600/cd */
  const extraClaims = 600 / cd;
  const extraGems = extraClaims * ev.refreshMulti * ev.gemsPerClaim;
  const worth = extraGems >= cost;
  return {
    cost,
    extraGems: +extraGems.toFixed(1),
    worth,
    confidence: 'probable',
    note: worth
      ? `Lootbug 2× (~${extraGems.toFixed(0)} gems freebies) ≥ coût ${cost} → achète.`
      : `Lootbug 2× (~${extraGems.toFixed(0)} gems) < coût ${cost} — marge faible / ignore bombs.`,
  };
}

/**
 * Écart pioche vs armure OB+1 → multi nécessaire + niveaux Notice 1.15×.
 */
export function estimatePickaxeGap(stats = {}, profile = {}) {
  const ob = profile.obeliskLevel ?? null;
  const pick = +(stats.pickaxe_damage ?? profile.pickaxeDamage);
  const armorRed = +(stats.obelisk_armor_reduction ?? profile.armorReduction ?? 0);
  if (ob == null || !isFinite(pick) || pick <= 0) return null;

  const nextArmor = OBELISK.effectiveArmor(ob + 1, armorRed);
  const ratio = nextArmor / pick;
  const blocked = pick <= nextArmor;
  const needMulti = blocked ? ratio : 1;

  /* Notice Pickaxe & Bomb Damage = 1.15× / niveau (wiki Fishing Notices) */
  const NOTICE_PER = 1.15;
  let noticeLevels = 0;
  if (blocked && needMulti > 1) {
    noticeLevels = Math.ceil(Math.log(needMulti) / Math.log(NOTICE_PER));
  }

  return {
    obNext: ob + 1,
    pick,
    nextArmorEff: nextArmor,
    gapRatio: pick / nextArmor,
    needMulti: +needMulti.toFixed(3),
    noticeLevelsNeeded: noticeLevels,
    blocked,
    confidence: 'confirmed',
    note: blocked
      ? `Il te faut ×${needMulti.toFixed(2)} pioche (ou −armure). ≈ ${noticeLevels} niv. Notice Pickaxe & Bomb (1.15×) si tu n'as que ça.`
      : `Pioche déjà au-dessus de l'armure OB${ob + 1} (hors items).`,
  };
}
