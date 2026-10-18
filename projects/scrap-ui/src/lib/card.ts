import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Carte : un objet qu'on ouvre ou qu'on choisit — un fichier, une session,
 * une pièce.
 *
 * ```html
 * <scrap-card title="moteur.wav">
 *   <button scrap-button variant="ghost" icon actions aria-label="Options">…</button>
 *   <img media src="apercu.png" alt="" />
 *   48 kHz, 16 bits, 6,4 s
 *   <div footer><button scrap-button size="s">Ouvrir</button></div>
 * </scrap-card>
 * ```
 *
 * Les emplacements laissés vides ne prennent pas de place.
 */
@Component({
  selector: 'scrap-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="scrap-card__media"><ng-content select="[media]" /></div>
    <div class="scrap-card__head">
      @if (title()) {
        <h3 class="scrap-card__title">{{ title() }}</h3>
      }
      <ng-content select="[actions]" />
    </div>
    <div class="scrap-card__body"><ng-content /></div>
    <div class="scrap-card__foot"><ng-content select="[footer]" /></div>
  `,
  host: { class: 'scrap-card' },
})
export class ScrapCard {
  readonly title = input<string>();
}
