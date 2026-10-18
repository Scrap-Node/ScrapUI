import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Pied de page : contenu projeté libre, et mention automatique
 * « © année Projet ».
 */
@Component({
  selector: 'scrap-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="scrap-footer">
      <div class="scrap-footer__content"><ng-content /></div>
      <p class="scrap-footer__legal">
        © {{ year }} {{ appName() }}. Assemblé à la main, comme le reste.
      </p>
    </footer>
  `,
})
export class ScrapFooter {
  readonly appName = input.required<string>();
  protected readonly year = new Date().getFullYear();
}
