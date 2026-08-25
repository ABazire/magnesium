import {
  Personnage,
  Equipment,
  PersonnageEquipment,
  StatType,
} from "@prisma/client";

import { bonusStatsParNiveau } from "./leveling";

type PersonnageAvecEquipement = Personnage & {
  equipment: (PersonnageEquipment & { equipment: Equipment })[];
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
