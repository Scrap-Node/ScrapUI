import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ScrapIdGenerator } from './id';
import { Typeahead, hidePopover, placeBelow, showPopover } from './popover';

const ITEM = '[role^="menuitem"]:not(:disabled):not([aria-disabled="true"])';

/**
 * Menu d'actions, ouvert par un bouton.
 *
 * ```html
 * <button scrap-button variant="ghost" [scrapMenuTrigger]="fichier">Fichier</button>
 * <scrap-menu #fichier label="Fichier">
 *   <button scrap-menu-item (click)="ouvrir()">Ouvrir… <kbd scrap-kbd>⌘O</kbd></button>
 *   <scrap-menu-separator />
 *   <button scrap-menu-item tone="danger" (click)="fermer()">Fermer la session</button>
 * </scrap-menu>
 * ```
 *
 * Le menu vit dans la couche supérieure du navigateur (API Popover) : il
 * passe au-dessus de tout sans `z-index`, et se referme au clic à côté.
 * Flèches, Origine et Fin pour se déplacer, une lettre pour aller à
 * l'action qui commence par elle, Échap pour refermer.
 */
@Component({
  selector: 'scrap-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    class: 'scrap-menu',
    popover: 'auto',
    role: 'menu',
    '[id]': 'id',
    '[attr.aria-label]': 'label() ?? null',
    '(toggle)': 'onToggle($event)',
    '(keydown)': 'onKeydown($event)',
  },
})
export class ScrapMenu {
  readonly label = input<string>();

  readonly id = inject(ScrapIdGenerator).next('scrap-menu');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);
  private readonly typeahead = new Typeahead();

  private readonly state = signal(false);
  /** Vrai tant que le menu est ouvert. */
  readonly isOpen = this.state.asReadonly();

  private trigger: HTMLElement | null = null;
  private cleanups: (() => void)[] = [];

  constructor() {
    inject(DestroyRef).onDestroy(() => this.close(false));
  }

  /** Ouvre le menu sous `trigger` et donne le focus à sa première action (ou la dernière). */
  open(trigger: HTMLElement, focus: 'first' | 'last' = 'first'): void {
    this.trigger = trigger;
    if (!this.state()) {
      if (!showPopover(this.host)) return;
      this.state.set(true);
      this.listen();
    }
    placeBelow(trigger, this.host);
    const items = this.items();
    (focus === 'last' ? items.at(-1) : items[0])?.focus();
  }

  /** Referme le menu ; `restoreFocus` rend le focus au bouton qui l'a ouvert. */
  close(restoreFocus = true): void {
    const trigger = this.trigger;
    hidePopover(this.host);
    this.reset();
    if (restoreFocus) trigger?.focus();
  }

  toggle(trigger: HTMLElement): void {
    if (this.state()) this.close();
    else this.open(trigger);
  }

  /** Actions atteignables, dans l'ordre. */
  items(): HTMLElement[] {
    return [...this.host.querySelectorAll<HTMLElement>(ITEM)];
  }

  protected onToggle(event: Event): void {
    // Fermeture par le navigateur : clic à côté, autre menu ouvert.
    if ((event as ToggleEvent).newState === 'closed') this.reset();
  }

  protected onKeydown(event: KeyboardEvent): void {
    const items = this.items();
    const current = items.indexOf(this.document.activeElement as HTMLElement);
    let next = -1;
    switch (event.key) {
      case 'ArrowDown':
        next = (current + 1) % items.length;
        break;
      case 'ArrowUp':
        next = (current - 1 + items.length) % items.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = items.length - 1;
        break;
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        this.close();
        return;
      case 'Tab':
        // Le focus part ailleurs : le menu n'a plus de raison d'être ouvert.
        this.close(false);
        return;
      default:
        if (event.key.length === 1 && /\S/.test(event.key) && !event.metaKey && !event.ctrlKey) {
          next = this.typeahead.find(
            event.key,
            items.map((el) => el.textContent?.trim() ?? ''),
            current,
          );
        }
    }
    if (next < 0 || !items.length) return;
    event.preventDefault();
    items[next].focus();
  }

  private listen(): void {
    const view = this.document.defaultView;
    if (!view) return;
    const reposition = () => this.trigger && placeBelow(this.trigger, this.host);
    const onScroll = (e: Event) => {
      if (!this.host.contains(e.target as Node)) reposition();
    };
    view.addEventListener('resize', reposition);
    this.document.addEventListener('scroll', onScroll, true);
    this.cleanups.push(
      () => view.removeEventListener('resize', reposition),
      () => this.document.removeEventListener('scroll', onScroll, true),
    );
  }

  private reset(): void {
    this.state.set(false);
    for (const cleanup of this.cleanups.splice(0)) cleanup();
  }
}

/**
 * Relie un bouton au menu qu'il ouvre : clic, ou ↓ et ↑ au clavier.
 * `<button scrap-button [scrapMenuTrigger]="menu">Fichier</button>`
 */
@Directive({
  selector: '[scrapMenuTrigger]',
  host: {
    'aria-haspopup': 'menu',
    '[attr.aria-expanded]': 'menu().isOpen()',
    '[attr.aria-controls]': 'menu().id',
    '(pointerdown)': 'wasOpen = menu().isOpen()',
    '(click)': 'onClick($event)',
    '(keydown)': 'onKeydown($event)',
  },
})
export class ScrapMenuTrigger {
  readonly menu = input.required<ScrapMenu>({ alias: 'scrapMenuTrigger' });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  /**
   * Un clic sur le bouton d'un menu ouvert le referme d'abord (clic à côté
   * du menu), puis le rouvrirait aussitôt : on retient l'état d'avant le clic.
   */
  protected wasOpen = false;

  protected onClick(event: MouseEvent): void {
    const menu = this.menu();
    const wasOpen = this.wasOpen;
    this.wasOpen = false;
    // `detail` vaut 0 pour un clic venu du clavier : pas de pointeur en jeu.
    if (wasOpen && event.detail > 0) {
      if (menu.isOpen()) menu.close();
      return;
    }
    menu.toggle(this.host);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    this.menu().open(this.host, event.key === 'ArrowUp' ? 'last' : 'first');
  }
}

/**
 * Une action du menu. `tone="danger"` pour ce qui détruit ; `checked` en fait
 * une case à cocher (`menuitemcheckbox`).
 */
@Component({
  selector: 'button[scrap-menu-item]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    class: 'scrap-menu__item',
    type: 'button',
    tabindex: '-1',
    '[class.scrap-menu__item--danger]': 'tone() === "danger"',
    '[attr.role]': 'checked() === undefined ? "menuitem" : "menuitemcheckbox"',
    '[attr.aria-checked]': 'checked() === undefined ? null : checked()',
    '(click)': 'menu?.close()',
  },
})
export class ScrapMenuItem {
  readonly tone = input<'default' | 'danger'>('default');
  readonly checked = input<boolean | undefined, unknown>(undefined, {
    transform: (v: unknown) =>
      v === undefined || v === null ? undefined : v !== false && v !== 'false',
  });

  protected readonly menu = inject(ScrapMenu, { optional: true });
}

/** Trait entre deux groupes d'actions. */
@Component({
  selector: 'scrap-menu-separator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  host: { class: 'scrap-menu__sep', role: 'separator' },
})
export class ScrapMenuSeparator {}
