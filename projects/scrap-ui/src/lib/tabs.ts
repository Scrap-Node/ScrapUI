import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  contentChildren,
  forwardRef,
  inject,
  input,
  signal,
  viewChildren,
} from '@angular/core';
import { ScrapIdGenerator } from './id';

/** Un onglet : `<scrap-tab label="Détails">contenu</scrap-tab>` */
@Component({
  selector: 'scrap-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (active()) {
      <ng-content />
    }
  `,
  host: {
    class: 'scrap-tabpanel',
    role: 'tabpanel',
    '[id]': 'panelId',
    '[attr.aria-labelledby]': 'tabId',
    // `.scrap-tabpanel[hidden]` est masqué par la feuille de la lib : un
    // panneau inactif n'est pas exposé comme tabpanel aux lecteurs d'écran.
    '[attr.hidden]': 'active() ? null : ""',
    '[attr.tabindex]': 'active() ? 0 : null',
  },
})
export class ScrapTab {
  readonly label = input.required<string>();

  private readonly ids = inject(ScrapIdGenerator);
  readonly panelId = this.ids.next('scrap-tabpanel');
  readonly tabId = `${this.panelId}-tab`;

  private readonly parent = inject(
    forwardRef(() => ScrapTabs),
    { optional: true },
  );

  /** Sans parent (onglet utilisé seul), le contenu reste visible. */
  readonly active = computed(() => {
    const parent = this.parent;
    if (!parent) return true;
    return parent.tabs().indexOf(this) === parent.selectedIndex();
  });
}

/**
 * Onglets : plusieurs vues d'un même objet, l'onglet actif souligné à
 * l'encre.
 *
 * ```html
 * <scrap-tabs label="Fiche de session">
 *   <scrap-tab label="Propriétés">…</scrap-tab>
 *   <scrap-tab label="Historique">…</scrap-tab>
 * </scrap-tabs>
 * ```
 *
 * Navigation clavier conforme au pattern ARIA « tabs » : flèches
 * gauche/droite, Origine/Fin, et `tabindex` mobile sur l'onglet actif.
 */
@Component({
  selector: 'scrap-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Le keydown est délégué : ce sont les boutons enfants qui portent le
         focus, la barre elle-même ne doit pas entrer dans l'ordre de tabulation. -->
    <!-- eslint-disable-next-line @angular-eslint/template/interactive-supports-focus -->
    <div
      role="tablist"
      class="scrap-tablist"
      [attr.aria-label]="label()"
      (keydown)="onKeydown($event)"
    >
      @for (tab of tabs(); track tab.panelId; let i = $index) {
        <button
          #tabButton
          class="scrap-tab"
          role="tab"
          type="button"
          [id]="tab.tabId"
          [attr.aria-selected]="i === selectedIndex()"
          [attr.aria-controls]="tab.panelId"
          [attr.tabindex]="i === selectedIndex() ? 0 : -1"
          (click)="select(i)"
        >
          {{ tab.label() }}
        </button>
      }
    </div>
    <ng-content />
  `,
  host: { class: 'scrap-tabs' },
})
export class ScrapTabs {
  /** Étiquette du groupe d'onglets, annoncée par les lecteurs d'écran. */
  readonly label = input<string>('Onglets');

  readonly tabs = contentChildren(ScrapTab);
  private readonly tabButtons = viewChildren<ElementRef<HTMLButtonElement>>('tabButton');

  private readonly requested = signal(0);

  /**
   * Index actif, borné à la liste réelle : plus besoin d'écrire dans un
   * signal depuis un `effect` pour activer le premier onglet.
   */
  readonly selectedIndex = computed(() => {
    const count = this.tabs().length;
    if (!count) return 0;
    return Math.max(0, Math.min(count - 1, this.requested()));
  });

  select(index: number): void {
    this.requested.set(index);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const count = this.tabs().length;
    if (!count) return;

    const current = this.selectedIndex();
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
        next = (current + 1) % count;
        break;
      case 'ArrowLeft':
        next = (current - 1 + count) % count;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = count - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    this.select(next);
    this.tabButtons()[next]?.nativeElement.focus();
  }
}
