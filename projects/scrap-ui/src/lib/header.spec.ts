import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScrapHeader } from './header';

describe('ScrapHeader', () => {
  let fixture: ComponentFixture<ScrapHeader>;

  const burger = () =>
    fixture.nativeElement.querySelector('.scrap-header__burger') as HTMLButtonElement;
  const nav = () => fixture.nativeElement.querySelector('nav') as HTMLElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(ScrapHeader);
    fixture.componentRef.setInput('appName', 'Atelier');
    fixture.componentRef.setInput('links', [
      { label: 'Stock', href: '/stock' },
      { label: 'Contact', href: '/contact' },
    ]);
    await fixture.whenStable();
  });

  it('rend un lien par entrée de navigation', () => {
    const links = [...nav().querySelectorAll('a')] as HTMLAnchorElement[];
    expect(links.map((a) => [a.textContent?.trim(), a.getAttribute('href')])).toEqual([
      ['Stock', '/stock'],
      ['Contact', '/contact'],
    ]);
  });

  it('pointe la marque vers la racine par défaut', async () => {
    const brand = () => fixture.nativeElement.querySelector('.scrap-header__brand');
    expect(brand().getAttribute('href')).toBe('/');
    expect(brand().textContent.trim()).toBe('Atelier');
    fixture.componentRef.setInput('homeHref', '/accueil');
    await fixture.whenStable();
    expect(brand().getAttribute('href')).toBe('/accueil');
  });

  it('signale la page courante', async () => {
    fixture.componentRef.setInput('links', [
      { label: 'Stock', href: '/stock', current: true },
      { label: 'Contact', href: '/contact' },
    ]);
    await fixture.whenStable();
    const links = [...nav().querySelectorAll('a')] as HTMLAnchorElement[];
    expect(links.map((a) => a.getAttribute('aria-current'))).toEqual(['page', null]);
  });

  it("n'affiche pas de bouton de menu sans liens", async () => {
    fixture.componentRef.setInput('links', []);
    await fixture.whenStable();
    expect(burger()).toBeNull();
  });

  it('ouvre et referme le menu', async () => {
    expect(nav().classList.contains('is-open')).toBe(false);
    expect(burger().getAttribute('aria-expanded')).toBe('false');

    burger().click();
    await fixture.whenStable();
    expect(nav().classList.contains('is-open')).toBe(true);
    expect(burger().getAttribute('aria-expanded')).toBe('true');

    burger().click();
    await fixture.whenStable();
    expect(nav().classList.contains('is-open')).toBe(false);
  });

  it('referme le menu quand on suit un lien', async () => {
    burger().click();
    await fixture.whenStable();
    // On neutralise la navigation : jsdom ne sait pas changer de document.
    const link = nav().querySelector('a') as HTMLAnchorElement;
    link.addEventListener('click', (e) => e.preventDefault());
    link.click();
    await fixture.whenStable();
    expect(nav().classList.contains('is-open')).toBe(false);
  });

  it("relie le burger à la navigation qu'il commande", () => {
    expect(burger().getAttribute('aria-controls')).toBe(nav().id);
    expect(nav().id).toBeTruthy();
  });

  it("adapte l'étiquette du burger à son état", async () => {
    expect(burger().getAttribute('aria-label')).toBe('Ouvrir le menu');
    burger().click();
    await fixture.whenStable();
    expect(burger().getAttribute('aria-label')).toBe('Fermer le menu');
  });
});
