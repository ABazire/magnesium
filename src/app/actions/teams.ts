"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

const TAILLE_EQUIPE = 3;

export async function getEquipes() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");

  return prisma.team.findMany({
    where: { ownerId: session.user.id },
    orderBy: { id: "asc" },
    include: {
      membres: {
        orderBy: { position: "asc" },
        include: {
          personnage: {
            select: {
              id: true,
              name: true,
              color: true,
              spriteId: true,
              level: true,
            },
          },
        },
      },
    },
  });
}

export async function creerEquipe(name: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");

  const nomPropre = name.trim().slice(0, 30) || "Nouvelle équipe";

  const team = await prisma.team.create({
    data: { name: nomPropre, ownerId: session.user.id },
  });

  revalidatePath("/jouer");
  revalidatePath("/aventure");

  return team;
}

export async function renommerEquipe(teamId: string, name: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");

  const nomPropre = name.trim().slice(0, 30);
  if (!nomPropre) throw new Error("Nom invalide");

  await prisma.team.update({
    where: { id: teamId, ownerId: session.user.id },
    data: { name: nomPropre },
  });

  revalidatePath("/jouer");
  revalidatePath("/aventure");
}

export async function supprimerEquipe(teamId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");

  await prisma.team.findUniqueOrThrow({
    where: { id: teamId, ownerId: session.user.id },
  });

  await prisma.$transaction([
    prisma.teamMembre.deleteMany({ where: { teamId } }),
    prisma.team.delete({ where: { id: teamId } }),
  ]);

  revalidatePath("/jouer");
  revalidatePath("/aventure");
}

export async function getPersonnageDetail(personnageId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");

  return prisma.personnage.findUniqueOrThrow({
    where: { id: personnageId, ownerId: session.user.id },
    include: {
      rarity: true,
      equipment: { include: { equipment: true } },
      spells: { include: { spell: true } },
    },
  });
}

export async function definirMembreEquipe(
  teamId: string,
  position: number,
  personnageId: string | null,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");

  if (!Number.isInteger(position) || position < 0 || position >= TAILLE_EQUIPE) {
    throw new Error("Position invalide");
  }

  await prisma.team.findUniqueOrThrow({
    where: { id: teamId, ownerId: session.user.id },
  });

  if (personnageId) {
    await prisma.personnage.findUniqueOrThrow({
      where: { id: personnageId, ownerId: session.user.id },
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.teamMembre.deleteMany({ where: { teamId, position } });
    if (personnageId) {
      await tx.teamMembre.deleteMany({ where: { teamId, personnageId } });
      await tx.teamMembre.create({
        data: { teamId, position, personnageId },
      });
    }
  });

  revalidatePath("/jouer");
  revalidatePath("/aventure");
}
