import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SCRAP_SPLAT_NAMES, ScrapButton, ScrapSplat } from '@scrapnode/scrap-ui';
import { StoryCase, StoryPage } from '../story-page';
import { StoryReplay } from '../story-replay';

@Component({
  selector: 'story-poster',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StoryPage, StoryCase, StoryReplay, ScrapSplat, ScrapButton],
  template: `
    <story-page
      title="Affiche"
      lead="Le module facultatif pour les affiches, les pages d'accueil et les campagnes&nbsp;: grain, bords déchirés, tampons, éclaboussures. Il ne sert pas dans les outils."
    >
      <story-case name="Une affiche" [stack]="true">
        <div class="scrap-poster scrap-grain scrap-torn-bottom poster">
          <scrap-splat class="splat" name="burst" [size]="220" [rotate]="-12" />
          <span class="scrap-stamp">Nouveau</span>
          <p class="scrap-hero-title">Data Bender</p>
          <p class="tagline">Ouvrez un son. Détruisez-le proprement.</p>
          <button scrap-button>Essayer avec moteur.wav</button>
        </div>
      </story-case>

      <story-case
        name="Éclaboussures"
        note="Décoratives, jamais interactives&nbsp;; elles prennent la couleur du texte."
      >
        @for (name of splats; track name) {
          <figure>
            <scrap-splat [name]="name" [size]="96" />
            <figcaption>{{ name }}</figcaption>
          </figure>
        }
      </story-case>

      <story-case name="Tampon et trait de pinceau" [stack]="true">
        <span><span class="scrap-stamp">Détruit le 12/01</span></span>
        <hr class="scrap-rule" />
      </story-case>

      <story-case name="Curseurs" note="Survolez chaque plaque pour voir le curseur.">
        @for (c of cursors; track c.cls) {
          <div class="cursor-plate" [class]="c.cls">{{ c.label }}</div>
        }
      </story-case>

      <story-case
        name="Animations"
        note="Neutralisées sous mouvements réduits. Une animation d'entrée ne se joue qu'à l'insertion de l'élément&nbsp;: le bouton la rejoue sans recharger la page."
        [stack]="true"
      >
        <story-replay>
          <ng-template>
            <div class="plate scrap-stamp-in">Coup de tampon à l'apparition</div>
            <div class="plate scrap-reveal">Apparition au défilement</div>
          </ng-template>
        </story-replay>
        <div class="plate scrap-jitter">Tremblement au survol</div>
      </story-case>
    </story-page>
  `,
  styles: `
    .poster {
      display: grid;
      justify-items: start;
      gap: var(--scrap-space-3);
      padding: var(--scrap-space-6) var(--scrap-space-6) calc(var(--scrap-space-6) + 14px);
      border-radius: var(--scrap-radius-l) var(--scrap-radius-l) 0 0;
    }
    .splat {
      position: absolute;
      right: 4%;
      top: -10%;
      color: var(--scrap-copper);
    }
    .tagline {
      margin: 0;
      font-size: var(--scrap-fs-l);
      color: var(--scrap-steel);
    }
    figure {
      display: grid;
      justify-items: center;
      gap: var(--scrap-space-2);
      margin: 0;
      color: var(--scrap-accent);
    }
    figcaption {
      font-size: var(--scrap-fs-s);
      color: var(--scrap-ink-muted);
    }
    .cursor-plate,
    .plate {
      display: grid;
      place-items: center;
      padding: var(--scrap-space-4);
      border: 1px solid var(--scrap-line);
      border-radius: var(--scrap-radius-m);
      background: var(--scrap-sunken);
      font-size: var(--scrap-fs-ui);
    }
    .cursor-plate {
      width: 10rem;
      height: 5rem;
      text-align: center;
    }
    .plate {
      justify-items: start;
    }
    hr.scrap-rule {
      width: 100%;
      color: var(--scrap-copper);
    }
  `,
})
export class PosterStory {
  readonly splats = SCRAP_SPLAT_NAMES;
  readonly cursors = [
    { cls: 'scrap-cursor-cross', label: 'Croix de visée' },
    { cls: 'scrap-cursor-wrench', label: 'Clé à molette' },
    { cls: 'scrap-cursor-marker', label: 'Marqueur' },
    { cls: 'scrap-cursor-spray', label: 'Bombe de peinture' },
    { cls: 'scrap-cursor-gear', label: 'Engrenage' },
  ];
}
