import * as S from "./sprites";
import { animationsCombattant, type Animations } from "./animations";

export type ApparenceCombattant = {
  animations: Animations;
  palette: Record<string, string>;
  /** Dimensions de la grille : permet d'adapter la taille de rendu au format
   *  du sprite (certains monstres de palier 5 sont bien plus larges que hauts). */
  colonnes: number;
  lignes: number;
};

function dimensions(grid: readonly string[]) {
  return {
    colonnes: Math.max(...grid.map((l) => l.length)),
    lignes: grid.length,
  };
}

export function apparencePersonnage(
  variant = 0,
  couleur = "#10b981",
): ApparenceCombattant {
  const grid = S.spritePersonnage(variant);
  return {
    animations: animationsCombattant(grid),
    palette: S.palettePersonnage(couleur),
    ...dimensions(grid),
  };
}

const LOUPS = [
  [S.SPRITE_WOLF_1, S.PALETTE_WOLF_1],
  [S.SPRITE_WOLF_2, S.PALETTE_WOLF_2],
  [S.SPRITE_WOLF_3, S.PALETTE_WOLF_3],
  [S.SPRITE_WOLF_4, S.PALETTE_WOLF_4],
  [S.SPRITE_WOLF_MASSIF, S.PALETTE_WOLF_MASSIF],
] as const;

const OURS = [
  [S.SPRITE_BEAR_1, S.PALETTE_BEAR_1],
  [S.SPRITE_BEAR_2, S.PALETTE_BEAR_2],
  [S.SPRITE_BEAR_3, S.PALETTE_BEAR_3],
  [S.SPRITE_BEAR_4, S.PALETTE_BEAR_4],
  [S.SPRITE_BEAR_MASSIF, S.PALETTE_BEAR_MASSIF],
] as const;

export function apparenceMonstre(
  baseName: string,
  tier = 1,
): ApparenceCombattant {
  const t = Math.min(Math.max(Math.round(tier), 1), 5);

  function construire(
    grid: readonly string[],
    palette: Record<string, string>,
  ): ApparenceCombattant {
    return {
      animations: animationsCombattant([...grid]),
      palette,
      ...dimensions(grid),
    };
  }

  switch (baseName.toLowerCase()) {
    case "loup": {
      const [grid, palette] = LOUPS[t - 1];
      return construire(grid, palette);
    }
    case "ours": {
      const [grid, palette] = OURS[t - 1];
      return construire(grid, palette);
    }
    case "slime":
      return construire(S.SPRITE_SLIME, S.paletteSlime(t));
    case "griffon":
      return construire(S.SPRITE_GRIFFON, S.paletteGriffon(t));
    case "serpent de cristal":
      return construire(S.SPRITE_SERPENT, S.paletteSerpent(t));
    case "élémentaire":
    default:
      return construire(S.SPRITE_ELEMENTAIRE, S.paletteElementaire(t));
  }
}

export type { Animations };
