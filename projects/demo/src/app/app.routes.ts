import { Routes } from '@angular/router';

export { STORIES, type Story } from './stories.data';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'fondations' },
  {
    path: 'fondations',
    loadComponent: () => import('./stories/tokens').then((m) => m.TokensStory),
  },
  {
    path: 'icones',
    loadComponent: () => import('./stories/iconography').then((m) => m.IconographyStory),
  },
  { path: 'boutons', loadComponent: () => import('./stories/buttons').then((m) => m.ButtonsStory) },
  { path: 'badges', loadComponent: () => import('./stories/badges').then((m) => m.BadgesStory) },
  { path: 'cartes', loadComponent: () => import('./stories/cards').then((m) => m.CardsStory) },
  {
    path: 'formulaires',
    loadComponent: () => import('./stories/forms').then((m) => m.FormsStory),
  },
  {
    path: 'curseurs',
    loadComponent: () => import('./stories/sliders').then((m) => m.SlidersStory),
  },
  { path: 'onglets', loadComponent: () => import('./stories/tabs').then((m) => m.TabsStory) },
  {
    path: 'modale-toasts',
    loadComponent: () => import('./stories/overlays').then((m) => m.OverlaysStory),
  },
  { path: 'etats', loadComponent: () => import('./stories/feedback').then((m) => m.FeedbackStory) },
  { path: 'donnees', loadComponent: () => import('./stories/data').then((m) => m.DataStory) },
  { path: 'outils', loadComponent: () => import('./stories/tools').then((m) => m.ToolsStory) },
  {
    path: 'navigation',
    loadComponent: () => import('./stories/navigation').then((m) => m.NavigationStory),
  },
  { path: 'coquille', loadComponent: () => import('./stories/shell').then((m) => m.ShellStory) },
  { path: 'audio', loadComponent: () => import('./stories/audio').then((m) => m.AudioStory) },
  { path: 'layout', loadComponent: () => import('./stories/layout').then((m) => m.LayoutStory) },
  { path: 'affiche', loadComponent: () => import('./stories/poster').then((m) => m.PosterStory) },
  // Ancienne adresse de la page Affiche.
  { path: 'utilitaires', pathMatch: 'full', redirectTo: 'affiche' },
  { path: '**', loadComponent: () => import('./not-found').then((m) => m.NotFound) },
];
