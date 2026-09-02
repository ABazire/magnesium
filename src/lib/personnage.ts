import {
  Personnage,
  Equipment,
  PersonnageEquipment,
  Spell,
  PersonnageSpell,
  StatType,
  SpellType,
  SpellEffect,
} from "@prisma/client";

import { bonusStatsParNiveau } from "./leveling";
import { VIE_PAR_POINT } from "./statsConstantes";

type PersonnageAvecEquipement = Personnage & {
  equipment: (PersonnageEquipment & { equipment: Equipment })[];
  spells?: (PersonnageSpell & { spell: Spell })[];
};

export function statsEffectives(personnage: PersonnageAvecEquipement) {
  const bonusNiveau = bonusStatsParNiveau(personnage.level);

  // La vie est le seul point de statistique converti : sans multiplicateur un
  // personnage aurait autant de PV que de force et tomberait en deux coups.
  const stats = {
    vie: (personnage.vie + bonusNiveau) * VIE_PAR_POINT,
    force: personnage.force + bonusNiveau,
    vitesse: personnage.vitesse + bonusNiveau,
    resistance: personnage.resistance + bonusNiveau,
    agilite: personnage.agilite + bonusNiveau,
    mana: personnage.mana + bonusNiveau,
  };

  for (const pe of personnage.equipment) {
    const bonus = pe.equipment.bonusValue;
    switch (pe.equipment.bonusStat) {
      case StatType.FORCE:
        stats.force += bonus;
        break;
      case StatType.VITESSE:
        stats.vitesse += bonus;
        break;
      case StatType.RESISTANCE:
        stats.resistance += bonus;
        break;
      case StatType.AGILITE:
        stats.agilite += bonus;
        break;
    }
  }

  const passif = personnage.spells?.find((ps) => ps.slot === "PASSIF")?.spell;
  if (passif?.effect === SpellEffect.BONUS_STAT && passif.targetStat) {
    switch (passif.targetStat) {
      case StatType.FORCE:
        stats.force += passif.value;
        break;
      case StatType.VITESSE:
        stats.vitesse += passif.value;
        break;
      case StatType.RESISTANCE:
        stats.resistance += passif.value;
        break;
      case StatType.AGILITE:
        stats.agilite += passif.value;
        break;
    }
  }

  return stats;
}

export function puissance(stats: {
  force: number;
  vitesse: number;
  resistance: number;
  agilite: number;
}) {
  return stats.force + stats.vitesse + stats.resistance + stats.agilite;
}

/** Effets passifs, agrégés pour le moteur de combat. */
export type PassifsCombat = {
  /** % de dégâts subis en moins. */
  reductionDegats: number;
  /** % des PV max rendus à chaque tour. */
  regeneration: number;
  /** % des dégâts infligés convertis en PV. */
  volDeVie: number;
  /** % des dégâts subis renvoyés à l'attaquant. */
  epines: number;
  /** % de chance de doubler les dégâts. */
  critique: number;
};

const PASSIFS_VIDES: PassifsCombat = {
  reductionDegats: 0,
  regeneration: 0,
  volDeVie: 0,
  epines: 0,
  critique: 0,
};

/**
 * Le passif équipé, traduit en modificateurs de combat.
 *
 * Un personnage n'a qu'un seul emplacement de passif : la fonction renvoie
 * donc au plus un effet non nul, mais le moteur travaille sur la structure
 * complète pour ne pas avoir à tester quel effet est présent.
 */
export function passifsCombat(
  personnage: PersonnageAvecEquipement,
): PassifsCombat {
  const passif = personnage.spells?.find((ps) => ps.slot === "PASSIF")?.spell;
  if (!passif) return { ...PASSIFS_VIDES };

  const valeurs = { ...PASSIFS_VIDES };
  switch (passif.effect) {
    case SpellEffect.REDUCTION_DEGATS:
      valeurs.reductionDegats = passif.value;
      break;
    case SpellEffect.REGENERATION:
      valeurs.regeneration = passif.value;
      break;
    case SpellEffect.VOL_DE_VIE:
      valeurs.volDeVie = passif.value;
      break;
    case SpellEffect.EPINES:
      valeurs.epines = passif.value;
      break;
    case SpellEffect.CRITIQUE:
      valeurs.critique = passif.value;
      break;
    default:
      // BONUS_STAT est déjà appliqué dans statsEffectives.
      break;
  }
  return valeurs;
}

// % de réduction des dégâts subis apporté par le passif équipé, s'il y en a un.
export function reductionDegatsPassive(
  personnage: PersonnageAvecEquipement,
): number {
  return passifsCombat(personnage).reductionDegats;
}

/** Effets qu'un sort actif peut produire. */
export type EffetActif =
  | "DEGATS"
  | "SOIN"
  | "ETOURDISSEMENT"
  | "BRULURE"
  | "DEGATS_ZONE"
  | "RALENTISSEMENT";

/** Élément d'un sort, utilisé pour choisir l'effet visuel en combat. */
export type ElementSort = "NEUTRE" | "FEU" | "GLACE" | "FOUDRE";

export type SortActifCombat = {
  id: string;
  name: string;
  effect: EffetActif;
  element: ElementSort;
  value: number;
  duree: number;
  cooldown: number;
  manaCost: number;
};

// Sorts actifs équipés (hors passif), dans l'ordre SORT_1 -> SORT_2 -> SORT_3.
export function sortsActifsCombat(
  personnage: PersonnageAvecEquipement,
): SortActifCombat[] {
  return (personnage.spells ?? [])
    .filter((ps) => ps.spell.type === SpellType.ACTIF)
    .sort((a, b) => a.slot.localeCompare(b.slot))
    .map((ps) => ({
      id: ps.spell.id,
      name: ps.spell.name,
      effect: ps.spell.effect as EffetActif,
      element: ps.spell.element as ElementSort,
      value: ps.spell.value,
      duree: ps.spell.duree,
      cooldown: ps.spell.cooldown,
      manaCost: ps.spell.manaCost,
    }));
}
