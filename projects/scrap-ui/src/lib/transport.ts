import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  model,
  output,
} from '@angular/core';
import { ScrapIcon } from './icon';
import { ScrapIconButton } from './icon-button';

const CLOCK = new Intl.NumberFormat('fr-FR', {
  minimumIntegerDigits: 2,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Temps en `mm:ss,cc` (`h:mm:ss,cc` au-delà d'une heure) : `00:06,40`.
 * Les centièmes sont tronqués, pas arrondis : 6,399 s s'affiche 00:06,39.
 */
export function formatClock(seconds: number): string {
  const t = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const centi = Math.floor(t * 100 + 1e-6) / 100;
  const h = Math.floor(centi / 3600);
  const m = Math.floor((centi % 3600) / 60);
  const s = centi - h * 3600 - m * 60;
  const mm = String(m).padStart(2, '0');
  const ss = CLOCK.format(s);
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * Position de lecture, en chiffres tabulaires : elle ne tremble pas
 * pendant la lecture.
 *
 * `<scrap-timecode [time]="position()" [duration]="duree()" />`
 */
@Component({
  selector: 'scrap-timecode',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `{{ clock() }}
    @if (total(); as total) {
      <small>/ {{ total }}</small>
    }`,
  host: { class: 'scrap-timecode', role: 'timer' },
})
export class ScrapTimecode {
  readonly time = input(0);
  readonly duration = input<number>();

  protected readonly clock = computed(() => formatClock(this.time()));
  protected readonly total = computed(() => {
    const d = this.duration();
    return d === undefined ? null : formatClock(d);
  });
}

/**
 * Barre de transport : retour au début, lecture, boucle et position, plus
 * ce qu'on y projette (piste écoutée, zoom).
 *
 * ```html
 * <scrap-transport
 *   [playing]="lecture()" (playingChange)="basculer()"
 *   [(loop)]="boucle"
 *   [time]="position()" [duration]="duree()"
 *   (seek)="aller($event)">
 *   <scrap-segmented label="Piste écoutée" size="s" [(value)]="piste">…</scrap-segmented>
 *   <scrap-vu-meter end [level]="niveau()" />
 * </scrap-transport>
 * ```
 *
 * Le bouton de lecture, à l'encre, est le plus grand : c'est la commande la
 * plus fréquente. Ce qui porte l'attribut `end` se range à droite.
 *
 * La lecture est pilotée par le parent : un clic émet `playingChange` avec
 * l'état voulu, sans que le bouton change de lui-même. Il ne passe sur
 * « Pause » que quand `playing` devient vrai : une lecture qui n'a pas pu
 * démarrer le laisse sur « Lire ». `[(playing)]` suffit quand la bascule ne
 * peut pas échouer.
 */
@Component({
  selector: 'scrap-transport',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScrapIcon, ScrapIconButton, ScrapTimecode],
  template: `
    @if (showStart()) {
      <button scrap-icon-button label="Retour au début" (click)="seek.emit(0)">
        <scrap-icon name="skip-back" />
      </button>
    }
    <button
      class="scrap-transport__play"
      type="button"
      [attr.aria-label]="playing() ? 'Pause' : 'Lire'"
      (click)="playingChange.emit(!playing())"
    >
      <scrap-icon [name]="playing() ? 'pause' : 'play'" />
    </button>
    @if (showLoop()) {
      <button scrap-icon-button label="Boucle" [pressed]="loop()" (click)="loop.set(!loop())">
        <scrap-icon name="loop" />
      </button>
    }
    <scrap-timecode [time]="time()" [duration]="duration()" />
    <ng-content />
    <div class="scrap-transport__end"><ng-content select="[end]" /></div>
  `,
  host: { class: 'scrap-transport' },
})
export class ScrapTransport {
  /** Lecture en cours, telle que le parent la constate. */
  readonly playing = input(false);
  /** Bascule demandée au clic : l'état voulu, l'inverse de `playing`. */
  readonly playingChange = output<boolean>();
  readonly loop = model(false);
  /** Position de lecture, en secondes. */
  readonly time = input(0);
  /** Durée totale, en secondes. */
  readonly duration = input<number>();
  readonly showStart = input(true, { transform: booleanAttribute });
  readonly showLoop = input(true, { transform: booleanAttribute });
  /** Position demandée, en secondes : 0 pour « Retour au début ». */
  readonly seek = output<number>();
}
