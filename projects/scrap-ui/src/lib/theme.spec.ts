import { TestBed } from '@angular/core/testing';
import { ScrapTheme } from './theme';
import { installFakeStorage, removeStorage } from '../testing/fake-storage';

describe('ScrapTheme', () => {
  let storage: Storage;

  describe('couleurs des jetons', () => {
    const computed = (color: string) =>
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({ color } as CSSStyleDeclaration);

    afterEach(() => vi.restoreAllMocks());

    it('fait calculer le jeton par une sonde invisible', () => {
      const spy = computed('rgb(149, 97, 64)');
      const theme = TestBed.inject(ScrapTheme);
      expect(theme.color('--scrap-data-altered')).toBe('rgb(149, 97, 64)');
      const probe = spy.mock.calls[0][0] as HTMLElement;
      expect(probe.getAttribute('aria-hidden')).toBe('true');
      expect(probe.parentElement).toBe(document.body);
    });

    it("garde la couleur en cache jusqu'au changement de thème", () => {
      const spy = computed('rgb(1, 2, 3)');
      const theme = TestBed.inject(ScrapTheme);
      theme.color('--scrap-ink');
      theme.color('--scrap-ink');
      expect(spy).toHaveBeenCalledTimes(1);
      theme.toggle();
      theme.color('--scrap-ink');
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('résout dans une zone qui force son thème, sans cache', () => {
      const spy = computed('rgb(9, 9, 9)');
      const zone = document.createElement('div');
      document.body.appendChild(zone);
      const theme = TestBed.inject(ScrapTheme);
      theme.color('--scrap-ink', zone);
      theme.color('--scrap-ink', zone);
      expect(spy).toHaveBeenCalledTimes(2);
      expect((spy.mock.calls[1][0] as HTMLElement).parentElement).toBe(zone);
      zone.remove();
    });

    it('décompose la couleur et compose une opacité', () => {
      computed('rgba(149, 97, 64, 0.5)');
      const theme = TestBed.inject(ScrapTheme);
      expect(theme.rgb('--scrap-accent')).toEqual([149, 97, 64]);
      expect(theme.rgba('--scrap-accent', 0.25)).toBe('rgba(149, 97, 64, 0.25)');
    });

    it('rend du noir quand la couleur est illisible', () => {
      computed('');
      expect(TestBed.inject(ScrapTheme).rgb('--inconnu')).toEqual([0, 0, 0]);
    });
  });

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
