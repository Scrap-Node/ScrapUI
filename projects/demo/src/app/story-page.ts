import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

/**
 * Gabarit commun à toutes les stories : titre, chapeau, et blocs de démo.
 *
 * Les stories sont volontairement déterministes (aucun `Math.random`, aucune
 * animation en boucle par défaut) : elles servent aussi de référence aux
 * tests de régression visuelle.
 */
@Component({
  selector: 'story-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article>
      <h1>{{ title() }}</h1>
      @if (lead()) {
        <p class="lead">{{ lead() }}</p>
      }
      <ng-content />
    </article>
  `,
  styles: `
    :host {
      display: block;
      max-width: 72rem;
      margin: 0 auto;
      padding: var(--scrap-space-6) var(--scrap-space-5) var(--scrap-space-6);
    }
    h1 {
      margin: 0 0 var(--scrap-space-2);
      font: var(--scrap-weight-title) var(--scrap-fs-h1) / 1.2 var(--scrap-font-display);
      letter-spacing: var(--scrap-tracking-title);
      color: var(--scrap-ink-strong);
    }
    .lead {
      max-width: 64ch;
      margin: 0 0 var(--scrap-space-6);
      color: var(--scrap-ink-muted);
      font-size: var(--scrap-fs-l);
      line-height: 1.5;
    }
  `,
})
export class StoryPage {
  readonly title = input.required<string>();
  readonly lead = input<string>();
}

/** Un cas de démonstration isolé, avec sa légende. */
@Component({
  selector: 'story-case',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2>{{ name() }}</h2>
    @if (note()) {
      <p class="note">{{ note() }}</p>
    }
    <div class="stage" [class.stack]="stack()">
      <ng-content />
    </div>
  `,
  styles: `
    :host {
      display: block;
      margin-bottom: var(--scrap-space-6);
    }
    h2 {
      margin: 0 0 var(--scrap-space-1);
      font: var(--scrap-weight-strong) var(--scrap-fs-h3) / 1.3 var(--scrap-font-display);
      color: var(--scrap-ink-strong);
    }
    .note {
      max-width: 64ch;
      margin: 0 0 var(--scrap-space-3);
      color: var(--scrap-ink-muted);
      font-size: var(--scrap-fs-ui);
    }
    .stage {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--scrap-space-4);
      margin-top: var(--scrap-space-3);
      padding: var(--scrap-space-5);
      border: 1px solid var(--scrap-line);
      border-radius: var(--scrap-radius-l);
      background: var(--scrap-surface);
    }
    .stage.stack {
      flex-direction: column;
      align-items: stretch;
    }
  `,
})
export class StoryCase {
  readonly name = input.required<string>();
  readonly note = input<string>();
  /** Empile les cas verticalement plutôt qu'en ligne. */
  readonly stack = input(false, { transform: booleanAttribute });
}
