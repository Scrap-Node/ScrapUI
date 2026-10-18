import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  ScrapCommandPalette,
  ScrapCommands,
  ScrapFooter,
  ScrapHeader,
  ScrapIcon,
  ScrapIconButton,
  ScrapTheme,
  ScrapThemeToggle,
  ScrapToasts,
} from '@comechaslerie/scrap-ui';
import { STORIES, type Story } from './app.routes';

interface NavGroup {
  readonly name: string;
  readonly stories: readonly Story[];
}

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ScrapHeader,
    ScrapFooter,
    ScrapIcon,
    ScrapIconButton,
    ScrapThemeToggle,
    ScrapToasts,
    ScrapCommandPalette,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly groups: readonly NavGroup[] = STORIES.reduce<NavGroup[]>((groups, story) => {
    const last = groups.at(-1);
    if (last?.name === story.group)
      groups[groups.length - 1] = { ...last, stories: [...last.stories, story] };
    else groups.push({ name: story.group, stories: [story] });
    return groups;
  }, []);

  protected readonly commands = inject(ScrapCommands);

  constructor() {
    const router = inject(Router);
    const theme = inject(ScrapTheme);
    // La vitrine se parcourt aussi au clavier : ⌘K, puis le nom de la page.
    this.commands.register(
      ...STORIES.map((story) => ({
        id: `page-${story.path}`,
        label: story.title,
        group: story.group,
        icon: 'arrow' as const,
        run: () => void router.navigate(['/', story.path]),
      })),
      {
        id: 'theme',
        label: 'Basculer le thème clair ou sombre',
        group: 'Affichage',
        icon: 'moon',
        run: () => theme.toggle(),
      },
    );
  }
}
