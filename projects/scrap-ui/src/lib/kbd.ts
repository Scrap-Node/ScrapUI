import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Raccourci clavier dans le texte : `<kbd scrap-kbd>⌘K</kbd>`.
 */
@Component({
  selector: 'kbd[scrap-kbd]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: { class: 'scrap-kbd' },
})
export class ScrapKbd {}

const MAC_KEYS: Record<string, string> = {
  mod: '⌘',
  meta: '⌘',
  cmd: '⌘',
  ctrl: '⌃',
  shift: '⇧',
  alt: '⌥',
  option: '⌥',
  enter: '↵',
  return: '↵',
  escape: 'Échap',
  esc: 'Échap',
  backspace: '⌫',
  delete: '⌦',
  tab: '⇥',
  space: 'Espace',
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
};

const OTHER_KEYS: Record<string, string> = {
  ...MAC_KEYS,
  mod: 'Ctrl',
  meta: 'Win',
  cmd: 'Ctrl',
  ctrl: 'Ctrl',
  shift: 'Maj',
  alt: 'Alt',
  option: 'Alt',
  enter: 'Entrée',
  return: 'Entrée',
  backspace: 'Retour',
  delete: 'Suppr',
  tab: 'Tab',
};

/**
 * Met en forme un raccourci écrit `mod+shift+p` : `⇧⌘P` sur Mac,
 * `Ctrl+Maj+P` ailleurs. `mod` désigne ⌘ sur Mac et Ctrl ailleurs.
 *
 * Un texte déjà mis en forme (`⌘K`, `T`) est rendu tel quel.
 */
export function formatShortcut(shortcut: string, mac = true): string {
  const table = mac ? MAC_KEYS : OTHER_KEYS;
  const keys = shortcut
    .split('+')
    .map((k) => k.trim())
    .filter(Boolean);
  const known = (k: string) => Object.hasOwn(table, k.toLowerCase());
  const label = (k: string) =>
    known(k) ? table[k.toLowerCase()] : k.length === 1 ? k.toUpperCase() : k;
  if (keys.length === 1 && !known(keys[0])) return label(keys[0]);
  if (!mac) return keys.map(label).join('+');
  // Sur Mac, l'ordre d'usage est ⌃ ⌥ ⇧ ⌘ puis la touche, sans séparateur.
  const order = ['ctrl', 'alt', 'option', 'shift', 'mod', 'meta', 'cmd'];
  const rank = (k: string) => order.indexOf(k.toLowerCase());
  const mods = keys.filter((k) => rank(k) >= 0).sort((a, b) => rank(a) - rank(b));
  const rest = keys.filter((k) => rank(k) < 0);
  return [...mods, ...rest].map(label).join('');
}

/** Vrai sur macOS et iOS. Faux côté serveur, où aucun navigateur n'est connu. */
export function isMacPlatform(view: Window | null | undefined): boolean {
  const platform = view?.navigator?.platform ?? view?.navigator?.userAgent ?? '';
  return /Mac|iPhone|iPad|iPod/i.test(platform);
}

const ARIA_KEYS: Record<string, string> = {
  ctrl: 'Control',
  shift: 'Shift',
  alt: 'Alt',
  option: 'Alt',
  meta: 'Meta',
  cmd: 'Meta',
  enter: 'Enter',
  return: 'Enter',
  escape: 'Escape',
  esc: 'Escape',
  backspace: 'Backspace',
  delete: 'Delete',
  tab: 'Tab',
  space: 'Space',
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  home: 'Home',
  end: 'End',
};

/**
 * Valeur d'`aria-keyshortcuts` pour un raccourci écrit `mod+shift+p` :
 * `Meta+Shift+P` sur Mac, `Control+Shift+P` ailleurs.
 *
 * Renvoie `null` pour un texte déjà mis en forme (`⌘K`), qu'on ne sait pas
 * traduire sans risque d'annoncer un raccourci faux.
 */
export function ariaShortcut(shortcut: string, mac = true): string | null {
  const keys = shortcut
    .split('+')
    .map((k) => k.trim())
    .filter(Boolean);
  if (!keys.length) return null;
  const parts: string[] = [];
  for (const key of keys) {
    const lower = key.toLowerCase();
    if (lower === 'mod') parts.push(mac ? 'Meta' : 'Control');
    else if (Object.hasOwn(ARIA_KEYS, lower)) parts.push(ARIA_KEYS[lower]);
    else if (/^[a-z0-9]$/i.test(key)) parts.push(key.toUpperCase());
    else if (/^f([1-9]|1[0-2])$/i.test(key)) parts.push(key.toUpperCase());
    else return null;
  }
  return parts.join('+');
}

/** Un raccourci décomposé, prêt à comparer à un `KeyboardEvent`. */
interface ParsedShortcut {
  readonly key: string;
  readonly mod: boolean;
  readonly ctrl: boolean;
  readonly meta: boolean;
  readonly shift: boolean;
  readonly alt: boolean;
}

const EVENT_KEYS: Record<string, string> = {
  enter: 'enter',
  return: 'enter',
  escape: 'escape',
  esc: 'escape',
  backspace: 'backspace',
  delete: 'delete',
  tab: 'tab',
  space: ' ',
  up: 'arrowup',
  down: 'arrowdown',
  left: 'arrowleft',
  right: 'arrowright',
  home: 'home',
  end: 'end',
};

function parseShortcut(shortcut: string): ParsedShortcut | null {
  const keys = shortcut
    .toLowerCase()
    .split('+')
    .map((k) => k.trim())
    .filter(Boolean);
  const parsed = { key: '', mod: false, ctrl: false, meta: false, shift: false, alt: false };
  for (const k of keys) {
    if (k === 'mod') parsed.mod = true;
    else if (k === 'ctrl') parsed.ctrl = true;
    else if (k === 'meta' || k === 'cmd') parsed.meta = true;
    else if (k === 'shift') parsed.shift = true;
    else if (k === 'alt' || k === 'option') parsed.alt = true;
    else if (parsed.key) return null;
    else parsed.key = Object.hasOwn(EVENT_KEYS, k) ? EVENT_KEYS[k] : k;
  }
  return parsed.key ? parsed : null;
}

/**
 * Vrai si l'événement clavier correspond au raccourci `mod+shift+p`.
 * `mod` vaut ⌘ sur Mac et Ctrl ailleurs ; les autres modificateurs doivent
 * correspondre exactement : `mod+z` ne se déclenche pas sur ⇧⌘Z.
 *
 * Une lettre se compare au caractère produit (`event.key`, juste en AZERTY
 * comme en QWERTY) et, à défaut, à la touche physique : ⌥ change le
 * caractère produit sur Mac.
 */
export function matchesShortcut(event: KeyboardEvent, shortcut: string, mac = true): boolean {
  const s = parseShortcut(shortcut);
  if (!s) return false;
  const wantMeta = s.meta || (s.mod && mac);
  const wantCtrl = s.ctrl || (s.mod && !mac);
  if (event.metaKey !== wantMeta || event.ctrlKey !== wantCtrl || event.altKey !== s.alt) {
    return false;
  }
  const key = (event.key ?? '').toLowerCase();
  // Une touche qui ne s'obtient qu'avec ⇧ (`?`, `+`) tolère ⇧ sans l'exiger.
  const isLetterOrNamed = /^[a-z0-9]$/.test(s.key) || s.key.length > 1;
  if (isLetterOrNamed && event.shiftKey !== s.shift) return false;
  if (key === s.key) return true;
  if (/^[a-z]$/.test(s.key)) return event.code === `Key${s.key.toUpperCase()}`;
  if (/^[0-9]$/.test(s.key)) return event.code === `Digit${s.key}`;
  return false;
}

/**
 * Vrai si le focus est dans un champ de saisie : un raccourci d'une seule
 * lettre ne doit pas s'y déclencher.
 */
export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof el.tagName !== 'string') return false;
  if (el.isContentEditable) return true;
  if (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') return true;
  if (el.tagName !== 'INPUT') return false;
  const type = (el as HTMLInputElement).type;
  return !['checkbox', 'radio', 'range', 'button', 'submit', 'reset', 'color', 'file'].includes(
    type,
  );
}
