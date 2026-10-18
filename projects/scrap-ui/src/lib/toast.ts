import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Injectable,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ScrapIcon, type ScrapIconName } from './icon';
import type { ScrapTone } from './badge';

/** Une action proposée dans le toast, « Annuler » le plus souvent. */
export interface ScrapToastAction {
  readonly label: string;
  readonly run: () => void;
}

export interface ScrapToastOptions {
  /** Durée d'affichage en millisecondes ; 0 garde le toast jusqu'à sa fermeture. */
  readonly duration?: number;
  readonly action?: ScrapToastAction;
}

export interface ScrapToastItem {
  id: number;
  message: string;
  tone: ScrapTone;
  action?: ScrapToastAction;
}

/** Au-delà, les plus anciens sont retirés : une pile de 20 toasts ne sert personne. */
const MAX_VISIBLE = 4;

/**
 * Service de notifications. Injecter et appeler :
 *
 * ```ts
 * inject(ScrapToast).show('Enregistré', 'success');
 * ```
 *
 * Nécessite un `<scrap-toasts />` dans le layout racine.
 */
@Injectable({ providedIn: 'root' })
export class ScrapToast {
  private readonly state = signal<ScrapToastItem[]>([]);
  readonly items = this.state.asReadonly();

  private nextId = 0;

  /**
   * Minuteries en cours, par identifiant de toast. `handle` est `null`
   * lorsque la pile est en pause : la minuterie existe encore, elle ne
   * court simplement pas.
   */
  private readonly timers = new Map<
    number,
    { handle: ReturnType<typeof setTimeout> | null; expiresAt: number; remaining: number }
  >();

  /**
   * Profondeur de pause. Le pointeur et le focus peuvent se superposer
   * (on survole un toast puis on clique dessus) : un simple booléen ferait
   * reprendre les minuteries au premier `focusout`, alors que le pointeur
   * est toujours sur la pile.
   */
  private pauseDepth = 0;

  constructor() {
    // Sans ça, une minuterie en vol garde une référence sur le service après
    // destruction de l'application (tests, SSR, micro-frontends).
    inject(DestroyRef).onDestroy(() => this.clear());
  }

  /**
   * Affiche un toast et renvoie son identifiant.
   *
   * ```ts
   * toast.show('Enregistré', 'success');
   * toast.show('Passe 4 appliquée', 'success', {
   *   action: { label: 'Annuler', run: () => this.undo() },
   * });
   * ```
   */
  show(
    message: string,
    tone: ScrapTone = 'info',
    durationOrOptions: number | ScrapToastOptions = 3500,
  ): number {
    const options: ScrapToastOptions =
      typeof durationOrOptions === 'number' ? { duration: durationOrOptions } : durationOrOptions;
    const durationMs = options.duration ?? (options.action ? 6000 : 3500);
    const item: ScrapToastItem = { id: this.nextId++, message, tone, action: options.action };
    this.state.update((list) => [...list, item].slice(-MAX_VISIBLE));

    // Le `slice` a pu évincer des toasts : leurs minuteries n'ont plus d'objet.
    for (const id of [...this.timers.keys()]) {
      if (!this.state().some((t) => t.id === id)) this.stopTimer(id);
    }

    if (durationMs > 0) this.startTimer(item.id, durationMs);
    return item.id;
  }

  /** Lance l'action du toast puis le ferme. */
  act(id: number): void {
    const item = this.state().find((t) => t.id === id);
    this.close(id);
    item?.action?.run();
  }

  close(id: number): void {
    this.stopTimer(id);
    this.state.update((list) => list.filter((t) => t.id !== id));
  }

  clear(): void {
    for (const id of [...this.timers.keys()]) this.stopTimer(id);
    this.state.set([]);
  }

  /** Suspend toutes les minuteries — appelé quand le pointeur ou le focus entre dans la pile. */
  pause(): void {
    // Déjà en pause : recalculer le temps restant à partir d'une échéance
    // dépassée le ferait tomber à zéro, et le toast s'évaporerait à la reprise.
    if (this.pauseDepth++ > 0) return;

    const now = Date.now();
    for (const timer of this.timers.values()) {
      if (timer.handle === null) continue;
      clearTimeout(timer.handle);
      timer.handle = null;
      timer.remaining = Math.max(0, timer.expiresAt - now);
    }
  }

  /** Reprend les minuteries suspendues, chacune sur son temps restant. */
  resume(): void {
    if (this.pauseDepth === 0) return;
    if (--this.pauseDepth > 0) return;

    for (const [id, timer] of [...this.timers]) {
      if (timer.handle === null) this.startTimer(id, timer.remaining);
    }
  }

  private startTimer(id: number, durationMs: number): void {
    const existing = this.timers.get(id);
    if (existing?.handle) clearTimeout(existing.handle);

    // Un toast qui apparaît pendant que la pile est en pause attend son tour :
    // il serait absurde qu'il s'efface sous le pointeur de l'utilisateur.
    const paused = this.pauseDepth > 0;
    this.timers.set(id, {
      handle: paused ? null : setTimeout(() => this.close(id), durationMs),
      expiresAt: Date.now() + durationMs,
      remaining: durationMs,
    });
  }

  private stopTimer(id: number): void {
    const timer = this.timers.get(id);
    if (timer?.handle) clearTimeout(timer.handle);
    this.timers.delete(id);
  }
}

const TONE_ICON: Record<ScrapTone, ScrapIconName> = {
  neutral: 'info',
  info: 'info',
  success: 'check-circle',
  warning: 'warning',
  danger: 'x-circle',
};

/**
 * Zone d'affichage des toasts, en bas au centre de l'écran.
 *
 * Deux régions live distinctes : les messages `danger` sont annoncés en
 * `assertive`, les autres en `polite`. Imbriquer une seule région et y
 * changer le rôle ferait annoncer deux fois par certains lecteurs d'écran.
 */
@Component({
  selector: 'scrap-toasts',
  imports: [ScrapIcon, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'scrap-toasts',
    '(mouseenter)': 'svc.pause()',
    '(mouseleave)': 'svc.resume()',
    '(focusin)': 'svc.pause()',
    '(focusout)': 'svc.resume()',
  },
  template: `
    <div class="scrap-toasts__region" role="alert" aria-live="assertive">
      @for (t of urgent(); track t.id) {
        <ng-container *ngTemplateOutlet="toast; context: { $implicit: t }" />
      }
    </div>
    <div class="scrap-toasts__region" role="status" aria-live="polite">
      @for (t of routine(); track t.id) {
        <ng-container *ngTemplateOutlet="toast; context: { $implicit: t }" />
      }
    </div>

    <ng-template #toast let-t>
      <div class="scrap-toast scrap-toast--{{ t.tone }}">
        <scrap-icon class="scrap-toast__icon" [name]="icon(t.tone)" />
        <span class="scrap-toast__text">{{ t.message }}</span>
        @if (t.action) {
          <button type="button" class="scrap-toast__action" (click)="svc.act(t.id)">
            {{ t.action.label }}
          </button>
        }
        <button
          type="button"
          class="scrap-toast__close"
          aria-label="Fermer"
          (click)="svc.close(t.id)"
        >
          <scrap-icon name="close" [size]="14" />
        </button>
      </div>
    </ng-template>
  `,
})
export class ScrapToasts {
  protected readonly svc = inject(ScrapToast);
  protected readonly urgent = computed(() => this.svc.items().filter((t) => t.tone === 'danger'));
  protected readonly routine = computed(() => this.svc.items().filter((t) => t.tone !== 'danger'));

  protected icon(tone: ScrapTone): ScrapIconName {
    return TONE_ICON[tone];
  }
}
