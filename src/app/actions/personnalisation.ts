"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

const COULEURS_AUTORISEES = [
  "#10b981",
  "#ef4444",
  "#5cc8ff",
  "#c792ea",
  "#f2c94c",
  "#ff9d81",
];

export async function personnaliserPersonnage(
  personnageId: string,
  name: string,
  spriteId: number,
  color: string,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");

  const nomPropre = name.trim().slice(0, 20);
  if (nomPropre.length === 0) throw new Error("Le nom ne peut pas être vide");

  if (spriteId < 0 || spriteId > 2) throw new Error("Sprite invalide");
  if (!COULEURS_AUTORISEES.includes(color)) throw new Error("Couleur invalide");

  await prisma.personnage.update({
    where: { id: personnageId, ownerId: session.user.id },
    data: { name: nomPropre, spriteId, color },
  });

  revalidatePath("/jouer");
  revalidatePath("/collection");
  revalidatePath("/gatcha");
}
