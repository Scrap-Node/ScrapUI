import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  model,
  numberAttribute,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ScrapIcon } from './icon';
import { ScrapIdGenerator } from './id';

/** Pixels de glissement pour un pas. */
const PX_PER_STEP = 3;
/** En deçà, un appui sur l'étiquette est un clic, pas un glissement. */
const DRAG_THRESHOLD = 2;

function decimalsOf(step: number): number {
  const text = String(step);
  if (text.includes('e-')) return Number(text.split('e-')[1]);
  return text.includes('.') ? text.split('.')[1].length : 0;
}

/**
 * Champ numérique : une valeur précise, avec bornes, pas et unité.
 *
 * ```html
 * <scrap-number-field label="Densité" unit="%" [min]="0" [max]="100" [(value)]="densite" />
 * ```
 *
 * Glisser l'étiquette vers la droite ou la gauche règle la valeur, comme
 * dans les logiciels de création. Dans le champ, ↑ et ↓ avancent d'un pas
 * (⇧ de dix), Entrée valide, Échap rend la valeur d'avant. La saisie
 * accepte la virgule comme le point.
 */
@Component({
  selector: 'scrap-number-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScrapIcon],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ScrapNumberField),
      multi: true,
    },
  ],
  template: `
    <!-- Le glissement est un raccourci : le champ reste réglable au clavier. -->
    <label
      class="scrap-number__label"
      [attr.for]="inputId"
      (pointerdown)="onScrubStart($event)"
      (pointermove)="onScrubMove($event)"
      (pointerup)="onScrubEnd($event)"
      (pointercancel)="onScrubEnd($event)"
      >{{ label() }}</label
    >
    <div class="scrap-number__box">
      <button
        class="scrap-number__step"
        type="button"
        data-step="-1"
        tabindex="-1"
        aria-label="Diminuer"
        [disabled]="isDisabled() || value() <= min()"
        (click)="nudge(-1, $event.shiftKey)"
      >
        <scrap-icon name="minus" [size]="10" />
      </button>
      <input
        #field
        type="text"
        inputmode="decimal"
        autocomplete="off"
        spellcheck="false"
        role="spinbutton"
        [id]="inputId"
        [value]="text()"
        [disabled]="isDisabled()"
        [attr.aria-valuenow]="value()"
        [attr.aria-valuemin]="isFinite(min()) ? min() : null"
        [attr.aria-valuemax]="isFinite(max()) ? max() : null"
        [attr.aria-valuetext]="valueText()"
        (focus)="onFocus()"
        (blur)="onBlur()"
        (keydown)="onKeydown($event)"
      />
      @if (unit()) {
        <span class="scrap-number__unit" aria-hidden="true">{{ unit() }}</span>
      }
      <button
        class="scrap-number__step"
        type="button"
        data-step="1"
        tabindex="-1"
        aria-label="Augmenter"
        [disabled]="isDisabled() || value() >= max()"
        (click)="nudge(1, $event.shiftKey)"
      >
        <scrap-icon name="plus" [size]="10" />
      </button>
    </div>
  `,
  host: {
    class: 'scrap-number',
    '[class.is-scrubbing]': 'scrubbing()',
  },
})
export class ScrapNumberField implements ControlValueAccessor {
  readonly value = model(0);
  readonly label = input.required<string>();
  readonly min = input(-Infinity, { transform: numberAttribute });
  readonly max = input(Infinity, { transform: numberAttribute });
  readonly step = input(1, { transform: numberAttribute });
  /** Unité accolée à la valeur : `%`, `o`, `Hz`… */
  readonly unit = input<string>();
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly inputId = inject(ScrapIdGenerator).next('scrap-number');
  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');

  private readonly disabledByForm = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.disabledByForm());
  protected readonly scrubbing = signal(false);
  protected readonly isFinite = Number.isFinite;

  private readonly format = computed(
    () =>
      new Intl.NumberFormat('fr-FR', {
        useGrouping: false,
        minimumFractionDigits: decimalsOf(this.step()),
        maximumFractionDigits: decimalsOf(this.step()),
      }),
  );

  /** Valeur telle qu'écrite dans le champ : `2,5`, sans séparateur de milliers. */
  protected readonly text = computed(() => this.format().format(this.value()));

  protected readonly valueText = computed(() => {
    const unit = this.unit();
    return unit ? `${this.text()}\u00a0${unit}` : this.text();
  });

  /** Valeur au moment du focus, rendue par Échap. */
  private initial = 0;
  private scrub: { x: number; start: number; moved: boolean; id: number } | null = null;

  /** Avance de `direction` pas, de dix avec ⇧. */
  protected nudge(direction: 1 | -1, large: boolean): void {
    this.commit(this.value() + direction * this.step() * (large ? 10 : 1));
  }

  protected onFocus(): void {
    this.initial = this.value();
  }

  protected onBlur(): void {
    this.commitText();
    this.onTouched();
  }

  protected onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowDown':
        event.preventDefault();
        this.commitText();
        this.nudge(event.key === 'ArrowUp' ? 1 : -1, event.shiftKey);
        break;
      case 'PageUp':
      case 'PageDown':
        event.preventDefault();
        this.commitText();
        this.nudge(event.key === 'PageUp' ? 1 : -1, true);
        break;
      case 'Enter':
        event.preventDefault();
        this.commitText();
        this.initial = this.value();
        this.field().nativeElement.select();
        break;
      case 'Escape':
        event.preventDefault();
        this.commit(this.initial);
        this.field().nativeElement.select();
        break;
    }
  }

  protected onScrubStart(event: PointerEvent): void {
    if (this.isDisabled() || event.button !== 0) return;
    // Pas de sélection de texte ni de focus pendant le glissement.
    event.preventDefault();
    const label = event.currentTarget as HTMLElement;
    label.setPointerCapture?.(event.pointerId);
    this.scrub = { x: event.clientX, start: this.value(), moved: false, id: event.pointerId };
  }

  protected onScrubMove(event: PointerEvent): void {
    const scrub = this.scrub;
    if (!scrub || event.pointerId !== scrub.id) return;
    const dx = event.clientX - scrub.x;
    if (!scrub.moved && Math.abs(dx) <= DRAG_THRESHOLD) return;
    scrub.moved = true;
    this.scrubbing.set(true);
    const steps = Math.round(dx / PX_PER_STEP) * (event.shiftKey ? 10 : 1);
    this.commit(scrub.start + steps * this.step());
  }

  protected onScrubEnd(event: PointerEvent): void {
    const scrub = this.scrub;
    if (!scrub || event.pointerId !== scrub.id) return;
    this.scrub = null;
    this.scrubbing.set(false);
    (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
    // Un simple clic sur l'étiquette donne le focus au champ, comme toute étiquette.
    if (!scrub.moved && event.type === 'pointerup') this.field().nativeElement.focus();
    else if (scrub.moved) this.onTouched();
  }

  /** Lit le texte saisi ; une saisie illisible rend la valeur courante. */
  private commitText(): void {
    const raw = this.field()
      .nativeElement.value.replace(/[\s\u00a0\u202f]/g, '')
      .replace(',', '.');
    const parsed = raw === '' ? NaN : Number(raw);
    this.commit(Number.isFinite(parsed) ? parsed : this.value());
  }

  /** Borne, arrondit au pas, publie. */
  private commit(next: number): void {
    const min = this.min();
    const max = this.max();
    const step = this.step() > 0 ? this.step() : 1;
    const origin = Number.isFinite(min) ? min : 0;
    let value = origin + Math.round((next - origin) / step) * step;
    value = Math.min(max, Math.max(min, value));
    value = Number(value.toFixed(decimalsOf(step)));
    // Le champ réaffiche la valeur retenue, même si elle n'a pas changé.
    this.field().nativeElement.value = this.format().format(value);
    if (value === this.value()) return;
    this.value.set(value);
    this.onChange(value);
  }

  // --- ControlValueAccessor ---
  // Rappels neutres tant que le composant n'est pas relié à un formulaire.
  private onChange: (value: number) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: number | null): void {
    this.value.set(value ?? 0);
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabledByForm.set(disabled);
  }
}
