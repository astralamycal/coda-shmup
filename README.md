# Midnight the Rockist 2 + Vine Boom DLC

Shoot'em up vertical sur une route de nuit aux néons. Le joueur conduit une voiture, détruit les voitures ennemies, ramasse leur EXP et choisit un bonus à chaque niveau. Tous les quelques dizaines de points, The Rock débarque.

Projet de fin de module Jeu Vidéo (CODA, B2), construit sur la base du cours [coda-shmup](https://github.com/rthery/coda-shmup) avec [Phaser 3](https://phaser.io/) et TypeScript.

## Lancer le jeu
Il faut Node.js 22.18 ou plus récent.

```bash
npm install
npm run dev-nolog      # puis ouvrir http://localhost:8080
```

Avant chaque commit :

```bash
npx tsc --noEmit       # vérifie les types (le build seul ne le fait pas)
npm run build-nolog    # build de production dans dist/
npm run format         # mise en forme Prettier de src/
```

Le jeu est publié sur itch.io par la GitHub Action à chaque push sur `main`.

## Contrôles

| Touche | Action |
| --- | --- |
| Flèches gauche / droite | Conduire |
| Espace | Tirer |
| Maj + flèches | Tourner la voiture pour viser |
| 1, 2, 3 | Choisir la voiture (compacte, coupé, course) |
| ↑ ↓ puis Espace (ou souris) | Choisir un bonus au passage de niveau |
| Flèches gauche / droite (accueil) | Régler le volume |
| R | Recommencer la partie (debug) |
| B | Faire apparaître le boss (debug) |

## Fonctionnalités
- **Évaluation** : le boss se déplace en sinusoïde et tire en éventail (spread shot). Son apparition, son mouvement et son tir se règlent dans `public/assets/Data/enemies.json`. Le détail est dans `TECH_PLAN.md`.
- **Ennemis** : 3 types de voitures (normale, rapide, costaude), plus rapides et plus résistants à mesure que le score monte. Leurs phares clignotent avant de tirer.
- **Boss** : The Rock, avec un vine boom à l'arrivée et à chaque impact. Il revient plus fort à chaque apparition.
- **Progression** : chaque ennemi lâche de l'EXP, attirée par un léger aimant. À chaque niveau, le joueur gagne 1 PV max et le jeu se fige pour proposer 3 bonus au hasard.
- **Bonus** : PV max, dégâts, cadence, EXP, score, balles supplémentaires, aimant, tir ciblé et trafic. Les valeurs et les maximums sont dans `buffs.json`.
- **Soins** : une croix rose lâchée de temps en temps par les ennemis, à ramasser pour regagner 1 PV. Le taux et le soin sont dans `progression.json`.
- **Game feel** : barres de PV et d'EXP, explosions en particules, tremblement de caméra, flash à l'impact, musique, effets sonores, volume sauvegardé et meilleur score sauvegardé.

## Architecture
- `src/entities` : les entités (joueur, ennemis, boss, balles, orbes, soins), toutes poolées avec un `enable()` qui remet leur état à zéro.
- `src/components` : les composants Entity/Component (`Health`, `Weapon`, `Movement`, `SineMovement`, `Experience`, `PlayerStats`).
- `src/managers` : les plugins Phaser. `EntityManager` gère les entités et les collisions, `BuffManager` les bonus, `SaveManager` la sauvegarde.
- `src/scenes` : accueil, jeu, interface (au-dessus du jeu, elle ne fait qu'écouter des événements) et game over.
- `src/gameData` et `public/assets/Data` : les données de jeu en JSON, chacune typée en TypeScript. L'équilibrage se fait sans toucher au code.
- `tools/assets` : les scripts Python qui génèrent les sprites, la route et les sons. Voir `CREDITS.md`.

## Crédits
Voir [CREDITS.md](CREDITS.md).
