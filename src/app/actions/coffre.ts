"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { tirerRarete } from "@/lib/rarity";
import { SLOT_TO_STAT, NOMS_PAR_SLOT } from "@/lib/equipment";
import { EquipmentSlot } from "@prisma/client";

const COUT_COFFRE = 80;
const SLOTS = Object.values(EquipmentSlot);

function randomStat(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

type ResultatCoffre = {
  equipment: {
    name: string;
    slot: string;
    bonusStat: string;
    bonusValue: number;
    stars: number;
  };
  newCurrency: number;
};

export async function ouvrirCoffre(): Promise<ResultatCoffre> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
  });
  if (user.currency < COUT_COFFRE) throw new Error("Monnaie insuffisante");

  const rarete = await tirerRarete();
  const slot = SLOTS[Math.floor(Math.random() * SLOTS.length)];
  const noms = NOMS_PAR_SLOT[slot];
  const name = noms[Math.floor(Math.random() * noms.length)];
  const bonusValue = randomStat(rarete.statMin, rarete.statMax);

  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { currency: { decrement: COUT_COFFRE } },
    }),
    prisma.equipment.create({
      data: {
        name,
        slot,
        bonusStat: SLOT_TO_STAT[slot],
        bonusValue,
        rarityId: rarete.id,
        ownerId: session.user.id,
      },
    }),
  ]);

  revalidatePath("/coffre");
  revalidatePath("/jouer");

  return {
    equipment: {
      name,
      slot,
      bonusStat: SLOT_TO_STAT[slot],
      bonusValue,
      stars: rarete.stars,
    },
    newCurrency: updatedUser.currency,
  };
}
