import { DOCUMENT, DestroyRef, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ScrapThemeName = 'light' | 'dark';
/** Ce que l'utilisateur a choisi : un thème, ou celui du système. */
export type ScrapThemePreference = ScrapThemeName | 'system';

const STORAGE_KEY = 'scrap-theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

/**
 * État du thème, partagé par toute l'application.
 *
 * Par défaut, le thème suit celui du système et le suit en direct ; un choix
 * explicite (`set('dark')`, `toggle()`) est mémorisé. `set('system')` revient
 * au réglage du système.
 *
 * Sur le serveur (SSR/prerender) rien n'est touché : le thème reste `light`
 * et la bascule réelle se fait à l'hydratation, une fois `document`,
 * `localStorage` et `matchMedia` disponibles.
 */
@Injectable({ providedIn: 'root' })
export class ScrapTheme {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly state = signal<ScrapThemeName>('light');
  private readonly pref = signal<ScrapThemePreference>('system');

  /** Thème affiché. Toujours `light` tant qu'on n'est pas dans un navigateur. */
  readonly theme = this.state.asReadonly();
  /** Préférence retenue : `light`, `dark`, ou `system`. */
  readonly preference = this.pref.asReadonly();

  private readonly colors = new Map<string, string>();
  private probe?: HTMLElement;

  constructor() {
    if (!this.isBrowser) return;
    const stored = this.stored();
    this.pref.set(stored ?? 'system');
    this.apply(stored ?? this.systemPreference());

    // En mode système, un changement de réglage de l'OS se répercute aussitôt.
    const media = this.document.defaultView?.matchMedia?.(DARK_QUERY);
    if (media?.addEventListener) {
      const follow = () => {
        if (this.pref() === 'system') this.apply(this.systemPreference());
      };
      media.addEventListener('change', follow);
      inject(DestroyRef).onDestroy(() => media.removeEventListener('change', follow));
    }
  }

  set(preference: ScrapThemePreference): void {
    if (!this.isBrowser) return;
    this.pref.set(preference);
    if (preference === 'system') {
      this.forget();
      this.apply(this.systemPreference());
    } else {
      this.apply(preference);
      this.persist(preference);
    }
  }

  toggle(): void {
    this.set(this.state() === 'dark' ? 'light' : 'dark');
  }

  /**
   * Couleur calculée d'un jeton (`--scrap-data-altered`…), en `rgb(…)` ou
   * `rgba(…)` : ce qu'attend un canvas. Les jetons s'écrivent en
   * `light-dark()` et en `var()`, que `getComputedStyle` rendrait tels quels
   * et qu'un canvas refuse sans erreur ; une sonde les fait calculer par le
   * navigateur.
   *
   * Le résultat suit le thème affiché et reste en cache jusqu'au changement
   * suivant : redessiner dans un `effect()` qui lit `theme()` suffit.
   * `within` vise une zone qui force son propre thème (`data-scrap-theme`) ;
   * la couleur est alors celle de cette zone, sans cache. Sur le serveur, la
   * chaîne est vide.
   */
  color(token: string, within?: Element): string {
    if (!this.isBrowser) return '';
    const key = `${this.state()}|${token}`;
    const cached = within ? undefined : this.colors.get(key);
    if (cached !== undefined) return cached;

    const probe = this.probeIn(within ?? this.document.body ?? this.document.documentElement);
    probe.style.color = `var(${token})`;
    const value = this.document.defaultView?.getComputedStyle(probe).color ?? '';
    if (!within) this.colors.set(key, value);
    return value;
  }

  /** Composantes `[r, g, b]` (0 à 255) d'un jeton, pour composer rampes et dégradés. */
  rgb(token: string, within?: Element): [number, number, number] {
    const m = /rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(this.color(token, within));
    return m ? [Math.round(+m[1]), Math.round(+m[2]), Math.round(+m[3])] : [0, 0, 0];
  }

  /** Le jeton avec une opacité, en `rgba(…)`. */
  rgba(token: string, alpha: number, within?: Element): string {
    const [r, g, b] = this.rgb(token, within);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /** Sonde invisible, posée là où le jeton doit être résolu. */
  private probeIn(parent: Element): HTMLElement {
    let probe = this.probe;
    if (!probe) {
      probe = this.document.createElement('i');
      probe.setAttribute('aria-hidden', 'true');
      probe.style.cssText =
        'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none';
      this.probe = probe;
    }
    if (probe.parentElement !== parent) parent.appendChild(probe);
    return probe;
  }

  private apply(theme: ScrapThemeName): void {
    this.state.set(theme);
    this.document.documentElement.setAttribute('data-scrap-theme', theme);
  }

  private stored(): ScrapThemeName | null {
    const raw = this.safeStorage()?.getItem(STORAGE_KEY);
    return raw === 'dark' || raw === 'light' ? raw : null;
  }

  private persist(theme: ScrapThemeName): void {
    try {
      this.safeStorage()?.setItem(STORAGE_KEY, theme);
    } catch {
      // Stockage indisponible (navigation privée, quota) : le thème reste
      // valable pour la session en cours, on n'a rien de plus à faire.
    }
  }

  private forget(): void {
    try {
      this.safeStorage()?.removeItem(STORAGE_KEY);
    } catch {
      // Même cas que persist() : rien à faire de plus.
    }
  }

  private safeStorage(): Storage | null {
    try {
      return this.document.defaultView?.localStorage ?? null;
    } catch {
      return null;
    }
  }

  private systemPreference(): ScrapThemeName {
    const view = this.document.defaultView;
    return view?.matchMedia?.(DARK_QUERY).matches ? 'dark' : 'light';
  }
}
