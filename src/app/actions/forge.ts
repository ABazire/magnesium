"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { tirerRarete } from "@/lib/rarity";
import { SLOT_TO_STAT, NOMS_PAR_SLOT } from "@/lib/equipment";
import { genererSort } from "@/lib/spell";
import { RECETTES_EQUIPEMENT, RECETTE_SORT, type Recette } from "@/lib/craft";
import { progresserQuete } from "@/lib/quetes";
import { tirerEnsemble } from "@/lib/equipmentSet";
import { EquipmentSlot, MaterialType } from "@prisma/client";

function randomStat(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function verifierRecette(userId: string, recette: Recette) {
  const [user, stocks] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.materialStack.findMany({ where: { ownerId: userId } }),
  ]);

  if (user.currency < recette.or) throw new Error("Or insuffisant");

  const stockParType = new Map(stocks.map((s) => [s.type, s.quantity]));
  for (const m of recette.materiaux) {
    if ((stockParType.get(m.type) ?? 0) < m.quantity) {
      throw new Error("Matériaux insuffisants");
    }
  }

  return user;
}

function operationsConsommation(userId: string, recette: Recette) {
  return [
    prisma.user.update({
      where: { id: userId },
      data: { currency: { decrement: recette.or } },
    }),
    ...recette.materiaux.map((m) =>
      prisma.materialStack.update({
        where: { ownerId_type: { ownerId: userId, type: m.type as MaterialType } },
        data: { quantity: { decrement: m.quantity } },
      }),
    ),
  ];
}

export async function getRessourcesDisponibles() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");

  const [user, stocks] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: session.user.id } }),
    prisma.materialStack.findMany({ where: { ownerId: session.user.id } }),
  ]);

  const materiaux: Record<string, number> = {};
  for (const s of stocks) materiaux[s.type] = s.quantity;

  return { currency: user.currency, materiaux };
}

type ResultatFabricationEquipement = {
  equipment: {
    name: string;
    slot: string;
    bonusStat: string;
    bonusValue: number;
    stars: number;
  };
  newCurrency: number;
};

export async function fabriquerEquipement(
  slot: EquipmentSlot,
): Promise<ResultatFabricationEquipement> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");
  const userId = session.user.id;

  const recette = RECETTES_EQUIPEMENT[slot];
  const user = await verifierRecette(userId, recette);

  const rarete = await tirerRarete();
  const noms = NOMS_PAR_SLOT[slot];
  const name = noms[Math.floor(Math.random() * noms.length)];
  const bonusValue = randomStat(rarete.statMin, rarete.statMax);

  await prisma.$transaction([
    ...operationsConsommation(userId, recette),
    prisma.equipment.create({
      data: {
        name,
        slot,
        bonusStat: SLOT_TO_STAT[slot],
        bonusValue,
        ensemble: tirerEnsemble(),
        rarityId: rarete.id,
        ownerId: userId,
      },
    }),
  ]);

  await progresserQuete(userId, "FABRICATION");

  revalidatePath("/forge");
  revalidatePath("/inventaire");

  return {
    equipment: {
      name,
      slot,
      bonusStat: SLOT_TO_STAT[slot],
      bonusValue,
      stars: rarete.stars,
    },
    newCurrency: user.currency - recette.or,
  };
}

type ResultatFabricationSort = {
  spell: {
    name: string;
    type: string;
    effect: string;
    value: number;
    targetStat: string | null;
    stars: number;
  };
  newCurrency: number;
};

export async function fabriquerSort(): Promise<ResultatFabricationSort> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");
  const userId = session.user.id;

  const recette = RECETTE_SORT;
  const user = await verifierRecette(userId, recette);

  const rarete = await tirerRarete();
  const sort = genererSort(rarete);

  await prisma.$transaction([
    ...operationsConsommation(userId, recette),
    prisma.spell.create({ data: { ...sort, ownerId: userId } }),
  ]);

  await progresserQuete(userId, "FABRICATION");

  revalidatePath("/forge");
  revalidatePath("/inventaire");

  return {
    spell: {
      name: sort.name,
      type: sort.type,
      effect: sort.effect,
      value: sort.value,
      targetStat: sort.targetStat,
      stars: rarete.stars,
    },
    newCurrency: user.currency - recette.or,
  };
}
