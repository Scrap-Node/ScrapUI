import { expect, test } from '@playwright/test';
import { openStory } from './helpers';

/**
 * Comportements que les tests unitaires ne peuvent pas prouver : ils
 * dépendent du navigateur (`<dialog>` natif, API Popover, propagation des
 * événements de pointeur, focus) et non de la seule logique des composants.
 */

const MOD = process.platform === 'darwin' ? 'Meta' : 'Control';

test.describe('toasts', () => {
  test('le survol suspend vraiment la disparition', async ({ page }) => {
    await openStory(page, 'modale-toasts');
    await page.getByRole('button', { name: 'Succès', exact: true }).click();

    const toast = page.locator('scrap-toasts .scrap-toast');
    await expect(toast).toHaveCount(1);

    // L'hôte <scrap-toasts> est en `pointer-events: none` ; c'est le toast
    // qui reçoit le pointeur. Ce test vérifie que `mouseenter` remonte bien
    // jusqu'à l'hôte, où la pause est câblée.
    await toast.hover();
    await page.waitForTimeout(5000); // au-delà des 3,5 s de durée par défaut
    await expect(toast).toHaveCount(1);

    await page.mouse.move(0, 0);
    await expect(toast).toHaveCount(0, { timeout: 5000 });
  });

  test('le toast se ferme au clavier', async ({ page }) => {
    await openStory(page, 'modale-toasts');
    await page.getByRole('button', { name: 'Information', exact: true }).click();

    const toast = page.locator('scrap-toasts .scrap-toast');
    await toast.getByRole('button', { name: 'Fermer' }).focus();
    await page.keyboard.press('Enter');
    await expect(toast).toHaveCount(0);
  });

  test('le focus dans la pile suspend aussi la disparition', async ({ page }) => {
    await openStory(page, 'modale-toasts');
    await page.getByRole('button', { name: 'Avertissement', exact: true }).click();

    const toast = page.locator('scrap-toasts .scrap-toast');
    await toast.getByRole('button', { name: 'Fermer' }).focus();
    await page.waitForTimeout(5000);
    await expect(toast).toHaveCount(1);
  });

  test("l'action du toast revient en arrière", async ({ page }) => {
    await openStory(page, 'modale-toasts');
    const readout = page.getByText(/Passes appliquées/);
    await expect(readout).toHaveText('Passes appliquées : 3');

    await page.getByRole('button', { name: 'Appliquer une passe' }).click();
    await expect(readout).toHaveText('Passes appliquées : 4');
    await page.locator('scrap-toasts').getByRole('button', { name: 'Annuler' }).click();
    await expect(readout).toHaveText('Passes appliquées : 3');
    await expect(page.locator('scrap-toasts .scrap-toast')).toHaveCount(0);
  });
});

test.describe('modale', () => {
  test('Échap ferme et rend le défilement', async ({ page }) => {
    await openStory(page, 'modale-toasts');
    await page.getByRole('button', { name: 'Ouvrir la modale' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  });

  test('le focus est piégé dans la modale', async ({ page }) => {
    await openStory(page, 'modale-toasts');
    await page.getByRole('button', { name: 'Ouvrir la modale' }).click();
    // Sans cette attente, la première tabulation part avant l'ouverture et
    // le test devient instable.
    await expect(page.getByRole('dialog')).toBeVisible();

    // Le piège vient du <dialog> natif : quel que soit le nombre de
    // tabulations, le focus ne doit jamais ressortir vers la page.
    for (let i = 0; i < 8; i++) await page.keyboard.press('Tab');
    const inDialog = await page.evaluate(() => document.activeElement?.closest('dialog') !== null);
    expect(inDialog).toBe(true);
  });

  test('le focus revient sur le déclencheur à la fermeture', async ({ page }) => {
    await openStory(page, 'modale-toasts');
    const opener = page.getByRole('button', { name: 'Ouvrir la modale' });
    await opener.click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(opener).toBeFocused();
  });
});

test.describe('onglets', () => {
  test('les flèches déplacent le focus avec la sélection', async ({ page }) => {
    await openStory(page, 'onglets');
    const tabs = page.locator('scrap-tabs').first();

    await tabs.getByRole('tab', { name: 'Propriétés' }).focus();
    await page.keyboard.press('ArrowRight');

    await expect(tabs.getByRole('tab', { name: 'Historique' })).toBeFocused();
    await expect(tabs.getByRole('tabpanel')).toContainText('Trois passes');
  });

  test("un seul panneau est exposé à l'arbre d'accessibilité", async ({ page }) => {
    await openStory(page, 'onglets');
    const tabs = page.locator('scrap-tabs').first();

    await expect(tabs.getByRole('tabpanel')).toHaveCount(1);

    await tabs.getByRole('tab', { name: 'Fichier' }).click();
    await expect(tabs.getByRole('tabpanel')).toHaveCount(1);
    await expect(tabs.getByRole('tabpanel')).toContainText('sessions/moteur.wav');
  });

  test('une seule tabulation traverse la barre', async ({ page }) => {
    await openStory(page, 'onglets');
    const tabs = page.locator('scrap-tabs').first();
    await tabs.getByRole('tab', { name: 'Propriétés' }).focus();

    // Grâce au tabindex mobile, Tab quitte la barre au lieu de visiter
    // chacun des onglets un par un.
    await page.keyboard.press('Tab');
    await expect(tabs.getByRole('tab', { name: 'Historique' })).not.toBeFocused();
  });
});

test.describe('menus', () => {
  test("s'ouvre, se parcourt au clavier et rend le focus à Échap", async ({ page }) => {
    await openStory(page, 'outils');
    const trigger = page.getByRole('button', { name: 'Fichier' });
    await trigger.click();

    const menu = page.getByRole('menu', { name: 'Fichier' });
    await expect(menu).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(menu.getByRole('menuitem', { name: /Ouvrir/ })).toBeFocused();

    // « Partager » est désactivé : ↓ passe directement à la case à cocher.
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(menu.getByRole('menuitemcheckbox', { name: 'Afficher la grille' })).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('se referme au clic à côté, et sur son propre bouton sans se rouvrir', async ({ page }) => {
    await openStory(page, 'outils');
    const trigger = page.getByRole('button', { name: 'Fichier' });
    const menu = page.getByRole('menu', { name: 'Fichier' });

    await trigger.click();
    await expect(menu).toBeVisible();
    await page.mouse.click(5, 300);
    await expect(menu).toBeHidden();

    await trigger.click();
    await expect(menu).toBeVisible();
    await trigger.click();
    await expect(menu).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('passe au-dessus de tout, sans z-index', async ({ page }) => {
    await openStory(page, 'outils');
    await page.getByRole('button', { name: 'Fichier' }).click();
    const inTopLayer = await page
      .getByRole('menu', { name: 'Fichier' })
      .evaluate((el) => el.matches(':popover-open'));
    expect(inTopLayer).toBe(true);
  });
});

test.describe('liste déroulante', () => {
  test("s'ouvre sur l'option choisie et se pilote au clavier", async ({ page }) => {
    await openStory(page, 'formulaires');
    const select = page.locator('scrap-select').first();
    const button = select.getByRole('button');
    await button.focus();
    await page.keyboard.press('ArrowDown');

    const list = select.getByRole('listbox');
    await expect(list).toBeVisible();
    await expect(list.getByRole('option', { name: /XOR 0x80/ })).toBeFocused();

    await page.keyboard.press('e');
    await expect(list.getByRole('option', { name: /Écho/ })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(list).toBeHidden();
    await expect(button).toBeFocused();
    await expect(button).toContainText('Écho');
  });
});

test.describe('barre d’outils', () => {
  test('un seul arrêt de tabulation, des flèches et des lettres', async ({ page }) => {
    await openStory(page, 'outils');
    const bar = page.getByRole('toolbar', { name: 'Outils' });
    const zone = bar.getByRole('button', { name: 'Zone' });

    await zone.focus();
    await page.keyboard.press('ArrowDown');
    await expect(bar.getByRole('button', { name: 'Rectangle' })).toBeFocused();

    await page.keyboard.press('d');
    await expect(bar.getByRole('button', { name: 'Destruction' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByText('Outil actif : destruction')).toBeVisible();

    // Tab sort de la barre en un seul pas.
    await page.keyboard.press('Tab');
    const stillInBar = await bar.evaluate((el) => el.contains(document.activeElement));
    expect(stillInBar).toBe(false);
  });

  test("l'info-bulle nomme l'outil, avec son raccourci, et Échap la ferme", async ({ page }) => {
    await openStory(page, 'outils');
    await page
      .getByRole('toolbar', { name: 'Outils' })
      .getByRole('button', { name: 'Zone' })
      .hover();

    const tooltip = page.getByRole('tooltip');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText('Zone');
    await expect(tooltip.locator('kbd')).toHaveText('T');

    await page.keyboard.press('Escape');
    await expect(tooltip).toHaveCount(0);
  });
});

test.describe('palette de commandes', () => {
  test('⌘K ou Ctrl+K ouvre la palette, qui mène à la page tapée', async ({ page }) => {
    await openStory(page, 'boutons');
    await page.keyboard.press(`${MOD}+k`);

    const dialog = page.getByRole('dialog', { name: 'Palette de commandes' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('combobox')).toBeFocused();

    const search = dialog.getByRole('combobox');
    await search.fill('zzz');
    await expect(dialog.getByRole('option')).toHaveCount(0);
    await expect(dialog).toContainText('Aucune commande ne correspond');
    await search.fill('audio');
    await page.keyboard.press('Enter');

    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\/audio$/);
    await expect(page.locator('story-page h1')).toHaveText('Audio et montage');
  });

  test('Échap la referme et rend le focus', async ({ page }) => {
    await openStory(page, 'boutons');
    const opener = page.getByRole('button', { name: 'Commandes' });
    await opener.click();
    await expect(page.getByRole('dialog', { name: 'Palette de commandes' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Palette de commandes' })).toBeHidden();
    await expect(opener).toBeFocused();
  });
});

test.describe('champ numérique', () => {
  test("glisser l'étiquette règle la valeur", async ({ page }) => {
    await openStory(page, 'formulaires');
    const field = page.locator('scrap-number-field').first();
    const input = field.getByRole('spinbutton');
    await expect(input).toHaveValue('35');

    const label = field.locator('label');
    // Les coordonnées de la souris sont celles de la fenêtre : l'élément doit y être.
    await label.scrollIntoViewIfNeeded();
    const box = (await label.boundingBox())!;
    await page.mouse.move(box.x + 10, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 40, box.y + box.height / 2, { steps: 5 });
    await page.mouse.up();
    await expect(input).toHaveValue('45');
  });

  test('↑, ⇧↑ et Échap', async ({ page }) => {
    await openStory(page, 'formulaires');
    const input = page.locator('scrap-number-field').first().getByRole('spinbutton');
    await input.focus();
    await page.keyboard.press('ArrowUp');
    await expect(input).toHaveValue('36');
    await page.keyboard.press('Shift+ArrowUp');
    await expect(input).toHaveValue('46');
    await page.keyboard.press('Escape');
    await expect(input).toHaveValue('35');
  });
});

test.describe('timeline', () => {
  test('un clic place la lecture, un glissement fait une zone', async ({ page }) => {
    await openStory(page, 'audio');
    const hit = page.locator('.scrap-timeline__hit');
    const readout = page.getByText(/^(Zone de|Aucune zone)/);
    await expect(readout).toHaveText('Zone de 0,6 à 2,2 s');

    await hit.scrollIntoViewIfNeeded();
    const box = (await hit.boundingBox())!;
    const y = box.y + box.height / 2;
    await page.mouse.click(box.x + box.width / 2, y);
    await expect(readout).toHaveText('Aucune zone');
    await expect(hit).toHaveAttribute('aria-valuetext', '3,2 s');

    await page.mouse.move(box.x + box.width * 0.25, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.5, y, { steps: 6 });
    await page.mouse.up();
    await expect(readout).toHaveText('Zone de 1,6 à 3,2 s');
  });
});

test.describe('panneau latéral', () => {
  test('Échap le ferme et rend le focus à la liste', async ({ page }) => {
    await openStory(page, 'navigation');
    const sheet = page.getByRole('complementary', { name: 'Passe 3' });
    await expect(sheet).toBeVisible();

    const step = page.getByRole('button', { name: /Passe 2, XOR/ });
    await step.click();
    const passe2 = page.getByRole('complementary', { name: 'Passe 2' });
    await expect(passe2).toBeVisible();

    await passe2.getByRole('button', { name: 'Revenir ici' }).focus();
    await page.keyboard.press('Escape');
    await expect(passe2).toBeHidden();
    await expect(step).toBeFocused();
  });
});

test.describe('zone de dépôt', () => {
  test('accepte un WAV et refuse le reste', async ({ page }) => {
    await openStory(page, 'formulaires');
    const input = page.locator('scrap-dropzone input[type="file"]');

    await input.setInputFiles({
      name: 'voix.mp3',
      mimeType: 'audio/mpeg',
      buffer: Buffer.from('ID3'),
    });
    await expect(page.locator('.scrap-dropzone__error')).toContainText('voix.mp3');
    await expect(page.locator('scrap-dropzone')).toHaveClass(/is-error/);

    await input.setInputFiles({
      name: 'moteur.wav',
      mimeType: 'audio/wav',
      buffer: Buffer.from('RIFF'),
    });
    await expect(page.locator('.scrap-dropzone__error')).toHaveCount(0);
    await expect(page.locator('scrap-toasts .scrap-toast')).toContainText('moteur.wav importé');
  });
});
