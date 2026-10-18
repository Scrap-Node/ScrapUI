import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Page d'erreur prête à l'emploi (404, 500…), avec un chemin de retour.
 *
 * ```html
 * <scrap-error-page code="404" message="Cette pièce n'est pas dans la casse.">
 *   <a scrap-button href="/">Retour à l'atelier</a>
 * </scrap-error-page>
 * ```
 */
@Component({
  selector: 'scrap-error-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="scrap-error__code">{{ code() }}</p>
    <p class="scrap-error__msg">{{ message() }}</p>
    <div class="scrap-error__actions"><ng-content /></div>
  `,
  host: { class: 'scrap-error' },
})
export class ScrapErrorPage {
  readonly code = input('404');
  readonly message = input("Cette pièce n'est pas dans la casse.");
}
