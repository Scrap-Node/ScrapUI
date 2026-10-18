import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ScrapButton, ScrapIcon, ScrapTooltip } from '@scrap-node/scrap-ui';
import { StoryCase, StoryPage } from '../story-page';

@Component({
  selector: 'story-buttons',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StoryPage, StoryCase, ScrapButton, ScrapIcon, ScrapTooltip],
  template: `
    <story-page
      title="Boutons"
      lead="En pilule. Une seule action principale par zone, en cuivre&nbsp;; les autres en contour ou sans fond."
    >
      <story-case name="Variantes">
        <button scrap-button>Primaire</button>
        <button scrap-button variant="secondary">Secondaire</button>
        <button scrap-button variant="ghost">Sans fond</button>
        <button scrap-button variant="danger">Supprimer la session</button>
      </story-case>

      <story-case name="Tailles" note="24, 32 et 40 px de haut.">
        <button scrap-button size="s">Petit</button>
        <button scrap-button>Moyen</button>
        <button scrap-button size="l">Grand</button>
      </story-case>

      <story-case name="Avec icône">
        <button scrap-button><scrap-icon name="bolt" [size]="16" /> Détruire la zone</button>
        <button scrap-button variant="secondary">
          <scrap-icon name="download" [size]="16" /> Exporter le WAV
        </button>
        <button scrap-button variant="ghost">
          Passe suivante <scrap-icon name="arrow" [size]="16" />
        </button>
      </story-case>

      <story-case
        name="Icône seule"
        note="Carré, avec un aria-label&nbsp;: c'est le seul nom du bouton."
      >
        <button scrap-button variant="ghost" icon aria-label="Annuler" scrapTooltip="Annuler">
          <scrap-icon name="undo" />
        </button>
        <button scrap-button variant="secondary" icon aria-label="Rejouer" scrapTooltip="Rejouer">
          <scrap-icon name="redo" />
        </button>
        <button
          scrap-button
          icon
          aria-label="Lire"
          scrapTooltip="Lire"
          scrapTooltipShortcut="space"
        >
          <scrap-icon name="play" />
        </button>
      </story-case>

      <story-case
        name="Avec info-bulle et raccourci"
        note="Survolez ou atteignez le bouton au clavier&nbsp;: l'info-bulle nomme la commande et donne son raccourci."
      >
        <button
          scrap-button
          variant="danger"
          scrapTooltip="Détruire la zone sélectionnée"
          scrapTooltipShortcut="mod+enter"
        >
          Détruire
        </button>
      </story-case>

      <story-case name="Désactivé" note="L'attribut natif suffit&nbsp;: pas d'entrée dédiée.">
        <button scrap-button disabled>Exporter</button>
        <button scrap-button variant="secondary" disabled>Annuler</button>
        <button scrap-button variant="danger" disabled>Supprimer</button>
      </story-case>

      <story-case name="Lien" note="Le sélecteur accepte aussi les ancres.">
        <a scrap-button variant="secondary" href="#">Ouvrir la documentation</a>
      </story-case>
    </story-page>
  `,
})
export class ButtonsStory {}
