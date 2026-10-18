import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScrapModal } from './modal';
import { installDialogPolyfill } from '../testing/dialog-polyfill';

@Component({
  imports: [ScrapModal],
  template: `
    <scrap-modal [(open)]="open" title="Confirmer">
      <p>Corps</p>
      <div actions><button>OK</button></div>
    </scrap-modal>
  `,
})
class Host {
  readonly open = signal(false);
}

describe('ScrapModal', () => {
  let fixture: ComponentFixture<Host>;
  const dialog = () => fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;

  beforeEach(async () => {
    installDialogPolyfill();
    fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('reste fermée au départ', () => {
    expect(dialog().open).toBe(false);
  });

  it("s'ouvre et se ferme au gré de l'entrée open", async () => {
    fixture.componentInstance.open.set(true);
    await fixture.whenStable();
    expect(dialog().open).toBe(true);

    fixture.componentInstance.open.set(false);
    await fixture.whenStable();
    expect(dialog().open).toBe(false);
  });

  it('bloque puis rend le défilement de la page', async () => {
    fixture.componentInstance.open.set(true);
    await fixture.whenStable();
    expect(document.body.style.overflow).toBe('hidden');

    fixture.componentInstance.open.set(false);
    await fixture.whenStable();
    expect(document.body.style.overflow).toBe('');
  });

  it('nomme la boîte de dialogue par son titre', async () => {
    fixture.componentInstance.open.set(true);
    await fixture.whenStable();
    const titleId = dialog().getAttribute('aria-labelledby');
    expect(titleId).toBeTruthy();
    expect(fixture.nativeElement.querySelector(`#${titleId}`).textContent.trim()).toBe('Confirmer');
  });

  it('se referme via le bouton de fermeture', async () => {
    fixture.componentInstance.open.set(true);
    await fixture.whenStable();
    const close = fixture.nativeElement.querySelector('.scrap-dialog__close') as HTMLButtonElement;
    expect(close.getAttribute('aria-label')).toBe('Fermer');
    close.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('se referme au clic sur le fond, pas sur le panneau', async () => {
    fixture.componentInstance.open.set(true);
    await fixture.whenStable();

    (fixture.nativeElement.querySelector('.scrap-dialog__panel') as HTMLElement).click();
    await fixture.whenStable();
    expect(fixture.componentInstance.open()).toBe(true);

    dialog().click();
    await fixture.whenStable();
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it("remonte la fermeture native (Échap) dans l'entrée open", async () => {
    fixture.componentInstance.open.set(true);
    await fixture.whenStable();

    // Le <dialog> natif gère Échap tout seul : il faut que le signal suive.
    dialog().dispatchEvent(new Event('close'));
    await fixture.whenStable();
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('rend le défilement si la modale est détruite ouverte', async () => {
    fixture.componentInstance.open.set(true);
    await fixture.whenStable();
    expect(document.body.style.overflow).toBe('hidden');

    // Une navigation qui détruit la vue pendant que la modale est ouverte
    // laissait la page verrouillée pour de bon.
    fixture.destroy();
    expect(document.body.style.overflow).toBe('');
  });

  it('projette le corps et les actions', async () => {
    fixture.componentInstance.open.set(true);
    await fixture.whenStable();
    const query = (selector: string) => fixture.nativeElement.querySelector(selector);
    expect(query('.scrap-dialog__body p').textContent).toBe('Corps');
    expect(query('.scrap-dialog__actions button').textContent).toBe('OK');
    expect(dialog().classList.contains('scrap-dialog')).toBe(true);
  });
});
