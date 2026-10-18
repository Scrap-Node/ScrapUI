/**
 * jsdom n'implémente pas l'API Popover : `showPopover()` et `hidePopover()`
 * n'existent pas. On pose un substitut minimal qui tient l'état ouvert et
 * émet l'événement `toggle`, juste assez pour vérifier le câblage des
 * menus et des listes déroulantes.
 *
 * Ce que ce substitut NE simule pas — couche supérieure, fermeture au clic
 * à côté, une seule surcouche `auto` ouverte à la fois — est ce que le
 * navigateur fournit, et que les tests Playwright exercent pour de vrai.
 */
export function installPopoverPolyfill(): void {
  const proto = HTMLElement.prototype as HTMLElement & { __scrapPopover?: boolean };
  if (proto.__scrapPopover) return;
  proto.__scrapPopover = true;

  const open = new WeakSet<HTMLElement>();
  const toggle = (el: HTMLElement, newState: 'open' | 'closed') => {
    const event = new Event('toggle');
    Object.assign(event, { newState, oldState: newState === 'open' ? 'closed' : 'open' });
    el.dispatchEvent(event);
  };

  proto.showPopover = function (this: HTMLElement) {
    if (!this.hasAttribute('popover')) throw new DOMException('Not a popover', 'NotSupportedError');
    if (open.has(this)) return;
    open.add(this);
    toggle(this, 'open');
  };
  proto.hidePopover = function (this: HTMLElement) {
    if (!open.has(this)) return;
    open.delete(this);
    toggle(this, 'closed');
  };
  proto.togglePopover = function (this: HTMLElement, force?: boolean | { force?: boolean }) {
    const wanted = typeof force === 'object' ? force.force : force;
    const next = wanted ?? !open.has(this);
    if (next) this.showPopover();
    else this.hidePopover();
    return next;
  };
}
