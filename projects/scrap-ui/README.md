# @scrapnode/scrap-ui

Bibliothèque d'interface des projets **Scrap Node** : jetons CSS, composants Angular 22
(autonomes, signaux, `OnPush`, sûrs en SSR) et une feuille CSS compilée pour les projets
sans Angular.

> **Règle d'or : la palette et les typos sont fixes. Seul le logo change d'un projet à l'autre.**

## Installation

```bash
npm install @scrapnode/scrap-ui
ng add @scrapnode/scrap-ui    # branche le thème dans styles.scss
```

Le paquet est public sur npmjs.com : ni jeton ni `.npmrc`. Jusqu'en 0.3.0, il était sur
GitHub Packages, sous `@comechaslerie/scrap-ui` puis `@scrap-node/scrap-ui` ;
`ng add @scrapnode/scrap-ui` réécrit les imports de styles de ces anciens noms.

## Utilisation

```scss
// styles.scss
@use '@scrapnode/scrap-ui/styles/index';
@use '@scrapnode/scrap-ui/styles/affiche'; // facultatif : grain, tampons, éclaboussures
```

```ts
import { ScrapButton, ScrapCard, ScrapHeader } from '@scrapnode/scrap-ui';
```

Sans Angular (HTML, Blazor) : `css/scrap-ui.css`, et au besoin `css/scrap-ui-affiche.css`.

Le thème suit celui du système ; `data-scrap-theme="light"` ou `"dark"` le force sur
`<html>` ou sur une zone. Tous les jetons sont des custom properties `--scrap-*`.

## Prérequis côté consommateur

La lib est distribuée en compilation partielle Angular. Dans `angular.json`, deux réglages
évitent un `NG0203` (deux instances d'Angular chargées) :

```jsonc
"preserveSymlinks": true,
"prebundle": { "exclude": ["@scrapnode/scrap-ui"] }
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
