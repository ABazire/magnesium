"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function equiperObjet(personnageId: string, equipmentId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");

  const equipment = await prisma.equipment.findUniqueOrThrow({
    where: { id: equipmentId },
  });

  await prisma.personnageEquipment.upsert({
    where: {
      personnageId_slot: { personnageId, slot: equipment.slot },
    },
    update: { equipmentId },
    create: { personnageId, equipmentId, slot: equipment.slot },
  });

  revalidatePath("/jouer");
}
