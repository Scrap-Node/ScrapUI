import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  effect,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ScrapIcon } from './icon';
import { ScrapIdGenerator } from './id';
import { ScrapScrollLock } from './scroll-lock';

/**
 * Modale : une décision qui bloque la suite.
 *
 * ```html
 * <scrap-modal [(open)]="showModal" title="Supprimer la session ?">
 *   Les trois passes et l'export seront effacés.
 *   <div actions>…boutons…</div>
 * </scrap-modal>
 * ```
 *
 * S'appuie sur le `<dialog>` natif : piège de focus, restauration du focus
 * à la fermeture, fermeture par Échap et inertage de l'arrière-plan sont
 * fournis par le navigateur — rien à réimplémenter.
 */
@Component({
  selector: 'scrap-modal',
  imports: [ScrapIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Le clic sur le fond a son équivalent clavier : Échap, géré nativement
         par <dialog>. L'élément n'a donc pas à être focusable lui-même. -->
    <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
    <dialog
      #dialog
      class="scrap-dialog"
      [attr.aria-labelledby]="titleId"
      (close)="open.set(false)"
      (click)="onClick($event)"
    >
      <div class="scrap-dialog__panel">
        <div class="scrap-dialog__head">
          <h2 class="scrap-dialog__title" [id]="titleId">{{ title() }}</h2>
          <button
            type="button"
            class="scrap-icon-btn scrap-dialog__close"
            aria-label="Fermer"
            (click)="dismiss()"
          >
            <scrap-icon name="close" [size]="18" />
          </button>
        </div>
        <div class="scrap-dialog__body"><ng-content /></div>
        <div class="scrap-dialog__actions"><ng-content select="[actions]" /></div>
      </div>
    </dialog>
  `,
})
export class ScrapModal {
  readonly open = model(false);
  readonly title = input.required<string>();

  protected readonly titleId = inject(ScrapIdGenerator).next('scrap-modal-title');

  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly scrollLock = inject(ScrapScrollLock);

  /** Fonction de libération du verrou de défilement tant que la modale est ouverte. */
  private release: (() => void) | null = null;

  constructor() {
    // Une navigation peut détruire la vue modale ouverte : sans ça, la page
    // resterait verrouillée pour de bon.
    inject(DestroyRef).onDestroy(() => this.unlock());

    effect(() => {
      const el = this.dialog()?.nativeElement;
      const shouldOpen = this.open();
      if (!this.isBrowser || !el) return;

      if (shouldOpen && !el.open) el.showModal();
      else if (!shouldOpen && el.open) el.close();

      if (shouldOpen) this.release ??= this.scrollLock.acquire();
      else this.unlock();
    });
  }

  private unlock(): void {
    this.release?.();
    this.release = null;
  }

  dismiss(): void {
    this.open.set(false);
  }

  /** Clic sur le fond : la cible est le <dialog> lui-même, pas son panneau. */
  protected onClick(event: MouseEvent): void {
    if (event.target === this.dialog()?.nativeElement) this.dismiss();
  }
}
