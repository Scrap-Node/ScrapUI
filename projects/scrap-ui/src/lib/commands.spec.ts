import { Component, inject } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScrapCommandPalette, ScrapCommands, fuzzyMatch, type ScrapCommand } from './commands';
import { installDialogPolyfill } from '../testing/dialog-polyfill';

const press = (key: string, init: KeyboardEventInit = {}, target: EventTarget = document.body) =>
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }),
  );

describe('fuzzyMatch', () => {
  it('trouve les lettres dans l’ordre, sans accents ni casse', () => {
    expect(fuzzyMatch('dét', 'Détruire la zone')?.indices).toEqual([0, 1, 2]);
    expect(fuzzyMatch('DZ', 'Détruire la zone')).not.toBeNull();
    expect(fuzzyMatch('zd', 'Détruire la zone')).toBeNull();
  });

  it('préfère les lettres qui se suivent et les débuts de mots', () => {
    // « dét » : le « d » de « dernière », puis « ét » au début de « étape ».
    const match = fuzzyMatch('dét', 'Annuler la dernière passe, étape 3')!;
    const label = [...'Annuler la dernière passe, étape 3'];
    expect(match.indices.map((i) => label[i]).join('')).toBe('dét');
    expect(match.indices[1]).toBe(label.indexOf('é', 20));
  });

  it('classe un mot entier avant des lettres éparses', () => {
    const exact = fuzzyMatch('export', 'Exporter le WAV')!.score;
    const loose = fuzzyMatch('export', 'Échanger, ouvrir et passer en revue tout')?.score ?? -1;
    expect(exact).toBeGreaterThan(loose);
  });

  it('accepte une requête vide', () => {
    expect(fuzzyMatch('', 'Tout')).toEqual({ score: 0, indices: [] });
  });
});

describe('ScrapCommands', () => {
  let commands: ScrapCommands;
  const runs: string[] = [];
  const command = (id: string, extra: Partial<ScrapCommand> = {}): ScrapCommand => ({
    id,
    label: id,
    run: () => runs.push(id),
    ...extra,
  });

  beforeEach(() => {
    runs.length = 0;
    TestBed.resetTestingModule();
    commands = TestBed.inject(ScrapCommands);
  });

  it('enregistre, remplace et retire des commandes', () => {
    const off = commands.register(command('a'), command('b'));
    commands.register(command('a', { label: 'A bis' }));
    expect(commands.commands().map((c) => c.label)).toEqual(['b', 'A bis']);
    off();
    expect(commands.commands().map((c) => c.label)).toEqual(['A bis']);
  });

  it('lance une commande par son identifiant, sauf si elle est indisponible', () => {
    commands.register(command('a'), command('b', { disabled: () => true }));
    expect(commands.run('a')).toBe(true);
    expect(commands.run('b')).toBe(false);
    expect(commands.run('inconnue')).toBe(false);
    expect(runs).toEqual(['a']);
  });

  it('déclenche les raccourcis dans toute la page', () => {
    commands.register(command('detruire', { shortcut: 'mod+enter' }));
    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    document.body.dispatchEvent(event);
    expect(runs).toEqual(['detruire']);
    expect(event.defaultPrevented).toBe(true);
  });

  it('respecte exactement les modificateurs', () => {
    commands.register(command('annuler', { shortcut: 'mod+z' }));
    press('z', { ctrlKey: true, shiftKey: true });
    expect(runs).toEqual([]);
    press('z', { ctrlKey: true });
    expect(runs).toEqual(['annuler']);
  });

  it("tait les raccourcis d'une lettre pendant une saisie", () => {
    commands.register(command('zone', { shortcut: 'T' }));
    const input = document.createElement('input');
    document.body.appendChild(input);
    press('t', {}, input);
    expect(runs).toEqual([]);
    press('t');
    expect(runs).toEqual(['zone']);
    input.remove();
  });

  it('ignore une touche déjà traitée par un composant', () => {
    commands.register(command('zone', { shortcut: 'T' }));
    const event = new KeyboardEvent('keydown', { key: 't', bubbles: true, cancelable: true });
    event.preventDefault();
    document.body.dispatchEvent(event);
    expect(runs).toEqual([]);
  });

  it("retire les commandes d'un composant détruit", () => {
    @Component({ template: '' })
    class Declarer {
      constructor() {
        inject(ScrapCommands).register(command('locale'));
      }
    }
    const fixture = TestBed.createComponent(Declarer);
    expect(commands.commands().map((c) => c.id)).toEqual(['locale']);
    fixture.destroy();
    expect(commands.commands()).toEqual([]);
  });
});

describe('ScrapCommandPalette', () => {
  let fixture: ComponentFixture<ScrapCommandPalette>;
  let commands: ScrapCommands;
  const runs: string[] = [];
  const host = () => fixture.nativeElement as HTMLElement;
  const dialog = () => host().querySelector('dialog') as HTMLDialogElement;
  const input = () => host().querySelector('input') as HTMLInputElement;
  const options = () => [...host().querySelectorAll('[role="option"]')] as HTMLElement[];
  const type = async (text: string) => {
    input().value = text;
    input().dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };

  beforeEach(async () => {
    installDialogPolyfill();
    runs.length = 0;
    TestBed.resetTestingModule();
    fixture = TestBed.createComponent(ScrapCommandPalette);
    commands = TestBed.inject(ScrapCommands);
    commands.register(
      {
        id: 'detruire',
        label: 'Détruire la zone',
        group: 'Destruction',
        shortcut: 'mod+enter',
        icon: 'bolt',
        run: () => runs.push('detruire'),
      },
      {
        id: 'annuler',
        label: 'Annuler la dernière passe',
        group: 'Destruction',
        run: () => runs.push('annuler'),
      },
      {
        id: 'exporter',
        label: 'Exporter le WAV détruit',
        group: 'Fichier',
        hint: '48 kHz',
        run: () => runs.push('exporter'),
      },
    );
    await fixture.whenStable();
  });

  it("s'ouvre avec ⌘K ou Ctrl+K", async () => {
    expect(dialog().open).toBe(false);
    press('k', { ctrlKey: true });
    await fixture.whenStable();
    expect(dialog().open).toBe(true);
    expect(commands.isOpen()).toBe(true);
  });

  it('liste toutes les commandes par groupe, avec leurs raccourcis', async () => {
    commands.open();
    await fixture.whenStable();
    const groups = [...host().querySelectorAll('.scrap-palette__group')].map((g) =>
      g.textContent?.trim(),
    );
    expect(groups).toEqual(['Destruction', 'Fichier']);
    expect(options()).toHaveLength(3);
    expect(options()[0].querySelector('kbd')?.textContent).toBe('Ctrl+Entrée');
    expect(options()[2].querySelector('small')?.textContent).toBe('48 kHz');
    expect(options()[0].getAttribute('aria-selected')).toBe('true');
  });

  it('filtre, classe et surligne les lettres trouvées', async () => {
    commands.open();
    await fixture.whenStable();
    await type('exp');
    expect(options()).toHaveLength(1);
    expect(options()[0].querySelector('mark')?.textContent).toBe('Exp');
  });

  it('le dit quand rien ne correspond', async () => {
    commands.open();
    await fixture.whenStable();
    await type('zzz');
    expect(options()).toHaveLength(0);
    expect(host().querySelector('.scrap-palette__empty')?.textContent).toContain(
      '«\u00a0zzz\u00a0»',
    );
  });

  it('choisit avec les flèches et lance avec Entrée, puis se referme', async () => {
    commands.open();
    await fixture.whenStable();
    press('ArrowDown', {}, input());
    await fixture.whenStable();
    expect(input().getAttribute('aria-activedescendant')).toBe(options()[1].id);
    press('Enter', {}, input());
    await fixture.whenStable();
    expect(runs).toEqual(['annuler']);
    expect(dialog().open).toBe(false);
    expect(commands.isOpen()).toBe(false);
  });

  it('lance une commande au clic', async () => {
    commands.open();
    await fixture.whenStable();
    options()[2].click();
    expect(runs).toEqual(['exporter']);
  });

  it('cache les commandes indisponibles', async () => {
    commands.register({
      id: 'cachee',
      label: 'Cachée',
      disabled: () => true,
      run: () => undefined,
    });
    commands.open();
    await fixture.whenStable();
    expect(options()).toHaveLength(3);
  });

  it('ne déclenche pas les raccourcis des commandes tant qu’elle est ouverte', async () => {
    commands.open();
    await fixture.whenStable();
    press('Enter', { ctrlKey: true });
    expect(runs).toEqual([]);
  });
});
