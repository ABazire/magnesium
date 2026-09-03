"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { tirerRarete, tirerRaretePremium } from "@/lib/rarity";
import { progresserQuete } from "@/lib/quetes";

const COUT_TIRAGE = 100;
const COUT_PREMIUM = 75;
const NOMS_ALEATOIRES = [
  "Kaeruun",
  "Vor'gath",
  "Brindal",
  "Ossaria",
  "Nyxelle",
  "Grommosh",
  "Thalindra",
  "Karnog",
  "Elyndris",
  "Draveth",
  "Sylvaka",
  "Morgrath",
  "Zephyrine",
  "Baldrek",
  "Isolde",
  "Rurik",
  "Vaelith",
  "Corvinne",
  "Hagrim",
  "Selunara",
  "Torvek",
  "Amberlyn",
  "Doryan",
  "Ithriel",
  "Krognar",
  "Faelynn",
  "Grendric",
  "Lyssara",
  "Modrick",
  "Nyveth",
  "Osrune",
  "Perenna",
  "Quorrik",
  "Ravenna",
  "Skjald",
  "Tamriel",
  "Ulfrik",
  "Veyna",
  "Wystrel",
  "Xanthir",
  "Yggara",
  "Zaltheor",
];

function randomStat(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

type ResultatGatcha = {
  personnage: {
    id: string;
    name: string;
    stars: number;
    vie: number;
    force: number;
    vitesse: number;
    resistance: number;
    agilite: number;
    mana: number;
  };
  newCurrency: number;
};

export async function tirerGatcha(): Promise<ResultatGatcha> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
  });
  if (user.currency < COUT_TIRAGE) throw new Error("Monnaie insuffisante");

  const rarete = await tirerRarete();
  const name =
    NOMS_ALEATOIRES[Math.floor(Math.random() * NOMS_ALEATOIRES.length)];

  const stats = {
    vie: randomStat(rarete.statMin, rarete.statMax),
    force: randomStat(rarete.statMin, rarete.statMax),
    vitesse: randomStat(rarete.statMin, rarete.statMax),
    resistance: randomStat(rarete.statMin, rarete.statMax),
    agilite: randomStat(rarete.statMin, rarete.statMax),
    // Base garantie + jet de rareté, pour qu'aucun personnage ne naisse incapable de lancer un sort
    mana: 20 + randomStat(rarete.statMin, rarete.statMax),
  };

  const [updatedUser, nouveauPersonnage] = await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { currency: { decrement: COUT_TIRAGE } },
    }),
    prisma.personnage.create({
      data: { name, ...stats, rarityId: rarete.id, ownerId: session.user.id },
    }),
  ]);

  await progresserQuete(session.user.id, "INVOCATION");

  revalidatePath("/gatcha");
  revalidatePath("/jouer");
  revalidatePath("/collection");

  return {
    personnage: {
      id: nouveauPersonnage.id,
      name,
      stars: rarete.stars,
      ...stats,
    },
    newCurrency: updatedUser.currency,
  };
}

type ResultatGatchaPremium = {
  personnage: {
    id: string;
    name: string;
    stars: number;
    vie: number;
    force: number;
    vitesse: number;
    resistance: number;
    agilite: number;
    mana: number;
  };
  newDiamonds: number;
};

export async function tirerGatchaPremium(): Promise<ResultatGatchaPremium> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
  });
  if (user.diamonds < COUT_PREMIUM) throw new Error("Diamants insuffisants");

  const rarete = await tirerRaretePremium();
  const name =
    NOMS_ALEATOIRES[Math.floor(Math.random() * NOMS_ALEATOIRES.length)];

  const stats = {
    vie: randomStat(rarete.statMin, rarete.statMax),
    force: randomStat(rarete.statMin, rarete.statMax),
    vitesse: randomStat(rarete.statMin, rarete.statMax),
    resistance: randomStat(rarete.statMin, rarete.statMax),
    agilite: randomStat(rarete.statMin, rarete.statMax),
    // Base garantie + jet de rareté, pour qu'aucun personnage ne naisse incapable de lancer un sort
    mana: 20 + randomStat(rarete.statMin, rarete.statMax),
  };

  const [updatedUser, nouveauPersonnage] = await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { diamonds: { decrement: COUT_PREMIUM } },
    }),
    prisma.personnage.create({
      data: { name, ...stats, rarityId: rarete.id, ownerId: session.user.id },
    }),
  ]);

  await progresserQuete(session.user.id, "INVOCATION");

  revalidatePath("/gatcha");
  revalidatePath("/jouer");
  revalidatePath("/collection");

  return {
    personnage: {
      id: nouveauPersonnage.id,
      name,
      stars: rarete.stars,
      ...stats,
    },
    newDiamonds: updatedUser.diamonds,
  };
}
