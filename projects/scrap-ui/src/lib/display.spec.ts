import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ScrapCallout,
  ScrapDisclosure,
  ScrapProgress,
  ScrapProp,
  ScrapProps,
  ScrapTable,
  type ScrapCalloutTone,
} from './display';
import { ScrapBadge } from './badge';
import { ScrapBreadcrumbs } from './breadcrumbs';

describe('ScrapProgress', () => {
  let fixture: ComponentFixture<ScrapProgress>;
  const host = () => fixture.nativeElement as HTMLElement;
  const bar = () => host().querySelector('[role="progressbar"]') as HTMLElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(ScrapProgress);
    fixture.componentRef.setInput('label', 'Export du WAV');
    fixture.componentRef.setInput('value', 0.424);
    await fixture.whenStable();
  });

  it('affiche et annonce le pourcentage', () => {
    expect(bar().getAttribute('aria-valuenow')).toBe('42');
    expect(host().querySelector('output')?.textContent?.trim()).toBe('42\u00a0%');
    const label = host().querySelector('.scrap-progress__top span') as HTMLElement;
    expect(bar().getAttribute('aria-labelledby')).toBe(label.id);
    expect((bar().querySelector('i') as HTMLElement).style.getPropertyValue('--value')).toBe('42%');
  });

  it('borne la valeur entre 0 et 1', async () => {
    fixture.componentRef.setInput('value', 3);
    await fixture.whenStable();
    expect(bar().getAttribute('aria-valuenow')).toBe('100');
  });

  it('devient indéterminée sans valeur', async () => {
    fixture.componentRef.setInput('value', null);
    await fixture.whenStable();
    expect(host().classList).toContain('scrap-progress--indeterminate');
    expect(bar().hasAttribute('aria-valuenow')).toBe(false);
    expect(host().querySelector('output')).toBeNull();
  });

  it('se nomme seule sans étiquette', async () => {
    fixture.componentRef.setInput('label', undefined);
    await fixture.whenStable();
    expect(bar().getAttribute('aria-label')).toBe('Progression');
  });
});

@Component({
  imports: [ScrapCallout],
  template: `<scrap-callout [tone]="tone()" [title]="title()">Le MP3 sera décodé.</scrap-callout>`,
})
class CalloutHost {
  readonly tone = signal<ScrapCalloutTone>('info');
  readonly title = signal<string | undefined>('Fichier compressé');
}

describe('ScrapCallout', () => {
  let fixture: ComponentFixture<CalloutHost>;
  const callout = () => fixture.nativeElement.querySelector('scrap-callout') as HTMLElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(CalloutHost);
    await fixture.whenStable();
  });

  it('affiche le titre et le texte', () => {
    expect(callout().querySelector('.scrap-callout__title')?.textContent).toBe('Fichier compressé');
    expect(callout().querySelector('.scrap-callout__text')?.textContent).toBe(
      'Le MP3 sera décodé.',
    );
  });

  it("change de classe et d'icône avec la tonalité", async () => {
    const path = () => callout().querySelector('scrap-icon path')?.getAttribute('d');
    const info = path();
    fixture.componentInstance.tone.set('warning');
    await fixture.whenStable();
    expect(callout().classList).toContain('scrap-callout--warning');
    expect(path()).not.toBe(info);
  });

  it('se passe de titre', async () => {
    fixture.componentInstance.title.set(undefined);
    await fixture.whenStable();
    expect(callout().querySelector('.scrap-callout__title')).toBeNull();
  });
});

@Component({
  imports: [ScrapProps, ScrapProp, ScrapDisclosure, ScrapBadge, ScrapTable],
  template: `
    <dl scrap-props>
      <div scrap-prop label="Échantillonnage">48 kHz</div>
      <div scrap-prop label="Durée" icon="clock">6,4 s</div>
    </dl>
    <details scrap-disclosure summary="Réglages avancés" [(open)]="open">
      <scrap-badge>3</scrap-badge>
      <p>Contenu</p>
    </details>
    <table scrap-table>
      <tr>
        <td>a</td>
      </tr>
    </table>
  `,
})
class MiscHost {
  readonly open = signal(false);
}

describe('ScrapProps, ScrapDisclosure, ScrapTable', () => {
  let fixture: ComponentFixture<MiscHost>;
  const q = <T extends Element>(s: string) => fixture.nativeElement.querySelector(s) as T;

  beforeEach(async () => {
    fixture = TestBed.createComponent(MiscHost);
    await fixture.whenStable();
  });

  it('range chaque propriété en paire dt et dd', () => {
    const dl = q<HTMLElement>('dl');
    expect(dl.classList).toContain('scrap-props');
    const dts = [...dl.querySelectorAll('dt')].map((d) => d.textContent?.trim());
    const dds = [...dl.querySelectorAll('dd')].map((d) => d.textContent?.trim());
    expect(dts).toEqual(['Échantillonnage', 'Durée']);
    expect(dds).toEqual(['48 kHz', '6,4 s']);
    expect(dl.querySelectorAll('dt scrap-icon')).toHaveLength(1);
  });

  it("met le titre de l'accordéon et son badge dans le summary", () => {
    const summary = q<HTMLElement>('details > summary');
    expect(summary.textContent).toContain('Réglages avancés');
    expect(summary.querySelector('scrap-badge')).not.toBeNull();
    expect(q<HTMLElement>('.scrap-disclosure__body p').textContent).toBe('Contenu');
  });

  it("ouvre l'accordéon depuis le parent, et remonte l'ouverture native", async () => {
    const details = q<HTMLDetailsElement>('details');
    fixture.componentInstance.open.set(true);
    await fixture.whenStable();
    expect(details.open).toBe(true);

    details.open = false;
    details.dispatchEvent(new Event('toggle'));
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('pose la classe de table', () => {
    expect(q<HTMLElement>('table').classList).toContain('scrap-table');
  });
});

describe('ScrapBreadcrumbs', () => {
  it('relie les niveaux et marque la page courante', async () => {
    const fixture = TestBed.createComponent(ScrapBreadcrumbs);
    fixture.componentRef.setInput('items', [
      { label: 'Atelier', href: '/' },
      { label: 'Sessions' },
      { label: 'moteur.wav', href: '/ignored' },
    ]);
    await fixture.whenStable();
    const nav = fixture.nativeElement.querySelector('nav') as HTMLElement;
    expect(nav.getAttribute('aria-label')).toBe("Fil d'Ariane");
    const links = [...nav.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(links).toEqual(['/']);
    const current = nav.querySelector('[aria-current="page"]') as HTMLElement;
    expect(current.tagName).toBe('SPAN');
    expect(current.textContent).toBe('moteur.wav');
    expect(nav.querySelectorAll('scrap-icon')).toHaveLength(2);
  });
});
