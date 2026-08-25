/* ============================================================
   missingInfo.js — Détection des informations manquantes
   Chaque "gap" décrit une info absente de l'export, pourquoi
   elle compte, et la question à poser au joueur SI elle devient
   nécessaire à une décision. Le questionnaire est progressif :
   on ne pose que les gaps pertinents pour la situation actuelle.
   ============================================================ */

/**
 * detectMissingInformation(parsed, profile) -> [ gap, ... ]
 * gap = { id, label, question, type, needed, reason }
 *   needed : true si cette info influence une recommandation active
 */
export function detectMissingInformation(parsed, profile) {
  const s = parsed.stats;
  const gaps = [];

  /* --- Statues W3/W4 : l'export expose statue_X_setN mais ne nomme
     pas les statues ni leur monde -> inutilisable seul --- */
  if (s.statue_0_set1 !== undefined && STATUES_UNNAMED) {
    gaps.push({
      id: 'statues_w3',
      label: 'Statues World 3',
      question: 'Quelles statues World 3 te restent-il à obtenir ?',
      type: 'multi',
      options: null, // rempli depuis KB.STATUES.W3 ; si null -> réponse libre
      freeTextPlaceholder: 'ex : Propulsion, Safety… (laisse vide si toutes obtenues)',
      // Pertinent seulement si le joueur est en zone W3 (OB42..63)
      relevantWhen: p => (p.obeliskLevel ?? 0) >= 42,
      reason: 'L\'exportstats liste statue_0..8_set1/2/3 mais ne précise ni les noms ni le monde : impossible de savoir ce qu\'il te manque.',
    });
  }

  if (s.statue_0_set1 !== undefined && STATUES_UNNAMED) {
    gaps.push({
      id: 'statues_w4',
      label: 'Statues World 4',
      question: 'Quelles statues World 4 as-tu déjà ?',
      type: 'multi-free',
      options: null,
      relevantWhen: p => (p.obeliskLevel ?? 0) >= 64,
      reason: 'Monde 4 débloqué (OB64) : l\'export ne dit pas où tu en es des nouvelles statues.',
    });
  }

  /* --- Workshop : aucun niveau d'upgrade dans l'export --- */
  if (s.bomb_workshop_cap_increase === undefined && s.bomb_capacity === undefined)
    gaps.push({ id:'workshop_levels', label:'Workshop', question:'Niveaux Workshop principaux (Pickaxe Damage, Bomb Damage) ?', type:'numbers' });
  else
    gaps.push({
      id:'workshop_pickaxe',
      label:'Workshop Pickaxe Damage',
      question:'Niveau de l\'upgrade Workshop « Pickaxe Damage » (W1, +3%/niv, max 42) ?',
      type:'number',
      max:42,
      relevantWhen: p => true,
      reason:'L\'exportstats n\'expose pas les niveaux du Workshop. Ce multiplicateur permanent influe directement sur tes dégâts Obelisk.',
    });

  /* --- Artefacts : seuls les caps augmentés sont visibles --- */
  if (s.artifact_cap_increase !== undefined)
    gaps.push({
      id:'artifacts_t34',
      label:'Artefacts Tiers 3-4',
      question:'Niveaux actuels : T3 Pickaxe Damage / T3 Armor Reduction / T4 Pickaxe per Statue ?',
      type:'numbers',
      fields:[
        {id:'a_pick3',   label:'T3 Pickaxe Damage (+60%)'},
        {id:'a_armorred',label:'T3 Armor Reduction (-2%)'},
        {id:'a_statue',  label:'T4 Pickaxe per Statue (+10%)'},
      ],
      relevantWhen: p => (p.obeliskLevel ?? 0) >= 14,
      reason:`Tes caps artefacts sont augmentés (+${s.artifact_cap_increase}, +${s.artifact_tier4_cap_increase} en T4) mais l'export ne donne pas les niveaux atteints — indispensables pour prioriser tes PP.`,
    });

  /* --- Skills : invisibles dans l'export --- */
  gaps.push({
    id:'skills_sTier',
    label:'Skills S-Tier',
    question:'Possèdes-tu ces compétences du Skill Tree ?',
    type:'bools',
    fields:[
      {id:'sk_gem_bomb',   label:'Gem Bomb (S-Tier)'},
      {id:'sk_auto_bomber',label:'Auto-Bomber (S-Tier)'},
      {id:'sk_stonks',     label:'Stonks (S-Tier)'},
    ],
    relevantWhen: () => true,
    reason:'Le Skill Tree n\'apparaît pas dans exportstats ; ces skills sont classés S-Tier par la communauté.',
  });

  /* --- Monuments / mondes débloqués : dérivable du cap XP seulement
     indirectement (cap 350 => OB64 => W4 théoriquement accessible),
     mais construit != débloqué --- */
  if ((profile.obeliskLevel ?? 0) >= 64)
    gaps.push({
      id:'monument_w4',
      label:'Monument World 4',
      question:'Le Monument World 4 est-il construit (1M gemmes + 1q veines Industrial/Warfront/Neon) ?',
      type:'bool',
      relevantWhen: p => (p.obeliskLevel ?? 0) >= 64,
      reason:'OB64 donne accès au Monument W4, mais l\'export ne peut pas confirmer sa construction.',
    });

  return gaps.filter(g => !g.relevantWhen || g.relevantWhen(profile));
}

// Les statues W3/W4 ne sont pas encore nommées dans la base de connaissances.
import { STATUES } from './knowledgeBase.js';
const STATUES_UNNAMED = STATUES.W3 === null;
