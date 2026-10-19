import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ScrapIdGenerator } from './id';

const NUMBER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 });

/**
 * Curseur de réglage : une valeur continue (volume, densité, zoom). La
 * partie réglée est en cuivre.
 *
 * ```html
 * <scrap-slider [(value)]="volume" label="Volume">
 *   <scrap-icon icon name="volume" />
 * </scrap-slider>
 * <scrap-slider [(value)]="densite" label="Densité" showValue unit="%" />
 * <scrap-slider [(value)]="masque" label="Masque XOR" showValue [format]="enHexa" />
 * ```
 *
 * Utilisable aussi avec les formulaires Angular (`formControlName`,
 * `[(ngModel)]`) : le composant implémente `ControlValueAccessor`.
 */
@Component({
  selector: 'scrap-slider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ScrapSlider),
      multi: true,
    },
  ],
  template: `
    @if (showValue()) {
      <div class="scrap-slider__top">
        <span [id]="labelId">{{ label() }}</span>
        <output class="scrap-slider__value" [attr.for]="inputId">{{ valueText() }}</output>
      </div>
    }
    <div class="scrap-slider__row">
      <ng-content select="[icon]" />
      @if (showBounds()) {
        <span class="scrap-slider__bound" aria-hidden="true">{{ display(min()) }}</span>
      }
      <div class="scrap-slider__track">
        @if (ticks()) {
          <div class="scrap-slider__ticks" aria-hidden="true">
            @for (t of tickList(); track t) {
              <i class="scrap-slider__tick" [class.on]="!isDisabled() && t <= ratio() + 1e-6"></i>
            }
          </div>
        }
        <input
          class="scrap-range"
          type="range"
          [id]="inputId"
          [min]="min()"
          [max]="max()"
          [step]="step()"
          [value]="value()"
          [disabled]="isDisabled()"
          [attr.aria-label]="showValue() ? null : label()"
          [attr.aria-labelledby]="showValue() ? labelId : null"
          [attr.aria-valuetext]="valueText()"
          [style.--fill]="isDisabled() ? '0' : ratio()"
          (input)="onInput($event)"
          (blur)="onTouched()"
        />
      </div>
      @if (showBounds()) {
        <span class="scrap-slider__bound" aria-hidden="true">{{ display(max()) }}</span>
      }
    </div>
  `,
  host: {
    class: 'scrap-slider',
    '[class.scrap-slider--disabled]': 'isDisabled()',
  },
})
export class ScrapSlider implements ControlValueAccessor {
  readonly value = model(0);
  readonly min = input(0);
  readonly max = input(100);
  readonly step = input(1);
  /** Affiche des crans régulièrement espacés (suit `step` si <= 20 crans, sinon 10). */
  readonly ticks = input(false, { transform: booleanAttribute });
  readonly showBounds = input(true, { transform: booleanAttribute });
  /** Affiche l'étiquette et la valeur au-dessus de la piste. */
  readonly showValue = input(false, { transform: booleanAttribute });
  /** Unité accolée à la valeur affichée : `%`, `s`, `o`… */
  readonly unit = input<string>();
  /**
   * Mise en forme des nombres : valeur, bornes et texte annoncé. Par défaut,
   * l'usage français. Pour un masque en hexadécimal, des dixièmes affichés en
   * secondes, une échelle logarithmique… L'unité s'ajoute après.
   */
  readonly format = input<(value: number) => string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Étiquette du curseur : visible avec `showValue`, accessible dans tous les cas. */
  readonly label = input<string>();

  private readonly ids = inject(ScrapIdGenerator);
  protected readonly inputId = this.ids.next('scrap-slider');
  protected readonly labelId = `${this.inputId}-label`;

  /** Désactivation via l'entrée `disabled` ou via `FormControl.disable()`. */
  private readonly disabledByForm = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.disabledByForm());

  protected readonly ratio = computed(() => {
    const span = this.max() - this.min() || 1;
    return Math.max(0, Math.min(1, (this.value() - this.min()) / span));
  });

  protected readonly valueText = computed(() => {
    const unit = this.unit();
    // Espace insécable entre la valeur et l'unité, comme le veut l'usage.
    return unit ? `${this.display(this.value())}\u00a0${unit}` : this.display(this.value());
  });

  protected readonly tickList = computed(() => {
    const span = this.max() - this.min() || 1;
    const byStep = span / this.step();
    const n = byStep >= 2 && byStep <= 20 ? byStep : 10;
    return Array.from({ length: n + 1 }, (_, i) => i / n);
  });

  protected display(value: number): string {
    const format = this.format();
    if (format) return format(value);
    // Espace fine insécable des milliers → espace insécable : présente dans
    // toutes les polices, et le nombre ne se coupe jamais en fin de ligne.
    return NUMBER.format(value).replace(/\u202f/g, '\u00a0');
  }

  protected onInput(event: Event): void {
    const next = Number((event.target as HTMLInputElement).value);
    this.value.set(next);
    this.onChange(next);
  }

  // --- ControlValueAccessor ---
  // Rappels neutres tant que le composant n'est pas relié à un FormControl :
  // Angular les remplace via registerOnChange / registerOnTouched.
  protected onTouched: () => void = () => undefined;
  private onChange: (value: number) => void = () => undefined;

  writeValue(value: number | null): void {
    this.value.set(value ?? 0);
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledByForm.set(isDisabled);
  }
}
