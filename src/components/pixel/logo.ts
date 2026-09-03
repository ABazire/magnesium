/**
 * Logo « AR3NA », en pixel art — un alphabet minimal (juste ce qu'il faut
 * pour épeler le nom du jeu) plutôt qu'une police complète.
 *
 * Chaque lettre fait 5 colonnes sur 7 lignes, le format classique des
 * polices pixel les plus lisibles à petite taille. Le "3" utilise un
 * caractère de remplissage différent ('a' au lieu de 'p') pour qu'une seule
 * palette à deux couleurs suffise à le distinguer du reste du mot — c'est la
 * lettre qui donne son identité au nom, elle doit sauter aux yeux.
 */

const VIDE = [
  ".....",
  ".....",
  ".....",
  ".....",
  ".....",
  ".....",
  ".....",
];

const A = [
  ".ppp.",
  "p...p",
  "p...p",
  "ppppp",
  "p...p",
  "p...p",
  "p...p",
];

const R = [
  "pppp.",
  "p...p",
  "p...p",
  "pppp.",
  "p.p..",
  "p..p.",
  "p...p",
];

const N = [
  "p...p",
  "pp..p",
  "p.p.p",
  "p..pp",
  "p...p",
  "p...p",
  "p...p",
];

const TROIS = [
  "aaaaa",
  "....a",
  "....a",
  ".aaa.",
  "....a",
  "....a",
  "aaaaa",
];

const GLYPHES: Record<string, string[]> = { A, R, N, "3": TROIS, " ": VIDE };

/** Assemble un mot en une grille unique, lettres séparées d'une colonne vide. */
export function construireMotPixel(mot: string, espace = 1): string[] {
  const glyphes = [...mot.toUpperCase()].map((c) => GLYPHES[c] ?? VIDE);
  const hauteur = 7;
  const separateur = ".".repeat(espace);

  return Array.from({ length: hauteur }, (_, y) =>
    glyphes.map((g) => g[y]).join(separateur),
  );
}

/** Le mot-symbole du jeu, prêt à l'emploi. */
export const LOGO_AR3NA = construireMotPixel("AR3NA");

/** Palette standard : blanc pour les lettres, or pour le "3". */
export const PALETTE_LOGO = { p: "#ffffff", a: "#f2c94c" };

/**
 * Le "3" seul, pour les icônes (favicon, icône iOS) : à 32px un mot entier
 * de 29 colonnes serait illisible, mais la lettre qui donne son identité au
 * nom reste reconnaissable seule.
 */
export const MONOGRAMME_3 = TROIS;
export const PALETTE_MONOGRAMME = { a: "#f2c94c" };
