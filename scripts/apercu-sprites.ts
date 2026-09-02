import * as S from "../src/components/pixel/sprites";
import * as A from "../src/components/pixel/animations";

function afficher(nom: string, grid: string[], palette: Record<string, string>) {
  console.log(`\n=== ${nom} ===`);
  const largeurs = new Set(grid.map((l) => l.length));
  if (largeurs.size > 1) {
    console.log(`  ⚠ largeurs inégales: ${[...largeurs].join(", ")}`);
  }
  const inconnus = new Set<string>();
  for (const ligne of grid) {
    let sortie = "  ";
    for (const c of ligne) {
      if (c === ".") {
        sortie += "·";
      } else if (palette[c]) {
        // un glyphe distinct par caractère pour voir les nuances
        const glyphes: Record<string, string> = {
          k: "#",
          "#": "█",
          b: "▒",
          d: "▓",
          e: "O",
          $: "*",
          w: "/",
          j: "+",
          r: "x",
          v: "V",
          m: "m",
          g: "g",
        };
        sortie += glyphes[c] ?? c;
      } else {
        sortie += "?";
        inconnus.add(c);
      }
    }
    console.log(sortie);
  }
  if (inconnus.size > 0) {
    console.log(`  ⚠ caractères absents de la palette: ${[...inconnus].join(", ")}`);
  }
}

for (const [nom, grid] of [
  ["WOLF_MASSIF", S.SPRITE_WOLF_MASSIF],
  ["BEAR_MASSIF", S.SPRITE_BEAR_MASSIF],
] as const) {
  const largeurs = [...new Set(grid.map((l) => l.length))];
  console.log(
    `${nom}: ${grid.length} lignes, largeurs ${largeurs.join("/")}`,
  );
}

afficher("SLIME", S.SPRITE_SLIME, S.paletteSlime(1));
afficher("ELEMENTAIRE", S.SPRITE_ELEMENTAIRE, S.paletteElementaire(1));
afficher("GRIFFON", S.SPRITE_GRIFFON, S.paletteGriffon(1));
afficher("SERPENT", S.SPRITE_SERPENT, S.paletteSerpent(1));

A.EFFET_COUP.forEach((f, i) => afficher(`EFFET_COUP frame ${i}`, f, A.PALETTE_COUP));
A.EFFET_IMPACT.forEach((f, i) =>
  afficher(`EFFET_IMPACT frame ${i}`, f, A.PALETTE_IMPACT),
);
A.EFFET_SOIN.forEach((f, i) => afficher(`EFFET_SOIN frame ${i}`, f, A.PALETTE_SOIN));
A.EFFET_ETOURDI.forEach((f, i) =>
  afficher(`EFFET_ETOURDI frame ${i}`, f, A.PALETTE_ETOURDI),
);
A.EFFET_SORT.forEach((f, i) => afficher(`EFFET_SORT frame ${i}`, f, A.PALETTE_SORT));

// Vérifie les animations dérivées sur un personnage
const base = S.spritePersonnage(0);
const anims = A.animationsCombattant(base);
for (const [nom, anim] of Object.entries(anims)) {
  anim.frames.forEach((f, i) =>
    afficher(`PERSONNAGE ${nom} frame ${i}`, f, S.palettePersonnage("#10b981")),
  );
}
