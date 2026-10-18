/**
 * Registre des stories : une entrée = une page de la vitrine.
 *
 * Volontairement sans dépendance Angular : ce module est importé aussi bien
 * par les routes que par les tests Playwright, qui tournent hors du
 * compilateur Angular. Une seule liste à tenir à jour quand un composant arrive.
 */
export interface Story {
  readonly path: string;
  readonly title: string;
  /** Rubrique de la navigation. Les stories d'une rubrique se suivent. */
  readonly group: string;
}

export const STORIES: readonly Story[] = [
  { path: 'fondations', title: 'Fondations', group: 'Bases' },
  { path: 'icones', title: 'Icônes', group: 'Bases' },
  { path: 'boutons', title: 'Boutons', group: 'Composants' },
  { path: 'badges', title: 'Badges', group: 'Composants' },
  { path: 'cartes', title: 'Cartes', group: 'Composants' },
  { path: 'formulaires', title: 'Formulaires', group: 'Composants' },
  { path: 'curseurs', title: 'Curseurs', group: 'Composants' },
  { path: 'onglets', title: 'Onglets', group: 'Composants' },
  { path: 'modale-toasts', title: 'Modale et toasts', group: 'Composants' },
  { path: 'etats', title: 'États', group: 'Composants' },
  { path: 'donnees', title: 'Données', group: 'Composants' },
  { path: 'outils', title: 'Outils et menus', group: 'Outils de création' },
  { path: 'navigation', title: 'Navigation', group: 'Outils de création' },
  { path: 'coquille', title: "Coquille d'application", group: 'Outils de création' },
  { path: 'audio', title: 'Audio et montage', group: 'Outils de création' },
  { path: 'layout', title: 'En-tête et pied de page', group: 'Pages' },
  { path: 'affiche', title: 'Affiche', group: 'Pages' },
];
