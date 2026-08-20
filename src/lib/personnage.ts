import {
  Personnage,
  Equipment,
  PersonnageEquipment,
  StatType,
} from "@prisma/client";

type PersonnageAvecEquipement = Personnage & {
  equipment: (PersonnageEquipment & { equipment: Equipment })[];
};

export function statsEffectives(personnage: PersonnageAvecEquipement) {
  const stats = {
    vie: personnage.vie,
    force: personnage.force,
    vitesse: personnage.vitesse,
    resistance: personnage.resistance,
    agilite: personnage.agilite,
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
