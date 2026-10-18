import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SCRAP_ICON_NAMES, ScrapIcon } from '@comechaslerie/scrap-ui';
import { StoryCase, StoryPage } from '../story-page';

@Component({
  selector: 'story-iconography',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StoryPage, StoryCase, ScrapIcon],
  template: `
    <story-page
      title="Icônes"
      lead="Un set au trait sur une grille de 20, dessiné pour les outils de création. Les noms sont typés&nbsp;: une faute de frappe ne compile pas."
    >
      <story-case [name]="'Le set complet, ' + icons.length + ' icônes'">
        <div class="grid">
          @for (name of icons; track name) {
            <figure>
              <scrap-icon [name]="name" [size]="20" />
              <figcaption>{{ name }}</figcaption>
            </figure>
          }
        </div>
      </story-case>

      <story-case
        name="Tailles"
        note="14 px dans les barres d'état, 16 et 20 px dans les commandes, 40 px pour un écran vide."
      >
        <scrap-icon name="waveform" [size]="14" />
        <scrap-icon name="waveform" [size]="16" />
        <scrap-icon name="waveform" [size]="20" />
        <scrap-icon name="waveform" [size]="28" />
        <scrap-icon name="waveform" [size]="40" />
      </story-case>

      <story-case name="Couleur" note="Les icônes prennent la couleur du texte qui les entoure.">
        <span class="tint" style="color: var(--scrap-ink)"><scrap-icon name="bolt" /> Encre</span>
        <span class="tint" style="color: var(--scrap-accent-text)"
          ><scrap-icon name="bolt" /> Accent</span
        >
        <span class="tint" style="color: var(--scrap-danger-text)"
          ><scrap-icon name="warning" /> Erreur</span
        >
        <span class="tint" style="color: var(--scrap-success-text)"
          ><scrap-icon name="check-circle" /> Succès</span
        >
      </story-case>

      <story-case
        name="Annoncée ou décorative"
        note="Sans label, l'icône est ignorée par les lecteurs d'écran&nbsp;; avec, elle devient une image nommée."
      >
        <scrap-icon name="volume" label="Volume" />
        <code>&lt;scrap-icon name="volume" label="Volume" /&gt;</code>
      </story-case>
    </story-page>
  `,
  styles: `
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(7.5rem, 1fr));
      gap: var(--scrap-space-1);
      width: 100%;
    }
    figure {
      display: flex;
      align-items: center;
      gap: var(--scrap-space-2);
      min-width: 0;
      margin: 0;
      padding: 6px 8px;
      border-radius: var(--scrap-radius-m);
      color: var(--scrap-ink);
    }
    figure:hover {
      background: var(--scrap-hover);
    }
    figcaption {
      overflow: hidden;
      font-size: var(--scrap-fs-s);
      color: var(--scrap-ink-muted);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .tint {
      display: inline-flex;
      align-items: center;
      gap: var(--scrap-space-2);
      font-size: var(--scrap-fs-ui);
    }
    code {
      font-size: var(--scrap-fs-s);
      color: var(--scrap-ink-muted);
    }
  `,
})
export class IconographyStory {
  readonly icons = SCRAP_ICON_NAMES;
}
