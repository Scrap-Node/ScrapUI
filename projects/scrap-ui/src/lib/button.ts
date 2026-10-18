import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

export type ScrapButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ScrapButtonSize = 's' | 'm' | 'l';

/**
 * Bouton Scrap, en pilule.
 *
 * - `primary` (cuivre) : l'action principale, une seule par zone ;
 * - `secondary` : les autres actions, en contour ;
 * - `ghost` : dans les barres et les listes ;
 * - `danger` (rouille) : ce qui détruit sans retour.
 *
 * Trois tailles (24, 32 et 40 px) ; `icon` pour un bouton icône seule, qui
 * porte alors un `aria-label`.
 */
@Component({
  selector: 'button[scrap-button], a[scrap-button]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    // Classes posées une par une : un binding `[class]` global écraserait
    // les classes que le consommateur pose lui-même sur l'élément.
    class: 'scrap-btn',
    '[class.scrap-btn--primary]': 'variant() === "primary"',
    '[class.scrap-btn--secondary]': 'variant() === "secondary"',
    '[class.scrap-btn--ghost]': 'variant() === "ghost"',
    '[class.scrap-btn--danger]': 'variant() === "danger"',
    '[class.scrap-btn--s]': 'size() === "s"',
    '[class.scrap-btn--l]': 'size() === "l"',
    '[class.scrap-btn--icon]': 'icon()',
  },
})
export class ScrapButton {
  readonly variant = input<ScrapButtonVariant>('primary');
  readonly size = input<ScrapButtonSize>('m');
  /** Bouton carré, pour une icône seule. Penser à l'`aria-label`. */
  readonly icon = input(false, { transform: booleanAttribute });
}
