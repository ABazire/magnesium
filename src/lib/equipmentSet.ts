import { EquipmentSet, EquipmentSlot } from "@prisma/client";
import { RECETTES_EQUIPEMENT } from "./craft";

/**
 * Sets d'équipement et renforcement — la version « moins de chantier » du
 * système à la Summoners War demandé : pas de nouvel emplacement, juste plus
 * de profondeur sur les 4 emplacements existants.
 *
 * Un objet appartient à un ensemble tiré au hasard à sa création. Porter 2
 * pièces du même ensemble donne un petit bonus ; en porter 4 (le maximum
 * possible, il n'y a que 4 emplacements) donne le bonus fort à la place —
 * pas en plus, il n'existe pas de configuration à 6 pièces ici.
 */

export const NOMS_ENSEMBLE: Record<EquipmentSet, string> = {
  FORCE: "Ensemble de Force",
  ENDURANCE: "Ensemble d'Endurance",
  CELERITE: "Ensemble de Célérité",
  PRECISION: "Ensemble de Précision",
  REMPART: "Ensemble de Rempart",
};

export type EffetEnsemble =
  | { type: "stat"; stat: "force" | "vie" | "vitesse"; valeur: number }
  | { type: "critique"; valeur: number }
  | { type: "reductionDegats"; valeur: number };

export const BONUS_ENSEMBLE: Record<
  EquipmentSet,
  { deuxPieces: EffetEnsemble; quatrePieces: EffetEnsemble }
> = {
  FORCE: {
    deuxPieces: { type: "stat", stat: "force", valeur: 6 },
    quatrePieces: { type: "stat", stat: "force", valeur: 14 },
  },
  ENDURANCE: {
    deuxPieces: { type: "stat", stat: "vie", valeur: 6 },
    quatrePieces: { type: "stat", stat: "vie", valeur: 14 },
  },
  CELERITE: {
    deuxPieces: { type: "stat", stat: "vitesse", valeur: 6 },
    quatrePieces: { type: "stat", stat: "vitesse", valeur: 14 },
  },
  PRECISION: {
    deuxPieces: { type: "critique", valeur: 6 },
    quatrePieces: { type: "critique", valeur: 14 },
  },
  REMPART: {
    deuxPieces: { type: "reductionDegats", valeur: 6 },
    quatrePieces: { type: "reductionDegats", valeur: 14 },
  },
};

export function descriptionEffetEnsemble(effet: EffetEnsemble): string {
  switch (effet.type) {
    case "stat":
      return `+${effet.valeur} ${effet.stat}`;
    case "critique":
      return `+${effet.valeur}% critique`;
    case "reductionDegats":
      return `-${effet.valeur}% dégâts subis`;
  }
}

export function tirerEnsemble(): EquipmentSet {
  const valeurs = Object.values(EquipmentSet);
  return valeurs[Math.floor(Math.random() * valeurs.length)];
}

/**
 * Effets d'ensemble actifs pour une liste d'objets équipés — un au plus par
 * ensemble représenté (2 pièces OU 4 pièces, jamais les deux).
 */
export function effetsEnsemblesActifs(
  equipements: { equipment: { ensemble: EquipmentSet | null } }[],
): EffetEnsemble[] {
  const compte = new Map<EquipmentSet, number>();
  for (const pe of equipements) {
    if (!pe.equipment.ensemble) continue;
    compte.set(
      pe.equipment.ensemble,
      (compte.get(pe.equipment.ensemble) ?? 0) + 1,
    );
  }

  const effets: EffetEnsemble[] = [];
  for (const [ensemble, n] of compte) {
    if (n >= 4) effets.push(BONUS_ENSEMBLE[ensemble].quatrePieces);
    else if (n >= 2) effets.push(BONUS_ENSEMBLE[ensemble].deuxPieces);
  }
  return effets;
}

/* ---------------------------------------------------------------- Renforcement */

export const NIVEAU_RENFORCEMENT_MAX = 10;
const GAIN_BONUS_PAR_NIVEAU = 1;

/** Bonus réellement appliqué en combat, renforcement compris. */
export function bonusValueEffectif(bonusValue: number, niveau: number): number {
  return bonusValue + niveau * GAIN_BONUS_PAR_NIVEAU;
}

/** Matériau « signature » d'un emplacement, utilisé pour le renforcer. */
export function materiauRenforcement(slot: EquipmentSlot) {
  return RECETTES_EQUIPEMENT[slot].materiaux[0].type;
}

/** Coût pour passer du niveau actuel au niveau supérieur. */
export function coutRenforcement(
  slot: EquipmentSlot,
  niveauActuel: number,
): { or: number; materiau: { type: ReturnType<typeof materiauRenforcement>; quantity: number } } {
  return {
    or: 15 * (niveauActuel + 1),
    materiau: { type: materiauRenforcement(slot), quantity: niveauActuel + 1 },
  };
}
