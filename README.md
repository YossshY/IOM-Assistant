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
python3 -m http.server 8766
# → http://localhost:8766
```
Aucune dépendance, aucun build — HTML/CSS/JS modules purs.

## Architecture
```
src/
├── app.js                  # orchestration UI (zéro logique de jeu)
└── game/
    ├── knowledgeBase.js        # formules, caps, déblocages (wiki v2.2.6)
    ├── statsParser.js          # parsing dynamique + détection d'inconnues
    ├── missingInfo.js          # questions contextuelles progressives
    ├── recommendationEngine.js # règles → recos structurées + confiance
    ├── cardsData.js            # cards individuelles par monde
    ├── statuesData.js          # 27 statues + sprites
    ├── petsData.js             # 16 pets + skins + quêtes
    ├── collections.js          # état local persistant
    └── history.js              # historique & diff d'exports
src/data/                      # données extraites du wiki (régénérables)
assets/                        # icônes wiki (ores, cards, statues, pets, menu, backings)
```

## Crédits
- Données et icônes : [Idle Obelisk Miner Wiki](https://shminer.miraheze.org) (CC BY-NC-SA 4.0)
- Jeu : [Idle Obelisk Miner](https://apps.apple.com/us/app/idle-obelisk-miner/id6448125670) par Checkbox Entertainment
