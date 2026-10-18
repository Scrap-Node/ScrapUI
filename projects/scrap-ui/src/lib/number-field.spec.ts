import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ScrapNumberField } from './number-field';

@Component({
  imports: [ScrapNumberField],
  template: `
    <scrap-number-field
      label="Densité"
      unit="%"
      [min]="0"
      [max]="100"
      [step]="step()"
      [(value)]="value"
    />
  `,
})
class Host {
  readonly value = signal(35);
  readonly step = signal(1);
}

describe('ScrapNumberField', () => {
  let fixture: ComponentFixture<Host>;
  const root = () => fixture.nativeElement.querySelector('scrap-number-field') as HTMLElement;
  const input = () => root().querySelector('input') as HTMLInputElement;
  const label = () => root().querySelector('label') as HTMLLabelElement;
  const [dec, inc] = [0, 1].map(
    (i) => () => root().querySelectorAll<HTMLButtonElement>('.scrap-number__step')[i],
  );
  const key = (k: string, init: KeyboardEventInit = {}) =>
    input().dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, ...init }));
  const type = (text: string) => {
    input().value = text;
    input().dispatchEvent(new Event('input'));
  };
  const value = () => fixture.componentInstance.value();

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
  });

  it("s'expose comme un spinbutton relié à son étiquette", () => {
    expect(label().htmlFor).toBe(input().id);
    expect(input().getAttribute('role')).toBe('spinbutton');
    expect(input().getAttribute('aria-valuenow')).toBe('35');
    expect(input().getAttribute('aria-valuemin')).toBe('0');
    expect(input().getAttribute('aria-valuemax')).toBe('100');
    expect(input().getAttribute('aria-valuetext')).toBe('35\u00a0%');
    expect(input().value).toBe('35');
  });

  it('avance d’un pas avec les flèches, de dix avec ⇧', async () => {
    key('ArrowUp');
    expect(value()).toBe(36);
    key('ArrowDown', { shiftKey: true });
    expect(value()).toBe(26);
    key('PageUp');
    expect(value()).toBe(36);
  });

  it('respecte les bornes', async () => {
    fixture.componentInstance.value.set(99);
    await fixture.whenStable();
    key('ArrowUp', { shiftKey: true });
    expect(value()).toBe(100);
    await fixture.whenStable();
    expect(inc().disabled).toBe(true);
    expect(dec().disabled).toBe(false);
  });

  it('valide la saisie à Entrée, virgule comprise, et arrondit au pas', async () => {
    fixture.componentInstance.step.set(0.5);
    await fixture.whenStable();
    type('12,74');
    key('Enter');
    expect(value()).toBe(12.5);
    expect(input().value).toBe('12,5');
  });

  it('valide la saisie en quittant le champ', () => {
    input().focus();
    type('48');
    input().dispatchEvent(new Event('blur'));
    expect(value()).toBe(48);
  });

  it('rend la valeur courante pour une saisie illisible', () => {
    type('beaucoup');
    key('Enter');
    expect(value()).toBe(35);
    expect(input().value).toBe('35');
  });

  it("rend la valeur d'avant avec Échap", async () => {
    input().dispatchEvent(new Event('focus'));
    key('ArrowUp');
    key('ArrowUp');
    expect(value()).toBe(37);
    key('Escape');
    expect(value()).toBe(35);
  });

  it('se règle par les boutons, de dix avec ⇧', () => {
    inc().dispatchEvent(new MouseEvent('click', { shiftKey: true }));
    expect(value()).toBe(45);
    dec().click();
    expect(value()).toBe(44);
  });

  it("se règle en glissant l'étiquette", async () => {
    const down = new PointerEvent('pointerdown', { clientX: 100, button: 0, pointerId: 1 });
    label().dispatchEvent(down);
    label().dispatchEvent(new PointerEvent('pointermove', { clientX: 130, pointerId: 1 }));
    await fixture.whenStable();
    expect(value()).toBe(45);
    expect(root().classList).toContain('is-scrubbing');
    label().dispatchEvent(new PointerEvent('pointermove', { clientX: 70, pointerId: 1 }));
    expect(value()).toBe(25);
    label().dispatchEvent(new PointerEvent('pointerup', { clientX: 70, pointerId: 1 }));
    await fixture.whenStable();
    expect(root().classList).not.toContain('is-scrubbing');
  });

  it("donne le focus au champ sur un simple clic de l'étiquette", () => {
    label().dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 10, button: 0, pointerId: 2 }),
    );
    label().dispatchEvent(new PointerEvent('pointerup', { clientX: 11, pointerId: 2 }));
    expect(document.activeElement).toBe(input());
    expect(value()).toBe(35);
  });
});

@Component({
  imports: [ScrapNumberField, ReactiveFormsModule],
  template: `<scrap-number-field label="Graine" [formControl]="control" />`,
})
class FormHost {
  readonly control = new FormControl(7342);
}

describe('ScrapNumberField — formulaires', () => {
  let fixture: ComponentFixture<FormHost>;
  const input = () => fixture.nativeElement.querySelector('input') as HTMLInputElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(FormHost);
    await fixture.whenStable();
  });

  it('affiche la valeur du contrôle, sans séparateur de milliers', () => {
    expect(input().value).toBe('7342');
    expect(input().hasAttribute('aria-valuemin')).toBe(false);
  });

  it('renvoie la saisie au contrôle et le marque touché', () => {
    input().value = '12000';
    input().dispatchEvent(new Event('blur'));
    expect(fixture.componentInstance.control.value).toBe(12000);
    expect(fixture.componentInstance.control.touched).toBe(true);
  });

  it('se désactive avec le contrôle', async () => {
    fixture.componentInstance.control.disable();
    await fixture.whenStable();
    expect(input().disabled).toBe(true);
  });
});
