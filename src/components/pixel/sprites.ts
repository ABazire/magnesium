import { eclaircir, assombrir } from "./color";

export const PALETTE_COMMUNE: Record<string, string> = {
  k: "#0f1a16", // contour sombre
};

// --- Monnaie ---
export const SPRITE_COIN = [
  "......kkkk......",
  "....kk####kk....",
  "...k########k...",
  "..k####bb####k..",
  ".k####bbbb####k.",
  ".k###bb$$bb###k.",
  "k####b$$$$b####k",
  "k####$$$$$$####k",
  "k####$$dd$$####k",
  ".k###$$dddd###k.",
  ".k####dddd####k.",
  "..k####dd####k..",
  "...k########k...",
  "....kk####kk....",
  "......kkkk......",
  "................",
];
export const PALETTE_COIN = {
  k: PALETTE_COMMUNE.k,
  b: "#f7dd85",
  $: "#f2c94c",
  d: "#c9962f",
};

// --- Coffre ---
export const SPRITE_CHEST = [
  "............",
  ".kkkkkkkkkk.",
  "k##########k",
  "k#kkkkkkkk#k",
  "k#kkkkkkkk#k",
  "k##########k",
  "k#$$$$$$$$#k",
  "k#$$kkkk$$#k",
  "k#$$kggkk$#k",
  "k#$$$$$$$$#k",
  "k##########k",
  ".kkkkkkkkkk.",
];
export const PALETTE_CHEST = {
  ...PALETTE_COMMUNE,
  "#": "#8b5a2b",
  $: "#6b4226",
  g: "#f2c94c",
};

// --- Arme (Force) ---
export const SPRITE_SWORD = [
  ".......k....",
  "......k#k...",
  ".....k#k....",
  "....k#k.....",
  "...k#k......",
  "..k#k.......",
  ".k#k........",
  "kgk.........",
  "k#kkk.......",
  "kk#kk.......",
  ".kk#k.......",
  "...kk.......",
];
export const PALETTE_SWORD = {
  ...PALETTE_COMMUNE,
  "#": "#cbd5e1",
  g: "#f2c94c",
};

// --- Armure (Résistance) ---
export const SPRITE_ARMOR = [
  "..kkkkkkkk..",
  ".k########k.",
  "k##k####k##k",
  "k#k######k#k",
  "k##########k",
  "k##kkkkkk##k",
  "k##k####k##k",
  "k###kkkk###k",
  ".k########k.",
  "..k######k..",
  "...kkkkkk...",
  "............",
];
export const PALETTE_ARMOR = { ...PALETTE_COMMUNE, "#": "#a9b6c4" };

// --- Bottes (Vitesse) ---
export const SPRITE_BOOTS = [
  "............",
  "....kkkk....",
  "...k####k...",
  "...k####k...",
  "...k####k...",
  "...k####k...",
  "...k####k...",
  "..k######k..",
  ".k#kk####k..",
  "k########kk.",
  "k#########k.",
  "kkkkkkkkkkk.",
];
export const PALETTE_BOOTS = { ...PALETTE_COMMUNE, "#": "#5cc8ff" };

// --- Amulette (Agilité) ---
export const SPRITE_AMULET = [
  "....kk......",
  "...k##k.....",
  "..k####k....",
  "...k##k.....",
  "....kk......",
  "....kk......",
  "...k##k.....",
  "..k####k....",
  ".k######k...",
  ".k#$$$$#k...",
  "..k####k....",
  "...kkkk.....",
];
export const PALETTE_AMULET = {
  ...PALETTE_COMMUNE,
  "#": "#c792ea",
  $: "#8b5fbf",
};

// --- Coeur (Vie) ---
export const SPRITE_HEART = [
  "............",
  "..kk...kk...",
  ".k##k.k##k..",
  "k####k####k.",
  "k##########k",
  "k##########k",
  ".k########k.",
  "..k######k..",
  "...k####k...",
  "....k##k....",
  ".....kk.....",
  "............",
];
export const PALETTE_HEART = { ...PALETTE_COMMUNE, "#": "#ef4444" };

// --- Loup ---
export const SPRITE_WOLF = [
  "k...kkkkkk...k..",
  "k..k#b####b#k...",
  "kk#############k",
  "k#b###########bk",
  "k#$$e#####e$$#k.",
  "k##gk#####kg##k.",
  "k####b###b####k.",
  "k##############k",
  "k####kkkkkk####k",
  ".k####b##b####k.",
  "..k##########k..",
  "...kkkkkkkkkk...",
  "................",
  "................",
  "................",
  "................",
];
export const PALETTE_WOLF = {
  k: PALETTE_COMMUNE.k,
  b: "#c9d6cf",
  "#": "#9db3aa",
  $: "#6b7d74",
  g: "#f2c94c",
  e: "#16241f",
};

export const SPRITE_BEAR = [
  "k......kk......k",
  "k.k####bb####k..",
  ".k#############k",
  ".k#b###########k",
  ".k#####g###g###k",
  ".k####kk###kk##k",
  ".k#############k",
  ".k#####bbb#####k",
  ".k#############k",
  "..k###########k.",
  "..k#b#######b#k.",
  "...k#########k..",
  "....kkkkkkkkk...",
  "................",
  "................",
  "................",
];
export const PALETTE_BEAR = {
  k: PALETTE_COMMUNE.k,
  b: "#8b6339",
  "#": "#6b4226",
  g: "#f2c94c",
};

export const SPRITE_HOME = [
  "............",
  ".....kk.....",
  "....k##k....",
  "...k####k...",
  "..k######k..",
  ".k########k.",
  "k##########k",
  "k#kkkkkkkk#k",
  "k#k######k#k",
  "k#k######k#k",
  "k#kkkkkkkk#k",
  "kkkkkkkkkkkk",
];
export const PALETTE_HOME = { ...PALETTE_COMMUNE, "#": "#10b981" };

export const SPRITE_STAR = [
  "......k.....",
  "......#.....",
  ".....###....",
  "....#####...",
  "kkk#######kk",
  ".k#########k",
  "..k#######k.",
  "..k#k...k#k.",
  ".k#k.....k#k",
  ".k#.......#k",
  "k#.........#",
  "............",
];
export const PALETTE_STAR = { ...PALETTE_COMMUNE, "#": "#f2c94c" };

export const SPRITE_TROPHY = [
  "............",
  "..k######k..",
  ".k########k.",
  "k####kk####k",
  "k####kk####k",
  ".k########k.",
  "..k######k..",
  "...k####k...",
  "....k##k....",
  "...k####k...",
  "..k######k..",
  "kkkkkkkkkkkk",
];
export const PALETTE_TROPHY = { ...PALETTE_COMMUNE, "#": "#f2c94c" };

export function spritePersonnage(variant: number = 0): string[] {
  const variantes = [
    // 0 — carré, casque plat (référence de base)
    [
      "....kkkk....",
      "...kbb##k...",
      "...k#e$e#k...",
      "...k####k...",
      "....kkkk....",
      "..kbb####k..",
      ".k########k.",
      ".k########k.",
      ".k####dddk.",
      "..k####dk..",
      "...k#..#k...",
      "..k##..##k..",
    ],
    // 1 — tête ronde, corps large (trapu)
    [
      "...kkkkkk...",
      "..kbb####k..",
      ".k##e##e##k.",
      ".k########k.",
      "..k######k..",
      "...kkkkkk...",
      ".kbb########k.",
      "k############k",
      "k########dddk",
      ".k######dddk.",
      "..k#..##..#k..",
      ".k##......##k.",
    ],
    // 2 — casque pointu, corps fin (élancé)
    [
      "....kb#k....",
      "...k####k...",
      "..kbb####k..",
      ".k#e####e#k.",
      "..k######k..",
      "...kkkkkk...",
      "....k##k....",
      "...kb##k....",
      "...k####k...",
      "...k##ddk...",
      "...k#..#k...",
      "..k##..##k..",
    ],
    // 3 — grosse tête, petit corps (chibi)
    [
      "..kkkkkkkk..",
      ".kbb######k.",
      "k##########k",
      "k##e####e##k",
      "k##########k",
      "k####kk####k",
      ".k######ddk.",
      "..kkkkkkkk..",
      "....k##k....",
      "...k####k...",
      "...k#..#k...",
      "..k##..##k..",
    ],
    // 4 — cornes, corps carré (démoniaque)
    [
      ".k..k..k..k.",
      ".k.k....k.k.",
      "..kbb####k..",
      ".k##e##e##k.",
      ".k########k.",
      "..k######k..",
      "...kkkkkk...",
      ".kbb########k",
      "k############k",
      "k########dddk",
      ".k##..##..##k.",
      "..k#......#k..",
    ],
    // 5 — antennes, tête ovale (insectoïde)
    [
      "..k.....k...",
      "..k.....k...",
      "...kkkkkk...",
      "..kbb####k..",
      ".k##e##e##k.",
      ".k########k.",
      "..k######k..",
      "...kkkkkk...",
      "..kbb######k.",
      ".k##########k",
      ".k####dd####k",
      "..k#......#k.",
    ],
    // 6 — mohawk, épaules larges (guerrier)
    [
      ".....k......",
      ".....k......",
      "....kkk.....",
      "...kb##k....",
      "..k#e#e#k...",
      "..k#####k...",
      "...kkkkk....",
      ".kbb########k",
      "k############k",
      "k########dddk",
      ".k##..##..##k.",
      "..k#......#k..",
    ],
    // 7 — capuche, silhouette basse (furtif)
    [
      "...kkkkkk...",
      "..kbb####k..",
      ".k########k.",
      ".k#kkkkkk#k.",
      ".k#k....k#k.",
      "..k#e##e#k..",
      "...kkkkkk...",
      "..kbb######k.",
      ".k##########k",
      ".k####dd####k",
      "..k#......#k.",
      "..............",
    ],
  ];
  return variantes[variant] ?? variantes[0];
}

export function palettePersonnage(couleur: string) {
  return {
    k: PALETTE_COMMUNE.k,
    b: eclaircir(couleur, 0.45),
    "#": couleur,
    d: assombrir(couleur, 0.35),
    e: "#16241f",
    $: assombrir(couleur, 0.5),
  };
}
