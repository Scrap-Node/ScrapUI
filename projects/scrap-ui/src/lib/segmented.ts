import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  contentChildren,
  forwardRef,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** Un segment de `scrap-segmented` : `<button scrap-segment value="a">A</button>`. */
@Component({
  selector: 'button[scrap-segment]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    type: 'button',
    role: 'radio',
    '[attr.aria-checked]': 'checked()',
    '[attr.tabindex]': 'tabbable() ? 0 : -1',
    '[disabled]': 'isDisabled()',
    '(click)': 'group?.select(value())',
  },
})
export class ScrapSegment<T = unknown> {
  readonly value = input.required<T>();
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly element = inject<ElementRef<HTMLButtonElement>>(ElementRef).nativeElement;
  protected readonly group = inject(
    forwardRef(() => ScrapSegmented),
    { optional: true },
  );

  readonly checked = computed(() => !!this.group && Object.is(this.group.value(), this.value()));
  readonly isDisabled = computed(() => this.disabled() || !!this.group?.isDisabled());
  protected readonly tabbable = computed(() => !this.group || this.group.tabbable() === this);
}

/**
 * Contrôle segmenté : un choix exclusif entre deux à cinq options courtes,
 * toutes visibles. Le segment choisi est à l'encre.
 *
 * ```html
 * <scrap-segmented label="Piste écoutée" [(value)]="piste" size="s">
 *   <button scrap-segment value="a">A</button>
 *   <button scrap-segment value="b">B</button>
 * </scrap-segmented>
 * ```
 *
 * Exposé comme un groupe de boutons radio : Tab entre sur le segment
 * choisi, les flèches changent le choix. Utilisable avec les formulaires
 * Angular.
 */
@Component({
  selector: 'scrap-segmented',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ScrapSegmented),
      multi: true,
    },
  ],
  host: {
    class: 'scrap-segmented',
    role: 'radiogroup',
    '[class.scrap-segmented--s]': 'size() === "s"',
    '[attr.aria-label]': 'label()',
    '[attr.aria-disabled]': 'isDisabled() || null',
    '(keydown)': 'onKeydown($event)',
    '(focusout)': 'onFocusOut($event)',
  },
})
export class ScrapSegmented<T = unknown> implements ControlValueAccessor {
  readonly value = model<T>(undefined as T);
  readonly label = input.required<string>();
  readonly size = input<'s' | 'm'>('m');
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly segments = contentChildren(ScrapSegment, { descendants: true });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly disabledByForm = signal(false);
  readonly isDisabled = computed(() => this.disabled() || this.disabledByForm());

  /** Le segment qui reçoit le focus à l'entrée : le choisi, sinon le premier disponible. */
  readonly tabbable = computed(() => {
    const enabled = this.segments().filter((s) => !s.disabled());
    return enabled.find((s) => s.checked()) ?? enabled[0] ?? null;
  });

  select(value: T): void {
    if (this.isDisabled() || Object.is(value, this.value())) return;
    this.value.set(value);
    this.onChange(value);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const enabled = this.segments().filter((s) => !s.isDisabled());
    const current = enabled.findIndex((s) => s.element === event.target);
    if (current < 0) return;
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = (current + 1) % enabled.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = (current - 1 + enabled.length) % enabled.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = enabled.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    const segment = enabled[next];
    this.select(segment.value() as T);
    segment.element.focus();
  }

  protected onFocusOut(event: FocusEvent): void {
    if (!this.host.contains(event.relatedTarget as Node | null)) this.onTouched();
  }

  // --- ControlValueAccessor ---
  // Rappels neutres tant que le composant n'est pas relié à un formulaire.
  private onChange: (value: T) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: T): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: T) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabledByForm.set(disabled);
  }
}
