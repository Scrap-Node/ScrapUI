# @scrap-node/scrap-ui

Bibliothèque d'interface des projets **Scrap Node** : jetons CSS, composants Angular 22
(autonomes, signaux, `OnPush`, sûrs en SSR) et une feuille CSS compilée pour les projets
sans Angular.

> **Règle d'or : la palette et les typos sont fixes. Seul le logo change d'un projet à l'autre.**

## Installation

Jusqu'en 0.2.0, le paquet s'appelait `@comechaslerie/scrap-ui` : `ng add @scrap-node/scrap-ui`
reprend l'ancien import de styles.

Le paquet vit sur GitHub Packages, qui exige un token **même en lecture**. Dans le projet
consommateur, un `.npmrc` versionné :

```ini
@scrap-node:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_TOKEN}
```

et un PAT classique avec la portée `read:packages` exposé en `GITHUB_PACKAGES_TOKEN` :

```bash
npm install @scrap-node/scrap-ui
ng add @scrap-node/scrap-ui    # branche le thème dans styles.scss
```

## Utilisation

```scss
// styles.scss
@use '@scrap-node/scrap-ui/styles/index';
@use '@scrap-node/scrap-ui/styles/affiche'; // facultatif : grain, tampons, éclaboussures
```

```ts
import { ScrapButton, ScrapCard, ScrapHeader } from '@scrap-node/scrap-ui';
```

Sans Angular (HTML, Blazor) : `css/scrap-ui.css`, et au besoin `css/scrap-ui-affiche.css`.

Le thème suit celui du système ; `data-scrap-theme="light"` ou `"dark"` le force sur
`<html>` ou sur une zone. Tous les jetons sont des custom properties `--scrap-*`.

## Prérequis côté consommateur

La lib est distribuée en compilation partielle Angular. Dans `angular.json`, deux réglages
évitent un `NG0203` (deux instances d'Angular chargées) :

```jsonc
"preserveSymlinks": true,
"prebundle": { "exclude": ["@scrap-node/scrap-ui"] }
```

## Développement

```bash
ng build scrap-ui        # → dist/scrap-ui
ng serve demo            # vitrine de tous les composants
ng test scrap-ui         # vitest
```

Publication : voir [le README racine](../../README.md#publier-une-version) — un tag `vX.Y.Z`
déclenche le workflow `release`.

Composants et utilitaires CSS sont catalogués dans le [README racine](../../README.md).
