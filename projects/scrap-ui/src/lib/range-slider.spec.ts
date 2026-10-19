import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScrapRangeSlider } from './range-slider';

function inputs(fixture: ComponentFixture<unknown>): HTMLInputElement[] {
  return [...fixture.nativeElement.querySelectorAll('input[type="range"]')];
}

function slide(input: HTMLInputElement, value: number): void {
  input.value = String(value);
  input.dispatchEvent(new Event('input'));
}

describe('ScrapRangeSlider', () => {
  let fixture: ComponentFixture<ScrapRangeSlider>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(ScrapRangeSlider);
    fixture.componentRef.setInput('label', 'Bande visée');
    await fixture.whenStable();
  });

  it('pose deux contrôles sur la même piste, avec min, max et step', async () => {
    fixture.componentRef.setInput('min', 10);
    fixture.componentRef.setInput('max', 20);
    fixture.componentRef.setInput('step', 2);
    await fixture.whenStable();
    expect(inputs(fixture)).toHaveLength(2);
    for (const input of inputs(fixture)) {
      expect(input.min).toBe('10');
      expect(input.max).toBe('20');
      expect(input.step).toBe('2');
    }
  });

  it('remonte chaque poignée dans sa borne', async () => {
    const [low, high] = inputs(fixture);
    slide(low, 20);
    slide(high, 70);
    await fixture.whenStable();
    expect(fixture.componentInstance.low()).toBe(20);
    expect(fixture.componentInstance.high()).toBe(70);
  });

  it("empêche une poignée de passer l'autre", async () => {
    fixture.componentInstance.low.set(30);
    fixture.componentInstance.high.set(60);
    await fixture.whenStable();
    const [low, high] = inputs(fixture);

    slide(low, 90);
    await fixture.whenStable();
    expect(fixture.componentInstance.low()).toBe(60);
    expect(low.value).toBe('60');

    slide(high, 10);
    await fixture.whenStable();
    expect(fixture.componentInstance.high()).toBe(60);
    expect(high.value).toBe('60');
  });

  it('cale le remplissage sur les deux poignées', async () => {
    fixture.componentInstance.low.set(25);
    fixture.componentInstance.high.set(75);
    await fixture.whenStable();
    const track = fixture.nativeElement.querySelector('.scrap-range-slider__track') as HTMLElement;
    expect(track.style.getPropertyValue('--lo')).toBe('0.25');
    expect(track.style.getPropertyValue('--hi')).toBe('0.75');
  });

  it('fait passer la poignée basse devant quand les deux se rejoignent en haut', async () => {
    fixture.componentInstance.low.set(100);
    fixture.componentInstance.high.set(100);
    await fixture.whenStable();
    expect(inputs(fixture)[0].classList).toContain('is-front');

    fixture.componentInstance.low.set(0);
    fixture.componentInstance.high.set(0);
    await fixture.whenStable();
    expect(inputs(fixture)[0].classList).not.toContain('is-front');
  });

  it('nomme le groupe et chaque poignée', () => {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAttribute('role')).toBe('group');
    expect(host.getAttribute('aria-label')).toBe('Bande visée');
    const [low, high] = inputs(fixture);
    expect(low.getAttribute('aria-label')).toBe('Minimum');
    expect(high.getAttribute('aria-label')).toBe('Maximum');
  });

  it("affiche la plage sous l'étiquette, unité comprise", async () => {
    fixture.componentRef.setInput('showValue', true);
    fixture.componentRef.setInput('unit', 'Hz');
    fixture.componentRef.setInput('max', 20000);
    fixture.componentInstance.low.set(20);
    fixture.componentInstance.high.set(12000);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    const label = host.querySelector('.scrap-slider__top span') as HTMLElement;
    expect(label.textContent?.trim()).toBe('Bande visée');
    // L'étiquette visible nomme le groupe : pas de doublon en aria-label.
    expect(host.getAttribute('aria-labelledby')).toBe(label.id);
    expect(host.getAttribute('aria-label')).toBeNull();
    expect(host.querySelector('output')?.textContent?.trim()).toBe(
      '20\u00a0Hz à 12\u00a0000\u00a0Hz',
    );
    expect(inputs(fixture)[1].getAttribute('aria-valuetext')).toBe('12\u00a0000\u00a0Hz');
  });

  it('met les bornes en forme avec la fonction fournie', async () => {
    fixture.componentRef.setInput('format', (v: number) => (v === 1000 ? 'max' : String(v)));
    fixture.componentRef.setInput('max', 1000);
    await fixture.whenStable();
    const bounds = [...fixture.nativeElement.querySelectorAll('.scrap-slider__bound')].map(
      (e: Element) => e.textContent?.trim(),
    );
    expect(bounds).toEqual(['0', 'max']);
  });

  it('désactive les deux poignées', async () => {
    fixture.componentRef.setInput('disabled', true);
    await fixture.whenStable();
    expect(inputs(fixture).every((i) => i.disabled)).toBe(true);
    expect((fixture.nativeElement as HTMLElement).classList).toContain('scrap-slider--disabled');
  });
});

@Component({
  imports: [ScrapRangeSlider, ReactiveFormsModule],
  template: `<scrap-range-slider label="Fenêtre" [formControl]="control" />`,
})
class HostForm {
  readonly control = new FormControl<[number, number]>([10, 40]);
}

describe('ScrapRangeSlider — formulaires réactifs', () => {
  let fixture: ComponentFixture<HostForm>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(HostForm);
    await fixture.whenStable();
  });

  it('reprend le couple du contrôle', () => {
    const [low, high] = inputs(fixture);
    expect(low.value).toBe('10');
    expect(high.value).toBe('40');
  });

  it('propage la saisie sous forme de couple', async () => {
    slide(inputs(fixture)[1], 55);
    await fixture.whenStable();
    expect(fixture.componentInstance.control.value).toEqual([10, 55]);
  });

  it('suit disable() du FormControl', async () => {
    fixture.componentInstance.control.disable();
    await fixture.whenStable();
    expect(inputs(fixture).every((i) => i.disabled)).toBe(true);
  });
});
