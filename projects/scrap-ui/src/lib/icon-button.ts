import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  HostAttributeToken,
  computed,
  inject,
  input,
} from '@angular/core';
import { ScrapTooltip } from './tooltip';
import { ariaShortcut, isMacPlatform } from './kbd';

/**
 * Bouton d'action à icône seule, dans une barre d'outils ou un en-tête.
 * Son nom sert à la fois d'`aria-label` et d'info-bulle ; son raccourci
 * s'affiche dans l'info-bulle et s'annonce par `aria-keyshortcuts`.
 *
 * ```html
 * <button scrap-icon-button label="Zone" shortcut="T"
 *         [pressed]="outil() === 'zone'" (click)="outil.set('zone')">
 *   <scrap-icon name="zone" />
 * </button>
 * ```
 *
 * `pressed` en fait un bouton bascule (`aria-pressed`) : l'outil actif.
 */
@Component({
  selector: 'button[scrap-icon-button], a[scrap-icon-button]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  hostDirectives: [
    {
      directive: ScrapTooltip,
      inputs: ['scrapTooltip: label', 'scrapTooltipShortcut: shortcut'],
    },
  ],
  host: {
    class: 'scrap-icon-btn',
    '[class.scrap-icon-btn--s]': 'size() === "s"',
    '[attr.type]': 'type',
    '[attr.aria-label]': 'tooltip.text() || null',
    '[attr.aria-pressed]': 'pressed() === undefined ? null : pressed()',
    '[attr.aria-keyshortcuts]': 'keyshortcuts()',
  },
})
export class ScrapIconButton {
  /** État de la bascule. Absent = bouton d'action simple. */
  readonly pressed = input<boolean | undefined, unknown>(undefined, {
    transform: (v: unknown) =>
      v === undefined || v === null ? undefined : v !== false && v !== 'false',
  });
  readonly size = input<'s' | 'm'>('m');

  protected readonly tooltip = inject(ScrapTooltip, { self: true });

  private readonly isButton =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.tagName === 'BUTTON';
  /** Un `<button>` sans type validerait le formulaire qui le contient. */
  protected readonly type = this.isButton
    ? (inject(new HostAttributeToken('type'), { optional: true }) ?? 'button')
    : null;

  private readonly mac = isMacPlatform(inject(DOCUMENT).defaultView);
  protected readonly keyshortcuts = computed(() => {
    const shortcut = this.tooltip.shortcut();
    return shortcut ? ariaShortcut(shortcut, this.mac) : null;
  });
}
