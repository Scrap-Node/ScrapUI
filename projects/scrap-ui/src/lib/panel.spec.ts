import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScrapDocTab, ScrapPanel } from './panel';

@Component({
  imports: [ScrapPanel],
  template: `
    <scrap-panel [title]="title()">
      @if (withActions()) {
        <button actions id="options">…</button>
      }
      <p id="contenu">Réglages</p>
      @if (withFooter()) {
        <div footer><button id="enregistrer">Enregistrer</button></div>
      }
    </scrap-panel>
  `,
})
class PanelHost {
  readonly title = signal('Propriétés');
  readonly withActions = signal(true);
  readonly withFooter = signal(true);
}

describe('ScrapPanel', () => {
  let fixture: ComponentFixture<PanelHost>;
  const panel = () => fixture.nativeElement.querySelector('scrap-panel') as HTMLElement;
  const part = (name: string) => panel().querySelector(`.scrap-panel__${name}`) as HTMLElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(PanelHost);
    await fixture.whenStable();
  });

  it('range le titre et ses actions en tête, le contenu au milieu, le pied en bas', () => {
    expect(panel().classList).toContain('scrap-panel');
    expect(part('head').querySelector('h2')?.textContent?.trim()).toBe('Propriétés');
    expect(part('head').querySelector('#options')).not.toBeNull();
    expect(part('body').querySelector('#contenu')).not.toBeNull();
    expect(part('foot').querySelector('#enregistrer')).not.toBeNull();
  });

  it('nomme sa région par son titre', () => {
    const heading = part('head').querySelector('h2') as HTMLElement;
    expect(panel().getAttribute('role')).toBe('region');
    expect(panel().getAttribute('aria-labelledby')).toBe(heading.id);
  });

  it("laisse vides — donc masqués — la tête et le pied qu'on ne remplit pas", async () => {
    fixture.componentInstance.title.set('');
    fixture.componentInstance.withActions.set(false);
    fixture.componentInstance.withFooter.set(false);
    await fixture.whenStable();
    expect(part('head').matches(':empty')).toBe(true);
    expect(part('foot').matches(':empty')).toBe(true);
    expect(panel().hasAttribute('role')).toBe(false);
  });
});

describe('ScrapDocTab', () => {
  let fixture: ComponentFixture<ScrapDocTab>;
  const host = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(ScrapDocTab);
    await fixture.whenStable();
  });

  it("n'affiche pas de pastille tant que le document n'est pas modifié", () => {
    expect(host().classList).toContain('scrap-doctab');
    expect(host().querySelector('.scrap-doctab__dot')).toBeNull();
  });

  it('annonce la modification par une pastille nommée', async () => {
    fixture.componentRef.setInput('modified', true);
    await fixture.whenStable();
    const dot = host().querySelector('.scrap-doctab__dot') as HTMLElement;
    expect(dot.getAttribute('role')).toBe('img');
    expect(dot.getAttribute('aria-label')).toBe('Modifié');
    expect(host().classList).toContain('scrap-doctab--modified');
  });
});
