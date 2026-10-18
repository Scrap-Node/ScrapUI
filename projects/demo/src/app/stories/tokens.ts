import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ScrapButton, ScrapBadge } from '@comechaslerie/scrap-ui';
import { StoryCase, StoryPage } from '../story-page';

interface Swatch {
  readonly name: string;
  readonly token: string;
}

@Component({
  selector: 'story-tokens',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StoryPage, StoryCase, ScrapButton, ScrapBadge],
  template: `
    <story-page
      title="Fondations"
      lead="La palette de la charte, ses rôles nommés par usage, la typographie et les mesures. Tout passe par des variables CSS --scrap-*, en clair et en sombre."
    >
      <story-case
        name="Palette de la charte"
        note="Cinq couleurs, et trois états tirés du même esprit. On ne les emploie pas directement&nbsp;: on passe par les rôles."
      >
        @for (c of palette; track c.token) {
          <figure>
            <span class="swatch" [style.background]="'var(' + c.token + ')'"></span>
            <figcaption>
              <strong>{{ c.name }}</strong>
              <code>{{ c.token }}</code>
            </figcaption>
          </figure>
        }
      </story-case>

      <story-case
        name="Surfaces et encres"
        note="Chaque rôle porte sa valeur claire et sa valeur sombre."
      >
        @for (c of surfaces; track c.token) {
          <figure>
            <span class="swatch" [style.background]="'var(' + c.token + ')'"></span>
            <figcaption>
              <strong>{{ c.name }}</strong>
              <code>{{ c.token }}</code>
            </figcaption>
          </figure>
        }
      </story-case>

      <story-case name="Rôles et états">
        @for (c of roles; track c.token) {
          <figure>
            <span class="swatch" [style.background]="'var(' + c.token + ')'"></span>
            <figcaption>
              <strong>{{ c.name }}</strong>
              <code>{{ c.token }}</code>
            </figcaption>
          </figure>
        }
      </story-case>

      <story-case
        name="Données"
        note="Dans les outils&nbsp;: gris l'original, cuivre ce qui est altéré, encre la lecture, bleu-gris la boucle."
      >
        @for (c of data; track c.token) {
          <figure>
            <span class="swatch" [style.background]="'var(' + c.token + ')'"></span>
            <figcaption>
              <strong>{{ c.name }}</strong>
              <code>{{ c.token }}</code>
            </figcaption>
          </figure>
        }
      </story-case>

      <story-case
        name="Échelle typographique"
        note="Helvetica pour les titres, Arial pour le texte."
        [stack]="true"
      >
        <p class="type" style="font-size: var(--scrap-fs-display)">Détruire proprement</p>
        <p class="type" style="font-size: var(--scrap-fs-h1)">Titre de page, 28 px</p>
        <p class="type" style="font-size: var(--scrap-fs-h2)">Titre de section, 22 px</p>
        <p class="type" style="font-size: var(--scrap-fs-h3)">Titre de bloc, 18 px</p>
        <p class="text">Texte courant en 14 px&nbsp;: les commandes, les champs, les listes.</p>
        <p class="text small">
          Texte secondaire en 12 px&nbsp;: indices, métadonnées, horodatages.
        </p>
      </story-case>

      <story-case name="Espacements et rayons" [stack]="true">
        @for (s of spaces; track s) {
          <div class="space-row">
            <code>--scrap-space-{{ s }}</code>
            <span class="bar" [style.width]="'var(--scrap-space-' + s + ')'"></span>
          </div>
        }
        <div class="radii">
          @for (r of radii; track r) {
            <span class="radius" [style.border-radius]="'var(--scrap-radius-' + r + ')'">
              <code>{{ r }}</code>
            </span>
          }
        </div>
      </story-case>

      <story-case
        name="Thème par zone"
        note="data-scrap-theme force un thème sur une zone&nbsp;: un panneau sombre dans une page claire, ou l'inverse."
      >
        <div class="zone" data-scrap-theme="dark">
          <p>Zone forcée en sombre</p>
          <button scrap-button>Exporter</button>
          <scrap-badge tone="accent">Détruit</scrap-badge>
        </div>
        <div class="zone" data-scrap-theme="light">
          <p>Zone forcée en clair</p>
          <button scrap-button>Exporter</button>
          <scrap-badge tone="accent">Détruit</scrap-badge>
        </div>
      </story-case>
    </story-page>
  `,
  styles: `
    figure {
      display: grid;
      align-self: start;
      gap: var(--scrap-space-2);
      width: 10.5rem;
      margin: 0;
    }
    .swatch {
      display: block;
      height: 4.5rem;
      border-radius: var(--scrap-radius-m);
      box-shadow: inset 0 0 0 1px var(--scrap-line);
    }
    figcaption {
      display: grid;
      gap: 2px;
      font-size: var(--scrap-fs-s);
      color: var(--scrap-ink-muted);
    }
    figcaption strong {
      color: var(--scrap-ink);
    }
    .type {
      margin: 0;
      font-family: var(--scrap-font-display);
      font-weight: var(--scrap-weight-title);
      letter-spacing: var(--scrap-tracking-title);
      line-height: 1.2;
      color: var(--scrap-ink-strong);
    }
    .text {
      margin: 0;
      font-size: var(--scrap-fs-ui);
    }
    .text.small {
      font-size: var(--scrap-fs-s);
      color: var(--scrap-ink-muted);
    }
    .space-row {
      display: flex;
      align-items: center;
      gap: var(--scrap-space-3);
      font-size: var(--scrap-fs-s);
    }
    .space-row code {
      min-width: 10rem;
      color: var(--scrap-ink-muted);
    }
    .bar {
      display: inline-block;
      height: 12px;
      border-radius: 2px;
      background: var(--scrap-accent);
    }
    .radii {
      display: flex;
      gap: var(--scrap-space-3);
      margin-top: var(--scrap-space-2);
    }
    .radius {
      display: grid;
      place-items: center;
      width: 4.5rem;
      height: 3rem;
      border: 1px solid var(--scrap-line-strong);
      background: var(--scrap-sunken);
      font-size: var(--scrap-fs-s);
    }
    .zone {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--scrap-space-3);
      padding: var(--scrap-space-4);
      border-radius: var(--scrap-radius-l);
      border: 1px solid var(--scrap-line);
      background: var(--scrap-surface);
      color: var(--scrap-ink);
    }
    .zone p {
      margin: 0;
      flex-basis: 100%;
      font-size: var(--scrap-fs-s);
      color: var(--scrap-ink-muted);
    }
  `,
})
export class TokensStory {
  readonly palette: Swatch[] = [
    { name: 'Noir', token: '--scrap-black' },
    { name: 'Brun écorce', token: '--scrap-bark' },
    { name: 'Cuivre', token: '--scrap-copper' },
    { name: 'Bleu-gris', token: '--scrap-steel' },
    { name: 'Blanc', token: '--scrap-white' },
    { name: 'Rouille', token: '--scrap-rust' },
    { name: 'Mousse', token: '--scrap-moss' },
    { name: 'Ocre', token: '--scrap-ochre' },
  ];

  readonly surfaces: Swatch[] = [
    { name: 'Fond', token: '--scrap-bg' },
    { name: 'Surface', token: '--scrap-surface' },
    { name: 'En relief', token: '--scrap-raised' },
    { name: 'En creux', token: '--scrap-sunken' },
    { name: 'Encre', token: '--scrap-ink' },
    { name: 'Encre atténuée', token: '--scrap-ink-muted' },
    { name: 'Filet', token: '--scrap-line' },
  ];

  readonly roles: Swatch[] = [
    { name: 'Accent', token: '--scrap-accent' },
    { name: 'Focus', token: '--scrap-focus' },
    { name: 'Erreur', token: '--scrap-danger' },
    { name: 'Succès', token: '--scrap-success' },
    { name: 'Alerte', token: '--scrap-warning' },
    { name: 'Information', token: '--scrap-info' },
  ];

  readonly data: Swatch[] = [
    { name: 'Original', token: '--scrap-data-original' },
    { name: 'Altéré', token: '--scrap-data-altered' },
    { name: 'Tête de lecture', token: '--scrap-data-playhead' },
    { name: 'Boucle', token: '--scrap-data-loop' },
  ];

  readonly spaces = [1, 2, 3, 4, 5, 6];
  readonly radii = ['s', 'm', 'l', 'xl'];
}
