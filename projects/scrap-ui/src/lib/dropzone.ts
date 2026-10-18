import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ScrapIcon } from './icon';
import { ScrapIdGenerator } from './id';

/**
 * Vrai si le fichier correspond à la liste `accept` d'un `<input type="file">` :
 * extensions (`.wav`), types (`audio/wav`) ou familles (`audio/*`).
 */
export function acceptsFile(file: File, accept: string | null | undefined): boolean {
  const rules = (accept ?? '')
    .split(',')
    .map((r) => r.trim().toLowerCase())
    .filter(Boolean);
  if (!rules.length) return true;
  const name = file.name.toLowerCase();
  const type = (file.type ?? '').toLowerCase();
  return rules.some((rule) => {
    if (rule.startsWith('.')) return name.endsWith(rule);
    if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1));
    return type === rule;
  });
}

/**
 * Zone de dépôt : on y lâche un fichier, ou on clique pour le choisir.
 *
 * ```html
 * <scrap-dropzone
 *   accept=".wav"
 *   hint="WAV en PCM, de 8 à 32 bits."
 *   [error]="erreur()"
 *   (files)="ouvrir($event)"
 *   (rejected)="refuser($event)" />
 * ```
 *
 * Les fichiers qui ne correspondent pas à `accept` sortent par `rejected` :
 * à l'appli de dire pourquoi, dans `error`.
 */
@Component({
  selector: 'scrap-dropzone',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScrapIcon],
  template: `
    <scrap-icon name="upload" [size]="28" />
    <strong [id]="labelId">{{ label() }}</strong>
    @if (hint()) {
      <small [id]="hintId">{{ hint() }}</small>
    }
    @if (error()) {
      <small class="scrap-dropzone__error" role="alert" [id]="errorId">{{ error() }}</small>
    }
    <ng-content />
    <input
      type="file"
      [accept]="accept() ?? ''"
      [multiple]="multiple()"
      [disabled]="disabled()"
      [attr.aria-labelledby]="labelId"
      [attr.aria-describedby]="describedBy()"
      [attr.aria-invalid]="error() ? 'true' : null"
      (change)="onChange($event)"
    />
  `,
  host: {
    class: 'scrap-dropzone',
    '[class.is-over]': 'over()',
    '[class.is-error]': '!!error()',
    '(dragenter)': 'onDragOver($event)',
    '(dragover)': 'onDragOver($event)',
    '(dragleave)': 'onDragLeave($event)',
    '(drop)': 'onDrop($event)',
  },
})
export class ScrapDropzone {
  readonly label = input('Déposez un fichier ici, ou cliquez pour le choisir');
  readonly hint = input<string>();
  /** Message d'erreur, affiché sous l'indice et annoncé. */
  readonly error = input<string | null>();
  /** Même syntaxe que l'attribut `accept` d'un champ fichier. */
  readonly accept = input<string>();
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Fichiers acceptés, déposés ou choisis. */
  readonly files = output<File[]>();
  /** Fichiers écartés par `accept`. */
  readonly rejected = output<File[]>();

  private readonly ids = inject(ScrapIdGenerator);
  protected readonly labelId = this.ids.next('scrap-dropzone');
  protected readonly hintId = `${this.labelId}-hint`;
  protected readonly errorId = `${this.labelId}-error`;

  protected readonly over = signal(false);

  protected describedBy(): string | null {
    const ids = [this.hint() ? this.hintId : null, this.error() ? this.errorId : null];
    return ids.filter(Boolean).join(' ') || null;
  }

  protected onDragOver(event: DragEvent): void {
    if (this.disabled()) return;
    // Sans ça, le navigateur ouvrirait le fichier à la place de la page.
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    this.over.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    const host = event.currentTarget as HTMLElement;
    if (!host.contains(event.relatedTarget as Node | null)) this.over.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.over.set(false);
    if (this.disabled()) return;
    this.handle([...(event.dataTransfer?.files ?? [])]);
  }

  protected onChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.handle([...(input.files ?? [])]);
    // Choisir deux fois le même fichier doit relancer l'import.
    input.value = '';
  }

  private handle(list: File[]): void {
    const files = this.multiple() ? list : list.slice(0, 1);
    if (!files.length) return;
    const accepted = files.filter((f) => acceptsFile(f, this.accept()));
    const rejected = files.filter((f) => !accepted.includes(f));
    if (accepted.length) this.files.emit(accepted);
    if (rejected.length) this.rejected.emit(rejected);
  }
}
