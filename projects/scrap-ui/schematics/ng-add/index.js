'use strict';

// Schematic ng-add, écrit en JS pur pour éviter une étape de build.
//
// Il branche le thème dans le fichier de styles du projet visé. Le fichier
// n'est plus deviné : il est lu dans `angular.json`, ce qui fait fonctionner
// le schematic dans un workspace multi-projets, et pour un projet dont le
// sourceRoot n'est pas `src/`.

const PACKAGE = '@scrap-node/scrap-ui';
// Nom du paquet jusqu'en 0.2.0 : un projet déjà équipé garde cet import.
const OLD_PACKAGE = '@comechaslerie/scrap-ui';
const IMPORT_LINE = `@use '${PACKAGE}/styles/index';\n`;
const MARKER = 'scrap-ui/styles';

/** Lit angular.json et renvoie les feuilles de style globales du projet visé. */
function globalStyles(tree, projectName) {
  const raw = tree.read('angular.json');
  if (!raw) return { styles: [], project: null };

  const workspace = JSON.parse(raw.toString('utf-8'));
  const projects = workspace.projects ?? {};

  // À défaut de cible explicite, on prend une application — jamais une
  // librairie. Dans un workspace qui contient les deux, prendre « la
  // première entrée » tomberait au hasard sur la lib, qui n'a pas de
  // feuille de styles globale à équiper.
  const name =
    projectName ??
    Object.keys(projects).find((key) => projects[key].projectType === 'application') ??
    Object.keys(projects)[0];

  const project = projects[name];
  if (!project) return { styles: [], project: null };

  const styles = project.architect?.build?.options?.styles ?? [];
  return {
    project: name,
    // Une entrée de `styles` est soit un chemin, soit un objet { input, ... }.
    styles: styles
      .map((entry) => (typeof entry === 'string' ? entry : entry.input))
      .filter(Boolean),
  };
}

function ngAdd(options = {}) {
  return (tree, context) => {
    const { project, styles } = globalStyles(tree, options.project);

    if (!project) {
      context.logger.warn(
        `Projet introuvable dans angular.json — ajoute manuellement dans ta feuille de styles : ${IMPORT_LINE.trim()}`,
      );
      return tree;
    }

    const scss = styles.find((path) => path.endsWith('.scss') && tree.exists(path));

    if (!scss) {
      const css = styles.find((path) => path.endsWith('.css'));
      const detail = css
        ? `le projet « ${project} » utilise du CSS pur (${css}) : passe-le en SCSS`
        : `aucune feuille de styles SCSS trouvée pour le projet « ${project} »`;
      context.logger.warn(`${detail}, puis ajoute : ${IMPORT_LINE.trim()}`);
      return tree;
    }

    const content = tree.read(scss).toString('utf-8');
    if (content.includes(`${OLD_PACKAGE}/`)) {
      // L'ancien nom ne se résout plus une fois le paquet renommé installé.
      tree.overwrite(scss, content.split(`${OLD_PACKAGE}/`).join(`${PACKAGE}/`));
      context.logger.info(`✔ Imports Scrap UI de ${scss} passés à ${PACKAGE}`);
    } else if (content.includes(MARKER)) {
      context.logger.info(`✔ Thème Scrap UI déjà présent dans ${scss}`);
    } else {
      // En tête de fichier : `@use` doit précéder toute autre règle en Sass.
      tree.overwrite(scss, IMPORT_LINE + content);
      context.logger.info(`✔ Thème Scrap UI importé dans ${scss}`);
    }

    context.logger.info(
      `→ Favicon et manifest de la charte : node_modules/${PACKAGE}/assets/ (favicon.svg, manifest.webmanifest)`,
    );
    return tree;
  };
}

exports.ngAdd = ngAdd;
