import { ChangeDetectionStrategy, Component, computed, inject, input, model } from '@angular/core';
import { ScrapIcon, type ScrapIconName } from './icon';
import { ScrapIdGenerator } from './id';
import type { ScrapTone } from './badge';

// ============================================================
// Affichage : progression, encadré, propriétés, accordéon, table
// ============================================================

/**
 * Progression d'une tâche longue (export, analyse). `value` va de 0 à 1 ;
 * sans valeur, la barre devient indéterminée.
 *
 * `<scrap-progress label="Export du WAV" [value]="0.42" />`
 */
@Component({
  selector: 'scrap-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (label()) {
      <div class="scrap-progress__top">
        <span [id]="labelId">{{ label() }}</span>
        @if (percent() !== null) {
          <output>{{ percent() }}&nbsp;%</output>
        }
      </div>
    }
    <div
      class="scrap-progress__bar"
      role="progressbar"
      aria-valuemin="0"
      aria-valuemax="100"
      [attr.aria-labelledby]="label() ? labelId : null"
      [attr.aria-label]="label() ? null : 'Progression'"
      [attr.aria-valuenow]="percent()"
    >
      <i [style.--value]="(percent() ?? 0) + '%'"></i>
    </div>
  `,
  host: {
    class: 'scrap-progress',
    '[class.scrap-progress--indeterminate]': 'percent() === null',
  },
})
export class ScrapProgress {
  readonly value = input<number | null>();
  readonly label = input<string>();

  protected readonly labelId = inject(ScrapIdGenerator).next('scrap-progress');
  protected readonly percent = computed(() => {
    const v = this.value();
    return v === null || v === undefined || Number.isNaN(v)
      ? null
      : Math.round(Math.max(0, Math.min(1, v)) * 100);
  });
}

/** Tonalités de l'encadré : celles des badges, plus `accent`. */
export type ScrapCalloutTone = Exclude<ScrapTone, 'neutral'> | 'accent';

const CALLOUT_ICON: Record<ScrapCalloutTone, ScrapIconName> = {
  info: 'info',
  success: 'check-circle',
  warning: 'warning',
  danger: 'x-circle',
  accent: 'bolt',
};

/**
 * Encadré : une information qui concerne tout l'écran, posée dans le flux.
 *
 * ```html
 * <scrap-callout tone="warning" title="Fichier compressé">
 *   Le MP3 sera décodé avant la destruction : la taille en mémoire triple.
 * </scrap-callout>
 * ```
 */
@Component({
  selector: 'scrap-callout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScrapIcon],
  template: `
    <scrap-icon [name]="icon() ?? defaultIcon()" />
    @if (title()) {
      <p class="scrap-callout__title">{{ title() }}</p>
    }
    <div class="scrap-callout__text"><ng-content /></div>
  `,
  host: {
    class: 'scrap-callout',
    '[class.scrap-callout--success]': 'tone() === "success"',
    '[class.scrap-callout--warning]': 'tone() === "warning"',
    '[class.scrap-callout--danger]': 'tone() === "danger"',
    '[class.scrap-callout--accent]': 'tone() === "accent"',
  },
})
export class ScrapCallout {
  readonly tone = input<ScrapCalloutTone>('info');
  readonly title = input<string>();
  /** Remplace l'icône de la tonalité. */
  readonly icon = input<ScrapIconName>();

  protected readonly defaultIcon = computed(() => CALLOUT_ICON[this.tone()] ?? 'info');
}

/**
 * Liste de propriétés : des paires nom et valeur, alignées.
 *
 * ```html
 * <dl scrap-props>
 *   <div scrap-prop label="Échantillonnage">48 kHz</div>
 *   <div scrap-prop label="Durée" icon="clock">6,4 s</div>
 * </dl>
 * ```
 */
@Component({
  selector: 'dl[scrap-props]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: { class: 'scrap-props' },
})
export class ScrapProps {}

/** Une propriété de `dl[scrap-props]` : son nom, et sa valeur projetée. */
@Component({
  selector: 'div[scrap-prop]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScrapIcon],
  template: `
    <dt>
      @if (icon(); as icon) {
        <scrap-icon [name]="icon" [size]="14" />
      }
      {{ label() }}
    </dt>
    <dd><ng-content /></dd>
  `,
})
export class ScrapProp {
  readonly label = input.required<string>();
  readonly icon = input<ScrapIconName>();
}

/**
 * Accordéon : du contenu secondaire, replié par défaut. Un `<details>`
 * natif : rien à réimplémenter pour le clavier ni les lecteurs d'écran.
 *
 * ```html
 * <details scrap-disclosure summary="Réglages avancés">
 *   <scrap-badge>3</scrap-badge>
 *   …
 * </details>
 * ```
 *
 * Un `scrap-badge` projeté se range au bout du titre.
 */
@Component({
  selector: 'details[scrap-disclosure]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScrapIcon],
  template: `
    <summary>
      <scrap-icon name="chevron-right" [size]="16" />
      {{ summary() }}
      <ng-content select="scrap-badge" />
    </summary>
    <div class="scrap-disclosure__body"><ng-content /></div>
  `,
  host: {
    class: 'scrap-disclosure',
    '[open]': 'open()',
    '(toggle)': 'onToggle($event)',
  },
})
export class ScrapDisclosure {
  readonly summary = input.required<string>();
  readonly open = model(false);

  protected onToggle(event: Event): void {
    this.open.set((event.target as HTMLDetailsElement).open);
  }
}

/**
 * Table de données : `<table scrap-table>`. Les cellules `.num` s'alignent
 * à droite en chiffres tabulaires ; une ligne `aria-selected="true"` est
 * mise en avant.
 */
@Component({
  selector: 'table[scrap-table]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: { class: 'scrap-table' },
})
export class ScrapTable {}
