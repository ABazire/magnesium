"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { simulerCombat } from "@/lib/combat";
import { statsEffectives } from "@/lib/personnage";
import { tirerRarete } from "@/lib/rarity";
import { SLOT_TO_STAT, NOMS_PAR_SLOT } from "@/lib/equipment";
import { EquipmentSlot } from "@prisma/client";

const GAIN_VICTOIRE = 30;
const GAIN_DEFAITE = 10;
const CHANCE_COFFRE = 0.2; // 20%

function randomStat(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function affronterMonstre(
  personnageId: string,
  monsterId: string,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");

  const [personnage, monstre] = await Promise.all([
    prisma.personnage.findUniqueOrThrow({
      where: { id: personnageId, ownerId: session.user.id },
      include: { equipment: { include: { equipment: true } } },
    }),
    prisma.monster.findUniqueOrThrow({ where: { id: monsterId } }),
  ]);

  const combatPerso = {
    id: personnage.id,
    name: personnage.name,
    ...statsEffectives(personnage),
  };
  const combatMonstre = {
    id: monstre.id,
    name: monstre.name,
    vie: monstre.vie,
    force: monstre.force,
    vitesse: monstre.vitesse,
    resistance: monstre.resistance,
    agilite: monstre.agilite,
  };

  const resultat = simulerCombat(combatPerso, combatMonstre);
  const victoire = resultat.winnerId === personnage.id;
  const gain = victoire ? GAIN_VICTOIRE : GAIN_DEFAITE;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { currency: { increment: gain } },
  });

  if (victoire && Math.random() < CHANCE_COFFRE) {
    const rarete = await tirerRarete();
    const slots = Object.values(EquipmentSlot);
    const slot = slots[Math.floor(Math.random() * slots.length)];
    const noms = NOMS_PAR_SLOT[slot];

    await prisma.equipment.create({
      data: {
        name: noms[Math.floor(Math.random() * noms.length)],
        slot,
        bonusStat: SLOT_TO_STAT[slot],
        bonusValue: randomStat(rarete.statMin, rarete.statMax),
        rarityId: rarete.id,
        ownerId: session.user.id,
      },
    });
  }

  revalidatePath("/aventure");
  revalidatePath("/jouer");

  return { log: resultat.log, victoire, gain };
}
