import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  inject,
  input,
} from '@angular/core';

export type ScrapOrientation = 'horizontal' | 'vertical';

/** Éléments de la barre qui prennent le focus. */
const ITEM = 'button, a[href], input, select, [tabindex]';

/**
 * Barre d'outils : des boutons icônes groupés, un seul arrêt de tabulation.
 *
 * ```html
 * <scrap-toolbar label="Outils" orientation="vertical" panel>
 *   <button scrap-icon-button label="Zone" shortcut="T" [pressed]="outil() === 'zone'"
 *           (click)="outil.set('zone')">
 *     <scrap-icon name="zone" />
 *   </button>
 *   <scrap-toolbar-separator />
 *   …
 * </scrap-toolbar>
 * ```
 *
 * Tab entre dans la barre sur l'outil actif ; les flèches passent d'un
 * outil à l'autre, Origine et Fin vont aux extrémités. Quand le focus est
 * dans la barre, la lettre d'un outil (son `shortcut`) le déclenche.
 */
@Component({
  selector: 'scrap-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    class: 'scrap-toolbar',
    role: 'toolbar',
    '[class.scrap-toolbar--vertical]': 'orientation() === "vertical"',
    '[class.scrap-toolbar--panel]': 'panel()',
    '[attr.aria-orientation]': 'orientation()',
    '[attr.aria-label]': 'label()',
    '(keydown)': 'onKeydown($event)',
    '(focusin)': 'onFocusIn($event)',
  },
})
export class ScrapToolbar {
  readonly label = input.required<string>();
  readonly orientation = input<ScrapOrientation>('horizontal');
  /** Pose la barre sur un panneau bordé, pour la faire flotter sur un canevas. */
  readonly panel = input(false, { transform: booleanAttribute });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      this.refresh();
      // Des outils apparaissent ou disparaissent (un `@if`) : la barre doit
      // toujours garder exactement un arrêt de tabulation.
      const observer = new MutationObserver(() => this.refresh());
      observer.observe(this.host, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['aria-pressed', 'disabled'],
      });
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  /** Outils atteignables, dans l'ordre du document. */
  private items(): HTMLElement[] {
    return [...this.host.querySelectorAll<HTMLElement>(ITEM)].filter(
      (el) =>
        !el.hasAttribute('disabled') &&
        !el.closest('[popover], [role="radiogroup"], [role="menu"], [role="listbox"]'),
    );
  }

  /** Remet un seul arrêt de tabulation : l'outil actif, sinon le premier. */
  private refresh(current?: HTMLElement): void {
    const items = this.items();
    if (!items.length) return;
    const active = this.host.ownerDocument.activeElement as HTMLElement | null;
    const target =
      (current && items.includes(current) && current) ||
      items.find((el) => el === active) ||
      items.find((el) => el.getAttribute('aria-pressed') === 'true') ||
      items.find((el) => el.tabIndex === 0) ||
      items[0];
    for (const el of items) {
      const next = el === target ? '0' : '-1';
      if (el.getAttribute('tabindex') !== next) el.setAttribute('tabindex', next);
    }
  }

  protected onFocusIn(event: FocusEvent): void {
    const item = (event.target as HTMLElement).closest?.(ITEM) as HTMLElement | null;
    if (item && this.items().includes(item)) this.refresh(item);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const items = this.items();
    const current = items.indexOf(event.target as HTMLElement);
    if (current < 0) return;

    const vertical = this.orientation() === 'vertical';
    const prevKey = vertical ? 'ArrowUp' : 'ArrowLeft';
    const nextKey = vertical ? 'ArrowDown' : 'ArrowRight';
    let next = -1;
    if (event.key === nextKey) next = (current + 1) % items.length;
    else if (event.key === prevKey) next = (current - 1 + items.length) % items.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    else if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
      // La lettre d'un outil le déclenche, comme dans les logiciels de création.
      const key = event.key.toLowerCase();
      const match = items.find((el) => el.getAttribute('aria-keyshortcuts')?.toLowerCase() === key);
      if (!match) return;
      event.preventDefault();
      match.focus();
      match.click();
      return;
    }
    if (next < 0) return;
    event.preventDefault();
    this.refresh(items[next]);
    items[next].focus();
  }
}

/** Séparateur entre deux groupes d'outils. */
@Component({
  selector: 'scrap-toolbar-separator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  host: {
    class: 'scrap-toolbar__sep',
    role: 'separator',
    '[attr.aria-orientation]': 'orientation()',
  },
})
export class ScrapToolbarSeparator {
  private readonly toolbar = inject(ScrapToolbar, { optional: true });
  /** Un séparateur est perpendiculaire à la barre qui le contient. */
  protected orientation(): ScrapOrientation {
    return this.toolbar?.orientation() === 'vertical' ? 'horizontal' : 'vertical';
  }
}

/** Pousse les outils suivants au bout de la barre. */
@Component({
  selector: 'scrap-toolbar-spacer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  host: { class: 'scrap-toolbar__spacer', 'aria-hidden': 'true' },
})
export class ScrapToolbarSpacer {}
