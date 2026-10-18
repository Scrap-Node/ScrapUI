// ============================================================
// Outils communs aux surcouches posées dans la couche supérieure
// (API Popover) : menus et listes déroulantes.
// ============================================================

const GAP = 4;
const MARGIN = 8;

/** Ouvre une surcouche `popover`, sans erreur si elle l'est déjà. */
export function showPopover(el: HTMLElement): boolean {
  if (typeof el.showPopover !== 'function') return false;
  try {
    el.showPopover();
    return true;
  } catch {
    // Déjà ouverte, ou détachée du document : rien à faire de plus.
    return false;
  }
}

/** Ferme une surcouche `popover`, sans erreur si elle l'est déjà. */
export function hidePopover(el: HTMLElement): void {
  if (typeof el.hidePopover !== 'function') return;
  try {
    el.hidePopover();
  } catch {
    // Déjà fermée : rien à faire.
  }
}

/**
 * Place la surcouche sous son déclencheur, alignée à gauche ; au-dessus
 * s'il n'y a pas la place en dessous. `matchWidth` lui donne au moins la
 * largeur du déclencheur, pour une liste déroulante.
 */
export function placeBelow(trigger: HTMLElement, panel: HTMLElement, matchWidth = false): void {
  const view = trigger.ownerDocument.defaultView;
  if (!view) return;
  const r = trigger.getBoundingClientRect();
  if (matchWidth) panel.style.minWidth = `${r.width}px`;
  const p = panel.getBoundingClientRect();
  let top = r.bottom + GAP;
  if (top + p.height > view.innerHeight - MARGIN) {
    top = Math.max(MARGIN, r.top - p.height - GAP);
  }
  const left = Math.max(MARGIN, Math.min(r.left, view.innerWidth - p.width - MARGIN));
  panel.style.top = `${top}px`;
  panel.style.left = `${left}px`;
}

/** Minuscules, sans accents : « Écho » se trouve en tapant « e ». */
export function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Saisie au clavier dans une liste : les lettres tapées à la suite (moins
 * d'une demi-seconde d'écart) désignent l'élément qui commence par elles.
 */
export class Typeahead {
  private buffer = '';
  private last = 0;

  /** Renvoie l'index de l'élément suivant `from` qui commence par la saisie. */
  find(key: string, labels: readonly string[], from: number): number {
    const now = Date.now();
    this.buffer = now - this.last > 500 ? key : this.buffer + key;
    this.last = now;
    const query = fold(this.buffer);
    const n = labels.length;
    // Une même lettre répétée fait défiler les éléments qui commencent par elle.
    const repeated = query.length > 1 && [...query].every((c) => c === query[0]);
    const needle = repeated ? query[0] : query;
    const start = repeated || query.length === 1 ? from + 1 : from;
    for (let i = 0; i < n; i++) {
      const index = (start + i + n) % n;
      if (fold(labels[index]).startsWith(needle)) return index;
    }
    return -1;
  }
}
