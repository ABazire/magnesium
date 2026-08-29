"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { CombatEvent, simulerCombat } from "@/lib/combat";
import { statsEffectives } from "@/lib/personnage";
import { tirerRarete } from "@/lib/rarity";
import { SLOT_TO_STAT, NOMS_PAR_SLOT } from "@/lib/equipment";
import { gagnerXp } from "@/lib/leveling";
import { EquipmentSlot } from "@prisma/client";
import { debutDeJournee } from "@/lib/date";
import { tirerGainDiamants } from "@/lib/diamond";
import { obtenirEnergieActuelle, ENERGY_COUT_COMBAT } from "@/lib/energy";

const CHANCE_COFFRE = 0.2;
const LIMITE_PAR_MOB = 10;

function randomStat(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getMonsterBaseName(monstre: { baseName: string; name: string }) {
  return monstre.baseName || monstre.name.replace(/\s+[IVXLCDM]+$/, "");
}

type Fighter = {
  id: string;
  name: string;
  vieMax: number;
  color?: string;
  spriteId?: number;
  baseName?: string;
  tier?: number;
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

  const energieActuelle = await obtenirEnergieActuelle(session.user.id);
  if (energieActuelle < ENERGY_COUT_COMBAT) {
    throw new Error("Énergie insuffisante");
  }

  const tentativesAujourdhui = await prisma.adventureAttempt.count({
    where: { personnageId, monsterId, playedAt: { gte: debutDeJournee() } },
  });
  if (tentativesAujourdhui >= LIMITE_PAR_MOB) {
    throw new Error("Limite quotidienne atteinte pour ce monstre");
  }

  const [personnage, monstre] = await Promise.all([
    prisma.personnage.findUniqueOrThrow({
      where: { id: personnageId, ownerId: session.user.id },
      include: { rarity: true, equipment: { include: { equipment: true } } },
    }),
    prisma.monster.findUniqueOrThrow({ where: { id: monsterId } }),
  ]);

  // Vérifie que ce palier est bien débloqué pour ce joueur
  const baseName = getMonsterBaseName(monstre);
  const unlock = await prisma.monsterUnlock.findUnique({
    where: {
      userId_baseName: { userId: session.user.id, baseName },
    },
  });
  const tierDebloque = unlock?.highestTierUnlocked ?? 1;
  if (monstre.tier > tierDebloque) {
    throw new Error("Ce palier n'est pas encore débloqué");
  }

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
  const gain = victoire ? monstre.gainVictoire : monstre.gainDefaite;
  const gainDiamants = victoire ? tirerGainDiamants() : 0;

  let xpInfo = { newLevel: personnage.level, newXp: personnage.xp };
  if (victoire) {
    xpInfo = gagnerXp(
      personnage.level,
      personnage.xp,
      personnage.rarity?.stars ?? 1,
    );
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: {
        currency: { increment: gain },
        energy: { decrement: ENERGY_COUT_COMBAT },
        ...(gainDiamants > 0 ? { diamonds: { increment: gainDiamants } } : {}),
      },
    }),
    prisma.adventureAttempt.create({
      data: { personnageId, monsterId, victory: victoire },
    }),
    ...(victoire
      ? [
          prisma.personnage.update({
            where: { id: personnageId },
            data: { level: xpInfo.newLevel, xp: xpInfo.newXp },
          }),
        ]
      : []),
  ]);

  // Débloque le palier suivant si on vient de battre le palier max actuellement débloqué
  if (victoire && monstre.tier === tierDebloque && tierDebloque < 5) {
    await prisma.monsterUnlock.upsert({
      where: {
        userId_baseName: {
          userId: session.user.id,
          baseName,
        },
      },
      update: { highestTierUnlocked: tierDebloque + 1 },
      create: {
        userId: session.user.id,
        baseName,
        highestTierUnlocked: 2,
      },
    });
  }

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
        baseName: monstre.baseName,
        tier: monstre.tier,
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

export async function getMonstresDisponibles() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");

  const monstres = await prisma.monster.findMany({
    orderBy: [{ baseName: "asc" }, { tier: "asc" }],
  });

  const unlocks = await prisma.monsterUnlock.findMany({
    where: { userId: session.user.id },
  });
  const unlockMap: Record<string, number> = {};
  for (const u of unlocks) unlockMap[u.baseName] = u.highestTierUnlocked;

  return monstres.map((m) => {
    const baseName = getMonsterBaseName(m);
    return {
      ...m,
      baseName,
      debloque: m.tier <= (unlockMap[baseName] ?? 1),
    };
  });
}
