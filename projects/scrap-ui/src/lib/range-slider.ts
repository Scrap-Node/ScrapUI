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
 * Curseur double : une plage réglée par deux poignées sur une même piste
 * (bande de fréquences, fenêtre de temps). La partie entre les poignées est en
 * cuivre, et une poignée ne passe jamais l'autre.
 *
 * ```html
 * <scrap-range-slider label="Bande visée" [(low)]="bas" [(high)]="haut"
 *                     [max]="1000" showValue [format]="enHertz" />
 * ```
 *
 * Avec les formulaires Angular, la valeur est le couple `[bas, haut]`.
 */
@Component({
  selector: 'scrap-range-slider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ScrapRangeSlider),
      multi: true,
    },
  ],
  template: `
    @if (showValue()) {
      <div class="scrap-slider__top">
        <span [id]="labelId">{{ label() }}</span>
        <output class="scrap-slider__value">{{ valueText() }}</output>
      </div>
    }
    <div class="scrap-slider__row">
      @if (showBounds()) {
        <span class="scrap-slider__bound" aria-hidden="true">{{ display(min()) }}</span>
      }
      <div class="scrap-range-slider__track" [style.--lo]="lowRatio()" [style.--hi]="highRatio()">
        <input
          class="scrap-range-slider__input"
          type="range"
          [class.is-front]="lowInFront()"
          [min]="min()"
          [max]="max()"
          [step]="step()"
          [value]="low()"
          [disabled]="isDisabled()"
          [attr.aria-label]="lowLabel()"
          [attr.aria-valuetext]="withUnit(low())"
          (input)="onLow($event)"
          (blur)="onTouched()"
        />
        <input
          class="scrap-range-slider__input"
          type="range"
          [min]="min()"
          [max]="max()"
          [step]="step()"
          [value]="high()"
          [disabled]="isDisabled()"
          [attr.aria-label]="highLabel()"
          [attr.aria-valuetext]="withUnit(high())"
          (input)="onHigh($event)"
          (blur)="onTouched()"
        />
      </div>
      @if (showBounds()) {
        <span class="scrap-slider__bound" aria-hidden="true">{{ display(max()) }}</span>
      }
    </div>
  `,
  host: {
    class: 'scrap-slider scrap-range-slider',
    role: 'group',
    '[attr.aria-labelledby]': 'showValue() ? labelId : null',
    '[attr.aria-label]': 'showValue() ? null : label()',
    '[class.scrap-slider--disabled]': 'isDisabled()',
  },
})
export class ScrapRangeSlider implements ControlValueAccessor {
  /** Borne basse de la plage. */
  readonly low = model(0);
  /** Borne haute de la plage. */
  readonly high = model(100);
  readonly min = input(0);
  readonly max = input(100);
  readonly step = input(1);
  readonly showBounds = input(true, { transform: booleanAttribute });
  /** Affiche l'étiquette et la plage au-dessus de la piste. */
  readonly showValue = input(false, { transform: booleanAttribute });
  /** Unité accolée aux valeurs affichées : `Hz`, `s`… */
  readonly unit = input<string>();
  /** Mise en forme des nombres, comme sur `scrap-slider`. L'unité s'ajoute après. */
  readonly format = input<(value: number) => string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Nom de la plage : visible avec `showValue`, accessible dans tous les cas. */
  readonly label = input.required<string>();
  /** Nom annoncé pour la poignée basse, dans le groupe nommé par `label`. */
  readonly lowLabel = input('Minimum');
  /** Nom annoncé pour la poignée haute. */
  readonly highLabel = input('Maximum');

  private readonly ids = inject(ScrapIdGenerator);
  protected readonly labelId = `${this.ids.next('scrap-range-slider')}-label`;

  private readonly disabledByForm = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.disabledByForm());

  protected readonly lowRatio = computed(() => this.ratio(this.low()));
  protected readonly highRatio = computed(() => this.ratio(this.high()));

  /**
   * Poignées confondues : seule celle du dessus se saisit. En haut de la piste
   * la poignée haute ne peut plus monter, c'est donc la basse qui doit passer
   * devant ; en bas, l'inverse.
   */
  protected readonly lowInFront = computed(() => this.low() > (this.min() + this.max()) / 2);

  protected readonly valueText = computed(
    () => `${this.withUnit(this.low())} à ${this.withUnit(this.high())}`,
  );

  protected display(value: number): string {
    const format = this.format();
    if (format) return format(value);
    return NUMBER.format(value).replace(/\u202f/g, '\u00a0');
  }

  protected withUnit(value: number): string {
    const unit = this.unit();
    return unit ? `${this.display(value)}\u00a0${unit}` : this.display(value);
  }

  protected onLow(event: Event): void {
    const input = event.target as HTMLInputElement;
    const next = Math.min(Number(input.value), this.high());
    // La poignée basse bute sur la haute : le contrôle natif doit suivre.
    if (String(next) !== input.value) input.value = String(next);
    this.low.set(next);
    this.onChange([next, this.high()]);
  }

  protected onHigh(event: Event): void {
    const input = event.target as HTMLInputElement;
    const next = Math.max(Number(input.value), this.low());
    if (String(next) !== input.value) input.value = String(next);
    this.high.set(next);
    this.onChange([this.low(), next]);
  }

  private ratio(value: number): number {
    const span = this.max() - this.min() || 1;
    return Math.max(0, Math.min(1, (value - this.min()) / span));
  }

  // ControlValueAccessor : la valeur est le couple [bas, haut]
  private onChange: (value: [number, number]) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  writeValue(value: readonly [number, number] | null): void {
    if (!value) return;
    this.low.set(Number(value[0]));
    this.high.set(Number(value[1]));
  }

  registerOnChange(fn: (value: [number, number]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledByForm.set(isDisabled);
  }
}
