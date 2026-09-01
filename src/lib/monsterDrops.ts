import { MaterialType } from "@prisma/client";

type DropEntry = { type: MaterialType; chance: number; min: number; max: number };

// Slime n'a volontairement aucune entrée : sa récompense est un bonus d'XP, pas des matériaux.
// Os tombe sur tous les monstres liés à l'équipement : c'est l'ingrédient commun à tout craft de stuff.
export const DROPS_PAR_MONSTRE: Record<string, DropEntry[]> = {
  Loup: [
    { type: "GRIFFE", chance: 0.5, min: 1, max: 2 },
    { type: "CROC", chance: 0.5, min: 1, max: 2 },
    { type: "OS", chance: 0.7, min: 1, max: 3 },
  ],
  Ours: [
    { type: "CUIR", chance: 0.6, min: 1, max: 2 },
    { type: "OS", chance: 0.7, min: 1, max: 3 },
  ],
  Griffon: [
    { type: "PLUME", chance: 0.6, min: 1, max: 2 },
    { type: "OS", chance: 0.7, min: 1, max: 3 },
  ],
  "Serpent de Cristal": [
    { type: "ECAILLE_CRISTAL", chance: 0.6, min: 1, max: 2 },
    { type: "OS", chance: 0.7, min: 1, max: 3 },
  ],
  Élémentaire: [{ type: "ESSENCE_ELEMENTAIRE", chance: 0.8, min: 1, max: 2 }],
};

export function tirerDropsMateriaux(
  baseName: string,
): { type: MaterialType; quantity: number }[] {
  const table = DROPS_PAR_MONSTRE[baseName] ?? [];
  const gains: { type: MaterialType; quantity: number }[] = [];

  for (const entree of table) {
    if (Math.random() < entree.chance) {
      const quantity =
        Math.floor(Math.random() * (entree.max - entree.min + 1)) + entree.min;
      gains.push({ type: entree.type, quantity });
    }
  }

  return gains;
}

export const NOMS_MATERIAU: Record<MaterialType, string> = {
  GRIFFE: "Griffe",
  CROC: "Croc",
  OS: "Os",
  CUIR: "Cuir",
  ESSENCE_ELEMENTAIRE: "Essence élémentaire",
  PLUME: "Plume",
  ECAILLE_CRISTAL: "Écaille de cristal",
};
