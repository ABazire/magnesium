"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { simulerCombat } from "@/lib/combat";
import {
  statsEffectives,
  sortsActifsCombat,
  reductionDegatsPassive,
} from "@/lib/personnage";
import { debutDeJournee } from "@/lib/date";
import { calculerNouveauxRangs } from "@/lib/elo";
import { gagnerXp } from "@/lib/leveling";
import { revalidatePath } from "next/cache";
import { tirerGainDiamants } from "@/lib/diamond";
import { progresserQuete } from "@/lib/quetes";
import { obtenirCouponsActuels, COUPONS_COUT_COMBAT } from "@/lib/energy";

const GAIN_OR_VICTOIRE_ARENE = 30;

export async function lancerCombat(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");

  const a = formData.get("a") as string;
  const b = formData.get("b") as string;

  const couponsActuels = await obtenirCouponsActuels(session.user.id);
  if (couponsActuels < COUPONS_COUT_COMBAT) {
    throw new Error("Coupons insuffisants");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { coupons: { decrement: COUPONS_COUT_COMBAT } },
  });

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

  const inclusionCombat = {
    rarity: true,
    equipment: { include: { equipment: true } },
    spells: { include: { spell: true } },
  } as const;

  const [perso1, perso2] = await Promise.all([
    prisma.personnage.findUniqueOrThrow({
      where: { id: a, ownerId: session.user.id },
      include: inclusionCombat,
    }),
    prisma.personnage.findUniqueOrThrow({
      where: { id: b },
      include: inclusionCombat,
    }),
  ]);

  const stats1 = statsEffectives(perso1);
  const stats2 = statsEffectives(perso2);

  const combat1 = {
    id: perso1.id,
    name: perso1.name,
    ...stats1,
    manaMax: stats1.mana,
    sortsActifs: sortsActifsCombat(perso1),
    reductionDegats: reductionDegatsPassive(perso1),
  };
  const combat2 = {
    id: perso2.id,
    name: perso2.name,
    ...stats2,
    manaMax: stats2.mana,
    sortsActifs: sortsActifsCombat(perso2),
    reductionDegats: reductionDegatsPassive(perso2),
  };

  const seed = Math.floor(Math.random() * 2147483647);
  const { events, winnerId } = simulerCombat(combat1, combat2, seed);
  const gainDiamants = tirerGainDiamants();
  // Récompense d'or : seulement en cas de victoire, contrairement aux
  // diamants ci-dessus qui sont un lot de participation.
  const gainOr = winnerId === perso1.id ? GAIN_OR_VICTOIRE_ARENE : 0;

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
      gagnant.rarity?.stars ?? 1,
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
      attackerManaMax: combat1.manaMax,
      defenderManaMax: combat2.manaMax,
    },
  });

  await prisma.$transaction([
    ...(gainDiamants > 0 || gainOr > 0
      ? [
          prisma.user.update({
            where: { id: session.user.id },
            data: {
              ...(gainDiamants > 0 ? { diamonds: { increment: gainDiamants } } : {}),
              ...(gainOr > 0 ? { currency: { increment: gainOr } } : {}),
            },
          }),
        ]
      : []),
    prisma.personnage.update({
      where: { id: perso1.id },
      data: { rankPoints: nouveauRankAttaquant },
    }),
    prisma.personnage.update({
      where: { id: perso2.id },
      data: { rankPoints: nouveauRankDefenseur },
    }),
  ]);

  if (winnerId === perso1.id) {
    await progresserQuete(session.user.id, "VICTOIRE_ARENE");
  }

  revalidatePath("/arene");
  redirect(`/combat/${fight.id}`);
}
