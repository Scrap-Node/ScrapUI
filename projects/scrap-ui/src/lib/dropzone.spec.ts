import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScrapDropzone, acceptsFile } from './dropzone';

const wav = () => new File(['RIFF'], 'moteur.wav', { type: 'audio/wav' });
const mp3 = () => new File(['ID3'], 'voix.mp3', { type: 'audio/mpeg' });
const png = () => new File(['PNG'], 'apercu.png', { type: 'image/png' });

/** jsdom n'a ni DragEvent ni DataTransfer : un événement nu, avec ses fichiers. */
function drag(type: string, files: File[] = []): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'dataTransfer', { value: { files, dropEffect: 'none' } });
  return event;
}

describe('acceptsFile', () => {
  it('accepte tout sans règle', () => {
    expect(acceptsFile(png(), '')).toBe(true);
    expect(acceptsFile(png(), undefined)).toBe(true);
  });

  it('reconnaît extensions, types et familles', () => {
    expect(acceptsFile(wav(), '.wav')).toBe(true);
    expect(acceptsFile(wav(), '.WAV')).toBe(true);
    expect(acceptsFile(mp3(), '.wav')).toBe(false);
    expect(acceptsFile(mp3(), 'audio/*')).toBe(true);
    expect(acceptsFile(png(), 'audio/*')).toBe(false);
    expect(acceptsFile(mp3(), '.wav, audio/mpeg')).toBe(true);
  });
});

@Component({
  imports: [ScrapDropzone],
  template: `
    <scrap-dropzone
      accept=".wav"
      hint="WAV en PCM, de 8 à 32 bits."
      [multiple]="multiple()"
      [error]="error()"
      (files)="files.set($event)"
      (rejected)="rejected.set($event)"
    />
  `,
})
class Host {
  readonly multiple = signal(false);
  readonly error = signal<string | null>(null);
  readonly files = signal<File[]>([]);
  readonly rejected = signal<File[]>([]);
}

describe('ScrapDropzone', () => {
  let fixture: ComponentFixture<Host>;
  const zone = () => fixture.nativeElement.querySelector('scrap-dropzone') as HTMLElement;
  const input = () => zone().querySelector('input[type="file"]') as HTMLInputElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
  });

  it('nomme le champ fichier et le décrit par son indice', () => {
    const strong = zone().querySelector('strong') as HTMLElement;
    const hint = zone().querySelector('small') as HTMLElement;
    expect(input().getAttribute('aria-labelledby')).toBe(strong.id);
    expect(input().getAttribute('aria-describedby')).toBe(hint.id);
    expect(input().accept).toBe('.wav');
  });

  it('se met en avant pendant le survol, et le défait en sortant', async () => {
    const over = drag('dragover');
    zone().dispatchEvent(over);
    await fixture.whenStable();
    expect(over.defaultPrevented).toBe(true);
    expect(zone().classList).toContain('is-over');

    zone().dispatchEvent(drag('dragleave'));
    await fixture.whenStable();
    expect(zone().classList).not.toContain('is-over');
  });

  it('trie les fichiers déposés selon accept', async () => {
    fixture.componentInstance.multiple.set(true);
    await fixture.whenStable();
    const drop = drag('drop', [wav(), mp3()]);
    zone().dispatchEvent(drop);
    expect(drop.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.files().map((f) => f.name)).toEqual(['moteur.wav']);
    expect(fixture.componentInstance.rejected().map((f) => f.name)).toEqual(['voix.mp3']);
  });

  it('ne garde que le premier fichier sans multiple', () => {
    zone().dispatchEvent(drag('drop', [wav(), new File([''], 'b.wav', { type: 'audio/wav' })]));
    expect(fixture.componentInstance.files().map((f) => f.name)).toEqual(['moteur.wav']);
  });

  it('prend les fichiers choisis au clic', () => {
    Object.defineProperty(input(), 'files', { value: [wav()], configurable: true });
    input().dispatchEvent(new Event('change', { bubbles: true }));
    expect(fixture.componentInstance.files().map((f) => f.name)).toEqual(['moteur.wav']);
  });

  it("affiche et annonce l'erreur, et marque le champ invalide", async () => {
    fixture.componentInstance.error.set("« voix.mp3 » n'est pas un fichier WAV");
    await fixture.whenStable();
    const error = zone().querySelector('.scrap-dropzone__error') as HTMLElement;
    expect(error.getAttribute('role')).toBe('alert');
    expect(zone().classList).toContain('is-error');
    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(input().getAttribute('aria-describedby')).toContain(error.id);
  });
});
