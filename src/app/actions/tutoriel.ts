"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

function randomStat(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function terminerTutoriel() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");

  const rareteDepart = await prisma.rarity.findUniqueOrThrow({
    where: { stars: 2 },
  });

  const statsPerso = {
    vie: randomStat(rareteDepart.statMin, rareteDepart.statMax),
    force: randomStat(rareteDepart.statMin, rareteDepart.statMax),
    vitesse: randomStat(rareteDepart.statMin, rareteDepart.statMax),
    resistance: randomStat(rareteDepart.statMin, rareteDepart.statMax),
    agilite: randomStat(rareteDepart.statMin, rareteDepart.statMax),
  };

  const personnage = await prisma.personnage.create({
    data: {
      name: "Recrue",
      ...statsPerso,
      rarityId: rareteDepart.id,
      ownerId: session.user.id,
    },
  });

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { hasCompletedTutorial: true },
    }),
    prisma.equipment.create({
      data: {
        name: "Épée du débutant",
        slot: "ARME",
        bonusStat: "FORCE",
        bonusValue: randomStat(rareteDepart.statMin, rareteDepart.statMax),
        rarityId: rareteDepart.id,
        ownerId: session.user.id,
      },
    }),
    prisma.team.create({
      data: {
        name: "Mon équipe",
        ownerId: session.user.id,
        membres: { create: { position: 0, personnageId: personnage.id } },
      },
    }),
  ]);

  redirect("/jouer");
}
