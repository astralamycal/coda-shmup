# Crédits

## Code
- Moteur : [Phaser 3](https://phaser.io/) (licence MIT)
- Base du projet : [coda-shmup](https://github.com/rthery/coda-shmup) de Romain Théry, support du module Jeu Vidéo de CODA

## Graphismes
- Voitures, orbe d'XP, croix de soin, étincelles et route : créés pour ce projet, générés par les scripts de `tools/assets/` (Python, Pillow)
- Boss : photo de Dwayne Johnson, source et licence à compléter (préparée avec `tools/assets/boss.py`)
- Police kenvector future : [Kenney](https://kenney.nl/) (CC0)
- Direction artistique : clin d'œil au mini-jeu Midnight Motorist (Freddy Fazbear's Pizzeria Simulator, Scott Cawthon). Aucun asset du jeu original n'est utilisé.

## Sons
- `sfx_laser1`, `sfx_laser2` : [Kenney](https://kenney.nl/), Space Shooter Redux (CC0)
- Boom du boss (`sfx_boom`) : son « vine boom » fourni par l'équipe, source et licence à compléter
- Explosion, ramassage, level-up et musique : créés pour ce projet, générés par `tools/assets/sounds.py` (Python, numpy)

## Régénérer les assets
```bash
python tools/assets/sprites.py assets-src/sprites
python tools/assets/boss.py <photo.png> assets-src/sprites/boss.png --rotate-180
python tools/assets/road.py public/assets/Backgrounds
python tools/assets/sounds.py <dossier>   # puis conversion en .ogg avec ffmpeg
npm run atlas
```
