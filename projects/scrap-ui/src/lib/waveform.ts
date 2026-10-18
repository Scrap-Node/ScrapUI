import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  InjectionToken,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// ============================================================
// Visualisation audio — modules composables :
//  - scrap-wave-bars : forme d'onde en barres, cliquable (seek)
//  - scrap-wave-line : oscilloscope en trait continu
//  - scrap-vu-meter  : niveau instantané en segments
//  - scrap-wave-live : branche un AnalyserNode Web Audio sur
//                      l'un des rendus ci-dessus, en temps réel
// Toutes les données sont normalisées 0..1. Les couleurs suivent les rôles
// --scrap-data-* : gris l'original, cuivre la partie lue ou altérée, encre
// la tête de lecture.
// ============================================================

const VIEW_W = 100;
const VIEW_H = 40;
/** Pas de déplacement au clavier, en fraction de la durée totale. */
const KEY_STEP = 0.05;

/**
 * Posé par une piste de timeline : la forme d'onde qu'elle contient devient
 * un simple rendu, c'est la timeline qui gère le pointeur et le clavier.
 */
export const SCRAP_LANE = new InjectionToken<true>('SCRAP_LANE');

/** Plage d'une forme d'onde, en fractions 0..1 de sa longueur. */
export type ScrapRange = readonly [start: number, end: number];

/**
 * Forme d'onde en barres, avec position de lecture. Un clic — ou les flèches
 * du clavier — émet le ratio 0..1.
 *
 * ```html
 * <scrap-wave-bars [data]="peaks" [progress]="0.4" (seek)="onSeek($event)" />
 * <scrap-wave-bars [data]="peaks" [altered]="[[0.1, 0.3]]" />
 * ```
 */
@Component({
  selector: 'scrap-wave-bars',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      class="scrap-wave"
      [class.is-static]="!interactive"
      [attr.viewBox]="'0 0 ' + w + ' ' + h"
      preserveAspectRatio="none"
      [attr.role]="interactive ? 'slider' : null"
      [attr.tabindex]="interactive ? 0 : null"
      [attr.aria-hidden]="interactive ? null : 'true'"
      [attr.aria-label]="interactive ? label() : null"
      [attr.aria-valuemin]="interactive ? 0 : null"
      [attr.aria-valuemax]="interactive ? 1 : null"
      [attr.aria-valuenow]="interactive ? (progress() ?? 0) : null"
      [attr.aria-valuetext]="interactive ? valueText() : null"
      (click)="onClick($event)"
      (keydown)="onKeydown($event)"
    >
      @for (bar of bars(); track bar.i) {
        <rect
          [attr.x]="bar.x"
          [attr.y]="bar.y"
          [attr.width]="bar.w"
          [attr.height]="bar.h"
          [class.is-played]="bar.played"
          [class.is-altered]="bar.altered"
        />
      }
      @if (progress() !== undefined) {
        <rect
          class="scrap-wave__head"
          [attr.x]="w * progress()! - 0.25"
          y="0"
          width="0.5"
          [attr.height]="h"
        />
      }
    </svg>
  `,
})
export class ScrapWaveBars {
  /** Amplitudes normalisées 0..1, une entrée par barre. */
  readonly data = input.required<readonly number[]>();
  /** Position de lecture 0..1 (optionnelle). */
  readonly progress = input<number>();
  /** Plages altérées (détruites, modifiées), dessinées en cuivre. */
  readonly altered = input<readonly ScrapRange[]>([]);
  /** Étiquette accessible de la piste. */
  readonly label = input('Position de lecture');
  readonly seek = output<number>();

  /** Hors d'une piste de timeline, la forme d'onde se règle au pointeur et au clavier. */
  protected readonly interactive = !inject(SCRAP_LANE, { optional: true });

  protected readonly w = VIEW_W;
  protected readonly h = VIEW_H;

  protected readonly valueText = computed(() => {
    const p = this.progress();
    return p === undefined ? null : `${Math.round(p * 100)} %`;
  });

  protected readonly bars = computed(() => {
    const d = this.data();
    const p = this.progress();
    const zones = this.altered();
    const n = d.length || 1;
    const step = VIEW_W / n;
    const gap = Math.min(step * 0.3, 0.5);
    return d.map((v, i) => {
      const amp = Math.max(0.04, Math.min(1, v));
      const bh = amp * VIEW_H;
      const mid = (i + 0.5) / n;
      return {
        i,
        x: i * step,
        y: (VIEW_H - bh) / 2,
        w: step - gap,
        h: bh,
        played: p !== undefined && mid <= p,
        altered: zones.some(([a, b]) => mid >= a && mid < b),
      };
    });
  });

  protected onClick(event: MouseEvent): void {
    if (!this.interactive) return;
    const rect = (event.currentTarget as SVGSVGElement).getBoundingClientRect();
    if (!rect.width) return;
    this.emit((event.clientX - rect.left) / rect.width);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (!this.interactive) return;
    const current = this.progress() ?? 0;
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = current + KEY_STEP;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = current - KEY_STEP;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    this.emit(next);
  }

  private emit(ratio: number): void {
    this.seek.emit(Math.max(0, Math.min(1, ratio)));
  }
}

/**
 * Oscilloscope : trait continu, pour un signal temporel.
 * `<scrap-wave-line [data]="samples" />`
 */
@Component({
  selector: 'scrap-wave-line',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      class="scrap-scope"
      [attr.viewBox]="'0 0 ' + w + ' ' + h"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line class="axis" x1="0" [attr.y1]="h / 2" [attr.x2]="w" [attr.y2]="h / 2" />
      <polyline [attr.points]="points()" />
    </svg>
  `,
})
export class ScrapWaveLine {
  /** Échantillons normalisés 0..1 (0.5 = silence). */
  readonly data = input.required<readonly number[]>();

  protected readonly w = VIEW_W;
  protected readonly h = VIEW_H;

  protected readonly points = computed(() => {
    const d = this.data();
    const n = d.length;
    if (!n) return '';
    return d
      .map((v, i) => `${((i / (n - 1 || 1)) * VIEW_W).toFixed(2)},${((1 - v) * VIEW_H).toFixed(2)}`)
      .join(' ');
  });
}

/**
 * VU-mètre : niveau 0..1 en segments. Mousse, puis ocre, puis rouille selon
 * l'intensité.
 * `<scrap-vu-meter [level]="0.7" />`
 */
@Component({
  selector: 'scrap-vu-meter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="scrap-vu"
      role="meter"
      [attr.aria-label]="label()"
      [attr.aria-valuenow]="level()"
      aria-valuemin="0"
      aria-valuemax="1"
    >
      @for (seg of segments(); track seg.i) {
        <i [class.on]="seg.on" [class.hot]="seg.hot" [class.clip]="seg.clip"></i>
      }
    </div>
  `,
})
export class ScrapVuMeter {
  /** Niveau instantané 0..1. */
  readonly level = input.required<number>();
  readonly count = input(24);
  readonly label = input('Niveau audio');

  protected readonly segments = computed(() => {
    const lvl = this.level();
    const n = this.count();
    return Array.from({ length: n }, (_, i) => {
      const ratio = (i + 1) / n;
      return { i, on: lvl >= ratio - 1e-6, hot: ratio > 0.6, clip: ratio > 0.85 };
    });
  });
}

/**
 * Rendu temps réel depuis un AnalyserNode Web Audio.
 *
 * ```ts
 * const ctx = new AudioContext();
 * const analyser = ctx.createAnalyser();
 * source.connect(analyser);
 * // puis : <scrap-wave-live [analyser]="analyser" mode="line" />
 * ```
 *
 * mode "line" = domaine temporel (oscilloscope),
 * mode "bars" = spectre de fréquences.
 *
 * La boucle s'arrête quand l'onglet passe en arrière-plan : inutile de
 * brûler la batterie pour une animation que personne ne regarde.
 */
@Component({
  selector: 'scrap-wave-live',
  imports: [ScrapWaveBars, ScrapWaveLine],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (mode() === 'line') {
      <scrap-wave-line [data]="samples()" />
    } @else {
      <scrap-wave-bars [data]="samples()" />
    }
  `,
})
export class ScrapWaveLive {
  readonly analyser = input.required<AnalyserNode>();
  readonly mode = input<'bars' | 'line'>('line');
  /** Nombre de points affichés (le signal est sous-échantillonné). */
  readonly resolution = input(64);

  protected readonly samples = signal<number[]>([]);

  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private rafId = 0;
  private readonly visible = signal(true);

  constructor() {
    const destroyRef = inject(DestroyRef);

    if (this.isBrowser) {
      const onVisibility = () => this.visible.set(this.document.visibilityState === 'visible');
      onVisibility();
      this.document.addEventListener('visibilitychange', onVisibility);
      destroyRef.onDestroy(() =>
        this.document.removeEventListener('visibilitychange', onVisibility),
      );
    }

    destroyRef.onDestroy(() => this.stop());

    effect(() => {
      const analyser = this.analyser();
      const mode = this.mode();
      const res = this.resolution();
      const visible = this.visible();

      this.stop();
      if (!this.isBrowser || !visible) return;

      const buffer = new Uint8Array(
        mode === 'line' ? analyser.fftSize : analyser.frequencyBinCount,
      );
      const tick = () => {
        if (mode === 'line') analyser.getByteTimeDomainData(buffer);
        else analyser.getByteFrequencyData(buffer);
        const step = Math.max(1, Math.floor(buffer.length / res));
        const out: number[] = [];
        for (let i = 0; i < buffer.length; i += step) {
          out.push(buffer[i] / 255);
        }
        this.samples.set(out);
        this.rafId = requestAnimationFrame(tick);
      };
      tick();
    });
  }

  private stop(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }
}
