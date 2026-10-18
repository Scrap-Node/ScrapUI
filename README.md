# Scrap UI

Direction artistique commune à tous les projets, dérivée de la charte graphique
Scrap Node (03/03/26). Librairie Angular : tokens, composants, layouts.

**Règle d'or : la palette et les typos sont fixes. Seul le logo change d'un projet à l'autre.**

## Direction artistique

| Élément     | Valeur                                                                                               |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Palette     | `#000000` noir · `#322216` brun foncé · `#956140` cuivre · `#718993` bleu-gris · `#FFFFFF` blanc     |
| Titres      | Helvetica 900, capitales, léger désaxage « tampon »                                                  |
| Corps       | Arial                                                                                                |
| Style       | Grunge/récup : grain, bords déchirés, ombres dures, tampons, éclaboussures                           |
| Sémantiques | erreur `rouille #8a3324` · succès `mousse #5f7a3f` · avertissement `ocre #b3822f` · info `bleu-gris` |
| Thèmes      | Clair et sombre (auto via OS, ou forcé par `data-scrap-theme` sur `<html>`)                          |

## Vitrine

La démo est une vitrine routée, une page par composant. Elle sert aussi de
référence aux tests de régression visuelle.

```bash
npm start   # construit la lib puis sert la vitrine sur http://localhost:4200
```

## Utilisation dans un projet

La lib est publiée sur **GitHub Packages** sous `@comechaslerie/scrap-ui`. GitHub
Packages exige un token **même en lecture** : le projet consommateur a donc besoin d'un
`.npmrc` routant le scope, et d'un PAT classique avec la portée `read:packages`.

`.npmrc` du projet consommateur (versionné, sans le token) :

```ini
@comechaslerie:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_TOKEN}
```

Puis, avec `GITHUB_PACKAGES_TOKEN` dans l'environnement (shell, CI, `--build-arg` Docker) :

```bash
npm install @comechaslerie/scrap-ui
ng add @comechaslerie/scrap-ui    # branche le thème dans la feuille de styles du projet
```

`ng add` lit `angular.json` pour trouver la bonne feuille de styles ; dans un
workspace multi-projets, préciser la cible : `ng add @comechaslerie/scrap-ui --project mon-app`.

À défaut, dans `styles.scss` :

```scss
@use '@comechaslerie/scrap-ui/styles/index';
```

### Composants

```ts
import {
  ScrapBadge,
  ScrapButton,
  ScrapCard,
  ScrapEmptyState,
  ScrapErrorPage,
  ScrapField,
  ScrapFooter,
  ScrapHeader,
  ScrapIcon,
  ScrapInput,
  ScrapModal,
  ScrapSlider,
  ScrapSpinner,
  ScrapSplat,
  ScrapTab,
  ScrapTabs,
  ScrapTheme,
  ScrapThemeToggle,
  ScrapToast,
  ScrapToasts,
} from '@comechaslerie/scrap-ui';
```

```html
<scrap-header appName="Mon Projet" [links]="links">
  <img logo src="assets/logo-du-projet.svg" alt="" />
  <!-- slot logo : propre à chaque projet -->
  <scrap-theme-toggle actions />
</scrap-header>

<button scrap-button>Primaire</button>
<button scrap-button variant="secondary">Secondaire</button>
<button scrap-button variant="ghost">Fantôme</button>

<scrap-card title="Titre">contenu…</scrap-card>

<!-- La directive scrapInput relie l'étiquette, l'indice et l'erreur au contrôle -->
<scrap-field label="Email" hint="optionnel" [error]="messageErreur()">
  <input scrapInput type="email" />
</scrap-field>

<scrap-footer appName="Mon Projet">…</scrap-footer>

<!-- Badges sémantiques -->
<scrap-badge tone="success">OK</scrap-badge>

<!-- Onglets : flèches, Origine et Fin naviguent au clavier -->
<scrap-tabs label="Fiche pièce">
  <scrap-tab label="Détails">…</scrap-tab>
  <scrap-tab label="Notes">…</scrap-tab>
</scrap-tabs>

<!-- Modale : <dialog> natif, donc piège de focus et Échap fournis par le navigateur -->
<scrap-modal [(open)]="showModal" title="Confirmer">
  contenu…
  <div actions><button scrap-button>OK</button></div>
</scrap-modal>

<!-- Toasts : poser <scrap-toasts /> dans le layout racine, puis
     inject(ScrapToast).show('Enregistré', 'success') -->
<scrap-toasts />

<!-- Loader, état vide, page d'erreur, décor -->
<scrap-spinner label="Chargement…" />
<scrap-empty-state message="Aucun résultat"><button scrap-button>Créer</button></scrap-empty-state>
<scrap-error-page code="404"><a scrap-button href="/">Retour</a></scrap-error-page>
<scrap-splat name="burst" [size]="200" style="color: var(--scrap-copper)" />

<!-- Curseur : two-way binding, ou formControlName (ControlValueAccessor) -->
<scrap-slider [(value)]="volume" [step]="10" [ticks]="true" label="Volume">
  <scrap-icon icon name="volume" />
</scrap-slider>
<scrap-slider formControlName="seuil" label="Seuil d'alerte" />

<!-- Audio : forme d'onde (clic ou clavier), oscilloscope, VU-mètre (données 0..1) -->
<scrap-wave-bars [data]="peaks" [progress]="progress()" (seek)="onSeek($event)" />
<scrap-wave-line [data]="samples" />
<scrap-vu-meter [level]="0.7" />
<!-- Temps réel depuis Web Audio : mode "line" (oscilloscope) ou "bars" (spectre) -->
<scrap-wave-live [analyser]="analyserNode" mode="line" />
```

Les noms d'icônes et d'éclaboussures sont typés : `SCRAP_ICON_NAMES` et
`SCRAP_SPLAT_NAMES` exposent les listes disponibles, et un nom inconnu ne compile pas.

### Thème

`ScrapTheme` porte l'état, `providedIn: 'root'` : plusieurs `<scrap-theme-toggle>`
dans une page restent synchronisés, et rien n'est lu ni écrit côté serveur.

```ts
const theme = inject(ScrapTheme);
theme.theme(); // 'light' | 'dark'
theme.set('dark');
theme.toggle();
```

### Utilitaires CSS

Curseurs : `.scrap-cursor-cross`, `.scrap-cursor-wrench`, `.scrap-cursor-marker`,
`.scrap-cursor-spray`, `.scrap-cursor-gear`.

Classes globales : `.scrap-grain` (texture bruit), `.scrap-torn-bottom`
(bord déchiré), `.scrap-stamp` (badge tampon), `.scrap-rule` (séparateur pinceau),
`.scrap-hero-title`, `.scrap-input`, `.scrap-select`, `.scrap-checkbox`,
`.scrap-radio`, `.scrap-choice`, `.scrap-table`, et animations `.scrap-stamp-in`
(coup de tampon), `.scrap-reveal` (apparition au défilement), `.scrap-jitter`
(tremblement au survol). Toutes neutralisées sous `prefers-reduced-motion`.

Assets fournis (`node_modules/@comechaslerie/scrap-ui/assets/`) : `favicon.svg` et
`manifest.webmanifest` (template — remplacer le nom du projet).

## Développer

```bash
npm start            # vitrine sur http://localhost:4200 (construit la lib au passage)
npm run build        # construit la lib dans dist/scrap-ui
npm test             # tests unitaires (lib + démo + schematic)
npm run lint         # ESLint : TypeScript, gabarits, accessibilité
npm run format       # Prettier
npm run visual       # régression visuelle Playwright
npm run verify       # tout l'enchaînement, comme la CI
```

Le `paths` du `tsconfig.json` racine mappe `@comechaslerie/scrap-ui` → `dist/scrap-ui` :
la vitrine consomme la lib construite sans passer par npm. Pour un projet externe,
`npm link` ou une dépendance `file:` vers `dist/scrap-ui` reste valable (avec
`preserveSymlinks: true` et `prebundle.exclude` dans son `angular.json`).

### Ajouter un composant

1. Le composant dans `projects/scrap-ui/src/lib/`, en `OnPush`.
2. Son export dans `projects/scrap-ui/src/public-api.ts`.
3. Ses tests unitaires à côté, en `.spec.ts`.
4. Une story dans `projects/demo/src/app/stories/` et son entrée dans
   `projects/demo/src/app/stories.data.ts` — cette liste alimente à la fois la
   navigation, les routes et les captures de régression visuelle.
5. `npm run visual:update` pour enregistrer les nouvelles références.

### Régression visuelle

64 captures couvrent chaque story dans les deux thèmes, les états qu'on n'atteint
qu'en interagissant (modale ouverte, toasts empilés, focus clavier, survol) et le
rendu mobile.

`e2e/behaviour.spec.ts` complète le tableau avec 9 tests de comportement, sans
capture : ils vérifient ce que jsdom ne sait pas simuler — piège de focus du
`<dialog>` natif, restauration du focus à la fermeture, pause réelle des toasts
au survol, panneau d'onglets unique dans l'arbre d'accessibilité.

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
gh workflow run visual-baselines.yml
gh run watch
gh run download -n visual-baselines-linux -D e2e/__screenshots__
git add e2e/__screenshots__/linux && git commit -m "références visuelles Linux"
```

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
lib et la publie sur GitHub Packages avec le `GITHUB_TOKEN` du runner — aucun PAT
à stocker pour publier.

```bash
# 1. bumper la version de la lib (c'est elle qui compte, pas celle de la racine)
npm version --no-git-tag-version 0.2.0 --prefix projects/scrap-ui
# 2. renseigner CHANGELOG.md
git commit -am "scrap-ui 0.2.0"
# 3. taguer : le workflow refuse un tag qui ne correspond pas à projects/scrap-ui/package.json
git tag v0.2.0 && git push origin main --tags
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
