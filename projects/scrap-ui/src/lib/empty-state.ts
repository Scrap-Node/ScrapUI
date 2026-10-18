import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ScrapIcon, type ScrapIconName } from './icon';

/**
 * Un écran sans contenu, et l'action qui le remplit.
 *
 * ```html
 * <scrap-empty-state message="Ouvrez un fichier WAV pour commencer.">
 *   <button scrap-button>Ouvrir un fichier</button>
 * </scrap-empty-state>
 * ```
 */
@Component({
  selector: 'scrap-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScrapIcon],
  template: `
    <scrap-icon [name]="icon()" [size]="40" />
    <p class="scrap-empty__title">{{ title() }}</p>
    @if (message()) {
      <p class="scrap-empty__text">{{ message() }}</p>
    }
    <ng-content />
  `,
  host: { class: 'scrap-empty' },
})
export class ScrapEmptyState {
  readonly title = input('Rien dans la casse');
  readonly message = input<string>();
  readonly icon = input<ScrapIconName>('recycle');
}
