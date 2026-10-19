# Journal des modifications

Toutes les évolutions notables de `@scrap-node/scrap-ui`, publié sous
`@comechaslerie/scrap-ui` jusqu'en 0.2.0.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le
versionnage respecte [SemVer](https://semver.org/lang/fr/). Pour une librairie
de composants, « rupture » couvre aussi le rendu : un changement de token ou de
structure DOM qui casse les surcharges d'un projet consommateur est majeur, même
si l'API TypeScript ne bouge pas.

## [Non publié]

## [0.3.1] — 2026-10-19

### Modifié

- Le paquet est publié sur npmjs.com, en public : l'installer ne demande plus ni
  jeton ni `.npmrc`. Chaque version porte une attestation de provenance, qui la
  relie au commit et au workflow qui l'ont produite.
- Les versions jusqu'à 0.3.0 restent sur GitHub Packages. Pour passer à 0.3.1, un
  projet retire de son `.npmrc` la ligne qui route `@scrap-node` vers
  `npm.pkg.github.com`, puis réinstalle.

## [0.3.0] — 2026-10-18

### Ajouté

- Composants pour les outils de création :
  - commandes : `button[scrap-icon-button]` (nom servant d'info-bulle et
    d'`aria-label`, raccourci annoncé par `aria-keyshortcuts`, état
    `aria-pressed`), `[scrapTooltip]`, `scrap-toolbar` (un seul arrêt de
    tabulation, flèches, lettre d'un outil), `scrap-menu` avec
    `[scrapMenuTrigger]`, `scrap-menu-item` et `scrap-menu-separator`, posé dans
    la couche supérieure du navigateur (API Popover) ;
  - saisie : `scrap-select` et `scrap-option`, `scrap-segmented` et
    `button[scrap-segment]`, `scrap-number-field` (glisser l'étiquette, flèches,
    Entrée, Échap), `scrap-dropzone`, et les directives `scrapChoice`,
    `scrapCheckbox`, `scrapRadio` et `scrapSwitch`. Les contrôles implémentent
    `ControlValueAccessor` ;
  - affichage : `scrap-progress`, `scrap-callout`, `dl[scrap-props]` et
    `div[scrap-prop]`, `details[scrap-disclosure]`, `table[scrap-table]`,
    `kbd[scrap-kbd]` ;
  - navigation : `scrap-breadcrumbs`, `scrap-tree` (motif ARIA « tree »),
    `scrap-sheet` (panneau latéral non modal), `scrap-history` ;
  - applications : `scrap-shell` et ses régions (`scrapShellBrand`,
    `scrapShellHead`, `scrapShellNav`, `scrapShellMain`, `scrapShellAside`,
    `scrapShellStatus`), `scrap-statusbar` avec `scrapStatusItem` et
    `scrapStatusSpacer` ;
  - palette de commandes : le service `ScrapCommands` (registre des commandes,
    raccourcis valables dans toute la page) et `scrap-command-palette` (⌘K ou
    Ctrl+K, recherche approximative) ;
  - audio et montage : `scrap-transport`, `scrap-timecode`, `scrap-timeline`,
    `scrap-lane` et `scrap-marker`. `scrap-wave-bars` accepte `altered` : les
    plages détruites passent en cuivre.
- `scrap-button` : variante `danger`, tailles `s` et `l`, et `icon` pour un
  bouton à icône seule.
- `scrap-badge` : tonalité `accent` et pastille `dot`.
- `scrap-slider` : `showValue` et `unit` affichent l'étiquette et la valeur ;
  les nombres suivent l'usage français.
- `scrap-field` : `optional`, une mention discrète dans l'étiquette.
- `ScrapToast.show()` accepte `{ duration, action }` : un toast peut proposer
  « Annuler », et reste alors six secondes. `act(id)` lance son action.
- `ScrapTheme` : la préférence `system`, suivie en direct, et `preference()`.
- Jetons : rôles de surface, d'encre et de filet, couleurs de données
  (`--scrap-data-*`) et de code (`--scrap-code-*`), rayons, hauteurs de
  contrôle, échelle typographique. Chaque couleur porte ses valeurs claire et
  sombre (`light-dark()`), et `data-scrap-theme` force le thème de n'importe
  quelle zone.
- Feuille CSS compilée pour les projets sans Angular : `css/scrap-ui.css` et
  `css/scrap-ui-affiche.css`, déclarées dans le champ `exports`.
- Icônes : 97 tracés au trait, les douze noms existants compris.
- `formatShortcut`, `ariaShortcut` et `matchesShortcut` pour écrire, annoncer et
  reconnaître un raccourci (`mod+enter` : ⌘↵ sur Mac, Ctrl+Entrée ailleurs).
- Vitrine : un bouton « Rejouer » relance les animations d'entrée. Une animation
  CSS ne se déclenche qu'à l'insertion de l'élément, il fallait donc recharger
  la page pour revoir `.scrap-stamp-in`.
- Vitrine : une page par famille de composants, et une palette de commandes.

### Modifié

- **Rupture** — le paquet devient `@scrap-node/scrap-ui`, publié par
  l'organisation qui possède le dépôt. Dans un projet : remplacer la
  dépendance et les imports, et router le scope `@scrap-node` dans `.npmrc`.
  `ng add @scrap-node/scrap-ui` reprend l'ancien import de styles. Les
  versions jusqu'à 0.2.0 restent disponibles sous `@comechaslerie/scrap-ui`.
- **Rupture** — rendu : surfaces claires et filets fins, boutons en pilule,
  titres en casse de phrase, accent cuivre réservé à l'action principale. Le
  grain, les tampons, les bords déchirés et les animations d'entrée quittent
  les composants.
- **Rupture** — les composants n'embarquent plus de styles : tout passe par les
  classes `.scrap-*` de la feuille globale. Les surcharges qui visaient leurs
  classes internes sont à reprendre : `.plate` devient `.scrap-dialog__panel`,
  `.card-head` `.scrap-card__head`, `.toast` `.scrap-toast`, `.burger`
  `.scrap-header__burger`, `nav.open` `nav.is-open`, et les tonalités de badge
  `.success` deviennent `.scrap-badge--success`.
- **Rupture** — module Affiche : `.scrap-grain`, `.scrap-torn-bottom`,
  `.scrap-stamp`, `.scrap-rule`, `.scrap-hero-title`, les curseurs décoratifs
  (sauf `.scrap-cursor-cross`), les animations `.scrap-stamp-in`,
  `.scrap-reveal` et `.scrap-jitter`, et l'affichage de `<scrap-splat>`
  demandent désormais `@use '@scrap-node/scrap-ui/styles/affiche'`.
- **Rupture** — la feuille est rangée en couches (`@layer scrap.tokens`,
  `scrap.base`, `scrap.components`, `scrap.affiche`) : le CSS d'un projet, hors
  couche, l'emporte toujours, sans `!important`.
- **Rupture** — `<scrap-icon>` dessine au trait sur une grille de 20
  (`stroke="currentColor"`, `fill="none"`) : sa couleur se règle par `color`.
- `scrap-vu-meter` compte 24 segments par défaut, au lieu de 14.
- `scrap-spinner` devient un anneau, et dit « Chargement » aux lecteurs d'écran
  quand il n'a pas d'étiquette.
- `scrap-error-page` perd son éclaboussure et son animation d'entrée.
- `scrap-header` : `ScrapNavLink.current` marque la page courante ; les liens
  passent derrière le bouton de menu quand l'en-tête descend sous 560 px de
  large, et non plus selon la largeur de l'écran.
- Les anciens jetons (`--scrap-bg-alt`, `--scrap-border`, `--scrap-shadow`,
  `--scrap-fs-small`…) restent comme alias des nouveaux rôles, jusqu'à la
  prochaine version majeure.
- `npm run build` construit aussi la feuille CSS ; la publication passe par lui.
- Licence : le code passe de MIT à Apache 2.0, avec un fichier `NOTICE`. Le nom
  « Scrap » et les logos restent réservés. Les versions jusqu'à 0.2.0 incluse
  restent sous MIT.

## [0.2.0] — 2026-08-27

### Ajouté

- `ScrapTheme` : service de thème partagé, sûr en SSR, injectable partout.
  `<scrap-theme-toggle>` s'appuie dessus — plusieurs bascules dans une page
  restent désormais synchronisées.
- `ScrapInput` : directive `scrapInput` à poser sur le contrôle projeté dans un
  `<scrap-field>`. Elle relie l'étiquette, l'indice et l'erreur au contrôle.
- `scrap-field` accepte une entrée `error` : message annoncé (`role="alert"`) et
  contrôle marqué `aria-invalid`.
- `scrap-slider` implémente `ControlValueAccessor` : `formControlName` et
  `[(ngModel)]` fonctionnent, `FormControl.disable()` compris.
- `scrap-wave-bars` est déplaçable au clavier (flèches, Origine, Fin) et expose
  `role="slider"`.
- Navigation clavier conforme au pattern ARIA sur `scrap-tabs` : flèches,
  Origine, Fin, `tabindex` mobile, liaison `aria-controls` / `aria-labelledby`.
- `SCRAP_ICON_NAMES` et `SCRAP_SPLAT_NAMES` : les listes de noms disponibles.
- `scrap-header` accepte `homeHref` pour les applications qui ne sont pas
  servies à la racine.
- `ScrapToast` : `clear()`, `pause()`, `resume()`, et `show()` renvoie
  l'identifiant du toast créé.
- `ScrapScrollLock` : verrou de défilement de page à compteur, utilisé par la
  modale et réutilisable par tout composant en surimpression.
- Tests de rendu serveur : `PLATFORM_ID` forcé à `'server'` vérifie que
  `ScrapTheme`, `ScrapScrollLock` et `ScrapModal` ne touchent ni au document ni
  aux API du navigateur. La sûreté SSR cesse d'être une intention pour devenir
  une propriété testée.
- Sous-chemins `./styles/*` et `./assets/*` déclarés dans le champ `exports`
  du paquet.
- Licence MIT (le nom « Scrap » et les logos restent réservés).

### Modifié

- **Rupture** — le contrôle d'un `<scrap-field>` porte désormais la directive
  `scrapInput` au lieu de la classe `class="scrap-input"`. La classe continue de
  styler, mais sans la directive l'étiquette n'est reliée à rien.
- **Rupture** — `name` de `<scrap-icon>` et `<scrap-splat>` est typé sur les noms
  réellement disponibles. Un nom inconnu ne compile plus.
- **Rupture** — `ScrapToast.items` est en lecture seule. Passer par `show`,
  `close` ou `clear`.
- `<scrap-modal>` repose sur le `<dialog>` natif : piège de focus, restauration
  du focus, fermeture par Échap et arrière-plan inerte sont fournis par le
  navigateur. Le défilement de la page est bloqué à l'ouverture.
- Tous les composants passent en `ChangeDetectionStrategy.OnPush`.
- `<scrap-icon>` et `<scrap-splat>` n'utilisent plus `DomSanitizer` ni
  `innerHTML` : les tracés sont liés en `[attr.d]`.
- Les toasts sont plafonnés à quatre, se mettent en pause au survol et au focus,
  et portent un bouton de fermeture atteignable au clavier. Les messages
  `danger` sont annoncés en `assertive`, les autres en `polite`.
- `@angular/forms` devient une dépendance de pair.

### Corrigé

- `<scrap-theme-toggle>` ne lisait `matchMedia` et `localStorage` qu'au moment de
  la construction : le composant plantait en SSR, au prerender et sous test.
- L'étiquette d'un `<scrap-field>` avait un `for` qui ne désignait aucun élément.
- Les identifiants ARIA proviennent d'un générateur porté par l'injecteur racine
  plutôt que d'un compteur de module : plus de divergence serveur/client à
  l'hydratation.
- Les minuteries de toast n'étaient jamais annulées, ni à la fermeture manuelle
  ni à la destruction de l'application.
- `<scrap-wave-live>` laissait tourner sa boucle `requestAnimationFrame` onglet
  en arrière-plan et n'en annulait qu'une seule au changement d'entrée.
- `scrap-button` et `scrap-badge` écrasaient les classes posées par le
  consommateur via un binding `[class]` global.
- Les animations et rotations propres aux composants respectent
  `prefers-reduced-motion`.
- Les panneaux d'onglets inactifs restaient exposés comme `tabpanel` aux
  lecteurs d'écran : le `:host { display: block }` du composant écrasait la
  règle `[hidden]` du navigateur. Trois panneaux étaient annoncés, dont deux
  vides.
- Un second appel à `ScrapToast.pause()` — survol puis clic sur un toast —
  recalculait le temps restant à partir d'une échéance déjà dépassée, le
  ramenait à zéro, et le toast s'évaporait dès la reprise. Un toast apparu
  pendant une pause voyait aussi sa minuterie courir sous le pointeur.
- Une modale détruite alors qu'elle était ouverte laissait la page verrouillée
  en `overflow: hidden` définitivement. Deux modales superposées se rendaient le
  défilement l'une pour l'autre, et la valeur `overflow` de l'application hôte
  était écrasée plutôt que restaurée.

## [0.1.0] — 2026-08-22

### Ajouté

- Première version : tokens, thèmes clair et sombre, composants
  (bouton, carte, badge, champ, onglets, modale, toasts, curseur, spinner,
  état vide, page d'erreur, header, footer, icônes, éclaboussures,
  visualisation audio), utilitaires CSS et schematic `ng-add`.
