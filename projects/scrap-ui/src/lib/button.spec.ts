import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ScrapButton, type ScrapButtonSize, type ScrapButtonVariant } from './button';
import { ScrapBadge, type ScrapBadgeTone } from './badge';
import {
  ScrapKbd,
  ariaShortcut,
  formatShortcut,
  isMacPlatform,
  isTypingTarget,
  matchesShortcut,
} from './kbd';

@Component({
  imports: [ScrapButton],
  template: `<button
    scrap-button
    class="a-moi"
    [variant]="variant()"
    [size]="size()"
    [icon]="icon()"
  >
    Go
  </button>`,
})
class ButtonHost {
  readonly variant = signal<ScrapButtonVariant>('primary');
  readonly size = signal<ScrapButtonSize>('m');
  readonly icon = signal(false);
}

describe('ScrapButton', () => {
  const setup = async () => {
    const fixture = TestBed.createComponent(ButtonHost);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    return { fixture, button };
  };

  it('applique la classe de variante', async () => {
    const { fixture, button } = await setup();
    expect(button.classList.contains('scrap-btn--primary')).toBe(true);

    for (const variant of ['secondary', 'ghost', 'danger'] as ScrapButtonVariant[]) {
      fixture.componentInstance.variant.set(variant);
      await fixture.whenStable();
      expect(button.classList.contains(`scrap-btn--${variant}`), variant).toBe(true);
      expect(button.classList.contains('scrap-btn--primary')).toBe(false);
    }
  });

  it("n'ajoute une classe de taille qu'en dehors de la taille moyenne", async () => {
    const { fixture, button } = await setup();
    expect(button.classList.contains('scrap-btn--s')).toBe(false);
    expect(button.classList.contains('scrap-btn--l')).toBe(false);

    fixture.componentInstance.size.set('s');
    await fixture.whenStable();
    expect(button.classList.contains('scrap-btn--s')).toBe(true);

    fixture.componentInstance.size.set('l');
    await fixture.whenStable();
    expect(button.classList.contains('scrap-btn--l')).toBe(true);
    expect(button.classList.contains('scrap-btn--s')).toBe(false);
  });

  it('passe en bouton carré pour une icône seule', async () => {
    const { fixture, button } = await setup();
    expect(button.classList.contains('scrap-btn--icon')).toBe(false);
    fixture.componentInstance.icon.set(true);
    await fixture.whenStable();
    expect(button.classList.contains('scrap-btn--icon')).toBe(true);
  });

  it('conserve les classes posées par le consommateur', async () => {
    // Un binding `[class]` global les écraserait — d'où les bindings unitaires.
    const { button } = await setup();
    expect(button.classList.contains('a-moi')).toBe(true);
    expect(button.classList.contains('scrap-btn')).toBe(true);
  });
});

@Component({
  imports: [ScrapBadge],
  template: `<scrap-badge class="a-moi" [tone]="tone()" [dot]="dot()">OK</scrap-badge>`,
})
class BadgeHost {
  readonly tone = signal<ScrapBadgeTone>('neutral');
  readonly dot = signal(false);
}

describe('ScrapBadge', () => {
  const TONES: ScrapBadgeTone[] = ['accent', 'info', 'success', 'warning', 'danger'];

  const setup = async () => {
    const fixture = TestBed.createComponent(BadgeHost);
    await fixture.whenStable();
    const badge = fixture.nativeElement.querySelector('scrap-badge') as HTMLElement;
    return { fixture, badge };
  };

  it("n'ajoute pas de classe pour la tonalité neutre", async () => {
    const { badge } = await setup();
    expect(badge.classList.contains('scrap-badge')).toBe(true);
    for (const tone of TONES) {
      expect(badge.classList.contains(`scrap-badge--${tone}`)).toBe(false);
    }
  });

  it('applique une classe par tonalité', async () => {
    const { fixture, badge } = await setup();
    for (const tone of TONES) {
      fixture.componentInstance.tone.set(tone);
      await fixture.whenStable();
      expect(badge.classList.contains(`scrap-badge--${tone}`), tone).toBe(true);
      const others = TONES.filter((t) => t !== tone);
      expect(others.some((t) => badge.classList.contains(`scrap-badge--${t}`))).toBe(false);
    }
  });

  it('passe en pastille avec dot', async () => {
    const { fixture, badge } = await setup();
    expect(badge.classList.contains('scrap-badge--dot')).toBe(false);
    fixture.componentInstance.dot.set(true);
    await fixture.whenStable();
    expect(badge.classList.contains('scrap-badge--dot')).toBe(true);
  });

  it('conserve les classes du consommateur', async () => {
    const { badge } = await setup();
    expect(badge.classList.contains('a-moi')).toBe(true);
  });
});

@Component({
  imports: [ScrapKbd],
  template: `<kbd scrap-kbd>⌘K</kbd>`,
})
class KbdHost {}

describe('ScrapKbd', () => {
  it('pose la classe de touche', async () => {
    const fixture = TestBed.createComponent(KbdHost);
    await fixture.whenStable();
    const kbd = fixture.nativeElement.querySelector('kbd') as HTMLElement;
    expect(kbd.classList.contains('scrap-kbd')).toBe(true);
  });
});

describe('formatShortcut', () => {
  it('écrit les modificateurs en symboles sur Mac, dans l’ordre d’usage', () => {
    expect(formatShortcut('mod+k')).toBe('⌘K');
    expect(formatShortcut('mod+shift+p')).toBe('⇧⌘P');
    expect(formatShortcut('shift+mod+p')).toBe('⇧⌘P');
    expect(formatShortcut('alt+ctrl+z')).toBe('⌃⌥Z');
  });

  it('écrit les modificateurs en toutes lettres ailleurs', () => {
    expect(formatShortcut('mod+k', false)).toBe('Ctrl+K');
    expect(formatShortcut('mod+shift+p', false)).toBe('Ctrl+Maj+P');
    expect(formatShortcut('alt+enter', false)).toBe('Alt+Entrée');
  });

  it('rend une touche seule en majuscule', () => {
    expect(formatShortcut('t')).toBe('T');
    expect(formatShortcut('t', false)).toBe('T');
  });

  it('nomme les touches spéciales', () => {
    expect(formatShortcut('escape')).toBe('Échap');
    expect(formatShortcut('mod+backspace')).toBe('⌘⌫');
    expect(formatShortcut('mod+backspace', false)).toBe('Ctrl+Retour');
  });

  it('laisse passer un texte déjà mis en forme', () => {
    expect(formatShortcut('⌘K')).toBe('⌘K');
    expect(formatShortcut('F5')).toBe('F5');
  });

  it("ne confond pas une touche avec une propriété d'objet", () => {
    expect(formatShortcut('constructor')).toBe('constructor');
    expect(formatShortcut('mod+toString', false)).toBe('Ctrl+toString');
  });
});

describe('isMacPlatform', () => {
  const view = (platform: string) => ({ navigator: { platform } }) as unknown as Window;

  it('reconnaît macOS et iOS', () => {
    expect(isMacPlatform(view('MacIntel'))).toBe(true);
    expect(isMacPlatform(view('iPhone'))).toBe(true);
  });

  it('répond non ailleurs, et côté serveur', () => {
    expect(isMacPlatform(view('Win32'))).toBe(false);
    expect(isMacPlatform(view('Linux x86_64'))).toBe(false);
    expect(isMacPlatform(null)).toBe(false);
  });
});

describe('ariaShortcut', () => {
  it('écrit le raccourci dans le vocabulaire d’aria-keyshortcuts', () => {
    expect(ariaShortcut('mod+shift+p')).toBe('Meta+Shift+P');
    expect(ariaShortcut('mod+shift+p', false)).toBe('Control+Shift+P');
    expect(ariaShortcut('T')).toBe('T');
    expect(ariaShortcut('mod+enter', false)).toBe('Control+Enter');
    expect(ariaShortcut('F5')).toBe('F5');
  });

  it('renonce devant un texte déjà mis en forme', () => {
    expect(ariaShortcut('⌘K')).toBeNull();
    expect(ariaShortcut('')).toBeNull();
  });
});

describe('matchesShortcut', () => {
  const event = (key: string, init: KeyboardEventInit = {}) =>
    new KeyboardEvent('keydown', { key, ...init });

  it('lit mod comme ⌘ sur Mac et Ctrl ailleurs', () => {
    expect(matchesShortcut(event('k', { metaKey: true }), 'mod+k', true)).toBe(true);
    expect(matchesShortcut(event('k', { ctrlKey: true }), 'mod+k', true)).toBe(false);
    expect(matchesShortcut(event('k', { ctrlKey: true }), 'mod+k', false)).toBe(true);
  });

  it('exige exactement les modificateurs demandés', () => {
    expect(matchesShortcut(event('Z', { ctrlKey: true, shiftKey: true }), 'mod+z', false)).toBe(
      false,
    );
    expect(
      matchesShortcut(event('Z', { ctrlKey: true, shiftKey: true }), 'mod+shift+z', false),
    ).toBe(true);
    expect(matchesShortcut(event('t', { altKey: true }), 't', false)).toBe(false);
  });

  it('reconnaît les touches nommées', () => {
    expect(matchesShortcut(event('Enter', { metaKey: true }), 'mod+enter', true)).toBe(true);
    expect(matchesShortcut(event('Escape'), 'escape', true)).toBe(true);
    expect(matchesShortcut(event(' '), 'space', true)).toBe(true);
  });

  it('retombe sur la touche physique quand ⌥ change le caractère', () => {
    const e = new KeyboardEvent('keydown', { key: 'å', code: 'KeyA', altKey: true, metaKey: true });
    expect(matchesShortcut(e, 'mod+alt+a', true)).toBe(true);
  });
});

describe('isTypingTarget', () => {
  it('reconnaît les champs de saisie, pas les cases ni les boutons', () => {
    const make = (html: string) => {
      const wrap = document.createElement('div');
      wrap.innerHTML = html;
      return wrap.firstElementChild;
    };
    expect(isTypingTarget(make('<input type="text">'))).toBe(true);
    expect(isTypingTarget(make('<input>'))).toBe(true);
    expect(isTypingTarget(make('<textarea></textarea>'))).toBe(true);
    expect(isTypingTarget(make('<input type="checkbox">'))).toBe(false);
    expect(isTypingTarget(make('<button></button>'))).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});
