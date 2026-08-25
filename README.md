# IOM Assistant

**Idle Obelisk Miner Progress Assistant** — analyse ta progression réelle et te dit quoi faire ensuite.

## Fonctionnalités
- Import du JSON `exportstats` (collage ou fichier) avec parsing dynamique — les stats inconnues des futures versions sont conservées et affichées
- Dashboard profil (Obelisk level dérivé, cap XP, dégâts, multi PP, temps de jeu)
- **Feuille de route priorisée** avec niveaux de confiance 🟢 Confirmé / 🟡 Probable / 🔴 Données insuffisantes — jamais de conseil inventé
- **Cards** : 195 cartes individuelles (77 ores, 77 bars, 41 misc) avec icônes du wiki, dos de carte officiels (Standard/Gilded/Polychrome/Infernal), masquage par monde débloqué, bulk par famille
- **Statues** : 27 statues en 3×3 par monde avec sprites Normal/Gilded/Platinized, bonus par état, gating wiki
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
├── app.js                  # orchestration UI
└── game/
    ├── knowledgeBase.js        # formules, caps, catalogue exportstats
    ├── statsParser.js          # parsing + statues/mondes dérivés
    ├── missingInfo.js          # gaps absents de l'export
    ├── recommendationEngine.js # règles → recos (lit export + collections)
    ├── cardsData.js / petsData.js / statuesData.js
    ├── collections.js          # état local (Prestige, skills…)
    └── history.js
samples/exportstats-v2.2.6.json # export réel de référence
```

Prestige = artefacts (comme dans le jeu). Construct = statues auto-remplies depuis `statue_N_set1/2/3`.

## Crédits
- Données et icônes : [Idle Obelisk Miner Wiki](https://shminer.miraheze.org) (CC BY-NC-SA 4.0)
- Jeu : [Idle Obelisk Miner](https://apps.apple.com/us/app/idle-obelisk-miner/id6448125670) par Checkbox Entertainment
