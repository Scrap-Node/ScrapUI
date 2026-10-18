import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ScrapMenu, ScrapMenuItem, ScrapMenuSeparator, ScrapMenuTrigger } from './menu';
import { ScrapOption, ScrapSelect } from './select';
import { installPopoverPolyfill } from '../testing/popover-polyfill';

const key = (el: Element, k: string) =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

@Component({
  imports: [ScrapMenu, ScrapMenuTrigger, ScrapMenuItem, ScrapMenuSeparator],
  template: `
    <button id="trigger" [scrapMenuTrigger]="menu">Fichier</button>
    <scrap-menu #menu label="Fichier">
      <button scrap-menu-item (click)="last.set('ouvrir')">Ouvrir…</button>
      <button scrap-menu-item (click)="last.set('exporter')">Exporter</button>
      <button scrap-menu-item disabled>Imprimer</button>
      <button scrap-menu-item [checked]="grille()" (click)="grille.set(!grille())">Grille</button>
      <scrap-menu-separator />
      <button scrap-menu-item tone="danger" (click)="last.set('fermer')">Fermer la session</button>
    </scrap-menu>
  `,
})
class MenuHost {
  readonly last = signal('');
  readonly grille = signal(true);
}

describe('ScrapMenu', () => {
  let fixture: ComponentFixture<MenuHost>;
  const trigger = () => fixture.nativeElement.querySelector('#trigger') as HTMLButtonElement;
  const menu = () => fixture.nativeElement.querySelector('scrap-menu') as HTMLElement;
  const items = () => [...menu().querySelectorAll('button')] as HTMLButtonElement[];

  beforeEach(async () => {
    installPopoverPolyfill();
    fixture = TestBed.createComponent(MenuHost);
    await fixture.whenStable();
  });

  it('relie le bouton au menu', () => {
    expect(menu().getAttribute('popover')).toBe('auto');
    expect(menu().getAttribute('role')).toBe('menu');
    expect(menu().getAttribute('aria-label')).toBe('Fichier');
    expect(trigger().getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger().getAttribute('aria-controls')).toBe(menu().id);
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
  });

  it("s'ouvre au clic et donne le focus à la première action", async () => {
    trigger().click();
    await fixture.whenStable();
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(items()[0]);
  });

  it('s’ouvre sur la dernière action avec ↑', async () => {
    key(trigger(), 'ArrowUp');
    await fixture.whenStable();
    expect(document.activeElement).toBe(items().at(-1));
  });

  it('parcourt les actions disponibles avec les flèches, en boucle', async () => {
    trigger().click();
    const [ouvrir, exporter, , grille, fermer] = items();
    key(ouvrir, 'ArrowDown');
    expect(document.activeElement).toBe(exporter);
    key(exporter, 'ArrowDown');
    // « Imprimer » est désactivé : on le saute.
    expect(document.activeElement).toBe(grille);
    key(grille, 'End');
    expect(document.activeElement).toBe(fermer);
    key(fermer, 'ArrowDown');
    expect(document.activeElement).toBe(ouvrir);
  });

  it("va à l'action qui commence par la lettre tapée", async () => {
    trigger().click();
    key(items()[0], 'f');
    expect(document.activeElement).toBe(items().at(-1));
  });

  it("lance l'action, referme le menu et rend le focus au bouton", async () => {
    trigger().click();
    await fixture.whenStable();
    items()[1].click();
    await fixture.whenStable();
    expect(fixture.componentInstance.last()).toBe('exporter');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger());
  });

  it('se referme avec Échap', async () => {
    trigger().click();
    key(items()[0], 'Escape');
    await fixture.whenStable();
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger());
  });

  it('suit une fermeture décidée par le navigateur', async () => {
    trigger().click();
    await fixture.whenStable();
    menu().hidePopover();
    await fixture.whenStable();
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
  });

  it('ne rouvre pas un menu fermé par le clic sur son propre bouton', async () => {
    trigger().click();
    await fixture.whenStable();
    // Le navigateur referme le menu au clic à côté, avant que le clic n'arrive au bouton.
    trigger().dispatchEvent(new PointerEvent('pointerdown'));
    menu().hidePopover();
    trigger().dispatchEvent(new MouseEvent('click', { detail: 1 }));
    await fixture.whenStable();
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
  });

  it('pose les rôles des actions, cases et séparateurs', () => {
    const [ouvrir, , imprimer, grille, fermer] = items();
    expect(ouvrir.getAttribute('role')).toBe('menuitem');
    expect(ouvrir.getAttribute('tabindex')).toBe('-1');
    expect(ouvrir.getAttribute('type')).toBe('button');
    expect(imprimer.disabled).toBe(true);
    expect(grille.getAttribute('role')).toBe('menuitemcheckbox');
    expect(grille.getAttribute('aria-checked')).toBe('true');
    expect(fermer.classList).toContain('scrap-menu__item--danger');
    expect(menu().querySelector('scrap-menu-separator')?.getAttribute('role')).toBe('separator');
  });
});

interface Op {
  id: string;
  nom: string;
  aide: string;
}

@Component({
  imports: [ScrapSelect, ScrapOption, ReactiveFormsModule],
  template: `
    <scrap-select label="Opérateur" [formControl]="control">
      @for (op of ops; track op.id) {
        <scrap-option [value]="op.id" [description]="op.aide">{{ op.nom }}</scrap-option>
      }
      <scrap-option value="off" disabled>Hors service</scrap-option>
    </scrap-select>
  `,
})
class SelectHost {
  readonly ops: Op[] = [
    { id: 'zero', nom: 'Zéro', aide: 'Remplace par du silence' },
    { id: 'xor', nom: 'XOR', aide: 'Inverse des bits' },
    { id: 'echo', nom: 'Écho', aide: 'Répète un bloc' },
  ];
  readonly control = new FormControl<string | null>('xor');
}

describe('ScrapSelect', () => {
  let fixture: ComponentFixture<SelectHost>;
  const host = () => fixture.nativeElement.querySelector('scrap-select') as HTMLElement;
  const button = () => host().querySelector('button') as HTMLButtonElement;
  const list = () => host().querySelector('[role="listbox"]') as HTMLElement;
  const options = () => [...host().querySelectorAll('scrap-option')] as HTMLElement[];

  beforeEach(async () => {
    installPopoverPolyfill();
    fixture = TestBed.createComponent(SelectHost);
    await fixture.whenStable();
  });

  it("affiche l'option choisie, sans sa description", () => {
    expect(button().querySelector('span')?.textContent?.trim()).toBe('XOR');
  });

  it("nomme le bouton par l'étiquette et la valeur", () => {
    const label = host().querySelector('label') as HTMLLabelElement;
    expect(label.textContent?.trim()).toBe('Opérateur');
    expect(button().getAttribute('aria-labelledby')).toBe(`${label.id} ${button().id}`);
    expect(button().getAttribute('aria-haspopup')).toBe('listbox');
    expect(button().getAttribute('aria-controls')).toBe(list().id);
  });

  it("ouvre la liste sur l'option choisie", async () => {
    button().click();
    await fixture.whenStable();
    expect(button().getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(options()[1]);
    expect(options()[1].getAttribute('aria-selected')).toBe('true');
    expect(options()[0].getAttribute('aria-selected')).toBe('false');
  });

  it('choisit au clic et prévient le formulaire', async () => {
    button().click();
    await fixture.whenStable();
    options()[2].click();
    await fixture.whenStable();
    expect(fixture.componentInstance.control.value).toBe('echo');
    expect(button().querySelector('span')?.textContent?.trim()).toBe('Écho');
    expect(button().getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(button());
  });

  it('se pilote au clavier : flèches, lettre, Entrée', async () => {
    key(button(), 'ArrowDown');
    await fixture.whenStable();
    expect(document.activeElement).toBe(options()[1]);
    key(list(), 'ArrowDown');
    expect(document.activeElement).toBe(options()[2]);
    // « Hors service » est désactivé : la liste s'arrête à « Écho ».
    key(list(), 'ArrowDown');
    expect(document.activeElement).toBe(options()[2]);
    key(list(), 'z');
    expect(document.activeElement).toBe(options()[0]);
    key(list(), 'Enter');
    await fixture.whenStable();
    expect(fixture.componentInstance.control.value).toBe('zero');
  });

  it('referme sans rien changer avec Échap', async () => {
    button().click();
    await fixture.whenStable();
    key(list(), 'ArrowDown');
    key(list(), 'Escape');
    await fixture.whenStable();
    expect(fixture.componentInstance.control.value).toBe('xor');
    expect(document.activeElement).toBe(button());
  });

  it('ignore une option désactivée', async () => {
    button().click();
    options()[3].click();
    await fixture.whenStable();
    expect(fixture.componentInstance.control.value).toBe('xor');
  });

  it('suit la valeur et l’état du formulaire', async () => {
    fixture.componentInstance.control.setValue('zero');
    await fixture.whenStable();
    expect(button().querySelector('span')?.textContent?.trim()).toBe('Zéro');

    fixture.componentInstance.control.disable();
    await fixture.whenStable();
    expect(button().disabled).toBe(true);
  });

  it("affiche l'invite sans valeur", async () => {
    fixture.componentInstance.control.setValue(null);
    await fixture.whenStable();
    expect(button().querySelector('span')?.textContent?.trim()).toBe('Choisir…');
  });

  it('marque le contrôle touché quand le focus quitte le composant', async () => {
    button().focus();
    button().dispatchEvent(new FocusEvent('blur', { relatedTarget: document.body }));
    expect(fixture.componentInstance.control.touched).toBe(true);
  });
});
