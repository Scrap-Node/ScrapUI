import { expect, test } from '@playwright/test';
import { openStory, shot, type Theme } from './helpers';

const THEMES: Theme[] = ['light', 'dark'];

/**
 * Les états qu'aucune capture de page au repos n'atteint : survol, focus,
 * modale ouverte, toasts empilés, onglet secondaire.
 *
 * Ce sont exactement les états où les régressions passent inaperçues en
 * revue de code, parce qu'il faut interagir pour les voir.
 */
for (const theme of THEMES) {
  test.describe(`états — thème ${theme}`, () => {
    test('bouton survolé', async ({ page }) => {
      await openStory(page, 'boutons', theme);
      const stage = page.locator('story-case').first().locator('.stage');
      await stage.getByRole('button', { name: 'Primaire' }).hover();
      await expect(stage).toHaveScreenshot(shot('bouton-survole', theme));
    });

    test('bouton focalisé au clavier', async ({ page }) => {
      await openStory(page, 'boutons', theme);
      const stage = page.locator('story-case').first().locator('.stage');
      await page.keyboard.press('Tab');
      await stage.getByRole('button', { name: 'Primaire' }).focus();
      await expect(stage).toHaveScreenshot(shot('bouton-focus', theme));
    });

    test('modale ouverte', async ({ page }) => {
      await openStory(page, 'modale-toasts', theme);
      await page.getByRole('button', { name: 'Ouvrir la modale' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page).toHaveScreenshot(shot('modale-ouverte', theme));
    });

    test('pile de toasts', async ({ page }) => {
      await openStory(page, 'modale-toasts', theme);
      const stage = page.locator('story-case').nth(1);
      for (const label of ['Succès', 'Avertissement', 'Erreur']) {
        await stage.getByRole('button', { name: label, exact: true }).click();
      }
      const toasts = page.locator('scrap-toasts');
      await expect(toasts.locator('.scrap-toast')).toHaveCount(3);
      // Le survol met la pile en pause : sans lui, les toasts s'évaporeraient
      // pendant la capture et le test serait instable.
      await toasts.hover();
      await expect(toasts).toHaveScreenshot(shot('toasts', theme));
    });

    test('second onglet actif', async ({ page }) => {
      await openStory(page, 'onglets', theme);
      const tabs = page.locator('scrap-tabs').first();
      await tabs.getByRole('tab', { name: 'Historique' }).click();
      await expect(tabs.getByRole('tab', { name: 'Historique' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      await expect(tabs).toHaveScreenshot(shot('onglet-second', theme));
    });

    test('onglet atteint au clavier', async ({ page }) => {
      await openStory(page, 'onglets', theme);
      const tabs = page.locator('scrap-tabs').first();
      await tabs.getByRole('tab', { name: 'Propriétés' }).focus();
      await page.keyboard.press('ArrowRight');
      await expect(tabs).toHaveScreenshot(shot('onglet-clavier', theme));
    });

    test('champ en erreur focalisé', async ({ page }) => {
      await openStory(page, 'formulaires', theme);
      const errorCase = page.locator('story-case').nth(1);
      await errorCase.locator('input').focus();
      await expect(errorCase).toHaveScreenshot(shot('champ-erreur-focus', theme));
    });

    test('curseur déplacé au clavier', async ({ page }) => {
      await openStory(page, 'curseurs', theme);
      const stage = page.locator('story-case').first().locator('.stage');
      const slider = stage.getByRole('slider').nth(1);
      await slider.focus();
      for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowLeft');
      await expect(stage).toHaveScreenshot(shot('curseur-clavier', theme));
    });

    test("forme d'onde déplacée au clavier", async ({ page }) => {
      await openStory(page, 'audio', theme);
      const waveCase = page.locator('story-case').first();
      await waveCase.getByRole('slider').focus();
      await page.keyboard.press('End');
      await expect(waveCase.locator('.readout')).toHaveText('Position : 100 %');
      await expect(waveCase).toHaveScreenshot(shot('onde-clavier', theme));
    });

    test('cases et boutons radio cochés', async ({ page }) => {
      await openStory(page, 'formulaires', theme);
      const choices = page.locator('story-case').nth(3);
      await choices.locator('input.scrap-checkbox').nth(1).check();
      await choices.locator('input.scrap-radio').nth(1).check();
      await expect(choices).toHaveScreenshot(shot('choix-coches', theme));
    });

    test('lien de vitrine actif', async ({ page }) => {
      await openStory(page, 'badges', theme);
      await expect(page.locator('nav.stories')).toHaveScreenshot(shot('nav-active', theme));
    });

    test('menu ouvert', async ({ page }) => {
      await openStory(page, 'outils', theme);
      await page.getByRole('button', { name: 'Fichier' }).click();
      const menu = page.getByRole('menu', { name: 'Fichier' });
      await expect(menu).toBeVisible();
      await expect(menu).toHaveScreenshot(shot('menu-ouvert', theme));
    });

    test('liste déroulante ouverte', async ({ page }) => {
      await openStory(page, 'formulaires', theme);
      const select = page.locator('scrap-select').first();
      await select.getByRole('button').click();
      const list = select.getByRole('listbox');
      await expect(list).toBeVisible();
      await expect(list).toHaveScreenshot(shot('liste-ouverte', theme));
    });

    test('info-bulle', async ({ page }) => {
      await openStory(page, 'outils', theme);
      const bar = page.getByRole('toolbar', { name: 'Outils' });
      await bar.getByRole('button', { name: 'Zone' }).hover();
      await expect(page.getByRole('tooltip')).toBeVisible();
      await expect(page.locator('story-case').first().locator('.stage')).toHaveScreenshot(
        shot('info-bulle', theme),
      );
    });

    test('palette de commandes ouverte', async ({ page }) => {
      await openStory(page, 'boutons', theme);
      await page.getByRole('button', { name: 'Commandes' }).click();
      const dialog = page.getByRole('dialog', { name: 'Palette de commandes' });
      await expect(dialog).toBeVisible();
      await dialog.getByRole('combobox').fill('form');
      await expect(dialog.getByRole('option')).toHaveCount(1);
      await expect(page).toHaveScreenshot(shot('palette-ouverte', theme));
    });

    test('zone sélectionnée dans la timeline', async ({ page }) => {
      await openStory(page, 'audio', theme);
      const timeline = page.locator('scrap-timeline');
      await timeline.locator('.scrap-timeline__hit').focus();
      await page.keyboard.press('Shift+PageUp');
      await expect(timeline).toHaveScreenshot(shot('timeline-zone', theme));
    });
  });
}
