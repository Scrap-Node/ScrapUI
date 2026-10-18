import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScrapCard } from './card';
import { ScrapEmptyState } from './empty-state';
import { ScrapErrorPage } from './error-page';
import { ScrapFooter } from './footer';
import { ScrapSpinner } from './spinner';

describe('ScrapCard', () => {
  let fixture: ComponentFixture<ScrapCard>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(ScrapCard);
    await fixture.whenStable();
  });

  const part = (name: string) =>
    fixture.nativeElement.querySelector(`.scrap-card__${name}`) as HTMLElement;

  it("laisse vides — donc masqués — les emplacements qu'on ne remplit pas", () => {
    expect(fixture.nativeElement.classList.contains('scrap-card')).toBe(true);
    expect(part('title')).toBeNull();
    // La feuille masque les emplacements `:empty`.
    for (const name of ['media', 'head', 'body', 'foot']) {
      expect(part(name).matches(':empty'), name).toBe(true);
    }
  });

  it("affiche l'en-tête dès qu'un titre est fourni", async () => {
    fixture.componentRef.setInput('title', 'CH-042');
    await fixture.whenStable();
    expect(part('head').matches(':empty')).toBe(false);
    const title = part('head').querySelector('h3.scrap-card__title') as HTMLElement;
    expect(title.textContent?.trim()).toBe('CH-042');
  });
});

describe('ScrapSpinner', () => {
  let fixture: ComponentFixture<ScrapSpinner>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(ScrapSpinner);
    await fixture.whenStable();
  });

  const host = () => fixture.nativeElement as HTMLElement;

  it("s'annonce comme un état, avec un texte réservé aux lecteurs d'écran", () => {
    expect(host().getAttribute('role')).toBe('status');
    const hidden = host().querySelector('span.scrap-sr-only') as HTMLElement;
    expect(hidden.textContent?.trim()).toBe('Chargement');
  });

  it('affiche le libellé quand il est fourni', async () => {
    fixture.componentRef.setInput('label', 'Analyse du fichier…');
    await fixture.whenStable();
    expect(host().querySelector('.scrap-sr-only')).toBeNull();
    expect(host().querySelector('span')?.textContent?.trim()).toBe('Analyse du fichier…');
  });

  it("règle le diamètre et l'épaisseur de l'anneau", async () => {
    expect(host().style.getPropertyValue('--spinner-size')).toBe('20px');
    expect(host().style.getPropertyValue('--spinner-w')).toBe('3px');
    fixture.componentRef.setInput('size', 14);
    await fixture.whenStable();
    expect(host().style.getPropertyValue('--spinner-size')).toBe('14px');
    expect(host().style.getPropertyValue('--spinner-w')).toBe('2px');
  });
});

describe('ScrapEmptyState', () => {
  let fixture: ComponentFixture<ScrapEmptyState>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(ScrapEmptyState);
    await fixture.whenStable();
  });

  it('propose un titre par défaut', () => {
    expect(fixture.nativeElement.classList.contains('scrap-empty')).toBe(true);
    expect(fixture.nativeElement.querySelector('.scrap-empty__title').textContent.trim()).toBe(
      'Rien dans la casse',
    );
  });

  it("affiche le message secondaire seulement s'il existe", async () => {
    expect(fixture.nativeElement.querySelector('.scrap-empty__text')).toBeNull();
    fixture.componentRef.setInput('message', 'Aucun résultat');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.scrap-empty__text').textContent.trim()).toBe(
      'Aucun résultat',
    );
  });

  it('accepte une autre icône du set', async () => {
    fixture.componentRef.setInput('icon', 'bolt');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('path')).not.toBeNull();
  });
});

describe('ScrapErrorPage', () => {
  let fixture: ComponentFixture<ScrapErrorPage>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(ScrapErrorPage);
    await fixture.whenStable();
  });

  const text = (name: string) =>
    (
      fixture.nativeElement.querySelector(`.scrap-error__${name}`) as HTMLElement
    ).textContent?.trim();

  it('affiche 404 et son message par défaut', () => {
    expect(fixture.nativeElement.classList.contains('scrap-error')).toBe(true);
    expect(text('code')).toBe('404');
    expect(text('msg')).toContain('casse');
  });

  it('accepte un autre code et un autre message', async () => {
    fixture.componentRef.setInput('code', '500');
    fixture.componentRef.setInput('message', 'La presse a lâché.');
    await fixture.whenStable();
    expect(text('code')).toBe('500');
    expect(text('msg')).toBe('La presse a lâché.');
  });
});

describe('ScrapFooter', () => {
  it("affiche l'année courante et le nom du projet", async () => {
    const fixture = TestBed.createComponent(ScrapFooter);
    fixture.componentRef.setInput('appName', 'Atelier');
    await fixture.whenStable();
    const legal = fixture.nativeElement.querySelector('.scrap-footer__legal').textContent as string;
    expect(legal).toContain(String(new Date().getFullYear()));
    expect(legal).toContain('Atelier');
  });
});
