import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  ScrapButton,
  ScrapCheckbox,
  ScrapChoice,
  ScrapDropzone,
  ScrapField,
  ScrapInput,
  ScrapNumberField,
  ScrapOption,
  ScrapRadio,
  ScrapSegment,
  ScrapSegmented,
  ScrapSelect,
  ScrapSlider,
  ScrapSwitch,
  ScrapToast,
} from '@scrap-node/scrap-ui';
import { StoryCase, StoryPage } from '../story-page';

interface Operator {
  readonly id: string;
  readonly name: string;
  readonly help: string;
}

const OPERATORS: Operator[] = [
  { id: 'zero', name: 'Zéro', help: 'Remplace la zone par du silence' },
  { id: 'xor', name: 'XOR 0x80', help: 'Inverse le bit de poids fort' },
  { id: 'echo', name: 'Écho', help: 'Répète un bloc avec du retard' },
  { id: 'shift', name: 'Décalage de bits', help: 'Décale chaque échantillon' },
];

@Component({
  selector: 'story-forms',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    StoryPage,
    StoryCase,
    ReactiveFormsModule,
    ScrapField,
    ScrapInput,
    ScrapButton,
    ScrapChoice,
    ScrapCheckbox,
    ScrapRadio,
    ScrapSwitch,
    ScrapSelect,
    ScrapOption,
    ScrapSegmented,
    ScrapSegment,
    ScrapNumberField,
    ScrapSlider,
    ScrapDropzone,
  ],
  template: `
    <story-page
      title="Formulaires"
      lead="Des champs nets sur fond clair, une étiquette au-dessus, l'erreur juste en dessous. Tous se branchent sur les formulaires Angular."
    >
      <story-case name="Champ et indice" [stack]="true">
        <scrap-field
          label="Nom de la session"
          hint="Visible dans l'historique et le nom de l'export."
        >
          <input scrapInput value="Moteur, version courte" />
        </scrap-field>
      </story-case>

      <story-case
        name="Champ en erreur"
        note="Le message est annoncé (role=alert) et le contrôle passe en aria-invalid."
        [stack]="true"
      >
        <scrap-field
          label="Fichier source"
          error="Ce fichier n'est pas un WAV&nbsp;: choisissez un .wav."
        >
          <input scrapInput value="moteur.mp3" />
        </scrap-field>
      </story-case>

      <story-case name="Zone de texte et liste native" [stack]="true">
        <scrap-field label="Notes" optional="facultatif">
          <textarea scrapInput rows="3">Garder l'attaque intacte.</textarea>
        </scrap-field>
        <scrap-field label="Format d'export">
          <select scrapInput>
            <option>WAV 16 bits</option>
            <option>WAV 24 bits</option>
            <option>WAV 32 bits flottant</option>
          </select>
        </scrap-field>
      </story-case>

      <story-case name="Cases, boutons radio et interrupteur" [stack]="true">
        <label scrapChoice
          ><input type="checkbox" scrapCheckbox checked /> Normaliser à l'export</label
        >
        <label scrapChoice><input type="checkbox" scrapCheckbox /> Garder les métadonnées</label>
        <div class="choices">
          <label scrapChoice><input type="radio" scrapRadio name="bits" checked /> 16 bits</label>
          <label scrapChoice><input type="radio" scrapRadio name="bits" /> 24 bits</label>
        </div>
        <label scrapChoice><input type="checkbox" scrapSwitch checked /> Pré-écoute</label>
      </story-case>

      <story-case
        name="Liste déroulante"
        note="Chaque option a un nom et, au besoin, une ligne d'aide. Au clavier&nbsp;: ↓ ouvre, une lettre va à l'option, Entrée choisit."
      >
        <div class="narrow">
          <scrap-select label="Opérateur" [(value)]="operator">
            @for (op of operators; track op.id) {
              <scrap-option [value]="op.id" [description]="op.help">{{ op.name }}</scrap-option>
            }
          </scrap-select>
        </div>
      </story-case>

      <story-case
        name="Contrôle segmenté"
        note="Un choix exclusif entre quelques options courtes, toutes visibles."
      >
        <scrap-segmented label="Vue" [(value)]="view">
          <button scrap-segment value="onde">Forme d'onde</button>
          <button scrap-segment value="spectre">Spectre</button>
          <button scrap-segment value="bits">Bits</button>
        </scrap-segmented>
        <scrap-segmented label="Piste écoutée" size="s" [(value)]="track">
          <button scrap-segment value="a">A</button>
          <button scrap-segment value="b">B</button>
        </scrap-segmented>
      </story-case>

      <story-case
        name="Champ numérique"
        note="Glissez l'étiquette, ou utilisez ↑ et ↓ dans le champ (⇧ pour dix pas). Entrée valide, Échap rend la valeur d'avant."
      >
        <div class="numbers">
          <scrap-number-field label="Densité" unit="%" [min]="0" [max]="100" [(value)]="density" />
          <scrap-number-field
            label="Taille de bloc"
            unit="o"
            [min]="64"
            [max]="4096"
            [step]="64"
            [(value)]="block"
          />
          <scrap-number-field label="Graine" unit="#" [min]="0" [max]="99999" [(value)]="seed" />
        </div>
      </story-case>

      <story-case name="Zone de dépôt" [stack]="true">
        <scrap-dropzone
          accept=".wav"
          hint="WAV en PCM, de 8 à 32 bits."
          [error]="dropError()"
          (files)="onFiles($event)"
          (rejected)="onRejected($event)"
        />
      </story-case>

      <story-case
        name="Formulaire réactif"
        note="Champ, liste, segmenté, champ numérique, curseur et interrupteur dans un même FormGroup."
        [stack]="true"
      >
        <form [formGroup]="form">
          <scrap-field label="Nom de la passe">
            <input scrapInput formControlName="name" />
          </scrap-field>
          <scrap-select label="Opérateur" formControlName="operator">
            @for (op of operators; track op.id) {
              <scrap-option [value]="op.id">{{ op.name }}</scrap-option>
            }
          </scrap-select>
          <scrap-segmented label="Piste" formControlName="track">
            <button scrap-segment value="a">Piste A</button>
            <button scrap-segment value="b">Piste B</button>
          </scrap-segmented>
          <scrap-number-field
            label="Densité"
            unit="%"
            [min]="0"
            [max]="100"
            formControlName="density"
          />
          <scrap-slider label="Mélange" showValue unit="%" formControlName="mix" />
          <label scrapChoice
            ><input type="checkbox" scrapSwitch formControlName="preview" /> Pré-écoute</label
          >
          <div class="actions">
            <button scrap-button type="button" variant="secondary" (click)="dump()">
              Lire la valeur
            </button>
          </div>
        </form>
        @if (dumped()) {
          <pre>{{ dumped() }}</pre>
        }
      </story-case>
    </story-page>
  `,
  styles: `
    .choices {
      display: flex;
      gap: var(--scrap-space-4);
    }
    .narrow {
      width: 18rem;
    }
    .numbers {
      display: grid;
      grid-template-columns: repeat(3, 10rem);
      gap: var(--scrap-space-4);
    }
    form {
      display: grid;
      gap: var(--scrap-space-4);
      max-width: 24rem;
    }
    .actions {
      display: flex;
      gap: var(--scrap-space-2);
    }
    pre {
      margin: 0;
      padding: var(--scrap-space-3);
      border-radius: var(--scrap-radius-m);
      background: var(--scrap-sunken);
      font: var(--scrap-fs-s) / 1.5 var(--scrap-font-mono);
      overflow-x: auto;
    }
  `,
})
export class FormsStory {
  private readonly toast = inject(ScrapToast);
  readonly operators = OPERATORS;
  readonly operator = signal('xor');
  readonly view = signal('onde');
  readonly track = signal('a');
  readonly density = signal(35);
  readonly block = signal(512);
  readonly seed = signal(7342);
  readonly dropError = signal<string | null>(null);

  readonly form = new FormGroup({
    name: new FormControl('Passe 4'),
    operator: new FormControl('echo'),
    track: new FormControl('b'),
    density: new FormControl(60),
    mix: new FormControl(80),
    preview: new FormControl(true),
  });

  readonly dumped = signal('');

  dump(): void {
    this.dumped.set(JSON.stringify(this.form.getRawValue(), null, 2));
  }

  onFiles(files: File[]): void {
    this.dropError.set(null);
    this.toast.show(`${files[0].name} importé`, 'success');
  }

  onRejected(files: File[]): void {
    this.dropError.set(`«\u00a0${files[0].name}\u00a0» n'est pas un fichier WAV.`);
  }
}
