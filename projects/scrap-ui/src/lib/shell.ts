import { ChangeDetectionStrategy, Component, Directive, contentChild, input } from '@angular/core';

// ============================================================
// Coquille d'application et barre d'état
// ============================================================

/** Marque du produit, en haut à gauche : `<a scrapShellBrand href="/">DataBender</a>`. */
@Directive({ selector: '[scrapShellBrand]', host: { class: 'scrap-shell__brand' } })
export class ScrapShellBrand {}

/** Barre du haut : menus, recherche, actions globales. */
@Directive({ selector: '[scrapShellHead]', host: { class: 'scrap-shell__head' } })
export class ScrapShellHead {}

/** Colonne de gauche : navigation, fichiers, outils. */
@Directive({ selector: '[scrapShellNav]', host: { class: 'scrap-shell__nav' } })
export class ScrapShellNav {}

/** Zone de travail. */
@Directive({ selector: '[scrapShellMain]', host: { class: 'scrap-shell__main' } })
export class ScrapShellMain {}

/** Colonne de droite : propriétés, inspecteur. Facultative. */
@Directive({ selector: '[scrapShellAside]', host: { class: 'scrap-shell__aside' } })
export class ScrapShellAside {}

/** Barre d'état, tout en bas. */
@Directive({ selector: '[scrapShellStatus]', host: { class: 'scrap-shell__status' } })
export class ScrapShellStatus {}

/**
 * Coquille des applications outils : marque, barre du haut, navigation,
 * zone de travail, inspecteur et barre d'état.
 *
 * ```html
 * <scrap-shell>
 *   <a scrapShellBrand href="/">DataBender</a>
 *   <header scrapShellHead>…</header>
 *   <nav scrapShellNav>…</nav>
 *   <main scrapShellMain><router-outlet /></main>
 *   <aside scrapShellAside>…</aside>
 *   <scrap-statusbar scrapShellStatus>…</scrap-statusbar>
 * </scrap-shell>
 * ```
 *
 * Sans `scrapShellAside`, la zone de travail prend sa place. La coquille
 * prend la hauteur qu'on lui donne (`height: 100dvh` pour tout l'écran) ;
 * largeurs et hauteurs par `--shell-nav`, `--shell-aside`, `--shell-head`
 * et `--shell-status`.
 */
@Component({
  selector: 'scrap-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    class: 'scrap-shell',
    '[class.scrap-shell--no-aside]': '!aside()',
  },
})
export class ScrapShell {
  protected readonly aside = contentChild(ScrapShellAside);
}

/**
 * Barre d'état : l'état du document et de l'appli, en petit, tout en bas.
 *
 * ```html
 * <scrap-statusbar>
 *   <span scrapStatusItem><scrap-icon name="check-circle" [size]="12" /> Prêt</span>
 *   <button scrapStatusItem tone="warn">2 avertissements</button>
 *   <span scrapStatusSpacer></span>
 *   <span scrapStatusItem>48 kHz, 16 bits</span>
 * </scrap-statusbar>
 * ```
 *
 * Ce n'est pas une région « live » : un timecode qui défile n'a pas à être
 * lu en continu. Ce qui doit être annoncé passe par un toast.
 */
@Component({
  selector: 'scrap-statusbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    class: 'scrap-statusbar',
    role: 'region',
    '[attr.aria-label]': 'label()',
  },
})
export class ScrapStatusbar {
  readonly label = input("Barre d'état");
}

/** Un élément de la barre d'état ; sur un `<button>`, il devient cliquable. */
@Directive({
  selector: '[scrapStatusItem]',
  host: {
    class: 'scrap-statusbar__item',
    '[class.scrap-statusbar__item--warn]': 'tone() === "warn"',
    '[class.scrap-statusbar__item--err]': 'tone() === "err"',
  },
})
export class ScrapStatusItem {
  readonly tone = input<'default' | 'warn' | 'err'>('default');
}

/** Pousse les éléments suivants à droite de la barre d'état. */
@Directive({
  selector: '[scrapStatusSpacer]',
  host: { class: 'scrap-statusbar__spacer', 'aria-hidden': 'true' },
})
export class ScrapStatusSpacer {}
