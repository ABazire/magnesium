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

type PersonnageAvecEquipement = Personnage & {
  equipment: (PersonnageEquipment & { equipment: Equipment })[];
  spells?: (PersonnageSpell & { spell: Spell })[];
};

export function statsEffectives(personnage: PersonnageAvecEquipement) {
  const bonusNiveau = bonusStatsParNiveau(personnage.level);

  const stats = {
    vie: personnage.vie + bonusNiveau,
    force: personnage.force + bonusNiveau,
    vitesse: personnage.vitesse + bonusNiveau,
    resistance: personnage.resistance + bonusNiveau,
    agilite: personnage.agilite + bonusNiveau,
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

// % de réduction des dégâts subis apporté par le passif équipé, s'il y en a un.
export function reductionDegatsPassive(
  personnage: PersonnageAvecEquipement,
): number {
  const passif = personnage.spells?.find((ps) => ps.slot === "PASSIF")?.spell;
  return passif?.effect === SpellEffect.REDUCTION_DEGATS ? passif.value : 0;
}

export type SortActifCombat = {
  id: string;
  name: string;
  effect: "DEGATS" | "SOIN" | "ETOURDISSEMENT";
  value: number;
  cooldown: number;
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
      effect: ps.spell.effect as "DEGATS" | "SOIN" | "ETOURDISSEMENT",
      value: ps.spell.value,
      cooldown: ps.spell.cooldown,
    }));
}
