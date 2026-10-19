import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  ScrapButton,
  ScrapIcon,
  ScrapIconButton,
  ScrapKbd,
  ScrapMenu,
  ScrapMenuItem,
  ScrapMenuSeparator,
  ScrapMenuTrigger,
  ScrapSegment,
  ScrapSegmented,
  ScrapToast,
  ScrapToolbar,
  ScrapToolbarSeparator,
  ScrapToolbarSpacer,
  type ScrapIconName,
} from '@scrapnode/scrap-ui';
import { StoryCase, StoryPage } from '../story-page';

interface Tool {
  readonly id: string;
  readonly label: string;
  readonly icon: ScrapIconName;
  readonly key: string;
}

@Component({
  selector: 'story-tools',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    StoryPage,
    StoryCase,
    ScrapToolbar,
    ScrapToolbarSeparator,
    ScrapToolbarSpacer,
    ScrapIconButton,
    ScrapIcon,
    ScrapButton,
    ScrapKbd,
    ScrapMenu,
    ScrapMenuItem,
    ScrapMenuSeparator,
    ScrapMenuTrigger,
    ScrapSegmented,
    ScrapSegment,
  ],
  template: `
    <story-page
      title="Outils et menus"
      lead="Ce qui fait un logiciel de création&nbsp;: des outils à une touche, des menus complets, des raccourcis affichés partout."
    >
      <story-case
        name="Barre d'outils verticale"
        note="Tab entre sur l'outil actif, ↑ et ↓ passent d'un outil à l'autre&nbsp;; dans la barre, la lettre d'un outil le choisit. Survolez pour voir le nom et le raccourci."
      >
        <scrap-toolbar label="Outils" orientation="vertical" panel>
          @for (tool of tools; track tool.id) {
            <button
              scrap-icon-button
              [label]="tool.label"
              [shortcut]="tool.key"
              [pressed]="active() === tool.id"
              (click)="active.set(tool.id)"
            >
              <scrap-icon [name]="tool.icon" />
            </button>
          }
          <scrap-toolbar-separator />
          <button scrap-icon-button label="Zoom avant" shortcut="mod+=">
            <scrap-icon name="zoom-in" />
          </button>
        </scrap-toolbar>
        <p class="readout">Outil actif&nbsp;: {{ activeLabel() }}</p>
      </story-case>

      <story-case name="Barre d'outils horizontale" [stack]="true">
        <scrap-toolbar label="Édition" panel>
          <button
            scrap-icon-button
            label="Annuler"
            shortcut="mod+z"
            (click)="notify('Passe annulée')"
          >
            <scrap-icon name="undo" />
          </button>
          <button scrap-icon-button label="Rétablir" shortcut="mod+shift+z" disabled>
            <scrap-icon name="redo" />
          </button>
          <scrap-toolbar-separator />
          <button scrap-icon-button label="Couper la zone" shortcut="mod+x">
            <scrap-icon name="scissors" />
          </button>
          <button scrap-icon-button label="Copier la zone" shortcut="mod+c">
            <scrap-icon name="copy" />
          </button>
          <scrap-toolbar-spacer />
          <button scrap-icon-button label="Boucle" [pressed]="loop()" (click)="loop.set(!loop())">
            <scrap-icon name="loop" />
          </button>
        </scrap-toolbar>
      </story-case>

      <story-case
        name="Menu"
        note="Ouvert au clic, ou avec ↓ sur le bouton. Les flèches parcourent les actions, une lettre va à l'action qui commence par elle, Échap referme."
      >
        <button scrap-button variant="ghost" [scrapMenuTrigger]="fileMenu">
          Fichier <scrap-icon name="chevron-down" [size]="16" />
        </button>
        <scrap-menu #fileMenu label="Fichier">
          <button scrap-menu-item (click)="notify('Ouvrir…')">
            <scrap-icon name="folder-open" [size]="16" /> Ouvrir… <kbd scrap-kbd>⌘O</kbd>
          </button>
          <button scrap-menu-item (click)="notify('Enregistré')">
            <scrap-icon name="download" [size]="16" /> Enregistrer <kbd scrap-kbd>⌘S</kbd>
          </button>
          <button scrap-menu-item disabled>
            <scrap-icon name="upload" [size]="16" /> Partager
          </button>
          <scrap-menu-separator />
          <button scrap-menu-item [checked]="grid()" (click)="grid.set(!grid())">
            Afficher la grille
          </button>
          <scrap-menu-separator />
          <button scrap-menu-item tone="danger" (click)="notify('Session fermée')">
            <scrap-icon name="trash" [size]="16" /> Fermer la session
          </button>
        </scrap-menu>

        <button scrap-icon-button label="Plus d'actions" [scrapMenuTrigger]="moreMenu">
          <scrap-icon name="more" />
        </button>
        <scrap-menu #moreMenu label="Plus d'actions">
          <button scrap-menu-item (click)="notify('Dupliquée')">Dupliquer la piste</button>
          <button scrap-menu-item (click)="notify('Renommée')">Renommer…</button>
        </scrap-menu>
      </story-case>

      <story-case
        name="Raccourcis dans le texte"
        note="kbd[scrap-kbd] pour citer une touche ou une combinaison."
      >
        <p class="text">
          <kbd scrap-kbd>⌘K</kbd> ouvre la palette de commandes, <kbd scrap-kbd>T</kbd> choisit
          l'outil zone, <kbd scrap-kbd>⇧⌘Z</kbd> rétablit la dernière passe annulée.
        </p>
      </story-case>

      <story-case
        name="Segmenté compact"
        note="En petite taille, pour une barre d'outils ou un transport."
      >
        <scrap-segmented label="Vue" size="s" [(value)]="view">
          <button scrap-segment value="onde">Onde</button>
          <button scrap-segment value="spectre">Spectre</button>
        </scrap-segmented>
      </story-case>
    </story-page>
  `,
  styles: `
    .readout,
    .text {
      margin: 0;
      font-size: var(--scrap-fs-ui);
      color: var(--scrap-ink-muted);
    }
    .text {
      color: var(--scrap-ink);
      line-height: 2;
    }
  `,
})
export class ToolsStory {
  private readonly toast = inject(ScrapToast);
  readonly tools: Tool[] = [
    { id: 'pointer', label: 'Sélection', icon: 'pointer', key: 'V' },
    { id: 'zone', label: 'Zone', icon: 'zone', key: 'T' },
    { id: 'marquee', label: 'Rectangle', icon: 'marquee', key: 'M' },
    { id: 'bolt', label: 'Destruction', icon: 'bolt', key: 'D' },
  ];
  readonly active = signal('zone');
  readonly loop = signal(true);
  readonly grid = signal(true);
  readonly view = signal('onde');

  activeLabel(): string {
    return this.tools.find((t) => t.id === this.active())?.label.toLowerCase() ?? '';
  }

  notify(message: string): void {
    this.toast.show(message, 'info');
  }
}
