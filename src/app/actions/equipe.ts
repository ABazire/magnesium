"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

const TAILLE_MAX_EQUIPE = 3;

export async function toggleEquipe(personnageId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");

  const personnage = await prisma.personnage.findUniqueOrThrow({
    where: { id: personnageId, ownerId: session.user.id },
  });

  if (!personnage.inTeam) {
    const tailleActuelle = await prisma.personnage.count({
      where: { ownerId: session.user.id, inTeam: true },
    });
    if (tailleActuelle >= TAILLE_MAX_EQUIPE) {
      throw new Error("Équipe déjà complète (3 maximum)");
    }
  }

  await prisma.personnage.update({
    where: { id: personnageId },
    data: { inTeam: !personnage.inTeam },
  });

  revalidatePath("/jouer");
  revalidatePath("/collection");
}

export async function getEquipeActuelle() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");

  return prisma.personnage.findMany({
    where: { ownerId: session.user.id, inTeam: true },
    select: { id: true, name: true, color: true, spriteId: true, level: true },
  });
}

export async function remplacerMembreEquipe(
  sortantId: string,
  entrantId: string,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");

  await prisma.$transaction([
    prisma.personnage.update({
      where: { id: sortantId, ownerId: session.user.id },
      data: { inTeam: false },
    }),
    prisma.personnage.update({
      where: { id: entrantId, ownerId: session.user.id },
      data: { inTeam: true },
    }),
  ]);

  revalidatePath("/jouer");
  revalidatePath("/collection");
}
