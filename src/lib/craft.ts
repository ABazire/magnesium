import { EquipmentSlot, MaterialType } from "@prisma/client";

export type Recette = {
  materiaux: { type: MaterialType; quantity: number }[];
  or: number;
};

export const RECETTES_EQUIPEMENT: Record<EquipmentSlot, Recette> = {
  ARME: {
    materiaux: [
      { type: "GRIFFE", quantity: 2 },
      { type: "CROC", quantity: 2 },
      { type: "OS", quantity: 3 },
    ],
    or: 80,
  },
  ARMURE: {
    materiaux: [
      { type: "CUIR", quantity: 4 },
      { type: "OS", quantity: 3 },
    ],
    or: 80,
  },
  BOTTES: {
    materiaux: [
      { type: "PLUME", quantity: 4 },
      { type: "OS", quantity: 3 },
    ],
    or: 80,
  },
  AMULETTE: {
    materiaux: [
      { type: "ECAILLE_CRISTAL", quantity: 4 },
      { type: "OS", quantity: 3 },
    ],
    or: 80,
  },
};

export const RECETTE_SORT: Recette = {
  materiaux: [{ type: "ESSENCE_ELEMENTAIRE", quantity: 3 }],
  or: 100,
};

// Fusion d'objets : même ressource que la fabrication du slot, en plus petite quantité.
export const RECETTES_FUSION_EQUIPEMENT: Record<
  EquipmentSlot,
  { materiaux: { type: MaterialType; quantity: number }[] }
> = {
  ARME: {
    materiaux: [
      { type: "GRIFFE", quantity: 1 },
      { type: "CROC", quantity: 1 },
    ],
  },
  ARMURE: { materiaux: [{ type: "CUIR", quantity: 2 }] },
  BOTTES: { materiaux: [{ type: "PLUME", quantity: 2 }] },
  AMULETTE: { materiaux: [{ type: "ECAILLE_CRISTAL", quantity: 2 }] },
};
