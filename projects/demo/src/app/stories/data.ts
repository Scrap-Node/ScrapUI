import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  ScrapBadge,
  ScrapDisclosure,
  ScrapProp,
  ScrapProps,
  ScrapTable,
} from '@scrap-node/scrap-ui';
import { StoryCase, StoryPage } from '../story-page';

interface Pass {
  readonly n: number;
  readonly operator: string;
  readonly zone: string;
  readonly bytes: string;
}

@Component({
  selector: 'story-data',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StoryPage, StoryCase, ScrapProps, ScrapProp, ScrapTable, ScrapDisclosure, ScrapBadge],
  template: `
    <story-page
      title="Données"
      lead="Des valeurs à lire d'un coup d'œil&nbsp;: chiffres tabulaires, alignés à droite, sans ornement."
    >
      <story-case name="Liste de propriétés">
        <dl scrap-props class="props">
          <div scrap-prop label="Échantillonnage" icon="waveform">48 kHz</div>
          <div scrap-prop label="Résolution">16 bits</div>
          <div scrap-prop label="Canaux">2</div>
          <div scrap-prop label="Durée" icon="clock">6,4 s</div>
          <div scrap-prop label="Taille">1,2 Mo</div>
        </dl>
      </story-case>

      <story-case
        name="Table"
        note="Dans une grille sélectionnable, la ligne choisie (aria-selected) est mise en avant&nbsp;: ici, la passe 2."
        [stack]="true"
      >
        <table scrap-table>
          <thead>
            <tr>
              <th scope="col">Passe</th>
              <th scope="col">Opérateur</th>
              <th scope="col">Zone</th>
              <th scope="col" class="num">Octets modifiés</th>
            </tr>
          </thead>
          <tbody>
            @for (p of passes; track p.n) {
              <tr [attr.aria-selected]="p.n === 2 ? 'true' : null">
                <td>{{ p.n }}</td>
                <td>{{ p.operator }}</td>
                <td class="muted">{{ p.zone }}</td>
                <td class="num">{{ p.bytes }}</td>
              </tr>
            }
          </tbody>
        </table>
      </story-case>

      <story-case
        name="Accordéon"
        note="Un details natif&nbsp;: rien à réimplémenter pour le clavier."
        [stack]="true"
      >
        <div>
          <details scrap-disclosure summary="Réglages avancés" [(open)]="advanced">
            <scrap-badge>3</scrap-badge>
            <p>
              Taille de bloc, graine et mélange. Les valeurs par défaut conviennent à la plupart des
              fichiers.
            </p>
          </details>
          <details scrap-disclosure summary="Métadonnées du fichier">
            <p>Logiciel d'origine, date d'enregistrement, marqueurs de boucle.</p>
          </details>
        </div>
      </story-case>
    </story-page>
  `,
  styles: `
    .props {
      width: 20rem;
    }
    details p {
      margin: 0;
    }
  `,
})
export class DataStory {
  readonly passes: Pass[] = [
    { n: 1, operator: 'Zéro', zone: '0,6 à 2,2 s', bytes: '153 600' },
    { n: 2, operator: 'XOR 0x80', zone: '2,4 à 3,8 s', bytes: '134 400' },
    { n: 3, operator: 'Écho', zone: '4,6 à 6,4 s', bytes: '172 800' },
  ];
  readonly advanced = signal(true);
}
