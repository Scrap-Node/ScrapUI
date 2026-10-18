import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  ScrapHistory,
  ScrapLane,
  ScrapMarker,
  ScrapSegment,
  ScrapSegmented,
  ScrapTimeline,
  ScrapTransport,
  ScrapVuMeter,
  ScrapWaveBars,
  ScrapWaveLine,
  type ScrapHistoryItem,
  type ScrapTimeRange,
} from '@scrap-node/scrap-ui';
import { StoryCase, StoryPage } from '../story-page';
import { destroyed, oscillo, peaks } from './samples';

const DURATION = 6.4;
const ZONES = [
  [0.094, 0.344],
  [0.375, 0.594],
  [0.719, 1],
] as const;

@Component({
  selector: 'story-audio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    StoryPage,
    StoryCase,
    ScrapWaveBars,
    ScrapWaveLine,
    ScrapVuMeter,
    ScrapTransport,
    ScrapTimeline,
    ScrapLane,
    ScrapMarker,
    ScrapHistory,
    ScrapSegmented,
    ScrapSegment,
  ],
  template: `
    <story-page
      title="Audio et montage"
      lead="La forme d'onde, la lecture, la timeline et l'historique des passes. Gris l'original, cuivre ce qui est lu ou détruit, encre la tête de lecture."
    >
      <story-case
        name="Forme d'onde"
        note="Clic ou flèches du clavier pour déplacer la tête de lecture."
        [stack]="true"
      >
        <scrap-wave-bars [data]="wave" [progress]="progress()" (seek)="progress.set($event)" />
        <p class="readout">Position&nbsp;: {{ (progress() * 100).toFixed(0) }}&nbsp;%</p>
      </story-case>

      <story-case
        name="Zones détruites"
        note="Les plages altérées passent en cuivre."
        [stack]="true"
      >
        <scrap-wave-bars [data]="broken" [altered]="zones" />
      </story-case>

      <story-case
        name="Transport"
        note="Lecture, boucle, position et piste écoutée, dans une seule barre."
        [stack]="true"
      >
        <scrap-transport
          [(playing)]="playing"
          [(loop)]="loop"
          [time]="time()"
          [duration]="duration"
          (seek)="time.set($event)"
        >
          <scrap-segmented label="Piste écoutée" size="s" [(value)]="track">
            <button scrap-segment value="a">A</button>
            <button scrap-segment value="b">B</button>
          </scrap-segmented>
          <scrap-vu-meter end [level]="level()" />
        </scrap-transport>
      </story-case>

      <story-case
        name="Timeline"
        note="Cliquez pour placer la tête de lecture, glissez pour sélectionner une zone. Au clavier&nbsp;: flèches, Pg↑ et Pg↓&nbsp;; avec ⇧, ces touches étendent la zone."
        [stack]="true"
      >
        <scrap-timeline [duration]="duration" [(selection)]="selection" [(playhead)]="time">
          <scrap-lane label="A"><scrap-wave-bars [data]="lane" /></scrap-lane>
          <scrap-lane label="B"
            ><scrap-wave-bars [data]="laneBroken" [altered]="zones"
          /></scrap-lane>
          @for (zone of zones; track $index) {
            <scrap-marker [at]="zone[0] * duration">{{ $index + 1 }}</scrap-marker>
          }
        </scrap-timeline>
        <p class="readout">{{ selectionText() }}</p>
      </story-case>

      <story-case name="Oscilloscope et VU-mètre" [stack]="true">
        <scrap-wave-line [data]="scope()" />
        <scrap-vu-meter class="vu" [level]="0.72" />
      </story-case>

      <story-case
        name="Historique des passes"
        note="Cliquer une étape y ramène le fichier&nbsp;; les suivantes restent visibles, grisées, jusqu'à la prochaine action."
        [stack]="true"
      >
        <scrap-history
          label="Historique des passes"
          [items]="history"
          [current]="head()"
          (jump)="head.set($event)"
        />
      </story-case>
    </story-page>
  `,
  styles: `
    .vu {
      width: 12rem;
    }
    .readout {
      margin: 0;
      font-size: var(--scrap-fs-ui);
      color: var(--scrap-ink-muted);
    }
  `,
})
export class AudioStory {
  readonly duration = DURATION;
  readonly zones = ZONES;
  readonly wave = peaks(3, 120);
  readonly broken = destroyed(peaks(3, 120), ZONES);
  readonly lane = peaks(21, 200);
  readonly laneBroken = destroyed(this.lane, ZONES);

  readonly progress = signal(0.35);
  readonly playing = signal(false);
  readonly loop = signal(true);
  readonly track = signal('b');
  readonly time = signal(1.92);
  readonly selection = signal<ScrapTimeRange | null>([0.6, 2.2]);
  readonly scope = signal(oscillo(96));
  readonly head = signal(3);

  readonly history: ScrapHistoryItem[] = [
    { label: 'Ouverture de moteur.wav', meta: '10:02', icon: 'file', kind: 'open' },
    { label: 'Zéro, de 0,6 à 2,2 s', meta: '10:04', kind: 'destroy' },
    { label: 'XOR 0x80, de 2,4 à 3,8 s', meta: '10:07', kind: 'destroy' },
    { label: 'Écho, de 4,6 à 6,4 s', meta: '10:11', kind: 'destroy' },
    { label: 'Décalage de bits, de 1,0 à 1,8 s', meta: '10:12', kind: 'destroy' },
  ];

  /** Niveau du VU : nul à l'arrêt, suit l'enveloppe pendant la lecture. */
  readonly level = computed(() => {
    if (!this.playing()) return 0;
    const i = Math.min(
      this.lane.length - 1,
      Math.floor((this.time() / DURATION) * this.lane.length),
    );
    return Math.min(1, this.lane[i] * 0.95);
  });

  readonly selectionText = computed(() => {
    const sel = this.selection();
    const fmt = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
    return sel ? `Zone de ${fmt.format(sel[0])} à ${fmt.format(sel[1])} s` : 'Aucune zone';
  });

  private rafId = 0;

  constructor() {
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => cancelAnimationFrame(this.rafId));
    // La lecture ne démarre qu'à la demande : à l'arrêt, la story rend
    // toujours la même image pour les captures.
    let last = 0;
    const tick = (now: number) => {
      if (!this.playing()) {
        this.rafId = 0;
        return;
      }
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
      last = now;
      const [a, b] = this.loop() && this.selection() ? this.selection()! : [0, DURATION];
      let t = this.time() + dt;
      if (t >= b || t < a) t = a;
      this.time.set(t);
      this.scope.set(oscillo(96, now / 1000));
      this.rafId = requestAnimationFrame(tick);
    };
    effect(() => {
      if (this.playing() && !this.rafId) {
        last = 0;
        this.rafId = requestAnimationFrame(tick);
      }
    });
  }
}
