import { booleanAttribute, ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { ScrapIdGenerator } from './id';

/**
 * Panneau d'inspecteur : un titre et ses actions en tête, des réglages qui
 * défilent, un pied d'actions qui reste à portée.
 *
 * ```html
 * <aside scrapShellAside aria-label="Réglages">
 *   <scrap-panel title="Propriétés">
 *     <button scrap-icon-button actions label="Plus d'options">…</button>
 *     <details scrap-disclosure summary="Signal">…</details>
 *     <div footer>
 *       <button scrap-button variant="secondary">Annuler</button>
 *       <button scrap-button>Détruire</button>
 *     </div>
 *   </scrap-panel>
 * </aside>
 * ```
 *
 * Il prend la hauteur de son parent. Les emplacements laissés vides ne
 * prennent pas de place.
 */
@Component({
  selector: 'scrap-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="scrap-panel__head">
      @if (title()) {
        <h2 class="scrap-panel__title" [id]="titleId">{{ title() }}</h2>
      }
      <ng-content select="[actions]" />
    </div>
    <div class="scrap-panel__body"><ng-content /></div>
    <div class="scrap-panel__foot"><ng-content select="[footer]" /></div>
  `,
  host: {
    class: 'scrap-panel',
    '[attr.role]': "title() ? 'region' : null",
    '[attr.aria-labelledby]': 'title() ? titleId : null',
  },
})
export class ScrapPanel {
  readonly title = input<string>();
  protected readonly titleId = inject(ScrapIdGenerator).next('scrap-panel-title');
}

/**
 * Onglet du document ouvert : son nom, et une pastille cuivre dès qu'il
 * diffère de ce qui est enregistré. Il ne se clique pas : les outils
 * n'ouvrent qu'un document à la fois.
 *
 * `<scrap-doc-tab [modified]="passes() > 0">moteur.wav</scrap-doc-tab>`
 */
@Component({
  selector: 'scrap-doc-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (modified()) {
      <span class="scrap-doctab__dot" role="img" [attr.aria-label]="modifiedLabel()"></span>
    }
    <span class="scrap-doctab__name"><ng-content /></span>
  `,
  host: { class: 'scrap-doctab', '[class.scrap-doctab--modified]': 'modified()' },
})
export class ScrapDocTab {
  readonly modified = input(false, { transform: booleanAttribute });
  readonly modifiedLabel = input('Modifié');
}
