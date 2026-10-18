import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  inject,
  input,
  model,
} from '@angular/core';
import { ScrapIcon } from './icon';
import { ScrapIconButton } from './icon-button';
import { ScrapIdGenerator } from './id';

/**
 * Panneau latéral, non modal : le détail d'un élément à côté de la liste,
 * sans la cacher.
 *
 * ```html
 * <scrap-sheet [(open)]="detail" title="Passe 3">
 *   <dl scrap-props>…</dl>
 * </scrap-sheet>
 * ```
 *
 * Le focus n'est pas piégé : la liste reste utilisable à côté. Échap, ou
 * le bouton de fermeture, le referme et rend le focus à l'élément qui
 * l'avait avant. Largeur par `--sheet-w` (360 px par défaut).
 */
@Component({
  selector: 'scrap-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScrapIcon, ScrapIconButton],
  template: `
    <div class="scrap-sheet__bar">
      <h2 class="scrap-sheet__title" [id]="titleId">{{ title() }}</h2>
      <ng-content select="[actions]" />
      <button scrap-icon-button size="s" label="Fermer le panneau" (click)="close()">
        <scrap-icon name="close" />
      </button>
    </div>
    <div class="scrap-sheet__body"><ng-content /></div>
  `,
  host: {
    class: 'scrap-sheet',
    role: 'complementary',
    '[attr.aria-labelledby]': 'titleId',
    '[attr.hidden]': 'open() ? null : ""',
    '[class.is-entering]': 'open()',
    '(keydown.escape)': 'onEscape($event)',
    '(focusin)': 'onFocusIn($event)',
  },
})
export class ScrapSheet {
  readonly open = model(false);
  readonly title = input.required<string>();

  protected readonly titleId = inject(ScrapIdGenerator).next('scrap-sheet-title');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);
  /** Élément qui avait le focus avant d'entrer dans le panneau, pour le lui rendre. */
  private returnFocus: HTMLElement | null = null;

  close(): void {
    const hadFocus = this.host.contains(this.document.activeElement);
    this.open.set(false);
    // Le panneau disparaît : le focus qu'il contenait retourne d'où il venait.
    if (hadFocus && this.returnFocus?.isConnected) this.returnFocus.focus();
    this.returnFocus = null;
  }

  protected onFocusIn(event: FocusEvent): void {
    const from = event.relatedTarget as HTMLElement | null;
    if (from && !this.host.contains(from)) this.returnFocus = from;
  }

  protected onEscape(event: Event): void {
    event.stopPropagation();
    this.close();
  }
}
