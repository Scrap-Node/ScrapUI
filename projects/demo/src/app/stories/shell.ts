import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  ScrapButton,
  ScrapCommands,
  ScrapDocTab,
  ScrapIcon,
  ScrapIconButton,
  ScrapMenu,
  ScrapMenuItem,
  ScrapMenuTrigger,
  ScrapPanel,
  ScrapProp,
  ScrapProps,
  ScrapShell,
  ScrapShellAside,
  ScrapShellBrand,
  ScrapShellHead,
  ScrapShellMain,
  ScrapShellNav,
  ScrapShellStatus,
  ScrapStatusItem,
  ScrapStatusSpacer,
  ScrapStatusbar,
  ScrapTimecode,
  ScrapToast,
  ScrapToolbar,
  ScrapTree,
  ScrapWaveBars,
  type ScrapTreeNode,
} from '@scrapnode/scrap-ui';
import { StoryCase, StoryPage } from '../story-page';
import { destroyed, peaks } from './samples';

const ZONES = [
  [0.094, 0.344],
  [0.375, 0.594],
  [0.719, 1],
] as const;

@Component({
  selector: 'story-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    StoryPage,
    StoryCase,
    ScrapShell,
    ScrapShellBrand,
    ScrapShellHead,
    ScrapShellNav,
    ScrapShellMain,
    ScrapShellAside,
    ScrapShellStatus,
    ScrapStatusbar,
    ScrapStatusItem,
    ScrapStatusSpacer,
    ScrapIcon,
    ScrapIconButton,
    ScrapButton,
    ScrapMenu,
    ScrapMenuItem,
    ScrapMenuTrigger,
    ScrapToolbar,
    ScrapTree,
    ScrapWaveBars,
    ScrapProps,
    ScrapProp,
    ScrapTimecode,
    ScrapPanel,
    ScrapDocTab,
  ],
  template: `
    <story-page
      title="Coquille d'application"
      lead="La disposition des outils&nbsp;: marque, barre du haut, fichiers, zone de travail, inspecteur et barre d'état. Sans inspecteur, la zone de travail prend sa place."
    >
      <story-case name="DataBender, en miniature" [stack]="true">
        <div class="frame">
          <scrap-shell>
            <a scrapShellBrand href="#">
              <span class="mark" aria-hidden="true"><scrap-icon name="bolt" [size]="16" /></span>
              DataBender
            </a>
            <div scrapShellHead>
              <button scrap-button variant="ghost" size="s" [scrapMenuTrigger]="fileMenu">
                Fichier
              </button>
              <scrap-menu #fileMenu label="Fichier">
                <button scrap-menu-item>Ouvrir…</button>
                <button scrap-menu-item>Exporter le WAV</button>
              </scrap-menu>
              <button scrap-button variant="ghost" size="s" [scrapMenuTrigger]="editMenu">
                Édition
              </button>
              <scrap-menu #editMenu label="Édition">
                <button scrap-menu-item>Annuler la passe</button>
                <button scrap-menu-item>Détruire la zone</button>
              </scrap-menu>
              <span class="spacer"></span>
              <button
                scrap-icon-button
                label="Commandes"
                shortcut="mod+k"
                (click)="commands.open()"
              >
                <scrap-icon name="command" />
              </button>
              <button
                scrap-icon-button
                label="Inspecteur"
                [pressed]="aside()"
                (click)="aside.set(!aside())"
              >
                <scrap-icon name="sidebar" />
              </button>
            </div>
            <nav scrapShellNav class="files" aria-label="Fichiers">
              <scrap-tree label="Fichiers" [nodes]="files" [(selected)]="file" />
            </nav>
            <section scrapShellMain class="work" aria-label="Zone de travail">
              <scrap-doc-tab modified>moteur.wav</scrap-doc-tab>
              <scrap-toolbar label="Lecture">
                <button scrap-icon-button label="Lire" shortcut="space">
                  <scrap-icon name="play" />
                </button>
                <scrap-timecode [time]="1.92" [duration]="6.4" />
              </scrap-toolbar>
              <scrap-wave-bars [data]="original" [progress]="0.3" label="Piste A" />
              <scrap-wave-bars [data]="broken" [altered]="zones" label="Piste B" />
            </section>
            @if (aside()) {
              <aside scrapShellAside aria-label="Inspecteur">
                <scrap-panel title="Passe 3">
                  <dl scrap-props>
                    <div scrap-prop label="Opérateur">Écho</div>
                    <div scrap-prop label="Zone">4,6 à 6,4 s</div>
                    <div scrap-prop label="Densité">35 %</div>
                  </dl>
                  <div footer>
                    <button scrap-button variant="secondary" size="s">Annuler</button>
                    <button scrap-button size="s">Détruire</button>
                  </div>
                </scrap-panel>
              </aside>
            }
            <scrap-statusbar scrapShellStatus>
              <span scrapStatusItem><scrap-icon name="check-circle" [size]="12" /> Prêt</span>
              <button scrapStatusItem tone="warn" (click)="warn()">
                <scrap-icon name="warning" [size]="12" /> 1 avertissement
              </button>
              <span scrapStatusSpacer></span>
              <span scrapStatusItem>48 kHz, 16 bits</span>
              <span scrapStatusItem>3 passes</span>
            </scrap-statusbar>
          </scrap-shell>
        </div>
      </story-case>

      <story-case
        name="Palette de commandes"
        note="Toutes les actions d'un écran, au clavier. Celle de la vitrine est réelle&nbsp;: ⌘K ou Ctrl+K, puis le nom d'une page."
      >
        <button scrap-button variant="secondary" (click)="commands.open()">
          <scrap-icon name="command" [size]="16" /> Ouvrir la palette
        </button>
      </story-case>
    </story-page>
  `,
  styles: `
    .frame {
      height: 30rem;
      overflow: hidden;
      border: 1px solid var(--scrap-line);
      border-radius: var(--scrap-radius-m);
    }
    scrap-shell {
      height: 100%;
      --shell-nav: 200px;
    }
    .mark {
      display: grid;
      place-items: center;
      width: 24px;
      height: 24px;
      border-radius: var(--scrap-radius-s);
      background: var(--scrap-copper);
      color: var(--scrap-white);
    }
    .spacer {
      flex: 1;
    }
    .files {
      padding: var(--scrap-space-2);
    }
    .work {
      display: grid;
      align-content: start;
      gap: var(--scrap-space-3);
      padding: var(--scrap-space-3);
    }
  `,
})
export class ShellStory {
  protected readonly commands = inject(ScrapCommands);
  private readonly toast = inject(ScrapToast);
  readonly aside = signal(true);
  readonly original = peaks(21, 160);
  readonly broken = destroyed(this.original, ZONES);
  readonly zones = ZONES;
  readonly files: ScrapTreeNode[] = [
    {
      id: 'sessions',
      label: 'sessions',
      expanded: true,
      children: [
        { id: 'moteur', label: 'moteur.wav', icon: 'waveform', mark: 'M' },
        { id: 'impact', label: 'impact.wav', icon: 'waveform' },
      ],
    },
    { id: 'exports', label: 'exports', icon: 'download' },
  ];
  readonly file = signal<string | null>('moteur');

  warn(): void {
    this.toast.show('La zone 3 dépasse la fin du fichier de 0,2 s', 'warning');
  }
}
