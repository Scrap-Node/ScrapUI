import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ScrapIcon, type ScrapIconName } from './icon';

/** Une étape de l'historique. */
export interface ScrapHistoryItem {
  readonly label: string;
  /** Heure, durée, auteur : en petit, à droite. */
  readonly meta?: string;
  readonly icon?: ScrapIconName;
  /** `destroy` met l'icône en cuivre : une passe destructrice. */
  readonly kind?: string;
}

/**
 * Historique des actions, comme celui d'un logiciel de création : chaque
 * étape y ramène.
 *
 * ```html
 * <scrap-history label="Historique des passes" [items]="passes()" [current]="tete()"
 *                (jump)="allerA($event)" />
 * ```
 *
 * L'étape courante porte un trait cuivre ; les suivantes, annulées,
 * passent en italique jusqu'à la prochaine action. ↑ et ↓ parcourent les
 * étapes, Entrée y revient.
 */
@Component({
  selector: 'scrap-history',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScrapIcon],
  template: `
    <ol class="scrap-history" [attr.aria-label]="label()">
      @for (item of items(); track $index; let i = $index) {
        <li>
          <button
            type="button"
            class="scrap-history__item"
            [class.is-undone]="i > head()"
            [attr.aria-current]="i === head() ? 'step' : null"
            [attr.data-kind]="item.kind ?? null"
            [attr.tabindex]="i === focusIndex() ? 0 : -1"
            (click)="jump.emit(i)"
            (focus)="focused.set(i)"
            (keydown)="onKeydown($event, i)"
          >
            <scrap-icon [name]="item.icon ?? 'bolt'" [size]="16" />
            <span class="scrap-history__label">
              {{ item.label }}
              @if (i > head()) {
                <span class="scrap-sr-only">, annulée</span>
              }
            </span>
            @if (item.meta) {
              <span class="scrap-history__meta">{{ item.meta }}</span>
            }
          </button>
        </li>
      }
    </ol>
  `,
})
export class ScrapHistory {
  readonly label = input.required<string>();
  readonly items = input.required<readonly ScrapHistoryItem[]>();
  /** Index de l'étape courante. Absent = la dernière. */
  readonly current = input<number>();
  /** Index de l'étape choisie. */
  readonly jump = output<number>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly focused = signal<number | null>(null);

  protected readonly head = computed(() => {
    const last = this.items().length - 1;
    const current = this.current();
    return current === undefined ? last : Math.max(-1, Math.min(last, current));
  });

  /** Un seul arrêt de tabulation : la dernière étape visitée, sinon la courante. */
  protected readonly focusIndex = computed(() => {
    const focused = this.focused();
    const last = this.items().length - 1;
    if (focused !== null && focused <= last) return focused;
    return Math.max(0, this.head());
  });

  protected onKeydown(event: KeyboardEvent, index: number): void {
    const last = this.items().length - 1;
    let next: number;
    switch (event.key) {
      case 'ArrowDown':
        next = Math.min(last, index + 1);
        break;
      case 'ArrowUp':
        next = Math.max(0, index - 1);
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = last;
        break;
      default:
        return;
    }
    event.preventDefault();
    this.focused.set(next);
    this.host.querySelectorAll<HTMLElement>('.scrap-history__item')[next]?.focus();
  }
}
