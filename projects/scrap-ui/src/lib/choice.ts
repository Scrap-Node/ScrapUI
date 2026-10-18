import { Directive } from '@angular/core';

/**
 * Étiquette d'une case, d'un bouton radio ou d'un interrupteur : la cible
 * cliquable couvre le texte.
 *
 * ```html
 * <label scrapChoice>
 *   <input type="checkbox" scrapSwitch formControlName="preEcoute" /> Pré-écoute
 * </label>
 * ```
 */
@Directive({
  selector: 'label[scrapChoice]',
  host: { class: 'scrap-choice' },
})
export class ScrapChoice {}

/** Case à cocher de la lib : `<input type="checkbox" scrapCheckbox />`. */
@Directive({
  selector: 'input[type="checkbox"][scrapCheckbox]',
  host: { class: 'scrap-checkbox' },
})
export class ScrapCheckbox {}

/** Bouton radio de la lib : `<input type="radio" scrapRadio />`. */
@Directive({
  selector: 'input[type="radio"][scrapRadio]',
  host: { class: 'scrap-radio' },
})
export class ScrapRadio {}

/**
 * Interrupteur : un réglage qui s'applique tout de suite, sans bouton de
 * validation. Une case à cocher native, annoncée comme interrupteur ; les
 * formulaires Angular s'y branchent comme sur toute case.
 *
 * `<input type="checkbox" scrapSwitch [(ngModel)]="preEcoute" />`
 */
@Directive({
  selector: 'input[type="checkbox"][scrapSwitch]',
  host: { class: 'scrap-switch', role: 'switch' },
})
export class ScrapSwitch {}
