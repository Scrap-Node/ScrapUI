import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

// Éclaboussures inspirées de la charte. Tracés inline : aucun asset à copier.
// Comme pour les icônes, chaque entrée est l'attribut `d` d'un unique <path>.
const SPLATS = {
  burst:
    'M50 8 57 34 78 15 66 39 95 33 70 50 96 62 68 58 82 86 58 64 52 94 45 65 22 88 34 58 4 66 28 49 6 32 33 40 20 10 44 32Z',
  drip: 'M18 20c10-8 28-12 44-8 18 4 24 14 20 24-3 8-14 10-18 18-3 6 2 14-4 20-5 5-12 2-14-4-3-8 2-16-4-22-7-7-20-2-26-10-4-6-2-13 2-18Zm56 52a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm-44 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z',
  scratch: 'M4 46 96 38l-1 5-90 9Zm6 14 80-4v4l-79 6Zm10-30 68-10 1 4-68 12Z',
} as const satisfies Record<string, string>;

export type ScrapSplatName = keyof typeof SPLATS;

/** Liste des éclaboussures disponibles. */
export const SCRAP_SPLAT_NAMES = Object.keys(SPLATS) as ScrapSplatName[];

/**
 * Élément décoratif du module Affiche : éclaboussure ou griffure à poser en
 * fond de section. Ses réglages d'affichage viennent de la feuille Affiche
 * (`@use '@scrap-node/scrap-ui/styles/affiche'`).
 *
 * <scrap-splat name="burst" [size]="140" style="color: var(--scrap-copper)" />
 */
@Component({
  selector: 'scrap-splat',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<svg
    [attr.width]="size()"
    [attr.height]="size()"
    viewBox="0 0 100 100"
    fill="currentColor"
    aria-hidden="true"
    [style.transform]="'rotate(' + rotate() + 'deg)'"
  >
    <path [attr.d]="path()" />
  </svg>`,
})
export class ScrapSplat {
  readonly name = input<ScrapSplatName>('burst');
  readonly size = input(120);
  readonly rotate = input(0);

  protected readonly path = computed(() => SPLATS[this.name()] ?? SPLATS.burst);
}
