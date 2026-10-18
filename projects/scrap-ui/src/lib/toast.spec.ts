import { TestBed } from '@angular/core/testing';
import { ScrapToast, ScrapToasts } from './toast';

describe('ScrapToast', () => {
  let svc: ScrapToast;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.resetTestingModule();
    svc = TestBed.inject(ScrapToast);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('empile les messages avec leur tonalité', () => {
    svc.show('Enregistré', 'success');
    svc.show('Stock faible', 'warning');
    expect(svc.items().map((t) => [t.message, t.tone])).toEqual([
      ['Enregistré', 'success'],
      ['Stock faible', 'warning'],
    ]);
  });

  it('referme automatiquement après la durée demandée', () => {
    svc.show('Éphémère', 'info', 1000);
    vi.advanceTimersByTime(999);
    expect(svc.items()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(svc.items()).toHaveLength(0);
  });

  it('ne referme jamais un toast de durée nulle', () => {
    svc.show('Persistant', 'danger', 0);
    vi.advanceTimersByTime(60_000);
    expect(svc.items()).toHaveLength(1);
  });

  it('plafonne la pile et évince les plus anciens', () => {
    for (let i = 0; i < 7; i++) svc.show(`msg ${i}`);
    expect(svc.items().map((t) => t.message)).toEqual(['msg 3', 'msg 4', 'msg 5', 'msg 6']);
  });

  it('ne laisse pas de minuterie derrière un toast évincé', () => {
    for (let i = 0; i < 7; i++) svc.show(`msg ${i}`, 'info', 1000);
    // Sans nettoyage, les minuteries des toasts évincés feraient tomber
    // la pile en cascade et fermeraient les mauvais éléments.
    expect(vi.getTimerCount()).toBe(4);
  });

  it('ferme un toast précis par identifiant', () => {
    const first = svc.show('un');
    svc.show('deux');
    svc.close(first);
    expect(svc.items().map((t) => t.message)).toEqual(['deux']);
  });

  it('suspend puis reprend les minuteries sur le temps restant', () => {
    svc.show('Survolé', 'info', 1000);
    vi.advanceTimersByTime(600);
    svc.pause();
    vi.advanceTimersByTime(10_000);
    expect(svc.items()).toHaveLength(1);

    svc.resume();
    vi.advanceTimersByTime(399);
    expect(svc.items()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(svc.items()).toHaveLength(0);
  });

  it('vide la pile et toutes les minuteries', () => {
    svc.show('a');
    svc.show('b');
    svc.clear();
    expect(svc.items()).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('reste en pause quand survol et focus se superposent', () => {
    svc.show('Survolé puis cliqué', 'info', 1000);

    svc.pause(); // le pointeur entre
    vi.advanceTimersByTime(5000);
    svc.pause(); // le focus entre à son tour, longtemps après

    // Un second `pause` ne doit pas recalculer le temps restant à partir
    // d'une échéance déjà dépassée : sinon il tombe à zéro et le toast
    // s'évapore dès la reprise.
    svc.resume(); // le focus sort, le pointeur est encore là
    vi.advanceTimersByTime(500);
    expect(svc.items()).toHaveLength(1);

    svc.resume(); // le pointeur sort enfin
    vi.advanceTimersByTime(999);
    expect(svc.items()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(svc.items()).toHaveLength(0);
  });

  it("ne fait pas courir la minuterie d'un toast apparu pendant une pause", () => {
    svc.pause();
    svc.show('Arrivé pendant le survol', 'info', 1000);
    vi.advanceTimersByTime(5000);
    expect(svc.items()).toHaveLength(1);

    svc.resume();
    vi.advanceTimersByTime(1000);
    expect(svc.items()).toHaveLength(0);
  });

  it('ignore une reprise sans pause préalable', () => {
    svc.show('Normal', 'info', 1000);
    vi.advanceTimersByTime(600);
    svc.resume();
    // La reprise ne doit pas réarmer la minuterie à sa durée pleine.
    vi.advanceTimersByTime(400);
    expect(svc.items()).toHaveLength(0);
  });

  it('accepte ses options sous forme d’objet', () => {
    svc.show('Court', 'info', { duration: 500 });
    vi.advanceTimersByTime(500);
    expect(svc.items()).toHaveLength(0);
  });

  it('laisse plus de temps quand le toast propose une action', () => {
    svc.show('Passe appliquée', 'success', { action: { label: 'Annuler', run: () => undefined } });
    vi.advanceTimersByTime(5999);
    expect(svc.items()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(svc.items()).toHaveLength(0);
  });

  it("lance l'action puis ferme le toast", () => {
    const run = vi.fn();
    const id = svc.show('Passe appliquée', 'success', { action: { label: 'Annuler', run } });
    svc.act(id);
    expect(run).toHaveBeenCalledOnce();
    expect(svc.items()).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("ferme le toast avant de lancer l'action", () => {
    // L'action peut afficher un autre toast : il ne doit pas évincer le suivant.
    const id = svc.show('Supprimé', 'info', {
      action: { label: 'Annuler', run: () => expect(svc.items()).toHaveLength(0) },
    });
    svc.act(id);
  });

  it('ignore une action sur un toast déjà fermé', () => {
    const run = vi.fn();
    const id = svc.show('Éphémère', 'info', { duration: 100, action: { label: 'Annuler', run } });
    vi.advanceTimersByTime(100);
    svc.act(id);
    expect(run).not.toHaveBeenCalled();
  });

  it("coupe les minuteries à la destruction de l'application", () => {
    svc.show('a', 'info', 5000);
    TestBed.resetTestingModule();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('ScrapToasts', () => {
  const setup = async () => {
    TestBed.resetTestingModule();
    const fixture = TestBed.createComponent(ScrapToasts);
    const svc = TestBed.inject(ScrapToast);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const [urgent, routine] = [...host.querySelectorAll('.scrap-toasts__region')] as HTMLElement[];
    return { fixture, svc, host, urgent, routine };
  };

  it('range les erreurs dans la région assertive, le reste dans la région polie', async () => {
    const { fixture, svc, urgent, routine } = await setup();
    expect(urgent.getAttribute('aria-live')).toBe('assertive');
    expect(routine.getAttribute('aria-live')).toBe('polite');

    svc.show('Export impossible', 'danger', 0);
    svc.show('Enregistré', 'success', 0);
    await fixture.whenStable();
    expect(urgent.querySelector('.scrap-toast--danger')?.textContent).toContain(
      'Export impossible',
    );
    expect(routine.querySelector('.scrap-toast--success')?.textContent).toContain('Enregistré');
  });

  it("affiche le bouton d'action et le relie au service", async () => {
    const { fixture, svc, host } = await setup();
    const run = vi.fn();
    svc.show('Passe appliquée', 'success', { duration: 0, action: { label: 'Annuler', run } });
    await fixture.whenStable();

    const action = host.querySelector('.scrap-toast__action') as HTMLButtonElement;
    expect(action.textContent?.trim()).toBe('Annuler');
    action.click();
    await fixture.whenStable();
    expect(run).toHaveBeenCalledOnce();
    expect(host.querySelector('.scrap-toast')).toBeNull();
  });

  it('ferme un toast par son bouton', async () => {
    const { fixture, svc, host } = await setup();
    svc.show('Enregistré', 'success', 0);
    await fixture.whenStable();
    expect(host.querySelector('.scrap-toast__action')).toBeNull();

    const close = host.querySelector('.scrap-toast__close') as HTMLButtonElement;
    expect(close.getAttribute('aria-label')).toBe('Fermer');
    close.click();
    await fixture.whenStable();
    expect(svc.items()).toHaveLength(0);
  });
});
