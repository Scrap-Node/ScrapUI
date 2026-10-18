import { expect, test } from '@playwright/test';
import { STORIES, openStory, shot } from './helpers';

/**
 * Rendu mobile : la vitrine passe en une colonne et le header replie sa
 * navigation derrière un burger. Deux bascules qu'aucune capture de bureau
 * ne surveille.
 */
test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const story of STORIES) {
    test(`${story.title} en 390 px`, async ({ page }) => {
      await openStory(page, story.path);
      await expect(page).toHaveScreenshot(shot(`mobile-${story.path}`, 'light'), {
        fullPage: true,
      });
    });
  }

  test('menu burger déplié', async ({ page }) => {
    await openStory(page, 'layout');
    const header = page.locator('story-layout scrap-header').first();
    await header.getByRole('button', { name: 'Ouvrir le menu' }).click();
    await expect(header.locator('nav.is-open')).toBeVisible();
    await expect(header).toHaveScreenshot(shot('burger-ouvert', 'light'));
  });
});
