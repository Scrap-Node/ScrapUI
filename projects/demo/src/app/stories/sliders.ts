import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ScrapIcon, ScrapRangeSlider, ScrapSlider, type ScrapIconName } from '@scrapnode/scrap-ui';
import { StoryCase, StoryPage } from '../story-page';

const TENTHS = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const KHZ = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

@Component({
  selector: 'story-sliders',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StoryPage, StoryCase, ScrapSlider, ScrapRangeSlider, ScrapIcon],
  template: `
    <story-page
      title="Curseurs"
      lead="Une valeur continue&nbsp;: volume, densité, zoom. La partie réglée est en cuivre&nbsp;; les nombres suivent l'usage français."
    >
      <story-case name="Avec icône de volume" [stack]="true">
        @for (v of volumes; track v.label) {
          <scrap-slider [(value)]="v.value" [label]="v.label">
            <scrap-icon icon [name]="iconFor(v.value())" />
          </scrap-slider>
        }
      </story-case>

      <story-case name="Étiquette et valeur affichées" [stack]="true">
        <scrap-slider [(value)]="density" label="Densité" showValue unit="%" [showBounds]="false" />
        <scrap-slider
          [(value)]="offset"
          label="Décalage"
          showValue
          unit="s"
          [min]="0"
          [max]="6.4"
          [step]="0.1"
          [showBounds]="false"
        />
      </story-case>

      <story-case
        name="Crans"
        note="Les crans suivent le pas tant qu'il en reste moins de 20."
        [stack]="true"
      >
        <scrap-slider
          [(value)]="block"
          label="Taille de bloc"
          [min]="64"
          [max]="1024"
          [step]="64"
          ticks
        />
        <scrap-slider [(value)]="fine" label="Réglage fin" ticks />
      </story-case>

      <story-case
        name="Valeur mise en forme"
        note="Une fonction met en forme la valeur et les bornes&nbsp;; l'unité s'ajoute après."
        [stack]="true"
      >
        <scrap-slider
          [(value)]="mask"
          label="Masque XOR"
          showValue
          [min]="1"
          [max]="255"
          [format]="hex"
        />
        <scrap-slider
          [(value)]="preRoll"
          label="Pré-roll"
          showValue
          unit="s"
          [min]="0"
          [max]="100"
          [format]="tenths"
        />
      </story-case>

      <story-case
        name="Curseur double"
        note="Une plage, deux poignées sur la même piste&nbsp;; une poignée ne passe jamais l'autre."
        [stack]="true"
      >
        <scrap-range-slider
          label="Bande visée"
          showValue
          [(low)]="bandLow"
          [(high)]="bandHigh"
          [max]="1000"
          [format]="hertz"
        />
        <scrap-range-slider
          label="Fenêtre"
          showValue
          unit="s"
          [(low)]="windowLow"
          [(high)]="windowHigh"
          [max]="60"
        />
      </story-case>

      <story-case name="Sans bornes, désactivé" [stack]="true">
        <scrap-slider [(value)]="bare" [showBounds]="false" label="Sans bornes" />
        <scrap-slider [(value)]="locked" disabled label="Verrouillé" />
      </story-case>
    </story-page>
  `,
})
export class SlidersStory {
  readonly volumes = [
    { label: 'Volume maximal', value: signal(100) },
    { label: 'Volume moyen', value: signal(58) },
    { label: 'Volume coupé', value: signal(0) },
  ];

  readonly density = signal(35);
  readonly offset = signal(2.4);
  readonly block = signal(512);
  readonly fine = signal(42);
  readonly bare = signal(25);
  readonly locked = signal(65);
  readonly mask = signal(255);
  readonly preRoll = signal(20);
  readonly bandLow = signal(180);
  readonly bandHigh = signal(720);
  readonly windowLow = signal(12);
  readonly windowHigh = signal(38);

  readonly hex = (v: number) => `0x${v.toString(16).toUpperCase().padStart(2, '0')}`;
  readonly tenths = (v: number) => TENTHS.format(v / 10);
  /** Position 0 à 1000 sur une échelle logarithmique, de 20 Hz à 20 kHz. */
  readonly hertz = (v: number) => {
    const hz = 20 * Math.pow(1000, v / 1000);
    return hz < 1000 ? `${Math.round(hz)}\u00a0Hz` : `${KHZ.format(hz / 1000)}\u00a0kHz`;
  };

  iconFor(v: number): ScrapIconName {
    return v === 0 ? 'mute' : v < 50 ? 'volume-low' : 'volume';
  }
}
