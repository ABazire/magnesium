"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

const TAILLE_MAX_EQUIPE = 3;

export async function toggleEquipe(personnageId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");
  const userId = session.user.id;

  try {
    // Isolation sérialisable : évite que deux ajouts concurrents ne fassent
    // toi les deux passer la vérification "équipe pas encore pleine" à la fois.
    await prisma.$transaction(
      async (tx) => {
        const personnage = await tx.personnage.findUniqueOrThrow({
          where: { id: personnageId, ownerId: userId },
        });

        if (!personnage.inTeam) {
          const tailleActuelle = await tx.personnage.count({
            where: { ownerId: userId, inTeam: true },
          });
          if (tailleActuelle >= TAILLE_MAX_EQUIPE) {
            throw new Error("Équipe déjà complète (3 maximum)");
          }
        }

        await tx.personnage.update({
          where: { id: personnageId },
          data: { inTeam: !personnage.inTeam },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2034") {
      throw new Error("Conflit détecté, réessaie");
    }
    throw e;
  }

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
