// Outils de transformation de grilles + frames d'animation.
//
// Deux approches cohabitent ici :
//  - les personnages et monstres sont animés en dérivant leur sprite de base
//    (décalage, inclinaison, écrasement) : une frame = une grille distincte,
//    mais générée, ce qui couvre automatiquement les 8 variantes de
//    personnages et les 6 familles de monstres sans les redessiner ;
//  - les effets (coup, impact, soin, étourdissement, sort) sont dessinés
//    frame par frame à la main : ils sont peu nombreux et réutilisés partout,
//    c'est là que le dessin manuel apporte le plus.

export type Animation = {
  frames: string[][];
  fps: number;
  loop: boolean;
};

export type Animations = Record<string, Animation>;

const VIDE = ".";

// Les grilles d'origine ont parfois des lignes de largeurs différentes, et
// PixelSprite les centre ligne par ligne. On reproduit exactement ce centrage
// ici, sinon une frame dérivée serait décalée par rapport au sprite de base et
// la silhouette tremblerait d'une frame à l'autre.
function normaliser(grid: string[]): string[] {
  const largeur = Math.max(...grid.map((l) => l.length));
  return grid.map((ligne) => {
    const gauche = Math.floor((largeur - ligne.length) / 2);
    const droite = largeur - ligne.length - gauche;
    return VIDE.repeat(gauche) + ligne + VIDE.repeat(droite);
  });
}

export function decalerX(grid: string[], n: number): string[] {
  const g = normaliser(grid);
  const largeur = g[0].length;
  return g.map((ligne) => {
    if (n === 0) return ligne;
    if (n > 0) return (VIDE.repeat(n) + ligne).slice(0, largeur);
    return (ligne + VIDE.repeat(-n)).slice(-n).slice(0, largeur);
  });
}

export function decalerY(grid: string[], n: number): string[] {
  const g = normaliser(grid);
  const largeur = g[0].length;
  const ligneVide = VIDE.repeat(largeur);
  if (n === 0) return g;
  if (n > 0) return [...Array(n).fill(ligneVide), ...g].slice(0, g.length);
  return [...g.slice(-n), ...Array(-n).fill(ligneVide)];
}

// Penche la silhouette : plus une ligne est haute, plus elle se décale.
export function incliner(grid: string[], amplitude: number): string[] {
  const g = normaliser(grid);
  return g.map((ligne, y) => {
    const facteur = 1 - y / (g.length - 1);
    const n = Math.round(amplitude * facteur);
    const largeur = ligne.length;
    if (n === 0) return ligne;
    if (n > 0) return (VIDE.repeat(n) + ligne).slice(0, largeur);
    return (ligne + VIDE.repeat(-n)).slice(-n).slice(0, largeur);
  });
}

// Silhouette au sol : on comprime la moitié haute et on pousse tout en bas.
export function ecraser(grid: string[]): string[] {
  const g = normaliser(grid);
  const largeur = g[0].length;
  const ligneVide = VIDE.repeat(largeur);
  const basses = g.filter((_, y) => y % 2 === 1);
  const manquantes = g.length - basses.length;
  return [...Array(manquantes).fill(ligneVide), ...basses];
}

// --- Animations dérivées d'un sprite de base ---

export function animationsCombattant(grilleSource: string[]): Animations {
  // Toutes les frames (y compris l'idle de repos) passent par la même
  // normalisation, pour qu'aucun décalage n'apparaisse entre elles.
  const base = normaliser(grilleSource);

  return {
    idle: {
      frames: [base, decalerY(base, 1)],
      fps: 2,
      loop: true,
    },
    attaque: {
      frames: [
        incliner(base, -1),
        decalerX(incliner(base, 2), 1),
        decalerX(base, 1),
        base,
      ],
      fps: 12,
      loop: false,
    },
    touche: {
      frames: [decalerX(base, -2), decalerY(decalerX(base, -1), 1), base],
      fps: 10,
      loop: false,
    },
    ko: {
      frames: [decalerY(base, 1), ecraser(base)],
      fps: 6,
      loop: false,
    },
    incantation: {
      frames: [decalerY(base, -1), base, decalerY(base, -1)],
      fps: 6,
      loop: false,
    },
  };
}

// --- Effets dessinés frame par frame ---

export const PALETTE_COUP = {
  k: "#0f1a16",
  w: "#ffffff",
  b: "#cfe3da",
};

export const EFFET_COUP: string[][] = [
  [
    "............",
    "..........k.",
    ".........kw.",
    "........kw..",
    ".......kw...",
    "......kw....",
    ".....kw.....",
    "....kw......",
    "............",
    "............",
    "............",
    "............",
  ],
  [
    ".........k..",
    "........kwk.",
    ".......kwwk.",
    "......kwwk..",
    ".....kwwk...",
    "....kwwk....",
    "...kwwk.....",
    "..kwwk......",
    "..kwk.......",
    "..kk........",
    "............",
    "............",
  ],
  [
    "............",
    "..........b.",
    "........b...",
    "......b.....",
    "....b.......",
    "..b.........",
    ".b..........",
    "............",
    "............",
    "............",
    "............",
    "............",
  ],
];

export const PALETTE_IMPACT = {
  k: "#0f1a16",
  r: "#ef4444",
  j: "#f2c94c",
  w: "#ffffff",
};

export const EFFET_IMPACT: string[][] = [
  [
    "............",
    "............",
    ".....k......",
    "....kwk.....",
    "...kwwwk....",
    "....kwk.....",
    ".....k......",
    "............",
    "............",
    "............",
    "............",
    "............",
  ],
  [
    "............",
    "...k..k..k..",
    "....kjjjk...",
    "...kjwwwjk..",
    "..kjwwwwwjk.",
    "...kjwwwjk..",
    "....kjjjk...",
    "...k..k..k..",
    "............",
    "............",
    "............",
    "............",
  ],
  [
    "..k.......k.",
    "............",
    "...r.....r..",
    "....rjjjr...",
    "...rj...jr..",
    "....rjjjr...",
    "...r.....r..",
    "............",
    "..k.......k.",
    "............",
    "............",
    "............",
  ],
];

export const PALETTE_SOIN = {
  k: "#0f1a16",
  v: "#34d399",
  b: "#a7f3d0",
};

export const EFFET_SOIN: string[][] = [
  [
    "............",
    "............",
    "............",
    "............",
    "............",
    ".....vv.....",
    "....vvvv....",
    "...vv..vv...",
    "............",
    "......b.....",
    "...b........",
    "........b...",
  ],
  [
    "............",
    "............",
    "............",
    ".....bb.....",
    "....vvvv....",
    "..vvvvvvvv..",
    "..vvvvvvvv..",
    "....vvvv....",
    ".....bb.....",
    "...b.....b..",
    "............",
    "......b.....",
  ],
  [
    "......b.....",
    "...b.....b..",
    ".....vv.....",
    "....vvvv....",
    "..vvvvvvvv..",
    "....vvvv....",
    ".....vv.....",
    "............",
    "...b........",
    "............",
    "........b...",
    "............",
  ],
];

export const PALETTE_ETOURDI = {
  k: "#0f1a16",
  j: "#f2c94c",
  b: "#fff3c4",
};

export const EFFET_ETOURDI: string[][] = [
  [
    "..j......j..",
    ".jbj....jbj.",
    "..j......j..",
    "............",
    "............",
    "............",
    "............",
    "............",
    "............",
    "............",
    "............",
    "............",
  ],
  [
    "......j.....",
    "j....jbj....",
    "jbj...j...j.",
    ".j.......jbj",
    "..........j.",
    "............",
    "............",
    "............",
    "............",
    "............",
    "............",
    "............",
  ],
];

export const PALETTE_SORT = {
  k: "#0f1a16",
  m: "#c792ea",
  b: "#e9d5ff",
  w: "#ffffff",
};

export const EFFET_SORT: string[][] = [
  [
    "............",
    "............",
    "............",
    "............",
    ".....ww.....",
    ".....ww.....",
    "............",
    "............",
    "............",
    "............",
    "............",
    "............",
  ],
  [
    "............",
    "............",
    ".....mm.....",
    "....mbbm....",
    "...mbwwbm...",
    "...mbwwbm...",
    "....mbbm....",
    ".....mm.....",
    "............",
    "............",
    "............",
    "............",
  ],
  [
    "............",
    "....m....m..",
    "..mm.bb.mm..",
    ".m.bbwwbb.m.",
    "..bwwwwwwb..",
    "..bwwwwwwb..",
    ".m.bbwwbb.m.",
    "..mm.bb.mm..",
    "....m....m..",
    "............",
    "............",
    "............",
  ],
  [
    ".m........m.",
    "............",
    "..m..mm..m..",
    ".....bb.....",
    "...bb..bb...",
    "...bb..bb...",
    ".....bb.....",
    "..m..mm..m..",
    "............",
    ".m........m.",
    "............",
    "............",
  ],
];

/* ==========================================================================
   Effets élémentaires
   Trois images chacun, sur la même grille 12x12 que les effets existants :
   apparition, plein régime, dissipation.
   ========================================================================== */

export const PALETTE_FLAMME = {
  k: "#7c2d12",
  f: "#f97316",
  j: "#fde047",
};

export const EFFET_FLAMME: string[][] = [
  [
    "............",
    "............",
    "............",
    "............",
    ".....f......",
    "....ff......",
    "....fjf.....",
    "...ffjff....",
    "...fjjjf....",
    "....fff.....",
    "............",
    "............",
  ],
  [
    "............",
    "......f.....",
    ".....ff.....",
    "....ffj.....",
    "...ffjjf....",
    "..ffjjjff...",
    "..fjjjjjf...",
    ".ffjjjjjff..",
    ".fjjjjjjjf..",
    "..fjjjjjf...",
    "...fffff....",
    "............",
  ],
  [
    "............",
    "....k..k....",
    "...k....k...",
    "..f..kk..f..",
    ".f...ff...f.",
    "f...fjjf...f",
    "....fjjf....",
    ".f..ffff..f.",
    "..f......f..",
    "...k....k...",
    "............",
    "............",
  ],
];

export const PALETTE_GIVRE = {
  k: "#0c4a6e",
  g: "#7dd3fc",
  b: "#e0f2fe",
};

export const EFFET_GIVRE: string[][] = [
  [
    "............",
    "............",
    "............",
    "............",
    "......g.....",
    ".....ggg....",
    "......g.....",
    "............",
    "............",
    "............",
    "............",
    "............",
  ],
  [
    "............",
    "......g.....",
    "...g..g..g..",
    "....g.g.g...",
    "..ggggbgggg.",
    "....gbbbg...",
    "..ggggbgggg.",
    "....g.g.g...",
    "...g..g..g..",
    "......g.....",
    "............",
    "............",
  ],
  [
    "......b.....",
    "...b..g..b..",
    "............",
    "..b.g...g.b.",
    "....g.b.g...",
    ".b...bbb...b",
    "....g.b.g...",
    "..b.g...g.b.",
    "............",
    "...b..g..b..",
    "......b.....",
    "............",
  ],
];

export const PALETTE_FOUDRE = {
  k: "#713f12",
  e: "#facc15",
  b: "#fefce8",
};

export const EFFET_FOUDRE: string[][] = [
  [
    "......ee....",
    ".....ee.....",
    "....ee......",
    "...eeeee....",
    ".....ee.....",
    "....ee......",
    "...ee.......",
    "..ee........",
    "............",
    "............",
    "............",
    "............",
  ],
  [
    "....e.ee.e..",
    "...ee.ee.ee.",
    "..ee.bbb.ee.",
    ".eeeebbbeeee",
    "..ee.bbb.ee.",
    "...ee.b.ee..",
    "..eee.b.eee.",
    ".ee..bbb..ee",
    "e....b.b....",
    "....ee.ee...",
    "...e.....e..",
    "............",
  ],
  [
    "..e.......e.",
    "............",
    "....e...e...",
    "..e...b...e.",
    ".....b.b....",
    "...e..b..e..",
    ".....b.b....",
    "..e...b...e.",
    "....e...e...",
    "............",
    "..e.......e.",
    "............",
  ],
];
