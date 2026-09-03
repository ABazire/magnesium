"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import {
  NIVEAU_RENFORCEMENT_MAX,
  coutRenforcement,
} from "@/lib/equipmentSet";

export async function renforcerEquipement(equipmentId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");
  const userId = session.user.id;

  const equipement = await prisma.equipment.findUniqueOrThrow({
    where: { id: equipmentId, ownerId: userId },
  });

  if (equipement.niveau >= NIVEAU_RENFORCEMENT_MAX) {
    throw new Error("Niveau de renforcement maximal atteint");
  }

  const { or, materiau } = coutRenforcement(equipement.slot, equipement.niveau);

  const [user, stock] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.materialStack.findUnique({
      where: { ownerId_type: { ownerId: userId, type: materiau.type } },
    }),
  ]);

  if (user.currency < or) throw new Error("Or insuffisant");
  if ((stock?.quantity ?? 0) < materiau.quantity) {
    throw new Error("Matériaux insuffisants");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { currency: { decrement: or } },
    }),
    prisma.materialStack.update({
      where: { ownerId_type: { ownerId: userId, type: materiau.type } },
      data: { quantity: { decrement: materiau.quantity } },
    }),
    prisma.equipment.update({
      where: { id: equipmentId },
      data: { niveau: { increment: 1 } },
    }),
  ]);

  revalidatePath("/inventaire");
  revalidatePath("/jouer");

  return { nouveauNiveau: equipement.niveau + 1, or, materiau };
}
