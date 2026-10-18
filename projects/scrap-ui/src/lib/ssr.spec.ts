import { Component, PLATFORM_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ScrapCommandPalette, ScrapCommands } from './commands';
import { ScrapIcon } from './icon';
import { ScrapIconButton } from './icon-button';
import { ScrapMenu, ScrapMenuItem, ScrapMenuTrigger } from './menu';
import { ScrapModal } from './modal';
import { ScrapOption, ScrapSelect } from './select';
import { ScrapSheet } from './sheet';
import { ScrapToolbar } from './toolbar';
import { ScrapScrollLock } from './scroll-lock';
import { ScrapTheme } from './theme';
import { ScrapThemeToggle } from './theme-toggle';
import { removeStorage } from '../testing/fake-storage';

/**
 * Sûreté côté serveur.
 *
 * En SSR et au prerender, `localStorage`, `matchMedia` et la mutation du DOM
 * n'existent pas ou ne doivent pas être touchés. Ces tests forcent
 * `PLATFORM_ID` à `'server'` : c'est exactement ce que voit un composant rendu
 * par Angular Universal.
 */
describe('rendu serveur', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });
    document.documentElement.removeAttribute('data-scrap-theme');
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-scrap-theme');
    document.body.style.overflow = '';
  });

  describe('ScrapTheme', () => {
    it('ne touche pas au document', () => {
      const theme = TestBed.inject(ScrapTheme);
      expect(theme.theme()).toBe('light');
      // Le serveur ne connaît pas la préférence de l'utilisateur : poser
      // l'attribut ici produirait un HTML qui contredit son choix réel,
      // avec un clignotement à l'hydratation.
      expect(document.documentElement.hasAttribute('data-scrap-theme')).toBe(false);
    });

    it('ignore les écritures', () => {
      const theme = TestBed.inject(ScrapTheme);
      theme.set('dark');
      expect(theme.theme()).toBe('light');
      expect(document.documentElement.hasAttribute('data-scrap-theme')).toBe(false);
    });

    it('ne lève pas sans stockage du tout', () => {
      removeStorage();
      expect(() => TestBed.inject(ScrapTheme).toggle()).not.toThrow();
    });
  });

  describe('ScrapScrollLock', () => {
    it('ne verrouille pas le corps du document', () => {
      const release = TestBed.inject(ScrapScrollLock).acquire();
      expect(document.body.style.overflow).toBe('');
      expect(() => release()).not.toThrow();
    });
  });

  describe('ScrapThemeToggle', () => {
    it('se rend sans erreur', async () => {
      const fixture = TestBed.createComponent(ScrapThemeToggle);
      await fixture.whenStable();
      const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      expect(button.getAttribute('aria-label')).toBe('Passer en mode sombre');
    });
  });

  describe('ScrapCommands et ScrapCommandPalette', () => {
    it("n'écoute pas le clavier du document", () => {
      let runs = 0;
      TestBed.inject(ScrapCommands).register({
        id: 'zone',
        label: 'Zone',
        shortcut: 'T',
        run: () => runs++,
      });
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 't', bubbles: true }));
      expect(runs).toBe(0);
    });

    it("se rend fermée sans appeler l'API <dialog>", async () => {
      const fixture = TestBed.createComponent(ScrapCommandPalette);
      TestBed.inject(ScrapCommands).open();
      await fixture.whenStable();
      const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
      expect(dialog.hasAttribute('open')).toBe(false);
    });
  });

  describe('barres, menus, listes et panneaux', () => {
    @Component({
      imports: [
        ScrapToolbar,
        ScrapIconButton,
        ScrapIcon,
        ScrapMenu,
        ScrapMenuTrigger,
        ScrapMenuItem,
        ScrapSelect,
        ScrapOption,
        ScrapSheet,
      ],
      template: `
        <scrap-toolbar label="Outils">
          <button scrap-icon-button label="Zone" shortcut="mod+t" [pressed]="true">
            <scrap-icon name="zone" />
          </button>
        </scrap-toolbar>
        <button [scrapMenuTrigger]="menu">Fichier</button>
        <scrap-menu #menu><button scrap-menu-item>Ouvrir</button></scrap-menu>
        <scrap-select label="Format" [(value)]="format">
          <scrap-option value="wav">WAV</scrap-option>
        </scrap-select>
        <scrap-sheet title="Détail" [open]="true">Contenu</scrap-sheet>
      `,
    })
    class Everything {
      readonly format = signal('wav');
    }

    it('se rendent sans toucher aux API du navigateur', async () => {
      // Aucun polyfill Popover ni <dialog> : un appel côté serveur lèverait.
      const fixture = TestBed.createComponent(Everything);
      await fixture.whenStable();
      const root = fixture.nativeElement as HTMLElement;
      expect(root.querySelector('[scrap-icon-button]')?.getAttribute('aria-label')).toBe('Zone');
      expect(root.querySelector('scrap-menu')?.getAttribute('popover')).toBe('auto');
      expect(root.querySelector('.scrap-select-btn span')?.textContent?.trim()).toBe('WAV');
      expect(root.querySelector('scrap-sheet')?.hasAttribute('hidden')).toBe(false);
      expect(document.body.querySelector('.scrap-tooltip')).toBeNull();
    });
  });

  describe('ScrapModal', () => {
    it("se rend fermée sans appeler l'API <dialog>", async () => {
      // Aucun polyfill installé ici : si le composant appelait showModal()
      // côté serveur, ce test lèverait « showModal is not a function ».
      const fixture = TestBed.createComponent(ScrapModal);
      fixture.componentRef.setInput('title', 'Confirmer');
      fixture.componentRef.setInput('open', true);
      await fixture.whenStable();

      const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
      expect(dialog).not.toBeNull();
      expect(dialog.hasAttribute('open')).toBe(false);
      expect(document.body.style.overflow).toBe('');
    });
  });
});
