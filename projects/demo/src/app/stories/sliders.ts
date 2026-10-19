import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ScrapIcon, ScrapSlider, type ScrapIconName } from '@scrapnode/scrap-ui';
import { StoryCase, StoryPage } from '../story-page';

@Component({
  selector: 'story-sliders',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StoryPage, StoryCase, ScrapSlider, ScrapIcon],
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

  iconFor(v: number): ScrapIconName {
    return v === 0 ? 'mute' : v < 50 ? 'volume-low' : 'volume';
  }
}
