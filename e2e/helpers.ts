import { expect, type Page } from '@playwright/test';
import { STORIES } from '../projects/demo/src/app/stories.data';

export { STORIES };

export type Theme = 'light' | 'dark';

/**
 * Ouvre une page de la vitrine dans un thème donné.
 *
 * Le thème est forcé via le stockage lu par ScrapTheme, avant le premier
 * script de la page : on évite ainsi le flash clair→sombre qui rendrait les
 * captures instables.
 */
export async function openStory(page: Page, path: string, theme: Theme = 'light'): Promise<void> {
  await page.addInitScript((value) => {
    window.localStorage.setItem('scrap-theme', value);
  }, theme);
  await page.goto(`/${path}`);
  await page.waitForSelector('story-page h1');
  await expect(page.locator('html')).toHaveAttribute('data-scrap-theme', theme);
  await page.evaluate(async () => void (await document.fonts.ready));
}

/** Nom de fichier de capture, stable et lisible dans le dossier de référence. */
export function shot(name: string, theme: Theme): string {
  return `${name}-${theme}.png`;
}

/**
 * Attend la fin des animations de la page, surcouches comprises.
 *
 * `animations: 'disabled'` ne rattrape pas toujours une animation lancée
 * juste avant la capture : une référence a déjà figé la modale à mi-chemin
 * de son ouverture. Les animations infinies (spinner, progression
 * indéterminée) restent à Playwright, qui les annule au moment de capturer.
 */
export async function settle(page: Page): Promise<void> {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );
}
