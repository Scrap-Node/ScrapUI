import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

/** Tonalités sémantiques communes aux badges, toasts et encadrés. */
export type ScrapTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/** Le badge ajoute `accent` : ce qui a été détruit ou modifié. */
export type ScrapBadgeTone = ScrapTone | 'accent';

/**
 * Un état ou une catégorie, en un mot.
 *
 * `dot` pour un état qui évolue (en cours, à vérifier) : pastille colorée sur
 * un fond teinté plutôt qu'un aplat.
 */
@Component({
  selector: 'scrap-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    class: 'scrap-badge',
    '[class.scrap-badge--accent]': 'tone() === "accent"',
    '[class.scrap-badge--info]': 'tone() === "info"',
    '[class.scrap-badge--success]': 'tone() === "success"',
    '[class.scrap-badge--warning]': 'tone() === "warning"',
    '[class.scrap-badge--danger]': 'tone() === "danger"',
    '[class.scrap-badge--dot]': 'dot()',
  },
})
export class ScrapBadge {
  readonly tone = input<ScrapBadgeTone>('neutral');
  readonly dot = input(false, { transform: booleanAttribute });
}
