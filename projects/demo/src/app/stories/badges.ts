import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ScrapBadge, type ScrapBadgeTone } from '@scrapnode/scrap-ui';
import { StoryCase, StoryPage } from '../story-page';

@Component({
  selector: 'story-badges',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StoryPage, StoryCase, ScrapBadge],
  template: `
    <story-page
      title="Badges"
      lead="Un état ou une catégorie, en un mot. L'accent cuivre marque ce qui a été détruit ou modifié."
    >
      <story-case name="Tonalités">
        @for (tone of tones; track tone.tone) {
          <scrap-badge [tone]="tone.tone">{{ tone.label }}</scrap-badge>
        }
      </story-case>

      <story-case
        name="Pastilles"
        note="Pour un état qui évolue&nbsp;: une pastille colorée sur un fond teinté."
      >
        <scrap-badge tone="warning" dot>En cours</scrap-badge>
        <scrap-badge tone="success" dot>Exporté</scrap-badge>
        <scrap-badge tone="info" dot>En attente</scrap-badge>
        <scrap-badge tone="danger" dot>Échec</scrap-badge>
        <scrap-badge tone="accent" dot>Modifié</scrap-badge>
      </story-case>

      <story-case name="Dans un texte">
        <p class="line">
          moteur.wav <scrap-badge tone="accent">Détruit</scrap-badge>, impact.wav
          <scrap-badge tone="warning" dot>En cours</scrap-badge>, relais.wav
          <scrap-badge tone="success">Prêt</scrap-badge>
        </p>
      </story-case>
    </story-page>
  `,
  styles: `
    .line {
      margin: 0;
      font-size: var(--scrap-fs-ui);
      line-height: 2;
    }
  `,
})
export class BadgesStory {
  readonly tones: { tone: ScrapBadgeTone; label: string }[] = [
    { tone: 'neutral', label: 'Brouillon' },
    { tone: 'accent', label: 'Détruit' },
    { tone: 'info', label: 'Information' },
    { tone: 'success', label: 'Prêt' },
    { tone: 'warning', label: 'À vérifier' },
    { tone: 'danger', label: 'Illisible' },
  ];
}
