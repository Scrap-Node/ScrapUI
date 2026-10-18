import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  ScrapBreadcrumbs,
  ScrapButton,
  ScrapHistory,
  ScrapProp,
  ScrapProps,
  ScrapSheet,
  ScrapTree,
  type ScrapCrumb,
  type ScrapHistoryItem,
  type ScrapTreeNode,
} from '@comechaslerie/scrap-ui';
import { StoryCase, StoryPage } from '../story-page';

interface PassDetail {
  readonly title: string;
  readonly operator: string;
  readonly zone: string;
}

@Component({
  selector: 'story-navigation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    StoryPage,
    StoryCase,
    ScrapBreadcrumbs,
    ScrapTree,
    ScrapSheet,
    ScrapHistory,
    ScrapProps,
    ScrapProp,
    ScrapButton,
  ],
  template: `
    <story-page
      title="Navigation"
      lead="Où l'on est, comment remonter, et le détail d'un élément sans quitter la liste."
    >
      <story-case
        name="Fil d'Ariane"
        note="Le dernier niveau est la page courante&nbsp;: il n'est pas un lien."
      >
        <scrap-breadcrumbs [items]="crumbs" />
      </story-case>

      <story-case
        name="Arbre"
        note="↑ et ↓ se déplacent, → et ← déplient et replient, Entrée choisit. Les marques M et A signalent les fichiers modifiés et ajoutés."
      >
        <div class="tree">
          <scrap-tree label="Atelier" [nodes]="tree" [(selected)]="file" />
        </div>
        <p class="readout">Fichier choisi&nbsp;: {{ file() ?? 'aucun' }}</p>
      </story-case>

      <story-case
        name="Panneau latéral"
        note="Non modal&nbsp;: la liste reste utilisable à côté. Cliquez une passe pour l'ouvrir&nbsp;; Échap ou le bouton le referme."
      >
        <div class="split">
          <div class="list">
            <scrap-history
              label="Passes"
              [items]="passes"
              [current]="current()"
              (jump)="openPass($event)"
            />
          </div>
          <scrap-sheet [(open)]="sheetOpen" [title]="detail().title">
            <dl scrap-props>
              <div scrap-prop label="Opérateur">{{ detail().operator }}</div>
              <div scrap-prop label="Zone">{{ detail().zone }}</div>
              <div scrap-prop label="Densité">35 %</div>
            </dl>
            <div class="sheet-actions">
              <button scrap-button variant="secondary" size="s">Revenir ici</button>
            </div>
          </scrap-sheet>
        </div>
      </story-case>
    </story-page>
  `,
  styles: `
    .tree {
      width: 20rem;
    }
    .readout {
      margin: 0;
      font-size: var(--scrap-fs-ui);
      color: var(--scrap-ink-muted);
    }
    .split {
      display: flex;
      width: 100%;
      min-height: 16rem;
      overflow: hidden;
      border: 1px solid var(--scrap-line);
      border-radius: var(--scrap-radius-m);
      background: var(--scrap-bg);
    }
    .list {
      flex: 1;
      min-width: 0;
      padding: var(--scrap-space-2);
    }
    scrap-sheet {
      --sheet-w: 300px;
    }
    .sheet-actions {
      margin-top: var(--scrap-space-3);
    }
  `,
})
export class NavigationStory {
  readonly crumbs: ScrapCrumb[] = [
    { label: 'Atelier', href: '#' },
    { label: 'Sessions', href: '#' },
    { label: 'moteur.wav' },
  ];

  readonly tree: ScrapTreeNode[] = [
    {
      id: 'sessions',
      label: 'sessions',
      expanded: true,
      children: [
        { id: 'moteur.wav', label: 'moteur.wav', icon: 'waveform', mark: 'M' },
        { id: 'impact.wav', label: 'impact.wav', icon: 'waveform' },
        { id: 'relais.wav', label: 'relais.wav', icon: 'waveform', mark: 'A' },
      ],
    },
    {
      id: 'recettes',
      label: 'recettes',
      children: [
        { id: 'bavure.toml', label: 'bavure-aux-coupes.toml', icon: 'file-code' },
        { id: 'gop.toml', label: 'gop-empoisonne.toml', icon: 'file-code' },
      ],
    },
    { id: 'exports', label: 'exports', icon: 'download', mark: '2' },
  ];
  readonly file = signal<string | null>('moteur.wav');

  readonly passes: ScrapHistoryItem[] = [
    { label: 'Passe 1, zéro', meta: '10:04', kind: 'destroy' },
    { label: 'Passe 2, XOR', meta: '10:07', kind: 'destroy' },
    { label: 'Passe 3, écho', meta: '10:11', kind: 'destroy' },
  ];
  private readonly details: PassDetail[] = [
    { title: 'Passe 1', operator: 'Zéro', zone: '0,6 à 2,2 s' },
    { title: 'Passe 2', operator: 'XOR 0x80', zone: '2,4 à 3,8 s' },
    { title: 'Passe 3', operator: 'Écho', zone: '4,6 à 6,4 s' },
  ];
  readonly current = signal(2);
  readonly sheetOpen = signal(true);
  readonly detail = signal(this.details[2]);

  openPass(index: number): void {
    this.current.set(index);
    this.detail.set(this.details[index]);
    this.sheetOpen.set(true);
  }
}
