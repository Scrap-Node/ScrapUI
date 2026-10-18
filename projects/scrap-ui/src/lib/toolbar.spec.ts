import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScrapIcon } from './icon';
import { ScrapIconButton } from './icon-button';
import { ScrapToolbar, ScrapToolbarSeparator, ScrapToolbarSpacer } from './toolbar';
import { ScrapTooltip } from './tooltip';

const tooltip = () => document.body.querySelector('.scrap-tooltip') as HTMLElement | null;

@Component({
  imports: [ScrapTooltip],
  template: `<button scrapTooltip="Détruire la zone" [scrapTooltipShortcut]="shortcut()">
    Détruire
  </button>`,
})
class TooltipHost {
  readonly shortcut = signal<string | undefined>('mod+enter');
}

describe('ScrapTooltip', () => {
  let fixture: ComponentFixture<TooltipHost>;
  const button = () => fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  const enter = () =>
    button().dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));

  beforeEach(async () => {
    fixture = TestBed.createComponent(TooltipHost);
    await fixture.whenStable();
    // Après le premier rendu : le planificateur d'Angular garde ses vraies minuteries.
    vi.useFakeTimers();
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
  });

  it('apparaît au survol après un court délai', () => {
    enter();
    expect(tooltip()).toBeNull();
    vi.advanceTimersByTime(450);
    expect(tooltip()?.getAttribute('role')).toBe('tooltip');
    expect(tooltip()?.querySelector('span')?.textContent).toBe('Détruire la zone');
  });

  it('affiche le raccourci mis en forme', () => {
    enter();
    vi.advanceTimersByTime(450);
    const kbd = tooltip()?.querySelector('kbd.scrap-kbd');
    // jsdom ne se déclare pas Mac : Ctrl+Entrée.
    expect(kbd?.textContent).toBe('Ctrl+Entrée');
  });

  it("décrit l'élément tant qu'elle est affichée", () => {
    enter();
    vi.advanceTimersByTime(450);
    expect(button().getAttribute('aria-describedby')).toBe(tooltip()!.id);

    button().dispatchEvent(new PointerEvent('pointerleave'));
    vi.advanceTimersByTime(200);
    expect(tooltip()).toBeNull();
    expect(button().getAttribute('aria-describedby')).toBeNull();
  });

  it('reste affichée quand le pointeur passe dessus', () => {
    enter();
    vi.advanceTimersByTime(450);
    button().dispatchEvent(new PointerEvent('pointerleave'));
    tooltip()!.dispatchEvent(new PointerEvent('pointerenter'));
    vi.advanceTimersByTime(1000);
    expect(tooltip()).not.toBeNull();
  });

  it('se ferme avec Échap', () => {
    enter();
    vi.advanceTimersByTime(450);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(tooltip()).toBeNull();
  });

  it("se ferme au clic sur l'élément", () => {
    enter();
    vi.advanceTimersByTime(450);
    button().dispatchEvent(new PointerEvent('pointerdown'));
    expect(tooltip()).toBeNull();
  });

  it('ne s’ouvre pas au toucher', () => {
    button().dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'touch' }));
    vi.advanceTimersByTime(1000);
    expect(tooltip()).toBeNull();
  });

  it('disparaît avec son élément', () => {
    enter();
    vi.advanceTimersByTime(450);
    fixture.destroy();
    expect(tooltip()).toBeNull();
  });
});

@Component({
  imports: [ScrapToolbar, ScrapToolbarSeparator, ScrapToolbarSpacer, ScrapIconButton, ScrapIcon],
  template: `
    <scrap-toolbar label="Outils" [orientation]="orientation()" panel>
      <button
        scrap-icon-button
        label="Sélection"
        shortcut="V"
        [pressed]="tool() === 'v'"
        (click)="tool.set('v')"
      >
        <scrap-icon name="pointer" />
      </button>
      <button
        scrap-icon-button
        label="Zone"
        shortcut="T"
        [pressed]="tool() === 't'"
        (click)="tool.set('t')"
      >
        <scrap-icon name="zone" />
      </button>
      <scrap-toolbar-separator />
      <button scrap-icon-button label="Annuler" shortcut="mod+z" size="s">
        <scrap-icon name="undo" />
      </button>
      <scrap-toolbar-spacer />
    </scrap-toolbar>
  `,
})
class ToolbarHost {
  readonly tool = signal('t');
  readonly orientation = signal<'horizontal' | 'vertical'>('vertical');
}

describe('ScrapToolbar et ScrapIconButton', () => {
  let fixture: ComponentFixture<ToolbarHost>;
  const bar = () => fixture.nativeElement.querySelector('scrap-toolbar') as HTMLElement;
  const buttons = () => [...bar().querySelectorAll('button')] as HTMLButtonElement[];
  const key = (el: HTMLElement, k: string) =>
    el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

  beforeEach(async () => {
    fixture = TestBed.createComponent(ToolbarHost);
    await fixture.whenStable();
  });

  it('se présente comme une barre d’outils nommée et orientée', () => {
    expect(bar().getAttribute('role')).toBe('toolbar');
    expect(bar().getAttribute('aria-label')).toBe('Outils');
    expect(bar().getAttribute('aria-orientation')).toBe('vertical');
    expect(bar().classList).toContain('scrap-toolbar--vertical');
    expect(bar().classList).toContain('scrap-toolbar--panel');
  });

  it('nomme chaque bouton par son libellé et annonce son raccourci', () => {
    const [select, zone, undo] = buttons();
    expect(select.getAttribute('aria-label')).toBe('Sélection');
    expect(select.getAttribute('type')).toBe('button');
    expect(zone.getAttribute('aria-keyshortcuts')).toBe('T');
    expect(undo.getAttribute('aria-keyshortcuts')).toBe('Control+Z');
    expect(undo.classList).toContain('scrap-icon-btn--s');
  });

  it("n'expose aria-pressed que sur les boutons bascules", () => {
    const [select, zone, undo] = buttons();
    expect(select.getAttribute('aria-pressed')).toBe('false');
    expect(zone.getAttribute('aria-pressed')).toBe('true');
    expect(undo.hasAttribute('aria-pressed')).toBe(false);
  });

  it("garde un seul arrêt de tabulation : l'outil actif", () => {
    expect(buttons().map((b) => b.tabIndex)).toEqual([-1, 0, -1]);
  });

  it('passe d’un outil à l’autre avec les flèches de son orientation', () => {
    const [select, zone, undo] = buttons();
    zone.focus();
    key(zone, 'ArrowDown');
    expect(document.activeElement).toBe(undo);
    key(undo, 'ArrowDown');
    expect(document.activeElement).toBe(select);
    key(select, 'ArrowUp');
    expect(document.activeElement).toBe(undo);
    // En vertical, ← et → ne bougent pas.
    key(undo, 'ArrowRight');
    expect(document.activeElement).toBe(undo);
    expect(buttons().map((b) => b.tabIndex)).toEqual([-1, -1, 0]);
  });

  it('va aux extrémités avec Origine et Fin', () => {
    const [select, zone, undo] = buttons();
    zone.focus();
    key(zone, 'End');
    expect(document.activeElement).toBe(undo);
    key(undo, 'Home');
    expect(document.activeElement).toBe(select);
  });

  it("déclenche l'outil dont on tape la lettre", async () => {
    const [select, zone] = buttons();
    zone.focus();
    key(zone, 'v');
    await fixture.whenStable();
    expect(fixture.componentInstance.tool()).toBe('v');
    expect(document.activeElement).toBe(select);
  });

  it('pose un séparateur perpendiculaire à la barre', async () => {
    const sep = bar().querySelector('scrap-toolbar-separator') as HTMLElement;
    expect(sep.getAttribute('role')).toBe('separator');
    expect(sep.getAttribute('aria-orientation')).toBe('horizontal');
    fixture.componentInstance.orientation.set('horizontal');
    await fixture.whenStable();
    expect(sep.getAttribute('aria-orientation')).toBe('vertical');
  });
});

@Component({
  imports: [ScrapIconButton, ScrapIcon],
  template: `
    <form>
      <button scrap-icon-button label="Envoyer" type="submit"><scrap-icon name="arrow" /></button>
    </form>
    <a scrap-icon-button label="Aide" href="/aide"><scrap-icon name="info" /></a>
  `,
})
class TypeHost {}

describe('ScrapIconButton hors barre', () => {
  it('respecte le type donné, et ne type pas un lien', async () => {
    const fixture = TestBed.createComponent(TypeHost);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    expect(button.getAttribute('type')).toBe('submit');
    expect(link.hasAttribute('type')).toBe(false);
    expect(link.getAttribute('aria-label')).toBe('Aide');
  });
});
