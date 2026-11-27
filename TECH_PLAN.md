# Tech plan : le boss sinusoïdal

## Objectif
Ajouter un nouvel ennemi, le boss, qui :
- apparaît à des seuils de score ;
- se déplace en sinusoïde ;
- tire en spread shot (plusieurs balles en éventail) ;
- est visuellement différent des autres ennemis.

Ces trois comportements se règlent dans `public/assets/Data/enemies.json`, sans toucher au code.

## Choix techniques
- **Spread shot** : extension du composant `Weapon` existant plutôt qu'un nouveau composant. Il reçoit un nombre de balles et un angle d'éventail, avec par défaut 1 balle et 0°, si bien que le joueur et les ennemis existants tirent comme avant. Sur un cercle complet (360°), l'écart entre deux balles est divisé par le nombre de balles, pour que la dernière ne se superpose pas à la première.
- **Mouvement** : nouveau composant `SineMovement` (pattern Entity/Component du cours). Le boss descend jusqu'à `targetY`, puis oscille autour de sa position de départ : `x = départ + sin(temps × fréquence) × amplitude`.
- **Boss** : nouvelle entité `Boss`, poolée dans un groupe de taille 1. Ses composants sont ajoutés une fois dans `init()`. Son état est remis à zéro dans `enable()` : PV, phase de la sinusoïde, timer de tir et teinte. `disable()` met le timer de tir en pause.
- **Apparition** : `EntityManager` écoute le score dans le registry, comme `MainUIScene`. Le boss apparaît à `firstScore`, puis tous les `everyScore` points. L'écoute est retirée au `SHUTDOWN` de la scène.
- **Données** : `enemies.json` est typé par `EnemiesData`, `BossData`, `SineMovementData` et `WeaponData`. Les couleurs des balles passent en texte `"#rrggbb"`, car le JSON n'accepte pas l'écriture `0x…`.
- **Visuel** : la teinte et la taille du boss sont lues dans le JSON. Après le flash blanc d'un impact, la teinte du boss est remise, plutôt qu'effacée par `clearTint()`.
- **Constantes nommées** : l'angle de tir vers le bas, la couleur et la durée du flash, ainsi que les dégâts au contact du boss.

## Fichiers
- Modifiés : `Weapon`, `Bullet`, `BulletData`, `Player`, `Enemy`, `EntityManager`, `HomeScene`, `MainGameScene`
- Créés : `SineMovement`, `Boss`, `BossData`, `SineMovementData`, `WeaponData`, `EnemiesData`, `enemies.json`

## Exemple de configuration
```json
"weapon": { "bulletCount": 7, "spreadAngle": 60, "fireDelay": 2000, "bullet": { ... } }
```
`"bulletCount": 3, "spreadAngle": 30` donne 3 balles sur 30°, et `"bulletCount": 60, "spreadAngle": 360` donne 60 balles tout autour du boss.

## Playtest
- Boss forcé à 2 points de score : il descend, ondule, tire en éventail, clignote quand il est touché, explose à 0 PV et revient au seuil suivant.
- Testé en modifiant uniquement le JSON : 3 balles sur 30°, 60 balles sur 360°, autres amplitudes et fréquences.
- `npx tsc --noEmit` et `npm run build-nolog` passent.
