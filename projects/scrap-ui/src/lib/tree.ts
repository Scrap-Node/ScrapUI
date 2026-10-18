import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  linkedSignal,
  model,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ScrapIcon, type ScrapIconName } from './icon';
import { Typeahead } from './popover';

/** Un nœud de l'arbre : un dossier s'il a des enfants, un fichier sinon. */
export interface ScrapTreeNode {
  readonly id: string;
  readonly label: string;
  readonly icon?: ScrapIconName;
  /** Marque discrète à droite : `M` modifié, `A` ajouté, ou un compteur. */
  readonly mark?: string;
  readonly children?: readonly ScrapTreeNode[];
  /** Déplié au premier affichage. */
  readonly expanded?: boolean;
}

interface VisibleNode {
  readonly node: ScrapTreeNode;
  readonly depth: number;
  readonly parent: string | null;
}

/**
 * Arbre de fichiers ou de pages, rangés en dossiers.
 *
 * ```html
 * <scrap-tree label="Atelier" [nodes]="arbre" [(selected)]="fichier" />
 * ```
 *
 * Motif ARIA « tree » : ↑ et ↓ se déplacent, → et ← déplient et
 * replient, Origine et Fin vont aux extrémités, une lettre va au nœud qui
 * commence par elle. Clic, Entrée ou Espace choisissent le nœud ; sur un
 * dossier, ils le déplient ou le replient aussi.
 */
@Component({
  selector: 'scrap-tree',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScrapIcon, NgTemplateOutlet],
  template: `
    <ul class="scrap-tree" role="tree" [attr.aria-label]="label()">
      <ng-container *ngTemplateOutlet="level; context: { $implicit: nodes(), depth: 0 }" />
    </ul>

    <ng-template #level let-nodes let-depth="depth">
      @for (node of nodes; track node.id) {
        <li
          role="treeitem"
          [attr.data-id]="node.id"
          [attr.aria-level]="depth + 1"
          [attr.aria-expanded]="node.children?.length ? isExpanded(node.id) : null"
          [attr.aria-selected]="node.id === selected()"
          [attr.tabindex]="node.id === focusId() ? 0 : -1"
          (focus)="focused.set(node.id)"
          (keydown)="onKeydown($event, node)"
        >
          <!-- Le clavier passe par le treeitem : la ligne n'est qu'une cible de clic. -->
          <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
          <div class="scrap-tree__row" [style.--d]="depth" (click)="activate(node)">
            @if (node.children?.length) {
              <scrap-icon class="scrap-tree__caret" name="chevron-right" [size]="14" />
            } @else {
              <span class="scrap-tree__spacer"></span>
            }
            <scrap-icon [name]="iconOf(node)" [size]="16" />
            <span class="scrap-tree__label">{{ node.label }}</span>
            @if (node.mark) {
              <span
                class="scrap-tree__mark"
                [class.scrap-tree__mark--m]="node.mark === 'M'"
                [class.scrap-tree__mark--a]="node.mark === 'A'"
                >{{ node.mark }}</span
              >
            }
          </div>
          @if (node.children?.length && isExpanded(node.id)) {
            <ul role="group">
              <ng-container
                *ngTemplateOutlet="level; context: { $implicit: node.children, depth: depth + 1 }"
              />
            </ul>
          }
        </li>
      }
    </ng-template>
  `,
})
export class ScrapTree {
  readonly label = input.required<string>();
  readonly nodes = input.required<readonly ScrapTreeNode[]>();
  /** Identifiant du nœud choisi. */
  readonly selected = model<string | null>(null);
  /** Un nœud choisi (clic, Entrée, Espace) : fichier ou dossier. */
  readonly activated = output<ScrapTreeNode>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly typeahead = new Typeahead();

  /** Dossiers dépliés, initialisés depuis `expanded` à chaque nouvel arbre. */
  private readonly expandedIds = linkedSignal<readonly ScrapTreeNode[], ReadonlySet<string>>({
    source: this.nodes,
    computation: (nodes, previous) => {
      const ids = new Set<string>(previous?.value ?? []);
      const walk = (list: readonly ScrapTreeNode[]) => {
        for (const n of list) {
          if (n.expanded && !previous) ids.add(n.id);
          if (n.children) walk(n.children);
        }
      };
      walk(nodes);
      return ids;
    },
  });

  /** Nœuds visibles, dans l'ordre d'affichage. */
  private readonly visible = computed(() => {
    const out: VisibleNode[] = [];
    const expanded = this.expandedIds();
    const walk = (list: readonly ScrapTreeNode[], depth: number, parent: string | null) => {
      for (const node of list) {
        out.push({ node, depth, parent });
        if (node.children?.length && expanded.has(node.id)) walk(node.children, depth + 1, node.id);
      }
    };
    walk(this.nodes(), 0, null);
    return out;
  });

  protected readonly focused = signal<string | null>(null);
  /** Le nœud qui porte l'arrêt de tabulation : le dernier visité, sinon le choisi, sinon le premier. */
  protected readonly focusId = computed(() => {
    const visible = this.visible();
    const has = (id: string | null) => !!id && visible.some((v) => v.node.id === id);
    const focused = this.focused();
    const selected = this.selected();
    if (has(focused)) return focused;
    if (has(selected)) return selected;
    return visible[0]?.node.id ?? null;
  });

  protected isExpanded(id: string): boolean {
    return this.expandedIds().has(id);
  }

  protected iconOf(node: ScrapTreeNode): ScrapIconName {
    if (node.icon) return node.icon;
    if (!node.children?.length) return 'file';
    return this.isExpanded(node.id) ? 'folder-open' : 'folder';
  }

  /** Déplie ou replie un dossier. */
  toggle(id: string, open = !this.isExpanded(id)): void {
    this.expandedIds.update((set) => {
      const next = new Set(set);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  protected activate(node: ScrapTreeNode): void {
    this.focused.set(node.id);
    this.selected.set(node.id);
    if (node.children?.length) this.toggle(node.id);
    this.activated.emit(node);
    this.focus(node.id);
  }

  protected onKeydown(event: KeyboardEvent, node: ScrapTreeNode): void {
    // Les treeitems sont imbriqués : seul le plus proche du focus répond.
    if (event.target !== event.currentTarget) return;
    const visible = this.visible();
    const index = visible.findIndex((v) => v.node.id === node.id);
    const hasChildren = !!node.children?.length;
    const expanded = this.isExpanded(node.id);
    let target: string | null = null;

    switch (event.key) {
      case 'ArrowDown':
        target = visible[index + 1]?.node.id ?? null;
        break;
      case 'ArrowUp':
        target = visible[index - 1]?.node.id ?? null;
        break;
      case 'Home':
        target = visible[0]?.node.id ?? null;
        break;
      case 'End':
        target = visible.at(-1)?.node.id ?? null;
        break;
      case 'ArrowRight':
        if (hasChildren && !expanded) this.toggle(node.id, true);
        else if (hasChildren) target = node.children![0].id;
        else return;
        break;
      case 'ArrowLeft':
        if (hasChildren && expanded) this.toggle(node.id, false);
        else target = visible[index]?.parent ?? null;
        break;
      case 'Enter':
      case ' ':
        this.activate(node);
        break;
      default:
        if (event.key.length !== 1 || event.metaKey || event.ctrlKey || event.altKey) return;
        {
          const found = this.typeahead.find(
            event.key,
            visible.map((v) => v.node.label),
            index,
          );
          if (found < 0) return;
          target = visible[found].node.id;
        }
    }
    event.preventDefault();
    if (target) {
      this.focused.set(target);
      this.focus(target);
    }
  }

  private focus(id: string): void {
    const items = this.host.querySelectorAll<HTMLElement>('[role="treeitem"]');
    [...items].find((el) => el.dataset['id'] === id)?.focus();
  }
}
