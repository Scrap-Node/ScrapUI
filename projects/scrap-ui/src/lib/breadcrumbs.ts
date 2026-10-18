import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ScrapIcon } from './icon';

export interface ScrapCrumb {
  readonly label: string;
  /** Absent pour un niveau qui n'a pas de page à lui. */
  readonly href?: string;
}

/**
 * Fil d'Ariane : où l'on est, et le chemin pour remonter.
 *
 * ```html
 * <scrap-breadcrumbs [items]="[
 *   { label: 'Atelier', href: '/' },
 *   { label: 'Sessions', href: '/sessions' },
 *   { label: 'moteur.wav' },
 * ]" />
 * ```
 *
 * Le dernier niveau est la page courante : il n'est pas un lien.
 */
@Component({
  selector: 'scrap-breadcrumbs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScrapIcon],
  template: `
    <nav [attr.aria-label]="label()">
      <ol class="scrap-crumbs">
        @for (item of items(); track $index; let last = $last) {
          <li>
            @if (last) {
              <span aria-current="page">{{ item.label }}</span>
            } @else {
              @if (item.href) {
                <a [href]="item.href">{{ item.label }}</a>
              } @else {
                <span>{{ item.label }}</span>
              }
              <scrap-icon name="chevron-right" [size]="12" />
            }
          </li>
        }
      </ol>
    </nav>
  `,
})
export class ScrapBreadcrumbs {
  readonly items = input.required<readonly ScrapCrumb[]>();
  readonly label = input("Fil d'Ariane");
}
