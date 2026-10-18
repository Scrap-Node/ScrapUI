# Journal des modifications

Toutes les évolutions notables de `@comechaslerie/scrap-ui`.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le
versionnage respecte [SemVer](https://semver.org/lang/fr/). Pour une librairie
de composants, « rupture » couvre aussi le rendu : un changement de token ou de
structure DOM qui casse les surcharges d'un projet consommateur est majeur, même
si l'API TypeScript ne bouge pas.

## [Non publié]

### Ajouté

- Vitrine : un bouton « Rejouer » relance les animations d'entrée. Une animation
  CSS ne se déclenche qu'à l'insertion de l'élément, il fallait donc recharger
  la page pour revoir `.scrap-stamp-in` ou l'arrivée du code d'une page
  d'erreur.

### Modifié

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
