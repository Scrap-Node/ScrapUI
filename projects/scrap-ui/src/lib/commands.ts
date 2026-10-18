import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  Injectable,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ScrapIcon, type ScrapIconName } from './icon';
import { ScrapIdGenerator } from './id';
import { formatShortcut, isMacPlatform, isTypingTarget, matchesShortcut } from './kbd';
import { fold } from './popover';

/** Une commande de l'appli, lançable depuis la palette ou par son raccourci. */
export interface ScrapCommand {
  /** Identifiant unique : enregistrer le même identifiant remplace la commande. */
  readonly id: string;
  readonly label: string;
  /** Titre du groupe dans la palette : « Fichier », « Destruction »… */
  readonly group?: string;
  readonly icon?: ScrapIconName;
  /** Raccourci écrit `mod+enter`, `mod+shift+p` ou `T`. Il marche dans toute la page. */
  readonly shortcut?: string;
  /** Précision en petit, après le libellé. */
  readonly hint?: string;
  /** Commande indisponible pour l'instant : absente de la palette, raccourci inactif. */
  readonly disabled?: () => boolean;
  readonly run: () => void;
}

/** Résultat de la recherche approximative : un score, et les lettres trouvées. */
export interface ScrapFuzzyMatch {
  readonly score: number;
  readonly indices: readonly number[];
}

/** Rôles qui utilisent déjà les lettres pour la saisie au clavier. */
const TYPEAHEAD_WIDGETS = '[role="menu"], [role="listbox"], [role="tree"], [role="combobox"]';

/**
 * Recherche approximative : les lettres de `query`, dans l'ordre, pas
 * forcément à la suite. Les lettres qui se suivent et les débuts de mots
 * comptent davantage ; accents et casse sont ignorés. `null` si le texte
 * ne contient pas toutes les lettres.
 */
export function fuzzyMatch(query: string, text: string): ScrapFuzzyMatch | null {
  const q = [...fold(query).replace(/\s+/g, '')];
  const chars = [...text];
  const t = chars.map((c) => fold(c));
  const m = q.length;
  const n = t.length;
  if (!m) return { score: 0, indices: [] };
  if (m > n) return null;

  const isStart = (j: number) => j === 0 || /[\s\-_.,:;/()«»'’]/.test(chars[j - 1]);
  const NONE = -Infinity;
  // best[i][j] : meilleur score quand la lettre i de la requête tombe sur la position j.
  const best: number[][] = [];
  const from: number[][] = [];

  for (let i = 0; i < m; i++) {
    best.push(new Array<number>(n).fill(NONE));
    from.push(new Array<number>(n).fill(-1));
    let runMax = NONE;
    let runArg = -1;
    for (let j = 0; j < n; j++) {
      // runMax : meilleur score de la lettre précédente, au plus en j - 2.
      if (i > 0 && j >= 2 && best[i - 1][j - 2] > runMax) {
        runMax = best[i - 1][j - 2];
        runArg = j - 2;
      }
      if (t[j] !== q[i]) continue;
      const gain = 1 + (isStart(j) ? 3 : 0);
      if (i === 0) {
        best[i][j] = gain - j * 0.01;
        continue;
      }
      const consecutive = j >= 1 ? best[i - 1][j - 1] + 4 : NONE;
      const gap = runMax - 1;
      if (consecutive === NONE && gap === NONE) continue;
      if (consecutive >= gap) {
        best[i][j] = gain + consecutive;
        from[i][j] = j - 1;
      } else {
        best[i][j] = gain + gap;
        from[i][j] = runArg;
      }
    }
  }

  let end = -1;
  for (let j = 0; j < n; j++) {
    if (best[m - 1][j] > NONE && (end < 0 || best[m - 1][j] > best[m - 1][end])) end = j;
  }
  if (end < 0) return null;
  const indices: number[] = [];
  for (let i = m - 1, j = end; i >= 0; i--) {
    indices.unshift(j);
    j = from[i][j];
  }
  return { score: best[m - 1][end], indices };
}

/**
 * Registre des commandes de l'appli, et état de la palette.
 *
 * ```ts
 * inject(ScrapCommands).register({
 *   id: 'detruire',
 *   label: 'Détruire la zone',
 *   group: 'Destruction',
 *   shortcut: 'mod+enter',
 *   run: () => this.destroy(),
 * });
 * ```
 *
 * Appelé dans un constructeur, `register` retire les commandes à la
 * destruction du composant ; ailleurs, il renvoie la fonction qui les
 * retire. Les raccourcis marchent dans toute la page ; ceux d'une seule
 * lettre se taisent pendant une saisie.
 */
@Injectable({ providedIn: 'root' })
export class ScrapCommands {
  private readonly document = inject(DOCUMENT);
  private readonly mac = isMacPlatform(this.document.defaultView);

  private readonly entries = signal<readonly ScrapCommand[]>([]);
  readonly commands = this.entries.asReadonly();

  private readonly paletteOpen = signal(false);
  /** Vrai tant que la palette est ouverte. */
  readonly isOpen = this.paletteOpen.asReadonly();

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    const onKeydown = (event: KeyboardEvent) => this.onKeydown(event);
    this.document.addEventListener('keydown', onKeydown);
    inject(DestroyRef).onDestroy(() => this.document.removeEventListener('keydown', onKeydown));
  }

  register(...commands: ScrapCommand[]): () => void {
    const ids = new Set(commands.map((c) => c.id));
    this.entries.update((list) => [...list.filter((c) => !ids.has(c.id)), ...commands]);
    const unregister = () =>
      this.entries.update((list) => list.filter((c) => !commands.includes(c)));
    // Dans un contexte d'injection (constructeur), les commandes suivent la
    // vie du composant qui les déclare.
    let destroyRef: DestroyRef | null = null;
    try {
      destroyRef = inject(DestroyRef);
    } catch {
      // Hors contexte d'injection : l'appelant garde `unregister`.
    }
    destroyRef?.onDestroy(unregister);
    return unregister;
  }

  /** Lance une commande par son identifiant. Faux si elle n'existe pas ou est indisponible. */
  run(id: string): boolean {
    const command = this.entries().find((c) => c.id === id);
    if (!command || command.disabled?.()) return false;
    command.run();
    return true;
  }

  open(): void {
    this.paletteOpen.set(true);
  }

  close(): void {
    this.paletteOpen.set(false);
  }

  toggle(): void {
    this.paletteOpen.update((open) => !open);
  }

  private onKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented || event.isComposing || this.paletteOpen()) return;
    const target = event.target as HTMLElement | null;
    if (this.modalOpen()) return;
    for (const command of this.entries()) {
      const shortcut = command.shortcut;
      if (!shortcut || !matchesShortcut(event, shortcut, this.mac)) continue;
      const single = !/[+]/.test(shortcut.replace(/\+$/, ''));
      if (single && (isTypingTarget(target) || target?.closest?.(TYPEAHEAD_WIDGETS))) return;
      if (command.disabled?.()) return;
      event.preventDefault();
      command.run();
      return;
    }
  }

  /** Une modale ouverte rend le reste de la page inerte, raccourcis compris. */
  private modalOpen(): boolean {
    try {
      return !!this.document.querySelector('dialog:modal');
    } catch {
      return false;
    }
  }
}

interface PaletteItem {
  readonly command: ScrapCommand;
  readonly id: string;
  readonly segments: readonly { readonly text: string; readonly hit: boolean }[];
  readonly shortcut: string | null;
}

interface PaletteGroup {
  readonly name: string;
  readonly id: string;
  readonly items: readonly PaletteItem[];
}

/**
 * Palette de commandes : toutes les actions de l'écran, au clavier. ⌘K
 * (Ctrl+K ailleurs) l'ouvre ; ↑ et ↓ choisissent, Entrée lance, Échap
 * referme.
 *
 * À poser une fois, dans le layout racine : `<scrap-command-palette />`.
 * Les commandes viennent de {@link ScrapCommands}.
 */
@Component({
  selector: 'scrap-command-palette',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScrapIcon],
  template: `
    <!-- Le clic sur le fond a son équivalent clavier : Échap, géré par <dialog>. -->
    <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
    <dialog
      #dialog
      class="scrap-palette"
      [attr.aria-label]="label()"
      (close)="commands.close()"
      (click)="onDialogClick($event)"
    >
      <div class="scrap-palette__panel">
        <div class="scrap-palette__input">
          <scrap-icon name="search" />
          <input
            #search
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-autocomplete="list"
            autocomplete="off"
            spellcheck="false"
            [attr.aria-controls]="listId"
            [attr.aria-activedescendant]="active()?.id ?? null"
            [attr.aria-label]="label()"
            [placeholder]="placeholder()"
            [value]="query()"
            (input)="onInput($event)"
            (keydown)="onKeydown($event)"
          />
        </div>
        <div class="scrap-palette__list" role="listbox" [id]="listId" [attr.aria-label]="label()">
          @for (group of groups(); track group.id) {
            <div role="group" [attr.aria-labelledby]="group.name ? group.id : null">
              @if (group.name) {
                <div class="scrap-palette__group" role="presentation" [id]="group.id">
                  {{ group.name }}
                </div>
              }
              @for (item of group.items; track item.id) {
                <!-- Le focus reste dans le champ : l'option active est désignée par aria-activedescendant. -->
                <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
                <div
                  class="scrap-palette__item"
                  role="option"
                  [id]="item.id"
                  [attr.aria-selected]="item === active()"
                  (click)="run(item)"
                  (pointermove)="activate(item)"
                >
                  <scrap-icon [name]="item.command.icon ?? 'command'" />
                  <!-- Chaque morceau dans son élément : aucune espace ne s'intercale. -->
                  <span>
                    @for (seg of item.segments; track $index) {
                      @if (seg.hit) {
                        <mark>{{ seg.text }}</mark>
                      } @else {
                        <span>{{ seg.text }}</span>
                      }
                    }
                  </span>
                  @if (item.command.hint) {
                    <small>{{ item.command.hint }}</small>
                  }
                  @if (item.shortcut) {
                    <kbd class="scrap-kbd">{{ item.shortcut }}</kbd>
                  }
                </div>
              }
            </div>
          } @empty {
            <div class="scrap-palette__empty">
              @if (query()) {
                Aucune commande ne correspond à «&nbsp;{{ query() }}&nbsp;».
              } @else {
                Aucune commande sur cet écran.
              }
            </div>
          }
        </div>
        <div class="scrap-palette__foot" aria-hidden="true">
          <span><kbd class="scrap-kbd">↑↓</kbd> choisir</span>
          <span><kbd class="scrap-kbd">↵</kbd> lancer</span>
          <span><kbd class="scrap-kbd">Échap</kbd> fermer</span>
        </div>
      </div>
    </dialog>
  `,
})
export class ScrapCommandPalette {
  /** Raccourci d'ouverture ; `null` pour n'ouvrir la palette que par le code. */
  readonly shortcut = input<string | null>('mod+k');
  readonly label = input('Palette de commandes');
  readonly placeholder = input('Rechercher une commande');

  protected readonly commands = inject(ScrapCommands);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly mac = isMacPlatform(this.document.defaultView);
  private readonly dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  private readonly searchRef = viewChild<ElementRef<HTMLInputElement>>('search');

  private readonly ids = inject(ScrapIdGenerator);
  protected readonly listId = this.ids.next('scrap-palette');

  protected readonly query = signal('');
  private readonly activeIndex = signal(0);

  /** Résultats regroupés : par score quand on cherche, dans l'ordre d'enregistrement sinon. */
  protected readonly groups = computed<readonly PaletteGroup[]>(() => {
    const query = this.query().trim();
    const available = this.commands.commands().filter((c) => !c.disabled?.());
    const scored = available
      .map((command, order) => ({ command, order, match: fuzzyMatch(query, command.label) }))
      .filter((r) => r.match !== null);
    if (query) scored.sort((a, b) => b.match!.score - a.match!.score || a.order - b.order);

    const groups = new Map<string, PaletteItem[]>();
    for (const { command, match } of scored) {
      const name = command.group ?? '';
      const items = groups.get(name) ?? [];
      items.push({
        command,
        id: `${this.listId}-${this.slug(command.id)}`,
        segments: this.segments(command.label, match!.indices),
        shortcut: command.shortcut ? formatShortcut(command.shortcut, this.mac) : null,
      });
      groups.set(name, items);
    }
    return [...groups].map(([name, items], i) => ({ name, id: `${this.listId}-g${i}`, items }));
  });

  private readonly flat = computed(() => this.groups().flatMap((g) => g.items));
  protected readonly active = computed(() => {
    const items = this.flat();
    return items.length ? items[Math.min(this.activeIndex(), items.length - 1)] : null;
  });

  constructor() {
    effect(() => {
      const open = this.commands.isOpen();
      const dialog = this.dialogRef()?.nativeElement;
      if (!dialog || !this.isBrowser) return;
      if (open && !dialog.open) {
        this.query.set('');
        this.activeIndex.set(0);
        dialog.showModal();
        this.searchRef()?.nativeElement.focus();
      } else if (!open && dialog.open) {
        dialog.close();
      }
    });

    if (this.isBrowser) {
      const onKeydown = (event: KeyboardEvent) => {
        const shortcut = this.shortcut();
        if (!shortcut || !matchesShortcut(event, shortcut, this.mac)) return;
        event.preventDefault();
        this.commands.toggle();
      };
      this.document.addEventListener('keydown', onKeydown);
      inject(DestroyRef).onDestroy(() => this.document.removeEventListener('keydown', onKeydown));
    }
  }

  protected onInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.activeIndex.set(0);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const count = this.flat().length;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (count) this.activeIndex.set((this.activeIndex() + 1) % count);
        this.reveal();
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (count) this.activeIndex.set((this.activeIndex() - 1 + count) % count);
        this.reveal();
        break;
      case 'Enter': {
        event.preventDefault();
        const item = this.active();
        if (item) this.run(item);
        break;
      }
    }
  }

  protected activate(item: PaletteItem): void {
    const index = this.flat().indexOf(item);
    if (index >= 0 && index !== this.activeIndex()) this.activeIndex.set(index);
  }

  /** Referme la palette, puis lance la commande : le focus est rendu d'abord. */
  protected run(item: PaletteItem): void {
    const dialog = this.dialogRef()?.nativeElement;
    if (dialog?.open) dialog.close();
    this.commands.close();
    item.command.run();
  }

  protected onDialogClick(event: MouseEvent): void {
    // Le <dialog> couvre l'écran : un clic sur lui-même est un clic sur le fond.
    if (event.target === this.dialogRef()?.nativeElement) this.commands.close();
  }

  private reveal(): void {
    const id = this.active()?.id;
    if (!id) return;
    queueMicrotask(() => {
      this.document.getElementById(id)?.scrollIntoView?.({ block: 'nearest' });
    });
  }

  private segments(label: string, indices: readonly number[]) {
    const chars = [...label];
    const hits = new Set(indices);
    const out: { text: string; hit: boolean }[] = [];
    chars.forEach((c, i) => {
      const hit = hits.has(i);
      const last = out.at(-1);
      if (last && last.hit === hit) last.text += c;
      else out.push({ text: c, hit });
    });
    return out;
  }

  private slug(id: string): string {
    return id.replace(/[^a-zA-Z0-9_-]/g, '_');
  }
}
