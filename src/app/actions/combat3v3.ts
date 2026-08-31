"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  simulerCombatEquipe,
  type PersonnageCombat3v3,
} from "@/lib/combatEquipe";
import {
  statsEffectives,
  sortsActifsCombat,
  reductionDegatsPassive,
} from "@/lib/personnage";
import { gagnerXp } from "@/lib/leveling";
import { calculerNouveauxRangs } from "@/lib/elo";
import { revalidatePath } from "next/cache";

async function chargerEquipe(userId: string): Promise<PersonnageCombat3v3[]> {
  const personnages = await prisma.personnage.findMany({
    where: { ownerId: userId, inTeam: true },
    include: {
      equipment: { include: { equipment: true } },
      spells: { include: { spell: true } },
    },
  });

  return personnages.map((p) => ({
    id: p.id,
    name: p.name,
    ...statsEffectives(p),
    sortsActifs: sortsActifsCombat(p),
    reductionDegats: reductionDegatsPassive(p),
  }));
}

export async function lancerCombat3v3(defenderUserId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");

  const equipeA = await chargerEquipe(session.user.id);
  const equipeB = await chargerEquipe(defenderUserId);

  if (equipeA.length !== 3 || equipeB.length !== 3) {
    throw new Error("Les deux équipes doivent avoir exactement 3 personnages");
  }

  const seed = Math.floor(Math.random() * 2147483647);
  const { events, winnerSide } = simulerCombatEquipe(
    equipeA as [PersonnageCombat3v3, PersonnageCombat3v3, PersonnageCombat3v3],
    equipeB as [PersonnageCombat3v3, PersonnageCombat3v3, PersonnageCombat3v3],
    seed,
  );

  const [attaquantUser, defenseurUser] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: session.user.id } }),
    prisma.user.findUniqueOrThrow({ where: { id: defenderUserId } }),
  ]);

  const { nouveauRankAttaquant, nouveauRankDefenseur } = calculerNouveauxRangs(
    attaquantUser.rankPoints3v3,
    defenseurUser.rankPoints3v3,
    winnerSide === "A",
  );

  const equipeGagnante = winnerSide === "A" ? equipeA : equipeB;

  const misesAJourNiveau = [];
  for (const combattant of equipeGagnante) {
    const personnage = await prisma.personnage.findUniqueOrThrow({
      where: { id: combattant.id },
      include: { rarity: true },
    });
    const { newLevel, newXp } = gagnerXp(
      personnage.level,
      personnage.xp,
      personnage.rarity!.stars,
    );
    misesAJourNiveau.push(
      prisma.personnage.update({
        where: { id: combattant.id },
        data: { level: newLevel, xp: newXp },
      }),
    );
  }

  const fight = await prisma.teamFight.create({
    data: {
      seed,
      events,
      winnerSide,
      attackerUserId: session.user.id,
      defenderUserId,
      fightersA: equipeA,
      fightersB: equipeB,
    },
  });

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { rankPoints3v3: nouveauRankAttaquant },
    }),
    prisma.user.update({
      where: { id: defenderUserId },
      data: { rankPoints3v3: nouveauRankDefenseur },
    }),
    ...misesAJourNiveau,
  ]);

  revalidatePath("/arene3v3");
  redirect(`/arene3v3/${fight.id}`);
}
