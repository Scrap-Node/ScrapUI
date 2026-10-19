import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ScrapBadge, ScrapButton, ScrapCard, ScrapIcon, ScrapWaveBars } from '@scrapnode/scrap-ui';
import { StoryCase, StoryPage } from '../story-page';
import { peaks } from './samples';

interface Session {
  readonly file: string;
  readonly meta: string;
  readonly seed: number;
  readonly state?: 'Détruit' | 'Prêt';
}

@Component({
  selector: 'story-cards',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StoryPage, StoryCase, ScrapCard, ScrapButton, ScrapIcon, ScrapBadge, ScrapWaveBars],
  template: `
    <story-page
      title="Cartes"
      lead="Un objet qu'on ouvre ou qu'on choisit&nbsp;: un fichier, une session, une recette. Les emplacements laissés vides ne prennent pas de place."
    >
      <story-case name="Complète" note="Aperçu, titre, action, texte et pied.">
        <scrap-card title="moteur.wav" style="width: 22rem">
          <button scrap-button variant="ghost" icon actions aria-label="Options de moteur.wav">
            <scrap-icon name="more" />
          </button>
          <scrap-wave-bars media [data]="wave" />
          48 kHz, 16 bits, 6,4 s. Trois passes appliquées.
          <div footer>
            <button scrap-button variant="secondary" size="s">Dupliquer</button>
            <button scrap-button size="s">Ouvrir</button>
          </div>
        </scrap-card>
      </story-case>

      <story-case name="Texte seul">
        <scrap-card title="Recette, bavure aux coupes" style="width: 22rem">
          Zéro sur les attaques, puis un écho court. À essayer sur des percussions.
        </scrap-card>
        <scrap-card style="width: 22rem">Une carte sans titre&nbsp;: du contenu libre.</scrap-card>
      </story-case>

      <story-case
        name="Choisir dans une grille"
        note="aria-selected met en avant la carte choisie."
      >
        <div class="grid" role="listbox" aria-label="Sessions">
          @for (s of sessions; track s.file) {
            <scrap-card
              class="scrap-card--interactive"
              role="option"
              tabindex="0"
              [title]="s.file"
              [attr.aria-selected]="s.file === chosen()"
              (click)="chosen.set(s.file)"
              (keydown.enter)="chosen.set(s.file)"
              (keydown.space)="chosen.set(s.file); $event.preventDefault()"
            >
              <scrap-wave-bars media [data]="wavesBySeed[s.seed]" />
              <span class="meta">
                {{ s.meta }}
                @if (s.state) {
                  <scrap-badge [tone]="s.state === 'Détruit' ? 'accent' : 'success'">{{
                    s.state
                  }}</scrap-badge>
                }
              </span>
            </scrap-card>
          }
        </div>
      </story-case>
    </story-page>
  `,
  styles: `
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
      gap: var(--scrap-space-4);
      width: 100%;
    }
    .meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--scrap-space-2);
      font-size: var(--scrap-fs-s);
    }
  `,
})
export class CardsStory {
  readonly wave = peaks(3, 90);
  readonly sessions: Session[] = [
    { file: 'moteur.wav', meta: '6,4 s, 48 kHz', seed: 3, state: 'Détruit' },
    { file: 'impact.wav', meta: '1,2 s, 44,1 kHz', seed: 11 },
    { file: 'relais.wav', meta: '12,8 s, 48 kHz', seed: 21, state: 'Prêt' },
  ];
  readonly wavesBySeed: Record<number, number[]> = Object.fromEntries(
    this.sessions.map((s) => [s.seed, peaks(s.seed, 60)]),
  );
  readonly chosen = signal('impact.wav');
}
