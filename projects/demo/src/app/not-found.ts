import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrapButton, ScrapErrorPage } from '@scrapnode/scrap-ui';

@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScrapErrorPage, ScrapButton, RouterLink],
  template: `
    <scrap-error-page code="404">
      <a scrap-button routerLink="/fondations">Retour à l'atelier</a>
    </scrap-error-page>
  `,
})
export class NotFound {}
