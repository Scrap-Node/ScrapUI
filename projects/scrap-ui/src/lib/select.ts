import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  booleanAttribute,
  computed,
  contentChildren,
  forwardRef,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ScrapIcon } from './icon';
import { ScrapIdGenerator } from './id';
import { Typeahead, hidePopover, placeBelow, showPopover } from './popover';

/**
 * Une option de `scrap-select`. Le texte projeté est son libellé ;
 * `description` ajoute une ligne d'aide, visible seulement dans la liste.
 */
@Component({
  selector: 'scrap-option',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span>
      <span data-label><ng-content /></span>
      @if (description()) {
        <small>{{ description() }}</small>
      }
    </span>
  `,
  host: {
    class: 'scrap-menu__item',
    role: 'option',
    tabindex: '-1',
    '[id]': 'id',
    '[attr.aria-selected]': 'selected()',
    '[attr.aria-disabled]': 'disabled() || null',
    '(click)': 'choose()',
  },
})
export class ScrapOption<T = unknown> {
  readonly value = input.required<T>();
  readonly description = input<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Libellé affiché dans le bouton, si le texte projeté ne convient pas. */
  readonly label = input<string>();

  readonly id = inject(ScrapIdGenerator).next('scrap-option');
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly select = inject(
    forwardRef(() => ScrapSelect),
    { optional: true },
  );

  readonly selected = computed(() => !!this.select && Object.is(this.select.value(), this.value()));

  /** Libellé de l'option, sans sa description. */
  labelText(): string {
    const text = this.element.querySelector('[data-label]')?.textContent;
    return this.label() ?? text?.trim() ?? '';
  }

  protected choose(): void {
    if (!this.disabled()) this.select?.choose(this);
  }
}

/**
 * Liste déroulante : un choix parmi des options qui ont chacune un nom et,
 * au besoin, une ligne d'aide.
 *
 * ```html
 * <scrap-select label="Opérateur" formControlName="operateur">
 *   @for (op of operateurs; track op.id) {
 *     <scrap-option [value]="op.id" [description]="op.aide">{{ op.nom }}</scrap-option>
 *   }
 * </scrap-select>
 * ```
 *
 * Utilisable avec `[(value)]` ou les formulaires Angular. Au clavier : ↓ et
 * ↑ ouvrent la liste sur l'option choisie, une lettre va à l'option qui
 * commence par elle, Entrée choisit, Échap referme sans rien changer.
 */
@Component({
  selector: 'scrap-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScrapIcon],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ScrapSelect),
      multi: true,
    },
  ],
  template: `
    <label
      class="scrap-field__label"
      [class.scrap-sr-only]="hideLabel()"
      [id]="labelId"
      [attr.for]="buttonId"
      >{{ label() }}</label
    >
    <button
      #button
      class="scrap-select-btn"
      type="button"
      aria-haspopup="listbox"
      [id]="buttonId"
      [attr.aria-expanded]="open()"
      [attr.aria-controls]="listId"
      [attr.aria-labelledby]="labelId + ' ' + buttonId"
      [disabled]="isDisabled()"
      (pointerdown)="wasOpen = open()"
      (click)="onTriggerClick($event)"
      (keydown)="onTriggerKeydown($event)"
      (blur)="onBlur($event)"
    >
      <span>{{ display() }}</span>
      <scrap-icon name="chevrons-up-down" [size]="16" />
    </button>
    <!-- Le focus passe d'option en option : la liste elle-même n'en prend pas. -->
    <!-- eslint-disable-next-line @angular-eslint/template/interactive-supports-focus -->
    <div
      #list
      class="scrap-menu"
      popover="auto"
      role="listbox"
      [id]="listId"
      [attr.aria-labelledby]="labelId"
      (toggle)="onToggle($event)"
      (keydown)="onListKeydown($event)"
      (focusout)="onBlur($event)"
    >
      <ng-content />
    </div>
  `,
  host: { class: 'scrap-field' },
})
export class ScrapSelect<T = unknown> implements ControlValueAccessor {
  readonly value = model<T>(undefined as T);
  readonly label = input.required<string>();
  /** Garde l'étiquette pour les lecteurs d'écran, sans l'afficher. */
  readonly hideLabel = input(false, { transform: booleanAttribute });
  readonly placeholder = input('Choisir…');
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly options = contentChildren(ScrapOption, { descendants: true });

  private readonly ids = inject(ScrapIdGenerator);
  protected readonly buttonId = this.ids.next('scrap-select');
  protected readonly labelId = `${this.buttonId}-label`;
  protected readonly listId = `${this.buttonId}-list`;

  private readonly button = viewChild.required<ElementRef<HTMLButtonElement>>('button');
  private readonly list = viewChild.required<ElementRef<HTMLElement>>('list');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);
  private readonly typeahead = new Typeahead();

  protected readonly open = signal(false);
  protected wasOpen = false;

  private readonly disabledByForm = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.disabledByForm());

  /** Texte du bouton : le libellé de l'option choisie, sinon l'invite. */
  protected display(): string {
    const value = this.value();
    const option = this.options().find((o) => Object.is(o.value(), value));
    return option ? option.labelText() : this.placeholder();
  }

  /** Choisit une option et referme la liste. */
  choose(option: ScrapOption<unknown>): void {
    const next = option.value() as T;
    if (!Object.is(next, this.value())) {
      this.value.set(next);
      this.onChange(next);
    }
    this.close(true);
  }

  protected onTriggerClick(event: MouseEvent): void {
    const wasOpen = this.wasOpen;
    this.wasOpen = false;
    if (wasOpen && event.detail > 0) return;
    if (this.open()) this.close(true);
    else this.show('selected');
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    this.show(event.key === 'ArrowUp' ? 'last' : 'selected');
  }

  protected onToggle(event: Event): void {
    if ((event as ToggleEvent).newState === 'closed') this.open.set(false);
  }

  protected onListKeydown(event: KeyboardEvent): void {
    const options = this.enabledOptions();
    const current = options.findIndex((o) => o.element === this.document.activeElement);
    let next = -1;
    switch (event.key) {
      case 'ArrowDown':
        next = Math.min(options.length - 1, current + 1);
        break;
      case 'ArrowUp':
        next = Math.max(0, current - 1);
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = options.length - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (options[current]) this.choose(options[current]);
        return;
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        this.close(true);
        return;
      case 'Tab':
        this.close(false);
        return;
      default:
        if (event.key.length === 1 && /\S/.test(event.key) && !event.metaKey && !event.ctrlKey) {
          next = this.typeahead.find(
            event.key,
            options.map((o) => o.labelText()),
            current,
          );
        }
    }
    if (next < 0 || !options[next]) return;
    event.preventDefault();
    options[next].element.focus();
  }

  protected onBlur(event: FocusEvent): void {
    // Touché quand le focus quitte le composant, pas en passant du bouton à la liste.
    if (!this.host.contains(event.relatedTarget as Node | null)) this.onTouched();
  }

  private enabledOptions(): ScrapOption<unknown>[] {
    return this.options().filter((o) => !o.disabled());
  }

  private show(focus: 'selected' | 'last'): void {
    if (this.isDisabled()) return;
    const list = this.list().nativeElement;
    if (!this.open()) {
      if (!showPopover(list)) return;
      this.open.set(true);
    }
    placeBelow(this.button().nativeElement, list, true);
    const options = this.enabledOptions();
    const target =
      focus === 'last' ? options.at(-1) : (options.find((o) => o.selected()) ?? options[0]);
    target?.element.focus();
  }

  private close(restoreFocus: boolean): void {
    hidePopover(this.list().nativeElement);
    this.open.set(false);
    if (restoreFocus) this.button().nativeElement.focus();
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
