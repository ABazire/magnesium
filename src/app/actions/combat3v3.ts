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
import { progresserQuete } from "@/lib/quetes";

// Le 3v3 est plus exigeant à préparer (équipe complète, pas de tirage
// contre un bot) qu'un duel 1v1 : la récompense d'or suit.
const GAIN_OR_VICTOIRE_3V3 = 50;

async function chargerEquipe(teamId: string): Promise<PersonnageCombat3v3[]> {
  const team = await prisma.team.findUniqueOrThrow({
    where: { id: teamId },
    include: {
      membres: {
        orderBy: { position: "asc" },
        include: {
          personnage: {
            include: {
              equipment: { include: { equipment: true } },
              spells: { include: { spell: true } },
            },
          },
        },
      },
    },
  });

  if (team.membres.length !== 3) {
    throw new Error("Cette équipe doit avoir exactement 3 personnages");
  }

  return team.membres.map(({ personnage: p }) => {
    const stats = statsEffectives(p);
    return {
      id: p.id,
      name: p.name,
      ...stats,
      manaMax: stats.mana,
      sortsActifs: sortsActifsCombat(p),
      reductionDegats: reductionDegatsPassive(p),
    };
  });
}

export async function lancerCombat3v3(teamId: string, defenderUserId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");
  const userId = session.user.id;

  const attaquantTeam = await prisma.team.findUniqueOrThrow({
    where: { id: teamId, ownerId: userId },
  });

  const defenseurTeam = await prisma.team.findFirst({
    where: { ownerId: defenderUserId, estDefense: true },
  });
  if (!defenseurTeam) {
    throw new Error("Cet adversaire n'a pas d'équipe de défense");
  }

  const [equipeA, equipeB] = await Promise.all([
    chargerEquipe(attaquantTeam.id),
    chargerEquipe(defenseurTeam.id),
  ]);

  const seed = Math.floor(Math.random() * 2147483647);
  const { events, winnerSide } = simulerCombatEquipe(equipeA, equipeB, seed);

  const [attaquantUser, defenseurUser] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
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
      personnage.rarity?.stars ?? 1,
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
      attackerUserId: userId,
      defenderUserId,
      fightersA: equipeA,
      fightersB: equipeB,
    },
  });

  const gainOr = winnerSide === "A" ? GAIN_OR_VICTOIRE_3V3 : 0;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        rankPoints3v3: nouveauRankAttaquant,
        ...(gainOr > 0 ? { currency: { increment: gainOr } } : {}),
      },
    }),
    prisma.user.update({
      where: { id: defenderUserId },
      data: { rankPoints3v3: nouveauRankDefenseur },
    }),
    ...misesAJourNiveau,
  ]);

  if (winnerSide === "A") {
    await progresserQuete(userId, "VICTOIRE_ARENE");
  }

  revalidatePath("/arene");
  redirect(`/arene3v3/${fight.id}`);
}
