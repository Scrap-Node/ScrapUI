import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScrapSlider } from './slider';

function range(fixture: ComponentFixture<unknown>): HTMLInputElement {
  return fixture.nativeElement.querySelector('input[type="range"]');
}

describe('ScrapSlider', () => {
  let fixture: ComponentFixture<ScrapSlider>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(ScrapSlider);
    await fixture.whenStable();
  });

  it('reporte min, max et step sur le contrôle natif', async () => {
    fixture.componentRef.setInput('min', 10);
    fixture.componentRef.setInput('max', 20);
    fixture.componentRef.setInput('step', 2);
    await fixture.whenStable();

    const input = range(fixture);
    expect(input.min).toBe('10');
    expect(input.max).toBe('20');
    expect(input.step).toBe('2');
  });

  it('remonte la saisie utilisateur dans la valeur', async () => {
    const input = range(fixture);
    input.value = '42';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(fixture.componentInstance.value()).toBe(42);
  });

  it('borne le remplissage entre 0 et 1', async () => {
    fixture.componentRef.setInput('min', 0);
    fixture.componentRef.setInput('max', 50);
    fixture.componentInstance.value.set(200);
    await fixture.whenStable();
    expect(range(fixture).style.getPropertyValue('--fill')).toBe('1');

    fixture.componentInstance.value.set(-10);
    await fixture.whenStable();
    expect(range(fixture).style.getPropertyValue('--fill')).toBe('0');
  });

  it('ne divise pas par zéro quand min vaut max', async () => {
    fixture.componentRef.setInput('min', 5);
    fixture.componentRef.setInput('max', 5);
    await fixture.whenStable();
    expect(range(fixture).style.getPropertyValue('--fill')).toBe('0');
  });

  it('affiche les bornes, et sait les masquer', async () => {
    fixture.componentRef.setInput('min', 3);
    fixture.componentRef.setInput('max', 9);
    await fixture.whenStable();
    expect(
      [...fixture.nativeElement.querySelectorAll('.scrap-slider__bound')].map((e: Element) =>
        e.textContent?.trim(),
      ),
    ).toEqual(['3', '9']);

    fixture.componentRef.setInput('showBounds', false);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('.scrap-slider__bound')).toHaveLength(0);
  });

  it('déduit le nombre de crans du pas quand il reste raisonnable', async () => {
    fixture.componentRef.setInput('ticks', true);
    fixture.componentRef.setInput('step', 10);
    await fixture.whenStable();
    // 100 / 10 = 10 intervalles, donc 11 crans.
    expect(fixture.nativeElement.querySelectorAll('.scrap-slider__tick')).toHaveLength(11);
  });

  it('retombe sur 10 intervalles quand le pas en produirait trop', async () => {
    fixture.componentRef.setInput('ticks', true);
    fixture.componentRef.setInput('step', 1);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('.scrap-slider__tick')).toHaveLength(11);
  });

  it('marque les crans déjà franchis', async () => {
    fixture.componentRef.setInput('ticks', true);
    fixture.componentRef.setInput('step', 25);
    fixture.componentInstance.value.set(50);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('.scrap-slider__tick.on')).toHaveLength(3);
  });

  it('désactive le contrôle et vide le remplissage', async () => {
    fixture.componentInstance.value.set(80);
    fixture.componentRef.setInput('disabled', true);
    await fixture.whenStable();
    expect(range(fixture).disabled).toBe(true);
    expect(range(fixture).style.getPropertyValue('--fill')).toBe('0');
    expect(fixture.nativeElement.classList.contains('scrap-slider--disabled')).toBe(true);
  });

  it("expose l'étiquette accessible", async () => {
    fixture.componentRef.setInput('label', 'Volume');
    await fixture.whenStable();
    expect(range(fixture).getAttribute('aria-label')).toBe('Volume');
  });

  it("n'affiche ni étiquette ni valeur par défaut", () => {
    expect(fixture.nativeElement.querySelector('.scrap-slider__top')).toBeNull();
    expect(fixture.nativeElement.querySelector('output')).toBeNull();
  });

  it("affiche l'étiquette et la valeur avec son unité", async () => {
    fixture.componentRef.setInput('label', 'Densité');
    fixture.componentRef.setInput('showValue', true);
    fixture.componentRef.setInput('unit', '%');
    fixture.componentInstance.value.set(35);
    await fixture.whenStable();

    const top = fixture.nativeElement.querySelector('.scrap-slider__top') as HTMLElement;
    const label = top.querySelector('span') as HTMLElement;
    const output = top.querySelector('output') as HTMLOutputElement;
    expect(label.textContent?.trim()).toBe('Densité');
    expect(output.textContent?.trim()).toBe('35\u00a0%');
    expect(output.getAttribute('for')).toBe(range(fixture).id);
    // L'étiquette visible nomme le contrôle : pas de doublon en aria-label.
    expect(range(fixture).getAttribute('aria-labelledby')).toBe(label.id);
    expect(range(fixture).getAttribute('aria-label')).toBeNull();
  });

  it('annonce la valeur avec son unité, en français', async () => {
    fixture.componentRef.setInput('unit', 's');
    fixture.componentRef.setInput('step', 0.5);
    fixture.componentInstance.value.set(2.5);
    await fixture.whenStable();
    expect(range(fixture).getAttribute('aria-valuetext')).toBe('2,5\u00a0s');
  });

  it('met les bornes au format français', async () => {
    fixture.componentRef.setInput('min', 0.25);
    fixture.componentRef.setInput('max', 12000);
    await fixture.whenStable();
    const bounds = [...fixture.nativeElement.querySelectorAll('.scrap-slider__bound')].map(
      (e: Element) => e.textContent?.trim(),
    );
    expect(bounds).toEqual(['0,25', '12\u00a0000']);
  });

  it('met en forme valeur, bornes et texte annoncé avec la fonction fournie', async () => {
    const hex = (v: number) => `0x${v.toString(16).toUpperCase().padStart(2, '0')}`;
    fixture.componentRef.setInput('format', hex);
    fixture.componentRef.setInput('showValue', true);
    fixture.componentRef.setInput('label', 'Masque');
    fixture.componentRef.setInput('min', 1);
    fixture.componentRef.setInput('max', 255);
    fixture.componentInstance.value.set(255);
    await fixture.whenStable();

    const bounds = [...fixture.nativeElement.querySelectorAll('.scrap-slider__bound')].map(
      (e: Element) => e.textContent?.trim(),
    );
    expect(bounds).toEqual(['0x01', '0xFF']);
    expect(fixture.nativeElement.querySelector('output').textContent?.trim()).toBe('0xFF');
    expect(range(fixture).getAttribute('aria-valuetext')).toBe('0xFF');
  });

  it("ajoute l'unité après la mise en forme", async () => {
    fixture.componentRef.setInput('format', (v: number) => (v / 10).toFixed(1));
    fixture.componentRef.setInput('unit', 's');
    fixture.componentInstance.value.set(25);
    await fixture.whenStable();
    expect(range(fixture).getAttribute('aria-valuetext')).toBe('2.5\u00a0s');
  });
});

@Component({
  imports: [ScrapSlider, ReactiveFormsModule],
  template: `<scrap-slider [formControl]="control" />`,
})
class HostForm {
  readonly control = new FormControl(30);
}

describe('ScrapSlider — formulaires réactifs', () => {
  let fixture: ComponentFixture<HostForm>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(HostForm);
    await fixture.whenStable();
  });

  it('affiche la valeur initiale du contrôle', () => {
    expect(range(fixture).value).toBe('30');
  });

  it('propage la saisie vers le FormControl', async () => {
    const input = range(fixture);
    input.value = '75';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(fixture.componentInstance.control.value).toBe(75);
  });

  it('marque le contrôle comme touché au blur', async () => {
    expect(fixture.componentInstance.control.touched).toBe(false);
    range(fixture).dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(fixture.componentInstance.control.touched).toBe(true);
  });

  it('suit disable() / enable() du FormControl', async () => {
    fixture.componentInstance.control.disable();
    await fixture.whenStable();
    expect(range(fixture).disabled).toBe(true);

    fixture.componentInstance.control.enable();
    await fixture.whenStable();
    expect(range(fixture).disabled).toBe(false);
  });

  it('traite une valeur nulle comme zéro', async () => {
    fixture.componentInstance.control.setValue(null);
    await fixture.whenStable();
    expect(range(fixture).value).toBe('0');
  });
});
