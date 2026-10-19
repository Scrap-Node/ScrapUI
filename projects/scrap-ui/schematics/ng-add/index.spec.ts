import { join } from 'node:path';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { Tree } from '@angular-devkit/schematics';

// Chemin depuis la racine du workspace : les specs tournent avec le dépôt
// pour répertoire courant, et le schematic est un .js chargé à l'exécution.
const COLLECTION = join(process.cwd(), 'projects/scrap-ui/schematics/collection.json');
const IMPORT_LINE = "@use '@scrapnode/scrap-ui/styles/index';";

interface WorkspaceProject {
  projectType: 'application' | 'library';
  styles?: (string | { input: string })[];
}

function workspace(projects: Record<string, WorkspaceProject>): string {
  return JSON.stringify({
    version: 1,
    projects: Object.fromEntries(
      Object.entries(projects).map(([name, { projectType, styles }]) => [
        name,
        {
          projectType,
          architect: styles ? { build: { options: { styles } } } : {},
        },
      ]),
    ),
  });
}

function runner(): SchematicTestRunner {
  return new SchematicTestRunner('scrap-ui', COLLECTION);
}

describe('ng-add', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = Tree.empty();
  });

  async function run(options: Record<string, unknown> = {}): Promise<UnitTestTree> {
    return runner().runSchematic('ng-add', options, tree);
  }

  it("ajoute l'import en tête de la feuille de styles", async () => {
    tree.create(
      'angular.json',
      workspace({ app: { projectType: 'application', styles: ['src/styles.scss'] } }),
    );
    tree.create('src/styles.scss', 'body { margin: 0; }\n');

    const result = await run();
    const content = result.readContent('src/styles.scss');
    // `@use` doit précéder toute autre règle : Sass refuse l'inverse.
    expect(content.startsWith(IMPORT_LINE)).toBe(true);
    expect(content).toContain('body { margin: 0; }');
  });

  it("n'ajoute pas l'import deux fois", async () => {
    tree.create(
      'angular.json',
      workspace({ app: { projectType: 'application', styles: ['src/styles.scss'] } }),
    );
    tree.create('src/styles.scss', `${IMPORT_LINE}\nbody {}\n`);

    const result = await run();
    const occurrences = result.readContent('src/styles.scss').split('scrap-ui/styles').length - 1;
    expect(occurrences).toBe(1);
  });

  it.each(['@comechaslerie/scrap-ui', '@scrap-node/scrap-ui'])(
    "passe les imports de l'ancien nom %s au nouveau",
    async (old) => {
      tree.create(
        'angular.json',
        workspace({ app: { projectType: 'application', styles: ['src/styles.scss'] } }),
      );
      tree.create(
        'src/styles.scss',
        `@use '${old}/styles/index';\n@use '${old}/styles/affiche';\nbody {}\n`,
      );

      const content = (await run()).readContent('src/styles.scss');
      expect(content).not.toContain(old);
      expect(content.startsWith(IMPORT_LINE)).toBe(true);
      expect(content).toContain("@use '@scrapnode/scrap-ui/styles/affiche';");
      expect(content.split('scrap-ui/styles/index').length - 1).toBe(1);
    },
  );

  it('suit le chemin déclaré dans angular.json, pas src/styles.scss par convention', async () => {
    tree.create(
      'angular.json',
      workspace({ app: { projectType: 'application', styles: ['apps/web/theme/global.scss'] } }),
    );
    tree.create('apps/web/theme/global.scss', '// vide\n');

    const result = await run();
    expect(result.readContent('apps/web/theme/global.scss')).toContain(IMPORT_LINE);
  });

  it('accepte la forme objet des entrées styles', async () => {
    tree.create(
      'angular.json',
      workspace({ app: { projectType: 'application', styles: [{ input: 'src/styles.scss' }] } }),
    );
    tree.create('src/styles.scss', '');

    const result = await run();
    expect(result.readContent('src/styles.scss')).toContain(IMPORT_LINE);
  });

  it("vise l'application, pas la librairie, quand le workspace contient les deux", async () => {
    tree.create(
      'angular.json',
      workspace({
        // La lib est listée en premier : prendre « la première entrée »
        // équiperait le mauvais projet.
        'ma-lib': { projectType: 'library' },
        'mon-app': { projectType: 'application', styles: ['src/styles.scss'] },
      }),
    );
    tree.create('src/styles.scss', '');

    const result = await run();
    expect(result.readContent('src/styles.scss')).toContain(IMPORT_LINE);
  });

  it('respecte une cible explicite', async () => {
    tree.create(
      'angular.json',
      workspace({
        a: { projectType: 'application', styles: ['a/styles.scss'] },
        b: { projectType: 'application', styles: ['b/styles.scss'] },
      }),
    );
    tree.create('a/styles.scss', '');
    tree.create('b/styles.scss', '');

    const result = await run({ project: 'b' });
    expect(result.readContent('b/styles.scss')).toContain(IMPORT_LINE);
    expect(result.readContent('a/styles.scss')).not.toContain(IMPORT_LINE);
  });

  it('ne touche à rien et prévient quand le projet est en CSS pur', async () => {
    tree.create(
      'angular.json',
      workspace({ app: { projectType: 'application', styles: ['src/styles.css'] } }),
    );
    tree.create('src/styles.css', 'body {}\n');

    const result = await run();
    expect(result.readContent('src/styles.css')).toBe('body {}\n');
  });

  it('ne lève pas quand angular.json est absent', async () => {
    await expect(run()).resolves.toBeDefined();
  });
});
