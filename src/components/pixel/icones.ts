/**
 * Icônes d'interface dessinées en pixels (9x9).
 *
 * Les icônes vectorielles au trait juraient avec les sprites du jeu : à 28px,
 * un trait de 2px anti-aliasé reste flou là où une grille 9x9 tombe pile sur
 * la grille de l'écran. Toutes les icônes partagent le même alphabet de
 * caractères pour qu'une seule palette puisse les teinter :
 *
 *   o = contour        p = masse principale
 *   c = éclat clair    s = détail secondaire
 */

export const ICONE_ACCUEIL = [
  "ooooooooo",
  "o.......o",
  "o..ppp..o",
  "o..ppp..o",
  "o.......o",
  "o.ppppp.o",
  "o.ppppp.o",
  "o.......o",
  "ooooooooo",
];

export const ICONE_INVENTAIRE = [
  ".........",
  ".ooooooo.",
  ".opppppo.",
  ".ooosooo.",
  ".opppppo.",
  ".opppppo.",
  ".opppppo.",
  ".ooooooo.",
  ".........",
];

export const ICONE_AVENTURE = [
  "...ooo...",
  ".oo...oo.",
  ".o.....o.",
  "o...s...o",
  "o..sss..o",
  "o...s...o",
  ".o.....o.",
  ".oo...oo.",
  "...ooo...",
];

export const ICONE_ARENE = [
  "p.......p",
  ".p.....p.",
  "..p...p..",
  "...p.p...",
  "....p....",
  "...p.p...",
  "..p...p..",
  ".s.....s.",
  "s.......s",
];

export const ICONE_CLASSEMENT = [
  ".ppppppp.",
  "p.ppppp.p",
  "p.ppppp.p",
  "p.ppppp.p",
  ".p.ppp.p.",
  "...ppp...",
  "...ppp...",
  "..ppppp..",
  ".ppppppp.",
];

export const ICONE_RECRUTEMENT = [
  "....p....",
  "....p....",
  "...ppp...",
  "ppppppppp",
  ".ppppppp.",
  "..ppppp..",
  "..pp.pp..",
  ".pp...pp.",
  ".p.....p.",
];

export const ICONE_FORGE = [
  "..ooooo..",
  ".ooooooo.",
  ".ooooooo.",
  "..ooooo..",
  "....s....",
  "....s....",
  "....s....",
  "....s....",
  "....s....",
];

export const ICONE_GUILDE = [
  "...oooo..",
  "..oppppo.",
  "..oppppo.",
  "..oppppo.",
  "...oopo..",
  "....s....",
  "....s....",
  "....s....",
  "....s....",
];

/** Teinte une icône d'interface en une ou deux couleurs. */
export function paletteIcone(
  principal: string,
  secondaire: string = principal,
): Record<string, string> {
  return { o: principal, p: principal, s: secondaire, c: secondaire };
}

/* --------------------------------------------------------------------------
   Ressources — celles-ci gardent leurs couleurs propres : la pièce doit rester
   dorée et la gemme bleue quel que soit le contexte.
   -------------------------------------------------------------------------- */

export const ICONE_PIECE = [
  "...ppp...",
  ".ppcccpp.",
  ".pccpppp.",
  "ppcpppppp",
  "ppppppppp",
  "ppppppppp",
  ".ppppppp.",
  ".ppppppp.",
  "...ppp...",
];

export const PALETTE_PIECE = { p: "#e5c14c", c: "#fff2ae" };

export const ICONE_GEMME = [
  ".ppppppp.",
  "ppcpppppp",
  ".ppppppp.",
  "..ppppp..",
  "..ppppp..",
  "...ppp...",
  "...ppp...",
  "....p....",
  "....p....",
];

export const PALETTE_GEMME = { p: "#6fc9dd", c: "#e8fbff" };

export const ICONE_ENERGIE = [
  ".....pp..",
  "....pp...",
  "...pp....",
  "..ppppp..",
  "....pp...",
  "...pp....",
  "..pp.....",
  ".pp......",
  ".........",
];

export const PALETTE_ENERGIE = { p: "#f2c94c" };

export const ICONE_TICKET = [
  ".........",
  ".ooooooo.",
  ".opppppo.",
  "oopppppoo",
  ".opppppo.",
  "oopppppoo",
  ".opppppo.",
  ".ooooooo.",
  ".........",
];

export const PALETTE_TICKET = { o: "#d9c96a", p: "#6f6530" };
