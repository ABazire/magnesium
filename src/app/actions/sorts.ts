"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { SpellSlot, SpellType } from "@prisma/client";

const SLOTS_ACTIFS: SpellSlot[] = [
  SpellSlot.SORT_1,
  SpellSlot.SORT_2,
  SpellSlot.SORT_3,
];

export async function equiperSort(
  personnageId: string,
  spellId: string,
  slot: SpellSlot,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");

  const [, spell] = await Promise.all([
    prisma.personnage.findUniqueOrThrow({
      where: { id: personnageId, ownerId: session.user.id },
    }),
    prisma.spell.findUniqueOrThrow({
      where: { id: spellId, ownerId: session.user.id },
    }),
  ]);

  const slotsValides =
    spell.type === SpellType.PASSIF ? [SpellSlot.PASSIF] : SLOTS_ACTIFS;
  if (!slotsValides.includes(slot)) {
    throw new Error("Ce sort ne peut pas être placé sur cet emplacement");
  }

  await prisma.personnageSpell.upsert({
    where: { personnageId_slot: { personnageId, slot } },
    update: { spellId },
    create: { personnageId, spellId, slot },
  });

  revalidatePath("/jouer");
  revalidatePath("/collection");
}

export async function desequiperSort(spellId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");

  const spell = await prisma.spell.findUniqueOrThrow({
    where: { id: spellId, ownerId: session.user.id },
  });

  await prisma.personnageSpell.deleteMany({
    where: { spellId: spell.id },
  });

  revalidatePath("/jouer");
  revalidatePath("/collection");
}

export async function getSortsDisponibles(slot: SpellSlot) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");

  if (!Object.values(SpellSlot).includes(slot)) {
    throw new Error("Emplacement invalide");
  }

  const type = slot === SpellSlot.PASSIF ? SpellType.PASSIF : SpellType.ACTIF;

  return prisma.spell.findMany({
    where: {
      ownerId: session.user.id,
      type,
      equippedOn: null,
    },
    include: { rarity: true },
  });
}
