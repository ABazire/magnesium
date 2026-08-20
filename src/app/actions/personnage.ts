"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { tirerRarete } from "@/lib/rarity";

function randomStat(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function creerPersonnage(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");

  const name = formData.get("name") as string;
  if (!name || name.trim().length === 0)
    throw new Error("Le nom est obligatoire");

  const rarete = await tirerRarete();

  await prisma.personnage.create({
    data: {
      name,
      vie: randomStat(rarete.statMin, rarete.statMax),
      force: randomStat(rarete.statMin, rarete.statMax),
      vitesse: randomStat(rarete.statMin, rarete.statMax),
      resistance: randomStat(rarete.statMin, rarete.statMax),
      agilite: randomStat(rarete.statMin, rarete.statMax),
      rarityId: rarete.id,
      ownerId: session.user.id,
    },
  });

  revalidatePath("/jouer");
}
