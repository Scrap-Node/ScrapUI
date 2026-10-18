import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  ScrapFooter,
  ScrapHeader,
  ScrapIcon,
  ScrapThemeToggle,
  type ScrapNavLink,
} from '@comechaslerie/scrap-ui';
import { StoryCase, StoryPage } from '../story-page';

@Component({
  selector: 'story-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StoryPage, StoryCase, ScrapHeader, ScrapFooter, ScrapIcon, ScrapThemeToggle],
  template: `
    <story-page
      title="En-tête et pied de page"
      lead="Pour les applications en pages, comme ScrapBrick. Seul le logo change d'un projet à l'autre&nbsp;: il est projeté."
    >
      <story-case
        name="En-tête"
        note="Quand l'en-tête descend sous 560 px de large, les liens passent derrière un bouton de menu."
        [stack]="true"
      >
        <scrap-header appName="ScrapBrick" [links]="links" homeHref="#">
          <span logo class="fake-logo" aria-hidden="true"
            ><scrap-icon name="blocks" [size]="16"
          /></span>
          <scrap-theme-toggle actions />
        </scrap-header>
      </story-case>

      <story-case name="En-tête étroit" [stack]="true">
        <div class="narrow">
          <scrap-header appName="ScrapBrick" [links]="links" homeHref="#">
            <span logo class="fake-logo" aria-hidden="true"
              ><scrap-icon name="blocks" [size]="16"
            /></span>
          </scrap-header>
        </div>
      </story-case>

      <story-case name="Pied de page" [stack]="true">
        <scrap-footer appName="ScrapBrick">
          <a href="#">Aide</a>
          <a href="#">Nouveautés</a>
          <a href="#">Signaler un problème</a>
        </scrap-footer>
      </story-case>
    </story-page>
  `,
  styles: `
    .fake-logo {
      display: grid;
      place-items: center;
      width: 28px;
      height: 28px;
      border-radius: var(--scrap-radius-m);
      background: var(--scrap-copper);
      color: var(--scrap-white);
    }
    .narrow {
      width: 22rem;
      max-width: 100%;
    }
  `,
})
export class LayoutStory {
  readonly links: ScrapNavLink[] = [
    { label: 'Projets', href: '#', current: true },
    { label: 'Pièces', href: '#' },
    { label: 'Partager', href: '#' },
  ];
}
