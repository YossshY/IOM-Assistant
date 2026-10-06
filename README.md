# IOM Assistant

**Idle Obelisk Miner Progress Assistant** — analyse ta progression réelle et te dit quoi faire ensuite.

## Fonctionnalités
- Import du JSON `exportstats` (collage ou fichier) avec parsing dynamique — les stats inconnues des futures versions sont conservées et affichées
- À partir des exports v2.2.20+ (tableaux), l'import remplit Skill-Tree, Workshop, pêche, pets, étoiles, idoles, suits de drones, veines et la boutique de challenges
- Dashboard profil (Obelisk level dérivé, cap XP, dégâts, multi PP, **temps du run prestige** — pas le lifetime du compte)
- **Feuille de route priorisée** avec niveaux de confiance 🟢 Confirmé / 🟡 Probable / 🔴 Données insuffisantes — jamais de conseil inventé
- **Cards** : catalogue wiki v2.2.6 — **86 ores** (dont 9 sans bar), **77 bars**, **45 misc**, bombs, drones, pets, **21 veins** (Volcano incluse), stars, fish / legendary fish
- **Store** : Special / Perk / Gem Unlocks / Gem Upgrades (wiki) — niveaux manuels (absents de l'export, sauf `gem_upgrade_cap_increase`)
- **Challenges** : Regular / Extreme / Divine + **Shop** (coins)
- **Caps dynamiques** : max en cours = max(total export, sources notées) ; Max wiki en infobulle
- **Reset / import / export** des données locales (page ExportStats)
- **Statues** : 27 statues en 3×3 par monde (W1 / W3 / W4, pas de W2) avec sprites Normal/Gilded/Platinized
- **Pets** : 16 pets avec skins, quêtes, icônes
- Artefacts, Skill-Tree, Construct, Stargazing, Fishing
- Historique local des exports avec diff (évolutions + nouvelles stats détectées)
- Interface pixel-art originale (aucun asset du jeu copié — icônes du wiki sous CC BY-NC-SA, attribution requise)

## Lancer
```bash
python -m http.server 8766
# → http://localhost:8766
```
Aucune dépendance, aucun build — HTML/CSS/JS modules purs.

Vérif rapide (avec le sample d'export) :
```bash
node check.mjs
```

## Architecture
```
src/
├── app.js                      # orchestration UI
├── data/ores_raw.js, bars_raw.js
└── game/
    ├── knowledgeBase.js        # formules, caps artefacts, catalogue exportstats
    ├── statsParser.js          # parsing + statues/mondes dérivés
    ├── playerMath.js           # estimateurs freebie / pioche
    ├── missingInfo.js          # gaps absents de l'export
    ├── recommendationEngine.js # règles → recos
    ├── cardsData.js            # cartes individuelles (wiki)
    ├── collections.js          # état local (Prestige, skills, fishing…)
    ├── history.js              # historique d'exports + diff
    ├── capsEngine.js           # caps live (export + saisie)
    ├── storeData.js            # Store wiki
    ├── siteBackup.js           # reset / import / export du site
    ├── exportArrays.js         # tableaux de menus v2.2.20+
    └── *Data.js                # workshop, drones, fishing, arch, stars, skills…
samples/exportstats-v2.2.6.json  # export scalaire de référence
samples/exportstats-v2.2.30.json # export avec tableaux de menus
```

WIP : menus Arcanist / cartes Archaeology-Essence-Runes-Spells-Orbs (OB70).

Prestige = artefacts (comme dans le jeu). Caps T1–T3 = `maxBase + artifact_cap_increase` ; T4 ajoute aussi `artifact_tier4_cap_increase`. Construct = statues auto-remplies depuis `statue_N_set1/2/3`.

## Crédits
- Données et icônes : [Idle Obelisk Miner Wiki](https://shminer.miraheze.org/wiki/Obelisk_Miner_Wiki) (CC BY-NC-SA 4.0)
- Calculateurs communautaires (liens, pas de copie de code) : [ObeliskFarm](https://arisboeuf.github.io/ObeliskFarm/) par arisboeuf — licence « personal use », on pointe vers l’outil plutôt que de réimplémenter ses simulateurs
- Sheets Discord listés sur [External Resources](https://shminer.miraheze.org/wiki/External_Resources)
- Jeu : [Idle Obelisk Miner](https://apps.apple.com/us/app/idle-obelisk-miner/id6448125670) par Checkbox Entertainment
