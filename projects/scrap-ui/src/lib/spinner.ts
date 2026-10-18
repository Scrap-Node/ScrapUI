import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Une attente courte dont on ne connaît pas la fin : un anneau dont le
 * quart cuivre tourne.
 *
 * Sous mouvements réduits, il ralentit sans s'arrêter : l'attente reste
 * visible.
 */
@Component({
  selector: 'scrap-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (label()) {
      <span>{{ label() }}</span>
    } @else {
      <span class="scrap-sr-only">Chargement</span>
    }
  `,
  host: {
    class: 'scrap-spinner',
    role: 'status',
    '[style.--spinner-size.px]': 'size()',
    '[style.--spinner-w.px]': 'size() < 18 ? 2 : 3',
  },
})
export class ScrapSpinner {
  /** Diamètre de l'anneau, en pixels. */
  readonly size = input(20);
  readonly label = input<string>();
}
