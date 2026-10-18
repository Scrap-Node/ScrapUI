import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ScrapProp, ScrapProps, ScrapTab, ScrapTabs } from '@scrap-node/scrap-ui';
import { StoryCase, StoryPage } from '../story-page';

@Component({
  selector: 'story-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StoryPage, StoryCase, ScrapTabs, ScrapTab, ScrapProps, ScrapProp],
  template: `
    <story-page
      title="Onglets"
      lead="Plusieurs vues d'un même objet. Au clavier&nbsp;: flèches, Origine, Fin&nbsp;; Tab sort de la barre en un seul pas."
    >
      <story-case name="Fiche de session" [stack]="true">
        <scrap-tabs label="Fiche de session">
          <scrap-tab label="Propriétés">
            <dl scrap-props>
              <div scrap-prop label="Échantillonnage">48 kHz</div>
              <div scrap-prop label="Résolution">16 bits</div>
              <div scrap-prop label="Durée">6,4 s</div>
            </dl>
          </scrap-tab>
          <scrap-tab label="Historique">
            <p>Trois passes depuis l'ouverture. Dernière passe&nbsp;: écho, à 10:11.</p>
          </scrap-tab>
          <scrap-tab label="Fichier">
            <p>sessions/moteur.wav, enregistré dans l'atelier le 12 janvier.</p>
          </scrap-tab>
        </scrap-tabs>
      </story-case>

      <story-case name="Onglet unique" [stack]="true">
        <scrap-tabs label="Résumé">
          <scrap-tab label="Résumé">
            <p>Un seul onglet&nbsp;: la barre reste, le contenu s'affiche.</p>
          </scrap-tab>
        </scrap-tabs>
      </story-case>
    </story-page>
  `,
  styles: `
    p {
      margin: 0;
      font-size: var(--scrap-fs-ui);
    }
    dl {
      max-width: 22rem;
    }
  `,
})
export class TabsStory {}
