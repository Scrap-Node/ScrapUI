import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScrapLane, ScrapMarker, ScrapRuler, ScrapTimeline, type ScrapTimeRange } from './timeline';
import { ScrapTimecode, ScrapTransport, formatClock } from './transport';
import { ScrapWaveBars } from './waveform';
import {
  ScrapShell,
  ScrapShellAside,
  ScrapShellBrand,
  ScrapShellHead,
  ScrapShellMain,
  ScrapShellNav,
  ScrapShellStatus,
  ScrapStatusItem,
  ScrapStatusSpacer,
  ScrapStatusbar,
} from './shell';

describe('formatClock', () => {
  it('écrit minutes, secondes et centièmes', () => {
    expect(formatClock(0)).toBe('00:00,00');
    expect(formatClock(6.4)).toBe('00:06,40');
    expect(formatClock(125.5)).toBe('02:05,50');
  });

  it('tronque les centièmes plutôt que de les arrondir', () => {
    expect(formatClock(6.399)).toBe('00:06,39');
    expect(formatClock(59.999)).toBe('00:59,99');
  });

  it('passe aux heures au-delà de 60 minutes', () => {
    expect(formatClock(3725)).toBe('1:02:05,00');
  });

  it('ramène les valeurs absurdes à zéro', () => {
    expect(formatClock(-3)).toBe('00:00,00');
    expect(formatClock(Number.NaN)).toBe('00:00,00');
  });
});

describe('ScrapTimecode', () => {
  it('affiche la position et, au besoin, la durée', async () => {
    const fixture = TestBed.createComponent(ScrapTimecode);
    fixture.componentRef.setInput('time', 2.5);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent?.trim()).toBe('00:02,50');
    expect(host.getAttribute('role')).toBe('timer');
    fixture.componentRef.setInput('duration', 6.4);
    await fixture.whenStable();
    expect(host.querySelector('small')?.textContent).toBe('/ 00:06,40');
  });
});

@Component({
  imports: [ScrapTransport],
  template: `<scrap-transport
    [(playing)]="playing"
    [(loop)]="loop"
    [time]="1.5"
    [duration]="6.4"
    (seek)="seeked.set($event)"
  >
    <span end id="fin">VU</span>
  </scrap-transport>`,
})
class TransportHost {
  readonly playing = signal(false);
  readonly loop = signal(true);
  readonly seeked = signal<number | null>(null);
}

describe('ScrapTransport', () => {
  let fixture: ComponentFixture<TransportHost>;
  const host = () => fixture.nativeElement.querySelector('scrap-transport') as HTMLElement;
  const play = () => host().querySelector('.scrap-transport__play') as HTMLButtonElement;
  const byLabel = (label: string) =>
    host().querySelector(`[aria-label="${label}"]`) as HTMLButtonElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(TransportHost);
    await fixture.whenStable();
  });

  it('bascule la lecture, et change le nom du bouton', async () => {
    expect(play().getAttribute('aria-label')).toBe('Lire');
    play().click();
    await fixture.whenStable();
    expect(fixture.componentInstance.playing()).toBe(true);
    expect(play().getAttribute('aria-label')).toBe('Pause');
  });

  it('bascule la boucle', async () => {
    expect(byLabel('Boucle').getAttribute('aria-pressed')).toBe('true');
    byLabel('Boucle').click();
    await fixture.whenStable();
    expect(fixture.componentInstance.loop()).toBe(false);
  });

  it('revient au début', () => {
    byLabel('Retour au début').click();
    expect(fixture.componentInstance.seeked()).toBe(0);
  });

  it('affiche le timecode et range à droite ce qui porte end', () => {
    expect(host().querySelector('scrap-timecode')?.textContent).toContain('00:01,50');
    expect(host().querySelector('.scrap-transport__end #fin')).not.toBeNull();
  });
});

/** Un parent qui pilote la lecture, et dont la lecture peut échouer. */
@Component({
  imports: [ScrapTransport],
  template: `<scrap-transport [playing]="playing()" (playingChange)="requests.push($event)" />`,
})
class ControlledTransportHost {
  readonly playing = signal(false);
  readonly requests: boolean[] = [];
}

describe('ScrapTransport piloté', () => {
  let fixture: ComponentFixture<ControlledTransportHost>;
  const play = () =>
    fixture.nativeElement.querySelector('.scrap-transport__play') as HTMLButtonElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(ControlledTransportHost);
    await fixture.whenStable();
  });

  it('demande la lecture sans se basculer lui-même', async () => {
    play().click();
    await fixture.whenStable();
    expect(fixture.componentInstance.requests).toEqual([true]);
    // la lecture n'a pas démarré : le bouton le dit, et un second clic redemande la lecture
    expect(play().getAttribute('aria-label')).toBe('Lire');
    play().click();
    await fixture.whenStable();
    expect(fixture.componentInstance.requests).toEqual([true, true]);
  });

  it("suit l'état que lui donne le parent", async () => {
    fixture.componentInstance.playing.set(true);
    await fixture.whenStable();
    expect(play().getAttribute('aria-label')).toBe('Pause');
    play().click();
    await fixture.whenStable();
    expect(fixture.componentInstance.requests).toEqual([false]);
    expect(play().getAttribute('aria-label')).toBe('Pause');
  });
});

@Component({
  imports: [ScrapTimeline, ScrapLane, ScrapMarker, ScrapWaveBars],
  template: `
    <scrap-timeline
      [duration]="duration()"
      [view]="view()"
      [(selection)]="zone"
      [(playhead)]="position"
    >
      <scrap-lane label="A"><scrap-wave-bars [data]="peaks" /></scrap-lane>
      <scrap-lane label="B"><scrap-wave-bars [data]="peaks" [altered]="[[0.1, 0.3]]" /></scrap-lane>
      <scrap-marker [at]="1.6">1</scrap-marker>
    </scrap-timeline>
  `,
})
class TimelineHost {
  readonly duration = signal(6.4);
  readonly view = signal<ScrapTimeRange | null>(null);
  readonly zone = signal<ScrapTimeRange | null>(null);
  readonly position = signal(0);
  readonly peaks = [0.2, 0.5, 0.8, 0.4];
}

describe('ScrapTimeline', () => {
  let fixture: ComponentFixture<TimelineHost>;
  const timeline = () => fixture.nativeElement.querySelector('scrap-timeline') as HTMLElement;
  const hit = () => timeline().querySelector('.scrap-timeline__hit') as HTMLElement;
  const key = (k: string, init: KeyboardEventInit = {}) =>
    hit().dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, ...init }));
  const pointer = (type: string, clientX: number) =>
    hit().dispatchEvent(new PointerEvent(type, { clientX, button: 0, pointerId: 1 }));

  beforeEach(async () => {
    fixture = TestBed.createComponent(TimelineHost);
    await fixture.whenStable();
    // jsdom ne mesure rien : on donne 640 px à la zone cliquable, 100 px par seconde.
    hit().getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 640, height: 100, right: 640, bottom: 100 }) as DOMRect;
  });

  it('gradue la règle en secondes rondes', () => {
    const labels = [...timeline().querySelectorAll('.scrap-ruler span:not(.minor)')].map((s) =>
      s.textContent?.trim(),
    );
    expect(labels.slice(0, 3)).toEqual(['0 s', '1 s', '2 s']);
    expect(timeline().querySelectorAll('.scrap-ruler span.minor').length).toBeGreaterThan(0);
  });

  it('rend les formes d’onde des pistes inertes', () => {
    const waves = [...timeline().querySelectorAll('svg.scrap-wave')];
    expect(waves).toHaveLength(2);
    expect(waves.every((w) => w.classList.contains('is-static'))).toBe(true);
    expect(timeline().querySelectorAll('.scrap-lane__label')[1].textContent).toBe('B');
  });

  it('place les repères sur la durée', () => {
    const marker = timeline().querySelector('scrap-marker') as HTMLElement;
    expect(marker.style.left).toBe('25%');
    expect(marker.textContent).toBe('1');
  });

  it('place la tête de lecture au clic, et efface la zone', async () => {
    fixture.componentInstance.zone.set([1, 2]);
    await fixture.whenStable();
    pointer('pointerdown', 320);
    pointer('pointerup', 320);
    await fixture.whenStable();
    expect(fixture.componentInstance.position()).toBeCloseTo(3.2);
    expect(fixture.componentInstance.zone()).toBeNull();
    const head = timeline().querySelector('.scrap-playhead') as HTMLElement;
    expect(head.style.left).toBe('50%');
  });

  it('sélectionne une zone en glissant, et y place la lecture', async () => {
    pointer('pointerdown', 100);
    pointer('pointermove', 300);
    pointer('pointerup', 300);
    await fixture.whenStable();
    const [a, b] = fixture.componentInstance.zone()!;
    expect(a).toBeCloseTo(1);
    expect(b).toBeCloseTo(3);
    expect(fixture.componentInstance.position()).toBeCloseTo(1);
    const sel = timeline().querySelector('.scrap-selection') as HTMLElement;
    expect(sel.hidden).toBe(false);
    expect(hit().getAttribute('aria-valuetext')).toBe('1 s, zone de 1 à 3 s');
  });

  it('ne fait pas de zone pour un geste de quelques pixels', async () => {
    pointer('pointerdown', 100);
    pointer('pointermove', 103);
    pointer('pointerup', 103);
    expect(fixture.componentInstance.zone()).toBeNull();
  });

  it('déplace la lecture au clavier', () => {
    key('ArrowRight');
    expect(fixture.componentInstance.position()).toBeCloseTo(0.1);
    key('PageUp');
    expect(fixture.componentInstance.position()).toBeCloseTo(1.1);
    key('End');
    expect(fixture.componentInstance.position()).toBeCloseTo(6.4);
    key('ArrowRight');
    expect(fixture.componentInstance.position()).toBeCloseTo(6.4);
    key('Home');
    expect(fixture.componentInstance.position()).toBe(0);
  });

  it('étend la zone avec ⇧, et l’efface avec Échap', async () => {
    fixture.componentInstance.position.set(1);
    await fixture.whenStable();
    key('PageUp', { shiftKey: true });
    key('PageUp', { shiftKey: true });
    expect(fixture.componentInstance.zone()).toEqual([1, 3]);
    key('ArrowLeft', { shiftKey: true });
    expect(fixture.componentInstance.zone()![1]).toBeCloseTo(2.9);
    key('Escape');
    expect(fixture.componentInstance.zone()).toBeNull();
  });

  it('expose la tête de lecture comme un curseur', () => {
    expect(hit().getAttribute('role')).toBe('slider');
    expect(hit().getAttribute('aria-valuemax')).toBe('6.4');
    expect(hit().getAttribute('aria-label')).toBe('Tête de lecture');
  });

  describe('avec une fenêtre visible', () => {
    beforeEach(async () => {
      fixture.componentInstance.view.set([2, 4]);
      await fixture.whenStable();
    });

    it('gradue la règle sur la fenêtre, pas sur la durée', () => {
      const labels = [...timeline().querySelectorAll('.scrap-ruler span:not(.minor)')].map((s) =>
        s.textContent?.trim(),
      );
      expect(labels[0]).toBe('2 s');
      expect(labels.at(-1)).toBe('3,8 s');
    });

    it('vise un temps de la fenêtre au clic', async () => {
      pointer('pointerdown', 320);
      pointer('pointerup', 320);
      await fixture.whenStable();
      expect(fixture.componentInstance.position()).toBeCloseTo(3);
      const head = timeline().querySelector('.scrap-playhead') as HTMLElement;
      expect(head.style.left).toBe('50%');
      expect(head.hidden).toBe(false);
    });

    it('masque ce qui sort de la fenêtre, et coupe la zone à ses bords', async () => {
      const head = timeline().querySelector('.scrap-playhead') as HTMLElement;
      const marker = timeline().querySelector('scrap-marker') as HTMLElement;
      expect(head.hidden).toBe(true);
      expect(marker.hidden).toBe(true);

      fixture.componentInstance.zone.set([1, 3]);
      await fixture.whenStable();
      const sel = timeline().querySelector('.scrap-selection') as HTMLElement;
      expect(sel.hidden).toBe(false);
      expect(sel.style.left).toBe('0%');
      expect(sel.style.width).toBe('50%');

      fixture.componentInstance.zone.set([5, 6]);
      await fixture.whenStable();
      expect(sel.hidden).toBe(true);
    });
  });
});

@Component({
  imports: [ScrapRuler],
  template: `<scrap-ruler [start]="start()" [end]="end()" />`,
})
class RulerHost {
  readonly start = signal(0);
  readonly end = signal(6.4);
}

describe('ScrapRuler', () => {
  let fixture: ComponentFixture<RulerHost>;
  const ruler = () => fixture.nativeElement.querySelector('scrap-ruler') as HTMLElement;
  const majors = () =>
    [...ruler().querySelectorAll('span:not(.minor)')].map((s) => ({
      label: s.textContent?.trim(),
      left: (s as HTMLElement).style.left,
    }));

  beforeEach(async () => {
    fixture = TestBed.createComponent(RulerHost);
    await fixture.whenStable();
  });

  it('se pose seule, hors de la timeline', () => {
    expect(ruler().classList).toContain('scrap-ruler');
    expect(ruler().getAttribute('aria-hidden')).toBe('true');
    expect(majors()[0]).toEqual({ label: '0 s', left: '0%' });
  });

  it('commence à la première graduation ronde de la fenêtre', async () => {
    fixture.componentInstance.start.set(1.3);
    fixture.componentInstance.end.set(3.3);
    await fixture.whenStable();
    // pas de 0,2 s : 1,4 s tombe à 5 % d'une fenêtre de 2 s
    expect(majors()[0]).toEqual({ label: '1,4 s', left: '5%' });
  });

  it('descend au centième quand la fenêtre est très étroite', async () => {
    fixture.componentInstance.start.set(1);
    fixture.componentInstance.end.set(1.2);
    await fixture.whenStable();
    expect(majors().map((m) => m.label)).toContain('1,02 s');
  });

  it('ne gradue rien sur une fenêtre vide', async () => {
    fixture.componentInstance.end.set(0);
    await fixture.whenStable();
    expect(ruler().querySelectorAll('span')).toHaveLength(0);
  });
});

@Component({
  imports: [
    ScrapShell,
    ScrapShellBrand,
    ScrapShellHead,
    ScrapShellNav,
    ScrapShellMain,
    ScrapShellAside,
    ScrapShellStatus,
    ScrapStatusbar,
    ScrapStatusItem,
    ScrapStatusSpacer,
  ],
  template: `
    <scrap-shell>
      <a scrapShellBrand href="/">DataBender</a>
      <header scrapShellHead>Menus</header>
      @if (nav()) {
        <nav scrapShellNav>Fichiers</nav>
      }
      <main scrapShellMain>Travail</main>
      @if (aside()) {
        <aside scrapShellAside>Propriétés</aside>
      }
      <scrap-statusbar scrapShellStatus>
        <span scrapStatusItem>Prêt</span>
        <button scrapStatusItem tone="warn">2 avertissements</button>
        <span scrapStatusSpacer></span>
        <span scrapStatusItem tone="err">Erreur</span>
      </scrap-statusbar>
    </scrap-shell>
  `,
})
class ShellHost {
  readonly nav = signal(true);
  readonly aside = signal(true);
}

describe('ScrapShell et ScrapStatusbar', () => {
  let fixture: ComponentFixture<ShellHost>;
  const shell = () => fixture.nativeElement.querySelector('scrap-shell') as HTMLElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(ShellHost);
    await fixture.whenStable();
  });

  it('pose une classe par région', () => {
    const classes = ['brand', 'head', 'nav', 'main', 'aside', 'status'].map(
      (r) => !!shell().querySelector(`.scrap-shell__${r}`),
    );
    expect(classes.every(Boolean)).toBe(true);
    expect(shell().classList).toContain('scrap-shell');
  });

  it('donne toute la largeur à la zone de travail sans navigation', async () => {
    expect(shell().classList).not.toContain('scrap-shell--no-nav');
    fixture.componentInstance.nav.set(false);
    await fixture.whenStable();
    expect(shell().classList).toContain('scrap-shell--no-nav');
  });

  it("donne la place de l'inspecteur à la zone de travail quand il manque", async () => {
    expect(shell().classList).not.toContain('scrap-shell--no-aside');
    fixture.componentInstance.aside.set(false);
    await fixture.whenStable();
    expect(shell().classList).toContain('scrap-shell--no-aside');
  });

  it('nomme la barre d’état sans en faire une région live', () => {
    const bar = shell().querySelector('scrap-statusbar') as HTMLElement;
    expect(bar.getAttribute('role')).toBe('region');
    expect(bar.getAttribute('aria-label')).toBe("Barre d'état");
    expect(bar.hasAttribute('aria-live')).toBe(false);
    const items = [...bar.querySelectorAll('.scrap-statusbar__item')];
    expect(items).toHaveLength(3);
    expect(items[1].classList).toContain('scrap-statusbar__item--warn');
    expect(items[2].classList).toContain('scrap-statusbar__item--err');
    expect(bar.querySelector('.scrap-statusbar__spacer')?.getAttribute('aria-hidden')).toBe('true');
  });
});
