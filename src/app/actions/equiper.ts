// src/app/actions/equiper.ts
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

  // upsert : s'il existe déjà un objet sur ce slot pour ce personnage, on le remplace
  await prisma.personnageEquipment.upsert({
    where: {
      personnageId_slot: { personnageId, slot: equipment.slot },
    },
    update: { equipmentId },
    create: { personnageId, equipmentId, slot: equipment.slot },
  });

  revalidatePath("/jouer");
}

export async function desequiperObjet(equipmentId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");

  // Vérifie que l'objet appartient bien au joueur avant de toucher quoi que ce soit
  const equipment = await prisma.equipment.findUniqueOrThrow({
    where: { id: equipmentId, ownerId: session.user.id },
  });

  await prisma.personnageEquipment.deleteMany({
    where: { equipmentId: equipment.id },
  });

  revalidatePath("/jouer");
}
