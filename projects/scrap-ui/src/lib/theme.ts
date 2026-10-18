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
