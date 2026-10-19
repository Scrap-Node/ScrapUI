import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  ScrapButton,
  ScrapCallout,
  ScrapEmptyState,
  ScrapErrorPage,
  ScrapProgress,
  ScrapSpinner,
} from '@scrapnode/scrap-ui';
import { StoryCase, StoryPage } from '../story-page';

@Component({
  selector: 'story-feedback',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    StoryPage,
    StoryCase,
    ScrapSpinner,
    ScrapProgress,
    ScrapCallout,
    ScrapEmptyState,
    ScrapErrorPage,
    ScrapButton,
  ],
  template: `
    <story-page
      title="États"
      lead="Attendre, informer, n'avoir rien à montrer, échouer&nbsp;: les écrans qu'on oublie toujours."
    >
      <story-case
        name="Attente courte"
        note="Un anneau dont le quart cuivre tourne&nbsp;; il ralentit sous mouvements réduits."
      >
        <scrap-spinner />
        <scrap-spinner label="Analyse du fichier…" />
        <scrap-spinner [size]="32" label="Chargement de la session" />
      </story-case>

      <story-case
        name="Progression"
        note="Une tâche longue dont on connaît l'avancement, ou pas."
        [stack]="true"
      >
        <scrap-progress label="Export du WAV" [value]="progress()" />
        <scrap-progress label="Recherche des zones silencieuses" />
        <div class="row">
          <button scrap-button variant="secondary" size="s" (click)="advance()">
            Avancer de 10 %
          </button>
        </div>
      </story-case>

      <story-case
        name="Encadrés"
        note="Une information qui concerne tout l'écran, posée dans le flux."
        [stack]="true"
      >
        <scrap-callout title="Lecture seule">
          Ce fichier est partagé&nbsp;: les passes s'appliquent à une copie.
        </scrap-callout>
        <scrap-callout tone="success" title="Export terminé"
          >moteur-detruit.wav est dans le dossier exports.</scrap-callout
        >
        <scrap-callout tone="warning" title="Fichier compressé">
          Le MP3 sera décodé avant la destruction&nbsp;: la taille en mémoire triple.
        </scrap-callout>
        <scrap-callout tone="danger" title="Fichier illisible">
          L'en-tête RIFF est absent. Choisissez un WAV en PCM, de 8 à 32 bits.
        </scrap-callout>
        <scrap-callout tone="accent">Trois zones détruites sur cette piste.</scrap-callout>
      </story-case>

      <story-case name="État vide" [stack]="true">
        <scrap-empty-state title="Aucune session" message="Ouvrez un fichier WAV pour commencer.">
          <button scrap-button>Ouvrir un fichier</button>
        </scrap-empty-state>
      </story-case>

      <story-case name="Page d'erreur" [stack]="true">
        <scrap-error-page code="404" message="Cette page n'existe pas, ou plus.">
          <a scrap-button href="#">Retour à l'atelier</a>
        </scrap-error-page>
      </story-case>
    </story-page>
  `,
  styles: `
    .row {
      display: flex;
      gap: var(--scrap-space-2);
    }
  `,
})
export class FeedbackStory {
  readonly progress = signal(0.42);

  advance(): void {
    this.progress.update((p) => (p >= 1 ? 0 : Math.min(1, Math.round((p + 0.1) * 100) / 100)));
  }
}
