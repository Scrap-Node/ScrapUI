import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScrapField, ScrapInput } from './field';

@Component({
  imports: [ScrapField, ScrapInput],
  template: `
    <scrap-field label="Email" [hint]="hint()" [error]="error()" [optional]="optional()">
      <input scrapInput type="email" />
    </scrap-field>
  `,
})
class Host {
  readonly hint = signal<string | undefined>(undefined);
  readonly error = signal<string | undefined>(undefined);
  readonly optional = signal<string | undefined>(undefined);
}

describe('ScrapField', () => {
  let fixture: ComponentFixture<Host>;

  const label = () => fixture.nativeElement.querySelector('label') as HTMLLabelElement;
  const input = () => fixture.nativeElement.querySelector('input') as HTMLInputElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
  });

  it("relie l'étiquette au contrôle projeté", () => {
    // C'est tout l'objet de la directive scrapInput : sans elle, le `for`
    // de l'étiquette ne désignerait aucun élément.
    expect(input().id).toBeTruthy();
    expect(label().getAttribute('for')).toBe(input().id);
  });

  it('applique la classe de style de la charte', () => {
    expect(input().classList.contains('scrap-input')).toBe(true);
  });

  it("n'annonce ni indice ni erreur par défaut", () => {
    expect(input().getAttribute('aria-describedby')).toBeNull();
    expect(input().getAttribute('aria-invalid')).toBeNull();
  });

  it("décrit le contrôle par l'indice", async () => {
    fixture.componentInstance.hint.set('Adresse professionnelle');
    await fixture.whenStable();
    const hint = fixture.nativeElement.querySelector('small.scrap-field__hint');
    expect(input().getAttribute('aria-describedby')).toBe(hint.id);
    expect(hint.textContent.trim()).toBe('Adresse professionnelle');
  });

  it("signale l'erreur et marque le contrôle invalide", async () => {
    fixture.componentInstance.error.set('Format invalide');
    await fixture.whenStable();
    const error = fixture.nativeElement.querySelector('small.scrap-field__error');
    expect(error.getAttribute('role')).toBe('alert');
    expect(error.textContent.trim()).toBe('Format invalide');
    expect(error.querySelector('scrap-icon')).not.toBeNull();
    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(input().getAttribute('aria-describedby')).toBe(error.id);
  });

  it('cumule indice et erreur dans aria-describedby', async () => {
    fixture.componentInstance.hint.set('Indice');
    fixture.componentInstance.error.set('Erreur');
    await fixture.whenStable();
    const ids = input().getAttribute('aria-describedby')!.split(' ');
    expect(ids).toHaveLength(2);
    const rendered = [
      ...fixture.nativeElement.querySelectorAll('.scrap-field__hint, .scrap-field__error'),
    ].map((e: Element) => e.id);
    expect(ids).toEqual(rendered);
  });

  it("ajoute une mention discrète dans l'étiquette", async () => {
    expect(label().querySelector('small')).toBeNull();
    fixture.componentInstance.optional.set('facultatif');
    await fixture.whenStable();
    expect(label().querySelector('small')?.textContent?.trim()).toBe('facultatif');
    // La mention ne compte ni comme indice ni comme erreur.
    expect(input().getAttribute('aria-describedby')).toBeNull();
  });
});

@Component({
  imports: [ScrapField, ScrapInput],
  template: `
    <scrap-field label="Format">
      <select scrapInput>
        <option>WAV</option>
      </select>
    </scrap-field>
    <scrap-field label="Notes">
      <textarea scrapInput></textarea>
    </scrap-field>
  `,
})
class OtherControls {}

describe('ScrapInput sur un select ou un textarea', () => {
  it("prend la classe qui correspond à l'élément", async () => {
    const fixture = TestBed.createComponent(OtherControls);
    await fixture.whenStable();
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    expect(select.classList.contains('scrap-select')).toBe(true);
    expect(select.classList.contains('scrap-input')).toBe(false);
    expect(textarea.classList.contains('scrap-textarea')).toBe(true);
    expect(textarea.classList.contains('scrap-input')).toBe(false);
  });

  it('reste relié à son étiquette', async () => {
    const fixture = TestBed.createComponent(OtherControls);
    await fixture.whenStable();
    const labels = [...fixture.nativeElement.querySelectorAll('label')] as HTMLLabelElement[];
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    expect(labels[0].htmlFor).toBe(select.id);
    expect(labels[1].htmlFor).toBe(textarea.id);
  });
});

@Component({
  imports: [ScrapInput],
  template: `<input scrapInput id="mien" />`,
})
class Standalone {}

describe('ScrapInput hors scrap-field', () => {
  it('se contente de styler, sans écraser un id existant', async () => {
    const fixture = TestBed.createComponent(Standalone);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.classList.contains('scrap-input')).toBe(true);
    expect(input.id).toBe('mien');
    expect(input.getAttribute('aria-describedby')).toBeNull();
  });
});
