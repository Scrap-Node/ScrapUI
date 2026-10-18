import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ScrapIcon } from './icon';
import { ScrapTheme } from './theme';

/**
 * Bascule clair/sombre. L'état vit dans le service {@link ScrapTheme} :
 * plusieurs bascules dans la même page restent synchronisées.
 */
@Component({
  selector: 'scrap-theme-toggle',
  imports: [ScrapIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      class="scrap-icon-btn"
      type="button"
      (click)="theme.toggle()"
      [attr.aria-label]="label()"
    >
      <scrap-icon [name]="theme.theme() === 'dark' ? 'sun' : 'moon'" />
    </button>
  `,
})
export class ScrapThemeToggle {
  protected readonly theme = inject(ScrapTheme);
  protected readonly label = computed(
    () => `Passer en mode ${this.theme.theme() === 'dark' ? 'clair' : 'sombre'}`,
  );
}
