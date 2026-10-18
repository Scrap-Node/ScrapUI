import { expect, test } from '@playwright/test';
import { openStory } from './helpers';

/**
 * Une animation CSS ne se déclenche qu'à l'insertion de l'élément : sans
 * bouton, `.scrap-stamp-in` ne se voyait qu'au chargement de la page.
 *
 * On ne peut pas observer l'animation depuis une capture : on vérifie que
 * l'élément animé est bien détruit puis recréé, ce qui est la condition
 * nécessaire et suffisante pour qu'elle reparte.
 */
test.describe('rejouer les animations', () => {
  test("le bouton recrée le bloc animé de l'affiche", async ({ page }) => {
    await openStory(page, 'affiche');
    const plate = page.locator('story-replay .scrap-stamp-in');
    await expect(plate).toHaveCount(1);

    // Un marqueur posé sur l'élément courant : s'il survit au clic, c'est que
    // le bloc n'a pas été recréé et que l'animation n'a pas rejoué.
    await plate.evaluate((el) => el.setAttribute('data-avant', '1'));

    await page.getByRole('button', { name: 'Rejouer', exact: true }).click();
    await expect(plate).toHaveCount(1);
    await expect(plate).not.toHaveAttribute('data-avant', '1');
  });

  test("l'animation est bien réarmée, pas seulement le DOM", async ({ page }) => {
    await openStory(page, 'affiche');

    // On compte les `animationstart`, qui remontent jusqu'au document. Guetter
    // un playState « running » après le clic serait une course : l'animation
    // dure 320 ms et peut se terminer avant qu'on l'observe. L'événement, lui,
    // ne se perd pas.
    await page.evaluate(() => {
      const w = window as unknown as { __starts: number };
      w.__starts = 0;
      document.addEventListener('animationstart', (event) => {
        const target = event.target as HTMLElement;
        if (target.classList?.contains('scrap-stamp-in')) w.__starts++;
      });
    });

    await page.getByRole('button', { name: 'Rejouer', exact: true }).click();

    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __starts: number }).__starts))
      .toBeGreaterThan(0);
  });

  test("l'ancienne adresse des utilitaires mène à l'affiche", async ({ page }) => {
    await openStory(page, 'utilitaires');
    await expect(page).toHaveURL(/\/affiche$/);
  });
});
