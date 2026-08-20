import { EquipmentSlot, StatType } from "@prisma/client";

export const SLOT_TO_STAT: Record<EquipmentSlot, StatType> = {
  ARME: StatType.FORCE,
  ARMURE: StatType.RESISTANCE,
  BOTTES: StatType.VITESSE,
  AMULETTE: StatType.AGILITE,
};

export const NOMS_PAR_SLOT: Record<EquipmentSlot, string[]> = {
  ARME: ["Épée rouillée", "Hache de guerre", "Dague empoisonnée"],
  ARMURE: ["Cuirasse d'os", "Plastron de fer", "Cape renforcée"],
  BOTTES: ["Bottes légères", "Sandales agiles"],
  AMULETTE: ["Amulette de jade", "Pendentif runique"],
};
