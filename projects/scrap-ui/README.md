# @comechaslerie/scrap-ui

Bibliothèque d'interface des projets **Scrap Node** : jetons CSS, composants Angular 22
(autonomes, signaux, `OnPush`, sûrs en SSR) et une feuille CSS compilée pour les projets
sans Angular.

> **Règle d'or : la palette et les typos sont fixes. Seul le logo change d'un projet à l'autre.**

## Installation

Le paquet vit sur GitHub Packages, qui exige un token **même en lecture**. Dans le projet
consommateur, un `.npmrc` versionné :

```ini
@comechaslerie:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_TOKEN}
```

et un PAT classique avec la portée `read:packages` exposé en `GITHUB_PACKAGES_TOKEN` :

```bash
npm install @comechaslerie/scrap-ui
ng add @comechaslerie/scrap-ui    # branche le thème dans styles.scss
```

## Utilisation

```scss
// styles.scss
@use '@comechaslerie/scrap-ui/styles/index';
@use '@comechaslerie/scrap-ui/styles/affiche'; // facultatif : grain, tampons, éclaboussures
```

```ts
import { ScrapButton, ScrapCard, ScrapHeader } from '@comechaslerie/scrap-ui';
```

Sans Angular (HTML, Blazor) : `css/scrap-ui.css`, et au besoin `css/scrap-ui-affiche.css`.

Le thème suit celui du système ; `data-scrap-theme="light"` ou `"dark"` le force sur
`<html>` ou sur une zone. Tous les jetons sont des custom properties `--scrap-*`.

## Prérequis côté consommateur

La lib est distribuée en compilation partielle Angular. Dans `angular.json`, deux réglages
évitent un `NG0203` (deux instances d'Angular chargées) :

```jsonc
"preserveSymlinks": true,
"prebundle": { "exclude": ["@comechaslerie/scrap-ui"] }
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
