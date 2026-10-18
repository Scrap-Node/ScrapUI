# Scrap UI

Bibliothèque d'interface des projets Scrap Node, dérivée de la charte graphique
du 03/03/26 : des jetons CSS, des composants Angular, et une feuille CSS pour
les projets qui n'utilisent pas Angular.

**Règle d'or : la palette et les typos sont fixes. Seul le logo change d'un projet à l'autre.**

## Direction artistique

| Élément     | Valeur                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| Palette     | `#000000` noir, `#322216` brun écorce, `#956140` cuivre, `#718993` bleu-gris, `#FFFFFF` blanc          |
| Titres      | Helvetica, gras, en casse de phrase                                                                    |
| Corps       | Arial, 14 px dans les interfaces                                                                       |
| Style       | Sobre et dense, fait pour des outils : filets fins, surfaces claires, une seule couleur d'accent       |
| Sémantiques | erreur `rouille #8a3324`, succès `mousse #5f7a3f`, avertissement `ocre #b3822f`, information bleu-gris |
| Données     | gris l'original, cuivre ce qui est altéré, encre la tête de lecture, bleu-gris la boucle               |
| Thèmes      | clair et sombre ; suit le système, ou forcé par `data-scrap-theme` sur `<html>` ou sur une zone        |

Le grain, les bords déchirés, les tampons et les éclaboussures vivent dans le
**module Affiche**, facultatif : pour les affiches, les pages d'accueil et les
campagnes, pas pour les outils.

## Vitrine

La démo est une vitrine routée, une page par famille de composants. Elle sert
aussi de référence aux tests de régression visuelle. <kbd>⌘K</kbd> (ou
<kbd>Ctrl+K</kbd>) ouvre sa palette de commandes.

```bash
npm start   # construit la lib puis sert la vitrine sur http://localhost:4200
```

## Utilisation dans un projet

La lib est publiée sur **GitHub Packages** sous `@scrap-node/scrap-ui`
(`@comechaslerie/scrap-ui` jusqu'en 0.2.0). GitHub
Packages exige un token **même en lecture** : le projet consommateur a donc besoin d'un
`.npmrc` routant le scope, et d'un PAT classique avec la portée `read:packages`.

`.npmrc` du projet consommateur (versionné, sans le token) :

```ini
@scrap-node:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_TOKEN}
```

Puis, avec `GITHUB_PACKAGES_TOKEN` dans l'environnement (shell, CI, `--build-arg` Docker) :

```bash
npm install @scrap-node/scrap-ui
ng add @scrap-node/scrap-ui    # branche les styles dans la feuille du projet
```

`ng add` lit `angular.json` pour trouver la bonne feuille de styles ; dans un
workspace multi-projets, préciser la cible : `ng add @scrap-node/scrap-ui --project mon-app`.

À défaut, dans `styles.scss` :

```scss
@use '@scrap-node/scrap-ui/styles/index';
@use '@scrap-node/scrap-ui/styles/affiche'; // facultatif : le module Affiche
```

### Sans Angular

Une page HTML ou une application Blazor prend la feuille compilée, livrée dans
le paquet (`node_modules/@scrap-node/scrap-ui/css/`) :

```html
<link rel="stylesheet" href="css/scrap-ui.css" />
<!-- Facultatif : le module Affiche -->
<link rel="stylesheet" href="css/scrap-ui-affiche.css" />

<button class="scrap-btn scrap-btn--primary">Exporter</button>
<section data-scrap-theme="dark">…</section>
```

Les classes suivent la même nomenclature que les composants : `.scrap-btn`,
`.scrap-card__title`, `.scrap-menu__item--danger`…

### Composants

| Famille          | Composants et directives                                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Bases            | `scrap-icon`, `kbd[scrap-kbd]`, `ScrapTheme`, `scrap-theme-toggle`                                                           |
| Commandes        | `button[scrap-button]`, `button[scrap-icon-button]`, `[scrapTooltip]`, `scrap-toolbar`, `scrap-menu`, `[scrapMenuTrigger]`   |
| Saisie           | `scrap-field`, `[scrapInput]`, `scrap-select`, `scrap-segmented`, `scrap-number-field`, `scrap-slider`, `scrap-dropzone`     |
| Choix            | `label[scrapChoice]`, `input[scrapCheckbox]`, `input[scrapRadio]`, `input[scrapSwitch]`                                      |
| Affichage        | `scrap-badge`, `scrap-card`, `scrap-tabs`, `dl[scrap-props]`, `table[scrap-table]`, `details[scrap-disclosure]`              |
| États et retours | `scrap-spinner`, `scrap-progress`, `scrap-callout`, `ScrapToast`, `scrap-toasts`, `scrap-modal`, `scrap-empty-state`         |
| Navigation       | `scrap-breadcrumbs`, `scrap-tree`, `scrap-sheet`, `scrap-history`, `ScrapCommands`, `scrap-command-palette`                  |
| Applications     | `scrap-shell` et ses régions, `scrap-statusbar`, `scrap-header`, `scrap-footer`, `scrap-error-page`                          |
| Audio et montage | `scrap-wave-bars`, `scrap-wave-line`, `scrap-vu-meter`, `scrap-wave-live`, `scrap-transport`, `scrap-timeline`, `scrap-lane` |
| Affiche          | `scrap-splat`                                                                                                                |

Tous les composants sont autonomes, en `OnPush`, sûrs en SSR. Les contrôles de
saisie implémentent `ControlValueAccessor` : `formControlName` et `[(ngModel)]`
marchent directement.

```html
<!-- Un outil : barre d'outils, info-bulle et raccourci -->
<scrap-toolbar label="Outils" orientation="vertical" panel>
  <button
    scrap-icon-button
    label="Zone"
    shortcut="T"
    [pressed]="outil() === 'zone'"
    (click)="outil.set('zone')"
  >
    <scrap-icon name="zone" />
  </button>
</scrap-toolbar>

<!-- Un menu, dans la couche supérieure du navigateur (API Popover) -->
<button scrap-button variant="ghost" [scrapMenuTrigger]="fichier">Fichier</button>
<scrap-menu #fichier label="Fichier">
  <button scrap-menu-item (click)="ouvrir()">Ouvrir… <kbd scrap-kbd>⌘O</kbd></button>
  <scrap-menu-separator />
  <button scrap-menu-item tone="danger" (click)="fermer()">Fermer la session</button>
</scrap-menu>

<!-- Saisie -->
<scrap-field label="Nom de la session" hint="Visible dans l'historique." [error]="erreur()">
  <input scrapInput />
</scrap-field>
<scrap-select label="Opérateur" formControlName="operateur">
  @for (op of operateurs; track op.id) {
  <scrap-option [value]="op.id" [description]="op.aide">{{ op.nom }}</scrap-option>
  }
</scrap-select>
<scrap-segmented label="Piste écoutée" [(value)]="piste">
  <button scrap-segment value="a">A</button>
  <button scrap-segment value="b">B</button>
</scrap-segmented>
<scrap-number-field label="Densité" unit="%" [min]="0" [max]="100" [(value)]="densite" />

<!-- Montage audio -->
<scrap-transport [(playing)]="lecture" [(loop)]="boucle" [time]="position()" [duration]="6.4" />
<scrap-timeline [duration]="6.4" [(selection)]="zone" [(playhead)]="position">
  <scrap-lane label="A"><scrap-wave-bars [data]="original" /></scrap-lane>
  <scrap-lane label="B"><scrap-wave-bars [data]="detruit" [altered]="zones" /></scrap-lane>
</scrap-timeline>

<!-- Retours : poser <scrap-toasts /> et <scrap-command-palette /> une fois, dans le layout racine -->
<scrap-toasts />
<scrap-command-palette />
```

```ts
inject(ScrapToast).show('Passe 4 appliquée', 'success', {
  action: { label: 'Annuler', run: () => this.passes.undo() },
});

// Une commande : dans la palette (⌘K), et son raccourci marche dans toute la page
inject(ScrapCommands).register({
  id: 'detruire',
  label: 'Détruire la zone',
  group: 'Destruction',
  shortcut: 'mod+enter',
  run: () => this.destroy(),
});
```

Les raccourcis s'écrivent `mod+enter` : ⌘↵ sur Mac, Ctrl+Entrée ailleurs.
`formatShortcut()` les met en forme pour l'affichage.

Les noms d'icônes et d'éclaboussures sont typés : `SCRAP_ICON_NAMES` et
`SCRAP_SPLAT_NAMES` exposent les listes disponibles, et un nom inconnu ne compile pas.

### Thème

`ScrapTheme` porte l'état, `providedIn: 'root'` : plusieurs `<scrap-theme-toggle>`
dans une page restent synchronisés, et rien n'est lu ni écrit côté serveur. Par
défaut, le thème suit celui du système, en direct.

```ts
const theme = inject(ScrapTheme);
theme.theme(); // 'light' | 'dark' : le thème affiché
theme.preference(); // 'light' | 'dark' | 'system' : le choix retenu
theme.set('dark'); // mémorisé
theme.set('system'); // revient au réglage du système
theme.toggle();
```

`data-scrap-theme="dark"` (ou `light`) force aussi le thème d'une seule zone de
la page.

### Module Affiche

Avec `@use '@scrap-node/scrap-ui/styles/affiche'` (ou `css/scrap-ui-affiche.css`) :
`.scrap-poster`, `.scrap-grain` (texture), `.scrap-torn-bottom` (bord déchiré),
`.scrap-hero-title`, `.scrap-stamp` (tampon), `.scrap-rule` (trait de pinceau),
les curseurs `.scrap-cursor-wrench`, `.scrap-cursor-marker`, `.scrap-cursor-spray`
et `.scrap-cursor-gear`, le composant `<scrap-splat>`, et les animations
`.scrap-stamp-in`, `.scrap-reveal` et `.scrap-jitter`. Toutes neutralisées sous
`prefers-reduced-motion`.

Assets fournis (`node_modules/@scrap-node/scrap-ui/assets/`) : `favicon.svg` et
`manifest.webmanifest` (template, remplacer le nom du projet).

## Développer

```bash
npm start            # vitrine sur http://localhost:4200 (construit la lib au passage)
npm run build        # construit la lib dans dist/scrap-ui, et sa feuille CSS compilée
npm test             # tests unitaires (lib + démo + schematic)
npm run lint         # ESLint : TypeScript, gabarits, accessibilité
npm run format       # Prettier
npm run visual       # régression visuelle Playwright
npm run verify       # tout l'enchaînement, comme la CI
```

Le `paths` du `tsconfig.json` racine mappe `@scrap-node/scrap-ui` → `dist/scrap-ui` :
la vitrine consomme la lib construite sans passer par npm. Pour un projet externe,
`npm link` ou une dépendance `file:` vers `dist/scrap-ui` reste valable (avec
`preserveSymlinks: true` et `prebundle.exclude` dans son `angular.json`).

### Ajouter un composant

1. Le composant dans `projects/scrap-ui/src/lib/`, en `OnPush`, sans styles
   propres : ses classes `.scrap-*` vont dans un partiel de
   `projects/scrap-ui/src/styles/components/`, déclaré dans `_components.scss`.
   La feuille CSS compilée en hérite, et les projets sans Angular avec.
2. Son export dans `projects/scrap-ui/src/public-api.ts`.
3. Ses tests unitaires à côté, en `.spec.ts`.
4. Une story dans `projects/demo/src/app/stories/` et son entrée dans
   `projects/demo/src/app/stories.data.ts` — cette liste alimente à la fois la
   navigation, les routes et les captures de régression visuelle.
5. `npm run visual:update` pour enregistrer les nouvelles références.

### Régression visuelle

86 captures couvrent chaque story dans les deux thèmes, le rendu mobile, et les
états qu'on n'atteint qu'en interagissant : modale, menu et liste ouverts,
palette de commandes, info-bulle, toasts empilés, focus clavier, survol.

`e2e/behaviour.spec.ts` complète le tableau avec 23 tests de comportement, sans
capture : ils vérifient ce que jsdom ne sait pas simuler — piège de focus du
`<dialog>` natif, couche supérieure et fermeture au clic à côté de l'API
Popover, focus rendu à la fermeture, glissement à la souris dans le champ
numérique et la timeline, pause réelle des toasts au survol.

### Rendu serveur

`ssr.spec.ts` force `PLATFORM_ID` à `'server'` et vérifie qu'aucun composant ne
touche au document ni aux API du navigateur. C'est ce qui garantit que la lib
reste utilisable dans un projet consommateur en SSR ou au prerender — la vitrine
de ce dépôt, elle, est une application purement cliente.

Les références sont rangées **par plateforme** (`e2e/__screenshots__/darwin`,
`.../linux`) : le rendu du texte diffère entre macOS et le Linux de la CI, et un
dossier commun rendrait le test rouge sur l'une ou l'autre en permanence.

**À faire une fois avant le premier passage de la CI** — le job `visual` échoue
tant que les références Linux n'existent pas. Elles se génèrent dans GitHub
Actions, via le workflow `visual-baselines` :

```bash
gh workflow run visual-baselines.yml --ref ma-branche
gh run watch
gh run download -n visual-baselines-linux -D e2e/__screenshots__/linux
git add e2e/__screenshots__/linux && git commit -m "références visuelles Linux"
```

`--ref` désigne la branche à rendre. L'artefact contient les images à plat,
d'où la cible `linux/` du téléchargement.

Même séquence après tout changement de rendu volontaire : relancer le workflow,
récupérer l'artefact, **relire le diff des images** avant de commiter — c'est là
que se joue la revue, puisque `--update-snapshots` accepte tout par construction.

Le workflow tourne dans le conteneur exact du job `visual`. C'est la raison
d'être de ce détour : reproduire ce rendu depuis un poste macOS suppose un Docker
capable de tirer l'image, ce qui n'est pas acquis derrière un VPN d'entreprise.

Les références macOS (`e2e/__screenshots__/darwin/`) restent générées localement
par `npm run visual:update`, pour boucler vite pendant le développement.

## Publier une version

Le tag est le déclencheur : `.github/workflows/release.yml` vérifie, construit la
lib et sa feuille CSS, puis les publie sur GitHub Packages avec le `GITHUB_TOKEN`
du runner — aucun PAT à stocker pour publier.

```bash
# 1. bumper la version de la lib (c'est elle qui compte, pas celle de la racine)
npm version --no-git-tag-version 0.3.0 --prefix projects/scrap-ui
# 2. renseigner CHANGELOG.md
git commit -am "scrap-ui 0.3.0"
# 3. taguer : le workflow refuse un tag qui ne correspond pas à projects/scrap-ui/package.json
git tag v0.3.0 && git push origin main --tags
```

Pour un essai en local (`npm publish` depuis `dist/scrap-ui`), il faut un PAT avec
`write:packages` — le workflow évite ce détour.

## Licence

Le **code** est sous licence [Apache 2.0](LICENSE) : réutilisez, modifiez,
redistribuez, y compris à des fins commerciales, en conservant les mentions du
fichier [`NOTICE`](NOTICE). Les versions jusqu'à 0.2.0 incluse ont été publiées
sous MIT et le restent.

La licence porte sur le code. Elle ne cède **ni le nom « Scrap »**, ni les
logos, ni les autres signes distinctifs des projets qui s'appuient sur cette
charte. Un dérivé de la lib est bienvenu ; qu'il se présente sous son propre nom.
