import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { ScrapIcon } from './icon';
import { ScrapIdGenerator } from './id';

export interface ScrapNavLink {
  label: string;
  href: string;
  /** Page courante : le lien est mis en avant et annoncé comme tel. */
  current?: boolean;
}

/**
 * En-tête des applications en pages : le logo du projet, ses liens, ses
 * actions. Le logo est projeté (slot `[logo]`) — chaque projet fournit le sien.
 *
 * ```html
 * <scrap-header appName="Mon Projet" [links]="links">
 *   <img logo src="logo.svg" alt="" />
 *   <scrap-theme-toggle actions />
 * </scrap-header>
 * ```
 *
 * Quand l'en-tête descend sous 560 px de large, les liens passent derrière
 * un bouton de menu.
 */
@Component({
  selector: 'scrap-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScrapIcon],
  template: `
    <header class="scrap-header">
      <a class="scrap-header__brand" [href]="homeHref()">
        <ng-content select="[logo]" />
        <span>{{ appName() }}</span>
      </a>

      <nav
        class="scrap-header__nav"
        [id]="navId"
        [attr.aria-label]="appName()"
        [class.is-open]="menuOpen()"
      >
        @for (link of links(); track link.href) {
          <a
            [href]="link.href"
            [attr.aria-current]="link.current ? 'page' : null"
            (click)="menuOpen.set(false)"
            >{{ link.label }}</a
          >
        }
      </nav>

      <div class="scrap-header__actions">
        <ng-content select="[actions]" />
        @if (links().length) {
          <button
            class="scrap-icon-btn scrap-header__burger"
            type="button"
            (click)="menuOpen.set(!menuOpen())"
            [attr.aria-expanded]="menuOpen()"
            [attr.aria-controls]="navId"
            [attr.aria-label]="menuOpen() ? 'Fermer le menu' : 'Ouvrir le menu'"
          >
            <scrap-icon [name]="menuOpen() ? 'close' : 'menu'" />
          </button>
        }
      </div>
    </header>
  `,
  host: { class: 'scrap-header-wrap' },
})
export class ScrapHeader {
  readonly appName = input.required<string>();
  readonly links = input<ScrapNavLink[]>([]);
  /** Cible du bloc marque. Utile quand l'appli n'est pas servie à la racine. */
  readonly homeHref = input('/');

  protected readonly navId = inject(ScrapIdGenerator).next('scrap-nav');
  protected readonly menuOpen = signal(false);
}
