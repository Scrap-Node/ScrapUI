import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ScrapButton, ScrapModal, ScrapToast, type ScrapTone } from '@scrapnode/scrap-ui';
import { StoryCase, StoryPage } from '../story-page';

@Component({
  selector: 'story-overlays',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StoryPage, StoryCase, ScrapButton, ScrapModal],
  template: `
    <story-page
      title="Modale et toasts"
      lead="La modale s'appuie sur le <dialog> natif&nbsp;: piège de focus, Échap et arrière-plan inerte sont fournis par le navigateur."
    >
      <story-case name="Modale" note="Pour une décision qui ne peut pas attendre, et rien d'autre.">
        <button scrap-button variant="secondary" (click)="open.set(true)">Ouvrir la modale</button>
        <scrap-modal [(open)]="open" title="Supprimer la session&nbsp;?">
          <p>Les trois passes et l'export seront effacés. Le fichier d'origine reste intact.</p>
          <div actions>
            <button scrap-button variant="secondary" (click)="open.set(false)">Annuler</button>
            <button scrap-button variant="danger" (click)="remove()">Supprimer</button>
          </div>
        </scrap-modal>
      </story-case>

      <story-case
        name="Toasts"
        note="Quatre au plus&nbsp;; la pile se met en pause au survol et au focus. Les erreurs sont annoncées tout de suite, le reste poliment."
      >
        @for (t of tones; track t.tone) {
          <button scrap-button variant="secondary" (click)="notify(t.tone)">{{ t.label }}</button>
        }
      </story-case>

      <story-case
        name="Toast avec action"
        note="Il reste six secondes à l'écran, le temps de revenir en arrière."
      >
        <button scrap-button (click)="applyPass()">Appliquer une passe</button>
        <p class="readout">Passes appliquées&nbsp;: {{ passes() }}</p>
      </story-case>
    </story-page>
  `,
  styles: `
    .readout {
      margin: 0;
      font-size: var(--scrap-fs-ui);
      color: var(--scrap-ink-muted);
    }
  `,
})
export class OverlaysStory {
  private readonly toast = inject(ScrapToast);
  readonly open = signal(false);
  readonly passes = signal(3);

  readonly tones: { tone: ScrapTone; label: string; message: string }[] = [
    { tone: 'neutral', label: 'Neutre', message: 'Session enregistrée en brouillon' },
    { tone: 'info', label: 'Information', message: 'Le fichier est en lecture seule' },
    { tone: 'success', label: 'Succès', message: 'Export terminé' },
    { tone: 'warning', label: 'Avertissement', message: 'La zone dépasse la fin du fichier' },
    { tone: 'danger', label: 'Erreur', message: 'Export impossible\u00a0: disque plein' },
  ];

  notify(tone: ScrapTone): void {
    const entry = this.tones.find((t) => t.tone === tone);
    if (entry) this.toast.show(entry.message, tone);
  }

  remove(): void {
    this.open.set(false);
    this.toast.show('Session supprimée', 'success');
  }

  applyPass(): void {
    this.passes.update((n) => n + 1);
    const n = this.passes();
    this.toast.show(`Passe ${n} appliquée`, 'success', {
      action: { label: 'Annuler', run: () => this.passes.update((p) => p - 1) },
    });
  }
}
