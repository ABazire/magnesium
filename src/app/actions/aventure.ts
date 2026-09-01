"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import {
  simulerCombatEquipe,
  type CombatEvent3v3,
  type PersonnageCombat3v3,
} from "@/lib/combatEquipe";
import {
  statsEffectives,
  sortsActifsCombat,
  reductionDegatsPassive,
} from "@/lib/personnage";
import { tirerRarete } from "@/lib/rarity";
import { SLOT_TO_STAT, NOMS_PAR_SLOT } from "@/lib/equipment";
import { tirerDropsMateriaux } from "@/lib/monsterDrops";
import { gagnerXp } from "@/lib/leveling";
import { EquipmentSlot, MaterialType } from "@prisma/client";
import { tirerGainDiamants } from "@/lib/diamond";
import { obtenirEnergieActuelle, ENERGY_COUT_COMBAT } from "@/lib/energy";

const CHANCE_COFFRE = 0.2;
const TAILLE_EQUIPE = 3;

function randomStat(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getMonsterBaseName(monstre: { baseName: string; name: string }) {
  return monstre.baseName || monstre.name.replace(/\s+[IVXLCDM]+$/, "");
}

type FighterEquipe = {
  id: string;
  name: string;
  vieMax: number;
  manaMax: number;
  color?: string;
  spriteId?: number;
};

type FighterMonstre = {
  id: string;
  name: string;
  vieMax: number;
  baseName?: string;
  tier?: number;
};

export async function affronterMonstre(
  teamId: string,
  monsterId: string,
): Promise<{
  events: CombatEvent3v3[];
  victoire: boolean;
  gain: number;
  materiaux: { type: MaterialType; quantity: number }[];
  equipe: FighterEquipe[];
  monstre: FighterMonstre;
}> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");
  const userId = session.user.id;

  const energieActuelle = await obtenirEnergieActuelle(userId);
  if (energieActuelle < ENERGY_COUT_COMBAT) {
    throw new Error("Énergie insuffisante");
  }

  const [team, monstre] = await Promise.all([
    prisma.team.findUniqueOrThrow({
      where: { id: teamId, ownerId: userId },
      include: {
        membres: {
          orderBy: { position: "asc" },
          include: {
            personnage: {
              include: {
                rarity: true,
                equipment: { include: { equipment: true } },
                spells: { include: { spell: true } },
              },
            },
          },
        },
      },
    }),
    prisma.monster.findUniqueOrThrow({ where: { id: monsterId } }),
  ]);

  if (team.membres.length !== TAILLE_EQUIPE) {
    throw new Error("L'équipe doit avoir 3 personnages pour partir à l'aventure");
  }

  // Vérifie que ce palier est bien débloqué pour ce joueur
  const baseName = getMonsterBaseName(monstre);
  const unlock = await prisma.monsterUnlock.findUnique({
    where: { userId_baseName: { userId, baseName } },
  });
  const tierDebloque = unlock?.highestTierUnlocked ?? 1;
  if (monstre.tier > tierDebloque) {
    throw new Error("Ce palier n'est pas encore débloqué");
  }

  const personnages = team.membres.map((m) => m.personnage);

  const combatEquipe: PersonnageCombat3v3[] = personnages.map((p) => {
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

  const combatMonstre: PersonnageCombat3v3 = {
    id: monstre.id,
    name: monstre.name,
    vie: monstre.vie,
    force: monstre.force,
    vitesse: monstre.vitesse,
    resistance: monstre.resistance,
    agilite: monstre.agilite,
  };

  const seed = Math.floor(Math.random() * 2147483647);
  const { events, winnerSide } = simulerCombatEquipe(
    combatEquipe,
    [combatMonstre],
    seed,
  );
  const victoire = winnerSide === "A";
  const gain = victoire ? monstre.gainVictoire : monstre.gainDefaite;
  const gainDiamants = victoire ? tirerGainDiamants() : 0;
  const materiaux = victoire ? tirerDropsMateriaux(baseName) : [];

  const misesAJourNiveau = victoire
    ? personnages.map((p) => {
        const { newLevel, newXp } = gagnerXp(
          p.level,
          p.xp,
          p.rarity?.stars ?? 1,
          monstre.xpGain,
        );
        return prisma.personnage.update({
          where: { id: p.id },
          data: { level: newLevel, xp: newXp },
        });
      })
    : [];

  const misesAJourMateriaux = materiaux.map((m) =>
    prisma.materialStack.upsert({
      where: { ownerId_type: { ownerId: userId, type: m.type } },
      update: { quantity: { increment: m.quantity } },
      create: { ownerId: userId, type: m.type, quantity: m.quantity },
    }),
  );

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        currency: { increment: gain },
        energy: { decrement: ENERGY_COUT_COMBAT },
        ...(gainDiamants > 0 ? { diamonds: { increment: gainDiamants } } : {}),
      },
    }),
    ...misesAJourNiveau,
    ...misesAJourMateriaux,
  ]);

  // Débloque le palier suivant si on vient de battre le palier max actuellement débloqué
  if (victoire && monstre.tier === tierDebloque && tierDebloque < 5) {
    await prisma.monsterUnlock.upsert({
      where: {
        userId_baseName: { userId, baseName },
      },
      update: { highestTierUnlocked: tierDebloque + 1 },
      create: {
        userId,
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
        ownerId: userId,
      },
    });
  }

  revalidatePath("/aventure");
  revalidatePath("/jouer");
  revalidatePath("/inventaire");

  return {
    events,
    victoire,
    gain,
    materiaux,
    equipe: combatEquipe.map((c, i) => ({
      id: c.id,
      name: c.name,
      vieMax: c.vie,
      manaMax: c.manaMax ?? 0,
      color: personnages[i].color,
      spriteId: personnages[i].spriteId,
    })),
    monstre: {
      id: combatMonstre.id,
      name: combatMonstre.name,
      vieMax: combatMonstre.vie,
      baseName: monstre.baseName,
      tier: monstre.tier,
    },
  };
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
