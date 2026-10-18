import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SCRAP_LANE, ScrapVuMeter, ScrapWaveBars, ScrapWaveLine } from './waveform';

describe('ScrapWaveBars', () => {
  let fixture: ComponentFixture<ScrapWaveBars>;

  const rects = () => [...fixture.nativeElement.querySelectorAll('rect')] as SVGRectElement[];
  const bars = () => rects().filter((r) => !r.classList.contains('scrap-wave__head'));
  const svg = () => fixture.nativeElement.querySelector('svg') as SVGSVGElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(ScrapWaveBars);
    fixture.componentRef.setInput('data', [0.2, 0.6, 1]);
    await fixture.whenStable();
  });

  it('rend une barre par échantillon', () => {
    expect(rects()).toHaveLength(3);
  });

  it('centre chaque barre verticalement', () => {
    const [first] = rects();
    const h = Number(first.getAttribute('height'));
    const y = Number(first.getAttribute('y'));
    expect(y + h / 2).toBeCloseTo(20, 5);
  });

  it('donne une hauteur minimale aux échantillons nuls', async () => {
    fixture.componentRef.setInput('data', [0]);
    await fixture.whenStable();
    // Sans plancher, un silence rendrait une barre invisible et la forme
    // d'onde paraîtrait tronquée.
    expect(Number(rects()[0].getAttribute('height'))).toBeGreaterThan(0);
  });

  it('écrête les échantillons au-dessus de 1', async () => {
    fixture.componentRef.setInput('data', [5]);
    await fixture.whenStable();
    expect(Number(rects()[0].getAttribute('height'))).toBe(40);
  });

  it("n'affiche pas de tête de lecture sans progress", () => {
    expect(rects()).toHaveLength(3);
    expect(svg().getAttribute('aria-valuenow')).toBe('0');
  });

  it('colore les barres déjà jouées et pose la tête de lecture', async () => {
    fixture.componentRef.setInput('progress', 0.5);
    await fixture.whenStable();
    const all = rects();
    expect(all).toHaveLength(4); // 3 barres + la tête de lecture
    expect(all[3].classList.contains('scrap-wave__head')).toBe(true);
    const played = bars().filter((r) => r.classList.contains('is-played'));
    expect(played).toHaveLength(2);
  });

  it('marque les barres des plages altérées', async () => {
    fixture.componentRef.setInput('data', [0.5, 0.5, 0.5, 0.5]);
    fixture.componentRef.setInput('altered', [[0.25, 0.75]]);
    await fixture.whenStable();
    expect(bars().map((r) => r.classList.contains('is-altered'))).toEqual([
      false,
      true,
      true,
      false,
    ]);
  });

  it('expose la position en pourcentage', async () => {
    fixture.componentRef.setInput('progress', 0.42);
    await fixture.whenStable();
    expect(svg().getAttribute('aria-valuenow')).toBe('0.42');
    expect(svg().getAttribute('aria-valuetext')).toBe('42 %');
  });

  it('est atteignable au clavier avec une étiquette', async () => {
    fixture.componentRef.setInput('label', 'Lecture');
    await fixture.whenStable();
    expect(svg().getAttribute('role')).toBe('slider');
    expect(svg().getAttribute('tabindex')).toBe('0');
    expect(svg().getAttribute('aria-label')).toBe('Lecture');
  });

  describe('navigation clavier', () => {
    const press = async (key: string) => {
      const emitted: number[] = [];
      const sub = fixture.componentInstance.seek.subscribe((v) => emitted.push(v));
      svg().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      await fixture.whenStable();
      sub.unsubscribe();
      return emitted;
    };

    beforeEach(async () => {
      fixture.componentRef.setInput('progress', 0.5);
      await fixture.whenStable();
    });

    it('avance de 5 % vers la droite', async () => {
      expect(await press('ArrowRight')).toEqual([0.55]);
    });

    it('recule de 5 % vers la gauche', async () => {
      expect(await press('ArrowLeft')).toEqual([0.45]);
    });

    it('saute au début et à la fin', async () => {
      expect(await press('Home')).toEqual([0]);
      expect(await press('End')).toEqual([1]);
    });

    it('borne la sortie entre 0 et 1', async () => {
      fixture.componentRef.setInput('progress', 0.98);
      await fixture.whenStable();
      expect(await press('ArrowRight')).toEqual([1]);

      fixture.componentRef.setInput('progress', 0.02);
      await fixture.whenStable();
      expect(await press('ArrowLeft')).toEqual([0]);
    });

    it("n'émet rien sur une touche non gérée", async () => {
      expect(await press('x')).toEqual([]);
    });
  });
});

describe('ScrapWaveBars dans une piste de timeline', () => {
  let fixture: ComponentFixture<ScrapWaveBars>;
  const svg = () => fixture.nativeElement.querySelector('svg') as SVGSVGElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [{ provide: SCRAP_LANE, useValue: true }] });
    fixture = TestBed.createComponent(ScrapWaveBars);
    fixture.componentRef.setInput('data', [0.2, 0.6, 1]);
    fixture.componentRef.setInput('progress', 0.5);
    await fixture.whenStable();
  });

  it("n'est plus qu'un rendu : la piste gère le pointeur et le clavier", async () => {
    expect(svg().classList.contains('is-static')).toBe(true);
    expect(svg().getAttribute('role')).toBeNull();
    expect(svg().getAttribute('tabindex')).toBeNull();
    expect(svg().getAttribute('aria-hidden')).toBe('true');

    const emitted: number[] = [];
    const sub = fixture.componentInstance.seek.subscribe((v) => emitted.push(v));
    svg().dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    svg().dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await fixture.whenStable();
    sub.unsubscribe();
    expect(emitted).toEqual([]);
  });
});

describe('ScrapWaveLine', () => {
  let fixture: ComponentFixture<ScrapWaveLine>;

  const points = () =>
    (fixture.nativeElement.querySelector('polyline') as SVGPolylineElement).getAttribute('points');

  beforeEach(() => {
    fixture = TestBed.createComponent(ScrapWaveLine);
  });

  it('étale les échantillons sur toute la largeur', async () => {
    fixture.componentRef.setInput('data', [0.5, 0.5, 0.5]);
    await fixture.whenStable();
    expect(points()).toBe('0.00,20.00 50.00,20.00 100.00,20.00');
  });

  it("inverse l'axe vertical : 1 en haut, 0 en bas", async () => {
    fixture.componentRef.setInput('data', [1, 0]);
    await fixture.whenStable();
    expect(points()).toBe('0.00,0.00 100.00,40.00');
  });

  it('ne divise pas par zéro sur un échantillon unique', async () => {
    fixture.componentRef.setInput('data', [0.5]);
    await fixture.whenStable();
    expect(points()).toBe('0.00,20.00');
  });

  it('rend un tracé vide sans données', async () => {
    fixture.componentRef.setInput('data', []);
    await fixture.whenStable();
    expect(points()).toBe('');
  });
});

describe('ScrapVuMeter', () => {
  let fixture: ComponentFixture<ScrapVuMeter>;

  const segments = () =>
    [...fixture.nativeElement.querySelectorAll('.scrap-vu i')] as HTMLElement[];
  const lit = () => segments().filter((s) => s.classList.contains('on'));

  beforeEach(async () => {
    fixture = TestBed.createComponent(ScrapVuMeter);
    fixture.componentRef.setInput('level', 0);
    await fixture.whenStable();
  });

  it('rend le nombre de segments demandé', async () => {
    expect(segments()).toHaveLength(24);
    fixture.componentRef.setInput('count', 20);
    await fixture.whenStable();
    expect(segments()).toHaveLength(20);
  });

  it("n'allume rien au silence", () => {
    expect(lit()).toHaveLength(0);
  });

  it('allume tout au maximum', async () => {
    fixture.componentRef.setInput('level', 1);
    await fixture.whenStable();
    expect(lit()).toHaveLength(24);
  });

  it('allume proportionnellement au niveau', async () => {
    fixture.componentRef.setInput('count', 10);
    fixture.componentRef.setInput('level', 0.5);
    await fixture.whenStable();
    expect(lit()).toHaveLength(5);
  });

  it('échelonne les couleurs mousse → ocre → rouille', async () => {
    fixture.componentRef.setInput('count', 20);
    await fixture.whenStable();
    const zone = (s: HTMLElement) =>
      s.classList.contains('clip') ? 'rouille' : s.classList.contains('hot') ? 'ocre' : 'mousse';
    const zones = segments().map(zone);
    expect(zones[0]).toBe('mousse');
    expect(zones[11]).toBe('mousse');
    expect(zones[14]).toBe('ocre');
    expect(zones[19]).toBe('rouille');
  });

  it('expose son niveau en tant que meter', async () => {
    fixture.componentRef.setInput('level', 0.7);
    await fixture.whenStable();
    const meter = fixture.nativeElement.querySelector('[role="meter"]');
    expect(meter.getAttribute('aria-valuenow')).toBe('0.7');
    expect(meter.getAttribute('aria-valuemin')).toBe('0');
    expect(meter.getAttribute('aria-valuemax')).toBe('1');
  });
});
