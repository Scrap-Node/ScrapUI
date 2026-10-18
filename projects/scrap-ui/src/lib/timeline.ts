import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  numberAttribute,
} from '@angular/core';
import { SCRAP_LANE } from './waveform';

/** Une zone de la timeline, en secondes. */
export type ScrapTimeRange = readonly [start: number, end: number];

/** En deçà de cette durée, un glissement ne fait pas une zone. */
const MIN_SELECTION = 0.05;
/** Pixels de glissement avant de passer du clic à la sélection. */
const DRAG_THRESHOLD = 4;
const NICE_STEPS = [0.1, 0.2, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600];

const SECONDS = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
const RULER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

function clockLabel(t: number): string {
  if (t < 60) return `${RULER.format(t)} s`;
  const m = Math.floor(t / 60);
  const s = Math.round(t - m * 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Piste de la timeline : son étiquette, et la forme d'onde qu'elle contient.
 * La forme d'onde y devient un simple rendu : la timeline gère le pointeur.
 *
 * `<scrap-lane label="A"><scrap-wave-bars [data]="original" /></scrap-lane>`
 */
@Component({
  selector: 'scrap-lane',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: SCRAP_LANE, useValue: true }],
  template: `
    <div class="scrap-lane__label">{{ label() }}</div>
    <div class="scrap-lane"><ng-content /></div>
  `,
  host: { class: 'scrap-timeline__row' },
})
export class ScrapLane {
  readonly label = input.required<string>();
}

/**
 * Timeline : la règle, les pistes, la sélection, la tête de lecture et les
 * repères.
 *
 * ```html
 * <scrap-timeline [duration]="6.4" [(selection)]="zone" [(playhead)]="position">
 *   <scrap-lane label="A"><scrap-wave-bars [data]="original" /></scrap-lane>
 *   <scrap-lane label="B"><scrap-wave-bars [data]="detruit" [altered]="zones" /></scrap-lane>
 *   @for (passe of passes(); track passe.id; let i = $index) {
 *     <scrap-marker [at]="passe.debut">{{ i + 1 }}</scrap-marker>
 *   }
 * </scrap-timeline>
 * ```
 *
 * Un clic place la tête de lecture, un glissement sélectionne une zone. Au
 * clavier : les flèches déplacent la lecture d'un dixième de seconde, Pg↑
 * et Pg↓ d'une seconde, Origine et Fin vont aux extrémités ; avec ⇧, ces
 * mêmes touches étendent la zone. Échap l'efface.
 */
@Component({
  selector: 'scrap-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="scrap-timeline__row">
      <div class="scrap-ruler-corner"></div>
      <div class="scrap-ruler" aria-hidden="true">
        @for (tick of ticks(); track tick.t) {
          <span [class.minor]="!tick.major" [style.left.%]="tick.left">{{ tick.label }}</span>
        }
      </div>
    </div>
    <ng-content select="scrap-lane" />
    <div class="scrap-timeline__overlay">
      <div
        class="scrap-selection"
        [hidden]="!selection()"
        [style.left.%]="selectionBox().left"
        [style.width.%]="selectionBox().width"
      ></div>
      <ng-content select="scrap-marker" />
      <div class="scrap-playhead" [style.left.%]="toPercent(playhead())"></div>
    </div>
    <div
      class="scrap-timeline__hit"
      role="slider"
      tabindex="0"
      aria-valuemin="0"
      [attr.aria-label]="label()"
      [attr.aria-valuemax]="duration()"
      [attr.aria-valuenow]="playhead()"
      [attr.aria-valuetext]="valueText()"
      (pointerdown)="onPointerDown($event)"
      (pointermove)="onPointerMove($event)"
      (pointerup)="onPointerUp($event)"
      (pointercancel)="onPointerUp($event)"
      (keydown)="onKeydown($event)"
    ></div>
  `,
  host: { class: 'scrap-timeline' },
})
export class ScrapTimeline {
  /** Durée totale, en secondes. */
  readonly duration = input.required({ transform: numberAttribute });
  /** Position de la tête de lecture, en secondes. */
  readonly playhead = model(0);
  /** Zone sélectionnée, en secondes ; `null` sans zone. */
  readonly selection = model<ScrapTimeRange | null>(null);
  readonly label = input('Tête de lecture');

  private drag: { start: number; x: number; moved: boolean; rect: DOMRect; id: number } | null =
    null;
  /** Bord fixe de la sélection au clavier. */
  private anchor: number | null = null;

  /** Graduations : une principale tous les « pas ronds », une secondaire entre deux. */
  protected readonly ticks = computed(() => {
    const d = this.duration();
    if (!(d > 0)) return [];
    const step = NICE_STEPS.find((s) => d / s <= 12) ?? NICE_STEPS.at(-1)!;
    const minor = step / 2;
    const out: { t: number; left: number; major: boolean; label: string }[] = [];
    for (let i = 0; i * minor < d - 1e-9; i++) {
      const t = i * minor;
      const major = i % 2 === 0;
      out.push({ t, left: (t / d) * 100, major, label: major ? clockLabel(t) : '' });
    }
    return out;
  });

  protected readonly selectionBox = computed(() => {
    const sel = this.selection();
    if (!sel) return { left: 0, width: 0 };
    const [a, b] = sel;
    return { left: this.toPercent(a), width: this.toPercent(b) - this.toPercent(a) };
  });

  protected readonly valueText = computed(() => {
    const at = `${SECONDS.format(this.playhead())} s`;
    const sel = this.selection();
    if (!sel) return at;
    return `${at}, zone de ${SECONDS.format(sel[0])} à ${SECONDS.format(sel[1])} s`;
  });

  /** Position en pourcentage de la durée, pour les repères. */
  toPercent(t: number): number {
    const d = this.duration();
    return d > 0 ? (Math.max(0, Math.min(d, t)) / d) * 100 : 0;
  }

  protected onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    const hit = event.currentTarget as HTMLElement;
    const rect = hit.getBoundingClientRect();
    hit.setPointerCapture?.(event.pointerId);
    hit.focus();
    this.anchor = null;
    this.drag = {
      start: this.timeAt(event.clientX, rect),
      x: event.clientX,
      moved: false,
      rect,
      id: event.pointerId,
    };
  }

  protected onPointerMove(event: PointerEvent): void {
    const drag = this.drag;
    if (!drag || event.pointerId !== drag.id) return;
    if (!drag.moved && Math.abs(event.clientX - drag.x) <= DRAG_THRESHOLD) return;
    drag.moved = true;
    this.select(drag.start, this.timeAt(event.clientX, drag.rect));
  }

  protected onPointerUp(event: PointerEvent): void {
    const drag = this.drag;
    if (!drag || event.pointerId !== drag.id) return;
    this.drag = null;
    (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
    if (event.type === 'pointercancel') return;
    if (!drag.moved) {
      // Un clic : la lecture va là, la zone s'efface.
      this.selection.set(null);
      this.playhead.set(drag.start);
    } else {
      const sel = this.selection();
      if (sel) this.playhead.set(sel[0]);
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    const d = this.duration();
    const at = this.playhead();
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = at + 0.1;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = at - 0.1;
        break;
      case 'PageUp':
        next = at + 1;
        break;
      case 'PageDown':
        next = at - 1;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = d;
        break;
      case 'Escape':
        if (!this.selection()) return;
        event.preventDefault();
        this.selection.set(null);
        this.anchor = null;
        return;
      default:
        return;
    }
    event.preventDefault();
    next = Math.max(0, Math.min(d, Number(next.toFixed(3))));
    if (event.shiftKey) {
      // ⇧ étend la zone depuis son bord fixe, comme une sélection de texte.
      const sel = this.selection();
      if (this.anchor === null) {
        this.anchor = sel ? (Math.abs(at - sel[0]) < 1e-6 ? sel[1] : sel[0]) : at;
      }
      this.select(this.anchor, next);
    } else {
      this.anchor = null;
    }
    this.playhead.set(next);
  }

  private select(a: number, b: number): void {
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    this.selection.set(hi - lo < MIN_SELECTION ? null : [lo, hi]);
  }

  private timeAt(clientX: number, rect: DOMRect): number {
    const d = this.duration();
    if (!rect.width) return 0;
    return Math.max(0, Math.min(d, ((clientX - rect.left) / rect.width) * d));
  }
}

/**
 * Repère numéroté sur la timeline : le début d'une passe, une note.
 * `<scrap-marker [at]="2.4">1</scrap-marker>`
 */
@Component({
  selector: 'scrap-marker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span><ng-content /></span>`,
  host: {
    class: 'scrap-marker',
    '[style.left.%]': 'timeline?.toPercent(at()) ?? 0',
  },
})
export class ScrapMarker {
  /** Position du repère, en secondes. */
  readonly at = input.required({ transform: numberAttribute });
  protected readonly timeline = inject(ScrapTimeline, { optional: true });
}
