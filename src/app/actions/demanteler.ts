"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import {
  orDemantelementEquipement,
  orDemantelementSort,
} from "@/lib/craft";

/**
 * Démantèlement d'objets inutiles contre de l'or.
 *
 * Seuls les objets non équipés peuvent être démantelés : forcer un
 * déséquipement préalable au clic évite qu'un geste malheureux détruise
 * l'équipement porté par un personnage en pleine préparation de combat.
 */

export async function demantelerEquipement(equipmentId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");
  const userId = session.user.id;

  const equipement = await prisma.equipment.findUniqueOrThrow({
    where: { id: equipmentId, ownerId: userId },
    include: { rarity: true, equippedOn: true },
  });

  if (equipement.equippedOn) {
    throw new Error("Déséquipe d'abord cet objet avant de le démanteler");
  }

  const or = orDemantelementEquipement(equipement.rarity.stars);

  await prisma.$transaction([
    prisma.equipment.delete({ where: { id: equipmentId } }),
    prisma.user.update({
      where: { id: userId },
      data: { currency: { increment: or } },
    }),
  ]);

  revalidatePath("/inventaire");
  revalidatePath("/jouer");

  return { or };
}

export async function demantelerSort(spellId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");
  const userId = session.user.id;

  const sort = await prisma.spell.findUniqueOrThrow({
    where: { id: spellId, ownerId: userId },
    include: { rarity: true, equippedOn: true },
  });

  if (sort.equippedOn) {
    throw new Error("Déséquipe d'abord ce sort avant de le démanteler");
  }

  const or = orDemantelementSort(sort.rarity.stars);

  await prisma.$transaction([
    prisma.spell.delete({ where: { id: spellId } }),
    prisma.user.update({
      where: { id: userId },
      data: { currency: { increment: or } },
    }),
  ]);

  revalidatePath("/inventaire");
  revalidatePath("/jouer");

  return { or };
}
