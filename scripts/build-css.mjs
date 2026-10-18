// Compile les feuilles de la lib en CSS autonome, à côté des sources SCSS.
//
// Le paquet publie déjà styles/*.scss pour les projets Angular. Les autres
// (Blazor, page HTML) n'ont pas Sass : ils chargent css/scrap-ui.css, et
// css/scrap-ui-affiche.css pour le module Affiche.
import { compile } from 'sass';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'projects/scrap-ui/src/styles');
const out = join(root, 'dist/scrap-ui/css');

const BANNER = {
  'scrap-ui.css':
    '/* @comechaslerie/scrap-ui : jetons, base et composants, sans framework.\n' +
    '   Thème : celui du système, ou data-scrap-theme="light|dark" sur <html> ou sur une zone. */\n',
  'scrap-ui-affiche.css':
    '/* @comechaslerie/scrap-ui : module Affiche (grain, tampons, bords déchirés, éclaboussures). */\n',
};

mkdirSync(out, { recursive: true });
for (const [entry, file] of [
  ['index.scss', 'scrap-ui.css'],
  ['affiche.scss', 'scrap-ui-affiche.css'],
]) {
  const { css } = compile(join(src, entry), { style: 'expanded', charset: false });
  writeFileSync(join(out, file), BANNER[file] + css + '\n');
  console.log(`✔ css/${file} (${Math.round(css.length / 1024)} Ko)`);
}
