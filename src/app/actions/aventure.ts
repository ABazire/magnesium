"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { CombatEvent, simulerCombat } from "@/lib/combat";
import { statsEffectives } from "@/lib/personnage";
import { tirerRarete } from "@/lib/rarity";
import { SLOT_TO_STAT, NOMS_PAR_SLOT } from "@/lib/equipment";
import { EquipmentSlot } from "@prisma/client";
import { debutDeJournee } from "@/lib/date";

const GAIN_VICTOIRE = 30;
const GAIN_DEFAITE = 10;
const CHANCE_COFFRE = 0.2;
const LIMITE_PAR_MOB = 10;

function randomStat(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

type Fighter = {
  id: string;
  name: string;
  vieMax: number;
  color?: string;
  spriteId?: number;
};

export async function affronterMonstre(
  personnageId: string,
  monsterId: string,
): Promise<{
  events: CombatEvent[];
  victoire: boolean;
  gain: number;
  fighters: [Fighter, Fighter];
}> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");

  const tentativesAujourdhui = await prisma.adventureAttempt.count({
    where: {
      personnageId,
      monsterId,
      playedAt: { gte: debutDeJournee() },
    },
  });

  if (tentativesAujourdhui >= LIMITE_PAR_MOB) {
    throw new Error("Limite quotidienne atteinte pour ce monstre");
  }

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

  const seed = Math.floor(Math.random() * 2147483647);
  const { events, winnerId } = simulerCombat(combatPerso, combatMonstre, seed);
  const victoire = winnerId === personnage.id;
  const gain = victoire ? GAIN_VICTOIRE : GAIN_DEFAITE;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { currency: { increment: gain } },
    }),
    prisma.adventureAttempt.create({
      data: { personnageId, monsterId },
    }),
  ]);

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

  return {
    events,
    victoire,
    gain,
    fighters: [
      {
        id: combatPerso.id,
        name: combatPerso.name,
        vieMax: combatPerso.vie,
        color: personnage.color,
        spriteId: personnage.spriteId,
      },
      {
        id: combatMonstre.id,
        name: combatMonstre.name,
        vieMax: combatMonstre.vie,
      },
    ],
  };
}

export async function getTentativesRestantes(personnageId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");

  const monstres = await prisma.monster.findMany();

  const resultats = await Promise.all(
    monstres.map(async (m) => {
      const utilisees = await prisma.adventureAttempt.count({
        where: {
          personnageId,
          monsterId: m.id,
          playedAt: { gte: debutDeJournee() },
        },
      });
      return {
        monsterId: m.id,
        restantes: Math.max(0, LIMITE_PAR_MOB - utilisees),
      };
    }),
  );

  return resultats;
}
