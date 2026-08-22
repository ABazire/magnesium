export const PALETTE_COMMUNE: Record<string, string> = {
  k: "#0f1a16", // contour sombre
};

// --- Monnaie ---
export const SPRITE_COIN = [
  "....kkkk....",
  "..kk####kk..",
  ".k########k.",
  "k##$$$$$$##k",
  "k#$$$$$$$$#k",
  "k#$$k$$$k$#k",
  "k#$$$$$$$$#k",
  "k#$$$$$$$$#k",
  "k##$$$$$$##k",
  ".k########k.",
  "..kk####kk..",
  "....kkkk....",
];
export const PALETTE_COIN = {
  ...PALETTE_COMMUNE,
  "#": "#f2c94c",
  $: "#c9962f",
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
  "k..kkkk..k..",
  "k.k####k.k..",
  "kk######kk..",
  "k#$####$#k..",
  "k#gk##kg#k..",
  "k##k##k##k..",
  "k########k..",
  "k##kkkk##k..",
  ".k######k...",
  "..kkkkkk....",
  "............",
  "............",
];
export const PALETTE_WOLF = {
  ...PALETTE_COMMUNE,
  "#": "#9db3aa",
  $: "#6b7d74",
  g: "#f2c94c",
};

// --- Ours ---
export const SPRITE_BEAR = [
  "k.......k...",
  "k#k....k#k..",
  "k##k..k##k..",
  ".k#kkkk#k...",
  ".k######k...",
  ".k#g##g#k...",
  ".k##kk##k...",
  ".k######k...",
  ".k#kkkk#k...",
  "..k####k....",
  "...kkkk.....",
  "............",
];
export const PALETTE_BEAR = {
  ...PALETTE_COMMUNE,
  "#": "#6b4226",
  g: "#f2c94c",
};

// --- Personnage générique (silhouette, couleur personnalisable) ---
export function spritePersonnage(): string[] {
  return [
    "....kkkk....",
    "...k####k...",
    "...k#$$#k...",
    "...k####k...",
    "....kkkk....",
    "..k######k..",
    ".k########k.",
    ".k########k.",
    ".k########k.",
    "..k######k..",
    "...k#..#k...",
    "..k##..##k..",
  ];
}
export function palettePersonnage(couleur: string) {
  return { ...PALETTE_COMMUNE, "#": couleur, $: "#0f1a16" };
}

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
