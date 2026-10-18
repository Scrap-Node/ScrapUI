import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ScrapSegment, ScrapSegmented } from './segmented';
import { ScrapCheckbox, ScrapChoice, ScrapRadio, ScrapSwitch } from './choice';

const key = (el: Element, k: string) =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

@Component({
  imports: [ScrapSegmented, ScrapSegment],
  template: `
    <scrap-segmented label="Piste écoutée" size="s" [(value)]="piste">
      <button scrap-segment value="a">A</button>
      <button scrap-segment value="b">B</button>
      <button scrap-segment value="c" [disabled]="cOff()">C</button>
    </scrap-segmented>
  `,
})
class Host {
  readonly piste = signal<'a' | 'b' | 'c'>('a');
  readonly cOff = signal(false);
}

describe('ScrapSegmented', () => {
  let fixture: ComponentFixture<Host>;
  const group = () => fixture.nativeElement.querySelector('scrap-segmented') as HTMLElement;
  const segments = () => [...group().querySelectorAll('button')] as HTMLButtonElement[];

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
  });

  it('se présente comme un groupe de boutons radio', () => {
    expect(group().getAttribute('role')).toBe('radiogroup');
    expect(group().getAttribute('aria-label')).toBe('Piste écoutée');
    expect(group().classList).toContain('scrap-segmented--s');
    expect(segments().map((s) => s.getAttribute('role'))).toEqual(['radio', 'radio', 'radio']);
    expect(segments().map((s) => s.getAttribute('aria-checked'))).toEqual([
      'true',
      'false',
      'false',
    ]);
  });

  it('ne garde que le segment choisi dans l’ordre de tabulation', () => {
    expect(segments().map((s) => s.tabIndex)).toEqual([0, -1, -1]);
  });

  it('change de choix au clic', async () => {
    segments()[1].click();
    await fixture.whenStable();
    expect(fixture.componentInstance.piste()).toBe('b');
    expect(segments().map((s) => s.tabIndex)).toEqual([-1, 0, -1]);
  });

  it('change de choix avec les flèches, en boucle, en sautant les segments désactivés', async () => {
    fixture.componentInstance.cOff.set(true);
    await fixture.whenStable();
    segments()[0].focus();
    key(segments()[0], 'ArrowRight');
    await fixture.whenStable();
    expect(fixture.componentInstance.piste()).toBe('b');
    expect(document.activeElement).toBe(segments()[1]);
    key(segments()[1], 'ArrowRight');
    await fixture.whenStable();
    expect(fixture.componentInstance.piste()).toBe('a');
    key(segments()[0], 'ArrowLeft');
    await fixture.whenStable();
    expect(fixture.componentInstance.piste()).toBe('b');
  });

  it('suit la valeur donnée par le parent', async () => {
    fixture.componentInstance.piste.set('c');
    await fixture.whenStable();
    expect(segments()[2].getAttribute('aria-checked')).toBe('true');
    expect(segments()[2].tabIndex).toBe(0);
  });
});

@Component({
  imports: [ScrapSegmented, ScrapSegment, ReactiveFormsModule],
  template: `
    <scrap-segmented label="Vue" [formControl]="control">
      <button scrap-segment value="onde">Onde</button>
      <button scrap-segment value="spectre">Spectre</button>
    </scrap-segmented>
  `,
})
class FormHost {
  readonly control = new FormControl('spectre');
}

describe('ScrapSegmented — formulaires', () => {
  let fixture: ComponentFixture<FormHost>;
  const segments = () =>
    [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];

  beforeEach(async () => {
    fixture = TestBed.createComponent(FormHost);
    await fixture.whenStable();
  });

  it('affiche la valeur du contrôle et lui renvoie le choix', async () => {
    expect(segments()[1].getAttribute('aria-checked')).toBe('true');
    segments()[0].click();
    expect(fixture.componentInstance.control.value).toBe('onde');
  });

  it('se désactive avec le contrôle', async () => {
    fixture.componentInstance.control.disable();
    await fixture.whenStable();
    expect(segments().every((s) => s.disabled)).toBe(true);
  });

  it('marque le contrôle touché quand le focus quitte le groupe', () => {
    const group = fixture.nativeElement.querySelector('scrap-segmented') as HTMLElement;
    group.dispatchEvent(new FocusEvent('focusout', { relatedTarget: document.body }));
    expect(fixture.componentInstance.control.touched).toBe(true);
  });
});

@Component({
  imports: [ScrapChoice, ScrapCheckbox, ScrapRadio, ScrapSwitch],
  template: `
    <label scrapChoice><input type="checkbox" scrapSwitch /> Pré-écoute</label>
    <label scrapChoice><input type="checkbox" scrapCheckbox /> Normaliser</label>
    <label scrapChoice><input type="radio" scrapRadio name="r" /> 16 bits</label>
  `,
})
class ChoiceHost {}

describe('Cases, radios et interrupteurs', () => {
  it('posent les classes de la lib et le rôle d’interrupteur', async () => {
    const fixture = TestBed.createComponent(ChoiceHost);
    await fixture.whenStable();
    const [sw, box, radio] = [...fixture.nativeElement.querySelectorAll('input')] as HTMLElement[];
    expect(sw.classList).toContain('scrap-switch');
    expect(sw.getAttribute('role')).toBe('switch');
    expect(box.classList).toContain('scrap-checkbox');
    expect(radio.classList).toContain('scrap-radio');
    const labels = [...fixture.nativeElement.querySelectorAll('label')] as HTMLElement[];
    expect(labels.every((l) => l.classList.contains('scrap-choice'))).toBe(true);
  });
});
