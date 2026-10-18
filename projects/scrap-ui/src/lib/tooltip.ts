import {
  DOCUMENT,
  DestroyRef,
  Directive,
  ElementRef,
  Injectable,
  effect,
  inject,
  input,
} from '@angular/core';
import { formatShortcut, isMacPlatform } from './kbd';
import { ScrapIdGenerator } from './id';

export type ScrapTooltipPlacement = 'auto' | 'top' | 'bottom' | 'left' | 'right';

/** Délai avant l'apparition au survol. */
const SHOW_DELAY = 450;
/** Une info-bulle refermée depuis moins longtemps que ça : la suivante apparaît tout de suite. */
const WARM_DELAY = 300;
/** Le temps de passer du déclencheur à l'info-bulle sans qu'elle disparaisse. */
const HIDE_GRACE = 120;
const GAP = 8;
const MARGIN = 8;

/** Une seule info-bulle à la fois dans la page. */
@Injectable({ providedIn: 'root' })
class ScrapTooltipLayer {
  current: ScrapTooltip | null = null;
  lastHiddenAt = 0;
}

/**
 * Info-bulle : le nom d'une commande, et son raccourci.
 *
 * ```html
 * <button scrap-button scrapTooltip="Détruire la zone" scrapTooltipShortcut="mod+enter">
 *   Détruire
 * </button>
 * ```
 *
 * Elle apparaît au survol après un court délai, et tout de suite au focus
 * clavier. Échap la referme ; le pointeur peut passer dessus sans qu'elle
 * disparaisse. Le raccourci s'écrit `mod+enter` : ⌘↵ sur Mac, Ctrl+Entrée
 * ailleurs.
 *
 * Quand l'élément porte déjà ce texte comme nom accessible (un bouton icône
 * dont l'`aria-label` vaut l'info-bulle), elle ne le décrit pas une seconde
 * fois.
 */
@Directive({
  selector: '[scrapTooltip]',
  host: {
    '(pointerenter)': 'onPointerEnter($event)',
    '(pointerleave)': 'scheduleHide()',
    '(pointerdown)': 'hide()',
    '(focus)': 'onFocus()',
    '(blur)': 'hide()',
  },
})
export class ScrapTooltip {
  readonly text = input<string | null | undefined>(undefined, { alias: 'scrapTooltip' });
  readonly shortcut = input<string | null | undefined>(undefined, {
    alias: 'scrapTooltipShortcut',
  });
  readonly placement = input<ScrapTooltipPlacement>('auto', { alias: 'scrapTooltipPlacement' });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);
  private readonly layer = inject(ScrapTooltipLayer);
  private readonly tipId = inject(ScrapIdGenerator).next('scrap-tooltip');

  private tip: HTMLElement | null = null;
  private showTimer: ReturnType<typeof setTimeout> | undefined;
  private hideTimer: ReturnType<typeof setTimeout> | undefined;
  private describedBy: string | null = null;
  private readonly cleanups: (() => void)[] = [];

  constructor() {
    inject(DestroyRef).onDestroy(() => this.hide());
    // Texte vidé ou modifié pendant l'affichage : on suit.
    effect(() => {
      const text = this.text();
      this.shortcut();
      if (!this.tip) return;
      if (text) this.render();
      else this.hide();
    });
  }

  /** Vrai tant que l'info-bulle est affichée. */
  get visible(): boolean {
    return this.tip !== null;
  }

  protected onPointerEnter(event: PointerEvent): void {
    if (event.pointerType === 'touch') return;
    clearTimeout(this.hideTimer);
    if (this.tip) return;
    const warm = Date.now() - this.layer.lastHiddenAt < WARM_DELAY;
    if (warm || this.layer.current) this.show();
    else this.showTimer = setTimeout(() => this.show(), SHOW_DELAY);
  }

  protected onFocus(): void {
    // Au clic, le focus arrive aussi : on ne montre l'info-bulle qu'au
    // focus clavier, là où personne ne survole l'élément.
    if (this.focusVisible()) this.show();
  }

  protected scheduleHide(): void {
    clearTimeout(this.showTimer);
    if (!this.tip) return;
    clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => this.hide(), HIDE_GRACE);
  }

  show(): void {
    clearTimeout(this.showTimer);
    clearTimeout(this.hideTimer);
    if (!this.text() || this.tip) return;
    if (this.layer.current && this.layer.current !== this) this.layer.current.hide();
    this.layer.current = this;

    const tip = this.document.createElement('div');
    tip.className = 'scrap-tooltip';
    tip.id = this.tipId;
    tip.setAttribute('role', 'tooltip');
    // Le pointeur peut passer sur l'info-bulle sans qu'elle disparaisse.
    tip.addEventListener('pointerenter', () => clearTimeout(this.hideTimer));
    tip.addEventListener('pointerleave', () => this.scheduleHide());
    this.tip = tip;
    this.render();
    this.document.body.appendChild(tip);
    this.position();
    this.describe();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') this.hide();
    };
    const onScroll = () => this.hide();
    this.document.addEventListener('keydown', onKey, true);
    this.document.addEventListener('scroll', onScroll, true);
    this.cleanups.push(
      () => this.document.removeEventListener('keydown', onKey, true),
      () => this.document.removeEventListener('scroll', onScroll, true),
    );
  }

  hide(): void {
    clearTimeout(this.showTimer);
    clearTimeout(this.hideTimer);
    if (!this.tip) return;
    this.tip.remove();
    this.tip = null;
    for (const cleanup of this.cleanups.splice(0)) cleanup();
    this.undescribe();
    if (this.layer.current === this) this.layer.current = null;
    this.layer.lastHiddenAt = Date.now();
  }

  private render(): void {
    const tip = this.tip;
    if (!tip) return;
    tip.replaceChildren();
    const label = this.document.createElement('span');
    label.textContent = this.text() ?? '';
    tip.appendChild(label);
    const shortcut = this.shortcut();
    if (shortcut) {
      const kbd = this.document.createElement('kbd');
      kbd.className = 'scrap-kbd';
      kbd.textContent = formatShortcut(shortcut, isMacPlatform(this.document.defaultView));
      tip.appendChild(kbd);
    }
  }

  private position(): void {
    const tip = this.tip;
    const view = this.document.defaultView;
    if (!tip || !view) return;
    const r = this.host.getBoundingClientRect();
    const t = tip.getBoundingClientRect();
    const vw = view.innerWidth;
    const vh = view.innerHeight;

    let placement = this.placement();
    if (placement === 'auto') {
      const vertical = this.host.closest('[role="toolbar"][aria-orientation="vertical"]');
      placement = vertical ? 'right' : 'top';
    }
    // Pas la place du côté demandé : on passe de l'autre côté.
    if (placement === 'top' && r.top - t.height - GAP < MARGIN) placement = 'bottom';
    else if (placement === 'bottom' && r.bottom + t.height + GAP > vh - MARGIN) placement = 'top';
    else if (placement === 'right' && r.right + t.width + GAP > vw - MARGIN) placement = 'left';
    else if (placement === 'left' && r.left - t.width - GAP < MARGIN) placement = 'right';

    let top: number;
    let left: number;
    if (placement === 'top' || placement === 'bottom') {
      top = placement === 'top' ? r.top - t.height - GAP : r.bottom + GAP;
      left = r.left + r.width / 2 - t.width / 2;
    } else {
      top = r.top + r.height / 2 - t.height / 2;
      left = placement === 'right' ? r.right + GAP : r.left - t.width - GAP;
    }
    const clamp = (v: number, max: number) => Math.max(MARGIN, Math.min(v, max - MARGIN));
    tip.style.top = `${clamp(top, vh - t.height)}px`;
    tip.style.left = `${clamp(left, vw - t.width)}px`;
  }

  /** Relie l'info-bulle à l'élément, sauf si elle répète son nom. */
  private describe(): void {
    const text = this.text()?.trim();
    if (!text || this.host.getAttribute('aria-label')?.trim() === text) return;
    this.describedBy = this.host.getAttribute('aria-describedby');
    const ids = [this.describedBy, this.tipId].filter(Boolean).join(' ');
    this.host.setAttribute('aria-describedby', ids);
  }

  private undescribe(): void {
    if (this.host.getAttribute('aria-describedby')?.includes(this.tipId)) {
      if (this.describedBy) this.host.setAttribute('aria-describedby', this.describedBy);
      else this.host.removeAttribute('aria-describedby');
    }
    this.describedBy = null;
  }

  private focusVisible(): boolean {
    try {
      return this.host.matches(':focus-visible');
    } catch {
      return true;
    }
  }
}
