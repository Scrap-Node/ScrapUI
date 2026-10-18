import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  computed,
  inject,
  input,
} from '@angular/core';
import { ScrapIcon } from './icon';
import { ScrapIdGenerator } from './id';

/**
 * Champ de formulaire : étiquette, contrôle projeté, indice et erreur.
 *
 * Le contrôle projeté porte la directive `scrapInput`, qui se charge de lier
 * l'étiquette, l'indice et le message d'erreur au contrôle :
 *
 * ```html
 * <scrap-field label="Email" hint="Pro de préférence">
 *   <input scrapInput type="email" />
 * </scrap-field>
 * ```
 */
@Component({
  selector: 'scrap-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScrapIcon],
  template: `
    <label class="scrap-field__label" [attr.for]="controlId">
      {{ label() }}
      @if (optional()) {
        <small>{{ optional() }}</small>
      }
    </label>
    <ng-content />
    @if (hint()) {
      <small class="scrap-field__hint" [id]="hintId">{{ hint() }}</small>
    }
    @if (error()) {
      <small class="scrap-field__error" [id]="errorId" role="alert">
        <scrap-icon name="warning" [size]="14" />{{ error() }}
      </small>
    }
  `,
  host: { class: 'scrap-field' },
})
export class ScrapField {
  readonly label = input.required<string>();
  readonly hint = input<string>();
  /** Message d'erreur. Présent = le contrôle est marqué `aria-invalid`. */
  readonly error = input<string>();
  /** Mention discrète à droite de l'étiquette, « facultatif » par exemple. */
  readonly optional = input<string>();

  private readonly ids = inject(ScrapIdGenerator);
  readonly controlId = this.ids.next('scrap-field');
  readonly hintId = `${this.controlId}-hint`;
  readonly errorId = `${this.controlId}-error`;

  /** Valeur de `aria-describedby` à poser sur le contrôle. */
  readonly describedBy = computed(() => {
    const parts = [this.hint() ? this.hintId : null, this.error() ? this.errorId : null];
    const joined = parts.filter(Boolean).join(' ');
    return joined || null;
  });
}

/**
 * À poser sur le contrôle projeté dans un `<scrap-field>` : applique le style
 * de la lib et branche les liaisons ARIA vers l'étiquette et les messages.
 *
 * Sur un `<select>` ou un `<textarea>`, la classe suit l'élément.
 * Utilisable hors d'un `scrap-field` — dans ce cas elle ne fait que styler.
 */
@Directive({
  selector: '[scrapInput]',
  host: {
    '[class.scrap-input]': 'kind === "input"',
    '[class.scrap-select]': 'kind === "select"',
    '[class.scrap-textarea]': 'kind === "textarea"',
    '[attr.id]': 'controlId',
    '[attr.aria-describedby]': 'field?.describedBy() ?? null',
    '[attr.aria-invalid]': 'field?.error() ? "true" : null',
  },
})
export class ScrapInput {
  protected readonly field = inject(ScrapField, { optional: true });
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  protected readonly kind =
    this.element.tagName === 'SELECT'
      ? 'select'
      : this.element.tagName === 'TEXTAREA'
        ? 'textarea'
        : 'input';

  /**
   * Hors d'un `scrap-field`, on rend l'id que le consommateur a posé
   * lui-même : un binding qui retournerait `null` effacerait son attribut.
   */
  protected readonly controlId = this.field?.controlId ?? (this.element.id || null);
}
