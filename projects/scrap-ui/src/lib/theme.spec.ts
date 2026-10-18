import { TestBed } from '@angular/core/testing';
import { ScrapTheme } from './theme';
import { installFakeStorage, removeStorage } from '../testing/fake-storage';

describe('ScrapTheme', () => {
  let storage: Storage;

  beforeEach(() => {
    storage = installFakeStorage();
    document.documentElement.removeAttribute('data-scrap-theme');
    TestBed.resetTestingModule();
  });

  it("retombe sur le thème clair quand rien n'est stocké", () => {
    // jsdom n'implémente pas matchMedia : l'appel optionnel doit passer
    // sans lever, exactement comme sur le serveur en SSR.
    const theme = TestBed.inject(ScrapTheme);
    expect(theme.theme()).toBe('light');
    expect(document.documentElement.getAttribute('data-scrap-theme')).toBe('light');
  });

  it('reprend le thème mémorisé', () => {
    storage.setItem('scrap-theme', 'dark');
    expect(TestBed.inject(ScrapTheme).theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-scrap-theme')).toBe('dark');
  });

  it('ignore une valeur stockée invalide', () => {
    storage.setItem('scrap-theme', 'chartreuse');
    expect(TestBed.inject(ScrapTheme).theme()).toBe('light');
  });

  it("bascule, applique l'attribut et persiste", () => {
    const theme = TestBed.inject(ScrapTheme);
    theme.toggle();
    expect(theme.theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-scrap-theme')).toBe('dark');
    expect(storage.getItem('scrap-theme')).toBe('dark');

    theme.toggle();
    expect(theme.theme()).toBe('light');
    expect(storage.getItem('scrap-theme')).toBe('light');
  });

  it('accepte un thème explicite', () => {
    const theme = TestBed.inject(ScrapTheme);
    theme.set('dark');
    expect(theme.theme()).toBe('dark');
  });

  it('suit le système tant que rien n’est choisi', () => {
    expect(TestBed.inject(ScrapTheme).preference()).toBe('system');
  });

  it('retient le choix explicite comme préférence', () => {
    const theme = TestBed.inject(ScrapTheme);
    theme.set('dark');
    expect(theme.preference()).toBe('dark');
    theme.toggle();
    expect(theme.preference()).toBe('light');
  });

  it('revient au système et oublie le choix mémorisé', () => {
    storage.setItem('scrap-theme', 'dark');
    const theme = TestBed.inject(ScrapTheme);
    expect(theme.preference()).toBe('dark');

    theme.set('system');
    expect(theme.preference()).toBe('system');
    expect(storage.getItem('scrap-theme')).toBeNull();
    // jsdom n'a pas de matchMedia : le système passe pour clair.
    expect(theme.theme()).toBe('light');
  });

  it('survit à un stockage indisponible', () => {
    // Navigation privée, quota dépassé, ou — comme ici — pas de localStorage
    // du tout : le thème doit rester utilisable pour la session.
    removeStorage();
    TestBed.resetTestingModule();
    const theme = TestBed.inject(ScrapTheme);
    expect(theme.theme()).toBe('light');
    expect(() => theme.toggle()).not.toThrow();
    expect(theme.theme()).toBe('dark');
  });
});

describe('ScrapTheme et le réglage du système', () => {
  let dark: boolean;
  let listeners: (() => void)[];

  /** jsdom n'implémente pas matchMedia : on simule le réglage clair/sombre de l'OS. */
  const installMatchMedia = () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: (query: string) => ({
        media: query,
        get matches() {
          return dark;
        },
        addEventListener: (_: string, fn: () => void) => listeners.push(fn),
        removeEventListener: (_: string, fn: () => void) => {
          listeners = listeners.filter((l) => l !== fn);
        },
      }),
    });
  };

  const switchSystem = (next: boolean) => {
    dark = next;
    for (const fn of listeners) fn();
  };

  beforeEach(() => {
    installFakeStorage();
    dark = true;
    listeners = [];
    installMatchMedia();
    document.documentElement.removeAttribute('data-scrap-theme');
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    delete (window as { matchMedia?: unknown }).matchMedia;
  });

  it('démarre sur le thème du système', () => {
    expect(TestBed.inject(ScrapTheme).theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-scrap-theme')).toBe('dark');
  });

  it('suit un changement du système en direct', () => {
    const theme = TestBed.inject(ScrapTheme);
    switchSystem(false);
    expect(theme.theme()).toBe('light');
    expect(document.documentElement.getAttribute('data-scrap-theme')).toBe('light');
  });

  it("ne suit plus le système une fois qu'un thème est choisi", () => {
    const theme = TestBed.inject(ScrapTheme);
    theme.set('dark');
    switchSystem(false);
    expect(theme.theme()).toBe('dark');

    theme.set('system');
    expect(theme.theme()).toBe('light');
  });

  it("cesse d'écouter le système à la destruction de l'application", () => {
    TestBed.inject(ScrapTheme);
    expect(listeners).toHaveLength(1);
    TestBed.resetTestingModule();
    expect(listeners).toHaveLength(0);
  });
});
