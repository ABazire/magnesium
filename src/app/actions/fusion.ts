"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { SLOT_TO_STAT, NOMS_PAR_SLOT } from "@/lib/equipment";
import { RECETTES_FUSION_EQUIPEMENT } from "@/lib/craft";
import { SEUILS_FUSION, coutFusionObjet, coutFusionPersonnage } from "@/lib/fusion";

function randomStat(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function fusionnerObjets(equipmentIds: string[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");
  const userId = session.user.id;

  if (equipmentIds.length === 0) {
    throw new Error("Sélectionne des objets à fusionner");
  }

  const objets = await prisma.equipment.findMany({
    where: { id: { in: equipmentIds }, ownerId: userId },
    include: { rarity: true, equippedOn: true },
  });

  if (objets.length !== equipmentIds.length) {
    throw new Error("Objet introuvable");
  }
  if (objets.some((o) => o.equippedOn)) {
    throw new Error("Retire d'abord les objets équipés de leur emplacement");
  }

  const slot = objets[0].slot;
  const stars = objets[0].rarity.stars;
  if (objets.some((o) => o.slot !== slot || o.rarity.stars !== stars)) {
    throw new Error(
      "Les objets doivent être du même emplacement et de la même rareté",
    );
  }

  const seuil = SEUILS_FUSION[stars];
  if (!seuil) throw new Error("Ce palier de rareté est déjà maximal");
  if (equipmentIds.length !== seuil) {
    throw new Error(`Il faut exactement ${seuil} objets pour cette fusion`);
  }

  const recette = RECETTES_FUSION_EQUIPEMENT[slot];
  const or = coutFusionObjet(stars);

  const [user, stocks, nouvelleRarete] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.materialStack.findMany({ where: { ownerId: userId } }),
    prisma.rarity.findUniqueOrThrow({ where: { stars: stars + 1 } }),
  ]);

  if (user.currency < or) throw new Error("Or insuffisant");
  const stockParType = new Map(stocks.map((s) => [s.type, s.quantity]));
  for (const m of recette.materiaux) {
    if ((stockParType.get(m.type) ?? 0) < m.quantity) {
      throw new Error("Matériaux insuffisants");
    }
  }

  const noms = NOMS_PAR_SLOT[slot];
  const name = noms[Math.floor(Math.random() * noms.length)];
  const bonusValue = randomStat(nouvelleRarete.statMin, nouvelleRarete.statMax);

  await prisma.$transaction([
    prisma.equipment.deleteMany({ where: { id: { in: equipmentIds } } }),
    prisma.user.update({
      where: { id: userId },
      data: { currency: { decrement: or } },
    }),
    ...recette.materiaux.map((m) =>
      prisma.materialStack.update({
        where: { ownerId_type: { ownerId: userId, type: m.type } },
        data: { quantity: { decrement: m.quantity } },
      }),
    ),
    prisma.equipment.create({
      data: {
        name,
        slot,
        bonusStat: SLOT_TO_STAT[slot],
        bonusValue,
        rarityId: nouvelleRarete.id,
        ownerId: userId,
      },
    }),
  ]);

  revalidatePath("/inventaire");

  return { newStars: nouvelleRarete.stars, newCurrency: user.currency - or };
}

export async function renvoyerPersonnage(personnageId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");
  const userId = session.user.id;

  const personnage = await prisma.personnage.findUniqueOrThrow({
    where: { id: personnageId, ownerId: userId },
    include: { rarity: true },
  });

  const stars = personnage.rarity?.stars ?? 1;

  await prisma.$transaction([
    prisma.teamMembre.deleteMany({ where: { personnageId } }),
    prisma.personnageEquipment.deleteMany({ where: { personnageId } }),
    prisma.personnageSpell.deleteMany({ where: { personnageId } }),
    prisma.personnage.delete({ where: { id: personnageId } }),
    prisma.personnageFragment.upsert({
      where: { ownerId_stars: { ownerId: userId, stars } },
      update: { quantity: { increment: 1 } },
      create: { ownerId: userId, stars, quantity: 1 },
    }),
  ]);

  revalidatePath("/collection");
  revalidatePath("/jouer");

  return { stars };
}

export async function fusionnerPersonnage(personnageId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");
  const userId = session.user.id;

  const personnage = await prisma.personnage.findUniqueOrThrow({
    where: { id: personnageId, ownerId: userId },
    include: { rarity: true },
  });

  const stars = personnage.rarity?.stars ?? 1;
  const seuil = SEUILS_FUSION[stars];
  if (!seuil) throw new Error("Ce personnage a déjà le palier maximal");

  const or = coutFusionPersonnage(stars);

  const [user, fragmentStack, nouvelleRarete] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.personnageFragment.findUnique({
      where: { ownerId_stars: { ownerId: userId, stars } },
    }),
    prisma.rarity.findUniqueOrThrow({ where: { stars: stars + 1 } }),
  ]);

  if (user.currency < or) throw new Error("Or insuffisant");
  if ((fragmentStack?.quantity ?? 0) < seuil) {
    throw new Error(`Il faut ${seuil} fragments ${stars}★ pour cette fusion`);
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { currency: { decrement: or } },
    }),
    prisma.personnageFragment.update({
      where: { ownerId_stars: { ownerId: userId, stars } },
      data: { quantity: { decrement: seuil } },
    }),
    prisma.personnage.update({
      where: { id: personnageId },
      data: {
        rarityId: nouvelleRarete.id,
        vie: randomStat(nouvelleRarete.statMin, nouvelleRarete.statMax),
        force: randomStat(nouvelleRarete.statMin, nouvelleRarete.statMax),
        vitesse: randomStat(nouvelleRarete.statMin, nouvelleRarete.statMax),
        resistance: randomStat(nouvelleRarete.statMin, nouvelleRarete.statMax),
        agilite: randomStat(nouvelleRarete.statMin, nouvelleRarete.statMax),
        mana: 20 + randomStat(nouvelleRarete.statMin, nouvelleRarete.statMax),
      },
    }),
  ]);

  revalidatePath("/collection");
  revalidatePath("/jouer");

  return { newStars: nouvelleRarete.stars, newCurrency: user.currency - or };
}

export async function getFragments() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");

  const fragments = await prisma.personnageFragment.findMany({
    where: { ownerId: session.user.id },
  });

  const parPalier: Record<number, number> = {};
  for (const f of fragments) parPalier[f.stars] = f.quantity;
  return parPalier;
}
