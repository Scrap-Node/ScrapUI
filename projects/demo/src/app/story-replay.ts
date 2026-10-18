import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  contentChild,
  input,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ScrapButton, ScrapIcon } from '@scrap-node/scrap-ui';

/**
 * Rejoue une animation d'entrée à la demande.
 *
 * Une animation CSS ne se déclenche qu'à l'insertion de l'élément : dans la
 * vitrine, `.scrap-stamp-in` ne se voyait donc qu'au chargement de la page, et
 * il fallait recharger pour la revoir. Ce contrôle détruit puis recrée le
 * contenu projeté, ce qui redéclenche l'animation.
 *
 * Le contenu passe par un `<ng-template>` : `ng-content` projette une vue qui
 * appartient au composant appelant, on ne peut pas la recréer d'ici.
 *
 * ```html
 * <story-replay>
 *   <ng-template>
 *     <div class="scrap-stamp-in">…</div>
 *   </ng-template>
 * </story-replay>
 * ```
 */
@Component({
  selector: 'story-replay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, ScrapButton, ScrapIcon],
  template: `
    <div class="stage">
      @for (run of runs(); track run) {
        @if (content(); as tpl) {
          <ng-container [ngTemplateOutlet]="tpl" />
        }
      }
    </div>
    <button scrap-button variant="ghost" type="button" (click)="replay()">
      <scrap-icon name="recycle" [size]="16" />
      {{ label() }}
    </button>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--scrap-space-3);
      width: 100%;
    }
    .stage {
      display: flex;
      flex-direction: column;
      gap: var(--scrap-space-3);
      width: 100%;
    }
  `,
})
export class StoryReplay {
  readonly label = input('Rejouer');

  protected readonly content = contentChild(TemplateRef);
  private readonly count = signal(0);

  /**
   * Une seule entrée, dont l'identité change à chaque relance : `track`
   * considère alors qu'il s'agit d'un autre élément, détruit le précédent et
   * en crée un neuf — l'animation repart de zéro.
   */
  protected readonly runs = computed(() => [this.count()]);

  protected replay(): void {
    this.count.update((n) => n + 1);
  }
}
