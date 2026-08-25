"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { simulerCombat } from "@/lib/combat";
import { statsEffectives } from "@/lib/personnage";
import { debutDeJournee } from "@/lib/date";
import { calculerNouveauxRangs } from "@/lib/elo";
import { gagnerXp } from "@/lib/leveling";
import { revalidatePath } from "next/cache";

const LIMITE_PVP_PAR_JOUR = 6;

export async function lancerCombat(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");

  const a = formData.get("a") as string;
  const b = formData.get("b") as string;

  const combatsAujourdhui = await prisma.fight.count({
    where: {
      attackerPersonnageId: a,
      playedAt: { gte: debutDeJournee() },
    },
  });

  if (combatsAujourdhui >= LIMITE_PVP_PAR_JOUR) {
    throw new Error("Limite quotidienne de combats PvP atteinte");
  }

  const dejaAffronteAujourdhui = await prisma.fight.findFirst({
    where: {
      attackerPersonnageId: a,
      defenderPersonnageId: b,
      playedAt: { gte: debutDeJournee() },
    },
  });

  if (dejaAffronteAujourdhui) {
    throw new Error("Tu as déjà affronté cet adversaire aujourd'hui");
  }

  const [perso1, perso2] = await Promise.all([
    prisma.personnage.findUniqueOrThrow({
      where: { id: a, ownerId: session.user.id },
      include: { rarity: true, equipment: { include: { equipment: true } } },
    }),
    prisma.personnage.findUniqueOrThrow({
      where: { id: b },
      include: { rarity: true, equipment: { include: { equipment: true } } },
    }),
  ]);

  const combat1 = {
    id: perso1.id,
    name: perso1.name,
    ...statsEffectives(perso1),
  };
  const combat2 = {
    id: perso2.id,
    name: perso2.name,
    ...statsEffectives(perso2),
  };

  const seed = Math.floor(Math.random() * 2147483647);
  const { events, winnerId } = simulerCombat(combat1, combat2, seed);

  const { nouveauRankAttaquant, nouveauRankDefenseur } = calculerNouveauxRangs(
    perso1.rankPoints,
    perso2.rankPoints,
    winnerId === perso1.id,
  );

  if (winnerId === perso1.id || winnerId === perso2.id) {
    const gagnant = winnerId === perso1.id ? perso1 : perso2;
    const { newLevel, newXp } = gagnerXp(
      gagnant.level,
      gagnant.xp,
      gagnant.rarity!.stars,
    );

    await prisma.personnage.update({
      where: { id: gagnant.id },
      data: { level: newLevel, xp: newXp },
    });
  }

  const fight = await prisma.fight.create({
    data: {
      seed,
      turns: events,
      winnerId,
      attackerPersonnageId: a,
      defenderPersonnageId: b,
      attackerVieMax: combat1.vie,
      defenderVieMax: combat2.vie,
    },
  });

  await prisma.$transaction([
    prisma.personnage.update({
      where: { id: perso1.id },
      data: { rankPoints: nouveauRankAttaquant },
    }),
    prisma.personnage.update({
      where: { id: perso2.id },
      data: { rankPoints: nouveauRankDefenseur },
    }),
  ]);

  revalidatePath("/arene");
  redirect(`/combat/${fight.id}`);
}

export async function getCombatsPvpRestants(personnageId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");

  const utilises = await prisma.fight.count({
    where: {
      attackerPersonnageId: personnageId,
      playedAt: { gte: debutDeJournee() },
    },
  });

  return Math.max(0, LIMITE_PVP_PAR_JOUR - utilises);
}
