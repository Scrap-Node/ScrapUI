import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScrapHistory, type ScrapHistoryItem } from './history';
import { ScrapTree, type ScrapTreeNode } from './tree';
import { ScrapSheet } from './sheet';

const key = (el: Element, k: string) =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

@Component({
  imports: [ScrapHistory],
  template: `<scrap-history
    label="Historique des passes"
    [items]="items"
    [current]="current()"
    (jump)="current.set($event)"
  />`,
})
class HistoryHost {
  readonly items: ScrapHistoryItem[] = [
    { label: 'Ouverture de moteur.wav', meta: '10:02', icon: 'file', kind: 'open' },
    { label: 'Zéro, de 0,6 à 2,2 s', meta: '10:04', kind: 'destroy' },
    { label: 'XOR 0x80', meta: '10:07', kind: 'destroy' },
    { label: 'Écho', meta: '10:11', kind: 'destroy' },
  ];
  readonly current = signal<number | undefined>(2);
}

describe('ScrapHistory', () => {
  let fixture: ComponentFixture<HistoryHost>;
  const list = () => fixture.nativeElement.querySelector('ol') as HTMLElement;
  const steps = () => [...list().querySelectorAll('button')] as HTMLButtonElement[];

  beforeEach(async () => {
    fixture = TestBed.createComponent(HistoryHost);
    await fixture.whenStable();
  });

  it("marque l'étape courante et grise les suivantes", () => {
    expect(list().getAttribute('aria-label')).toBe('Historique des passes');
    expect(steps().map((s) => s.getAttribute('aria-current'))).toEqual([null, null, 'step', null]);
    expect(steps().map((s) => s.classList.contains('is-undone'))).toEqual([
      false,
      false,
      false,
      true,
    ]);
    expect(steps()[3].textContent).toContain('annulée');
    expect(steps()[1].getAttribute('data-kind')).toBe('destroy');
    expect(steps()[0].querySelector('.scrap-history__meta')?.textContent).toBe('10:02');
  });

  it("prend la dernière étape quand current n'est pas donné", async () => {
    fixture.componentInstance.current.set(undefined);
    await fixture.whenStable();
    expect(steps()[3].getAttribute('aria-current')).toBe('step');
  });

  it('revient à une étape au clic', async () => {
    steps()[1].click();
    await fixture.whenStable();
    expect(fixture.componentInstance.current()).toBe(1);
    expect(steps()[2].classList).toContain('is-undone');
  });

  it('garde un seul arrêt de tabulation et se parcourt avec les flèches', () => {
    expect(steps().map((s) => s.tabIndex)).toEqual([-1, -1, 0, -1]);
    steps()[2].focus();
    key(steps()[2], 'ArrowDown');
    expect(document.activeElement).toBe(steps()[3]);
    key(steps()[3], 'Home');
    expect(document.activeElement).toBe(steps()[0]);
  });
});

const NODES: ScrapTreeNode[] = [
  {
    id: 'sessions',
    label: 'sessions',
    expanded: true,
    children: [
      { id: 'moteur', label: 'moteur.wav', icon: 'waveform', mark: 'M' },
      { id: 'impact', label: 'impact.wav', icon: 'waveform' },
    ],
  },
  {
    id: 'recettes',
    label: 'recettes',
    children: [{ id: 'bavure', label: 'bavure.toml', icon: 'file-code' }],
  },
  { id: 'exports', label: 'exports', mark: '2' },
];

@Component({
  imports: [ScrapTree],
  template: `<scrap-tree label="Atelier" [nodes]="nodes" [(selected)]="selected" />`,
})
class TreeHost {
  readonly nodes = NODES;
  readonly selected = signal<string | null>('moteur');
}

describe('ScrapTree', () => {
  let fixture: ComponentFixture<TreeHost>;
  const tree = () => fixture.nativeElement.querySelector('[role="tree"]') as HTMLElement;
  const item = (id: string) =>
    [...tree().querySelectorAll<HTMLElement>('[role="treeitem"]')].find(
      (el) => el.dataset['id'] === id,
    );
  const ids = () =>
    [...tree().querySelectorAll<HTMLElement>('[role="treeitem"]')].map((el) => el.dataset['id']);

  beforeEach(async () => {
    fixture = TestBed.createComponent(TreeHost);
    await fixture.whenStable();
  });

  it('affiche les dossiers dépliés au départ, et seulement eux', () => {
    expect(tree().getAttribute('aria-label')).toBe('Atelier');
    expect(ids()).toEqual(['sessions', 'moteur', 'impact', 'recettes', 'exports']);
    expect(item('sessions')?.getAttribute('aria-expanded')).toBe('true');
    expect(item('recettes')?.getAttribute('aria-expanded')).toBe('false');
    expect(item('exports')?.hasAttribute('aria-expanded')).toBe(false);
    expect(item('moteur')?.getAttribute('aria-level')).toBe('2');
  });

  it("marque le nœud choisi et lui donne l'arrêt de tabulation", () => {
    expect(item('moteur')?.getAttribute('aria-selected')).toBe('true');
    expect(item('moteur')?.tabIndex).toBe(0);
    expect(item('sessions')?.tabIndex).toBe(-1);
    expect(item('moteur')?.querySelector('.scrap-tree__mark--m')?.textContent).toBe('M');
  });

  it('se parcourt avec ↑ et ↓ sans changer le choix', async () => {
    item('moteur')!.focus();
    key(item('moteur')!, 'ArrowDown');
    await fixture.whenStable();
    expect(document.activeElement).toBe(item('impact'));
    expect(fixture.componentInstance.selected()).toBe('moteur');
    key(item('impact')!, 'ArrowUp');
    key(item('moteur')!, 'ArrowUp');
    expect(document.activeElement).toBe(item('sessions'));
  });

  it('déplie avec → puis entre dans le dossier, replie avec ←', async () => {
    item('recettes')!.focus();
    key(item('recettes')!, 'ArrowRight');
    await fixture.whenStable();
    expect(item('recettes')?.getAttribute('aria-expanded')).toBe('true');
    expect(ids()).toContain('bavure');

    key(item('recettes')!, 'ArrowRight');
    expect(document.activeElement).toBe(item('bavure'));

    key(item('bavure')!, 'ArrowLeft');
    expect(document.activeElement).toBe(item('recettes'));
    key(item('recettes')!, 'ArrowLeft');
    await fixture.whenStable();
    expect(ids()).not.toContain('bavure');
  });

  it('choisit avec Entrée, et déplie un dossier au passage', async () => {
    item('impact')!.focus();
    key(item('impact')!, 'Enter');
    await fixture.whenStable();
    expect(fixture.componentInstance.selected()).toBe('impact');

    key(item('sessions')!, ' ');
    await fixture.whenStable();
    expect(item('sessions')?.getAttribute('aria-expanded')).toBe('false');
  });

  it('choisit au clic sur la ligne', async () => {
    (item('exports')!.querySelector('.scrap-tree__row') as HTMLElement).click();
    await fixture.whenStable();
    expect(fixture.componentInstance.selected()).toBe('exports');
    expect(item('exports')?.getAttribute('aria-selected')).toBe('true');
  });

  it('va au nœud qui commence par la lettre tapée', () => {
    item('sessions')!.focus();
    key(item('sessions')!, 'e');
    expect(document.activeElement).toBe(item('exports'));
  });

  it("ne répond qu'au nœud qui a le focus, pas à ses parents", async () => {
    item('moteur')!.focus();
    key(item('moteur')!, 'ArrowLeft');
    await fixture.whenStable();
    // ← sur un fichier remonte au dossier, sans le replier.
    expect(document.activeElement).toBe(item('sessions'));
    expect(item('sessions')?.getAttribute('aria-expanded')).toBe('true');
  });
});

@Component({
  imports: [ScrapSheet],
  template: `
    <button id="ouvrir" (click)="open.set(true)">Passe 3</button>
    <scrap-sheet [(open)]="open" title="Passe 3"><p>Détail</p></scrap-sheet>
  `,
})
class SheetHost {
  readonly open = signal(false);
}

describe('ScrapSheet', () => {
  let fixture: ComponentFixture<SheetHost>;
  const sheet = () => fixture.nativeElement.querySelector('scrap-sheet') as HTMLElement;
  const opener = () => fixture.nativeElement.querySelector('#ouvrir') as HTMLButtonElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(SheetHost);
    await fixture.whenStable();
  });

  it('reste masqué fermé, et se nomme par son titre', () => {
    expect(sheet().hasAttribute('hidden')).toBe(true);
    const title = sheet().querySelector('h2') as HTMLElement;
    expect(sheet().getAttribute('aria-labelledby')).toBe(title.id);
    expect(sheet().getAttribute('role')).toBe('complementary');
  });

  it("rend le focus à l'élément d'où il venait en se fermant", async () => {
    opener().focus();
    opener().click();
    await fixture.whenStable();
    expect(sheet().hasAttribute('hidden')).toBe(false);

    const close = sheet().querySelector('button') as HTMLButtonElement;
    expect(close.getAttribute('aria-label')).toBe('Fermer le panneau');
    // jsdom ne renseigne pas relatedTarget au focus : on le donne.
    close.focus();
    close.dispatchEvent(new FocusEvent('focusin', { bubbles: true, relatedTarget: opener() }));
    close.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.open()).toBe(false);
    expect(document.activeElement).toBe(opener());
  });

  it('se ferme avec Échap', async () => {
    fixture.componentInstance.open.set(true);
    await fixture.whenStable();
    sheet()
      .querySelector('p')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(fixture.componentInstance.open()).toBe(false);
  });
});
