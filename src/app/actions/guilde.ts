"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { statsEffectives, puissance } from "@/lib/personnage";
import {
  MAX_ATTAQUES_PAR_JOUR,
  OR_PAR_ATTAQUE_BOSS,
  vieMaxBoss,
  poolRecompenseCycle,
  degatsAttaqueBoss,
  jourCourant,
} from "@/lib/guildeBoss";

async function utilisateurConnecte() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non connecté");
  return session.user.id;
}

export async function creerGuilde(nom: string) {
  const userId = await utilisateurConnecte();

  const nomPropre = nom.trim();
  if (nomPropre.length < 3 || nomPropre.length > 24) {
    throw new Error("Le nom doit faire entre 3 et 24 caractères");
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.guildeId) throw new Error("Quitte ta guilde actuelle avant d'en créer une autre");

  const guilde = await prisma.guild.create({
    data: { name: nomPropre, leaderId: userId, membres: { connect: { id: userId } } },
  });

  revalidatePath("/guilde");
  return { guildeId: guilde.id };
}

export async function rejoindreGuilde(guildeId: string) {
  const userId = await utilisateurConnecte();

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.guildeId) throw new Error("Quitte ta guilde actuelle avant d'en rejoindre une autre");

  const guilde = await prisma.guild.findUniqueOrThrow({
    where: { id: guildeId },
    include: { _count: { select: { membres: true } } },
  });
  if (guilde._count.membres >= 30) throw new Error("Cette guilde est complète");

  await prisma.user.update({ where: { id: userId }, data: { guildeId } });
  revalidatePath("/guilde");
}

export async function quitterGuilde() {
  const userId = await utilisateurConnecte();

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!user.guildeId) throw new Error("Tu n'es dans aucune guilde");

  const autresMembres = await prisma.user.findMany({
    where: { guildeId: user.guildeId, id: { not: userId } },
    orderBy: { id: "asc" },
    select: { id: true },
  });

  const guildeActuelle = await prisma.guild.findUniqueOrThrow({
    where: { id: user.guildeId },
  });
  const estLeader = guildeActuelle.leaderId === userId;

  if (estLeader && autresMembres.length > 0) {
    // La direction passe au membre le plus ancien plutôt que de bloquer le
    // départ : personne ne doit rester coincé leader malgré lui.
    await prisma.$transaction([
      prisma.guild.update({
        where: { id: user.guildeId },
        data: { leaderId: autresMembres[0].id },
      }),
      prisma.user.update({ where: { id: userId }, data: { guildeId: null } }),
    ]);
  } else if (estLeader) {
    // Dernier membre : la guilde n'a plus de raison d'exister.
    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { guildeId: null } }),
      prisma.guild.delete({ where: { id: user.guildeId } }),
    ]);
  } else {
    await prisma.user.update({ where: { id: userId }, data: { guildeId: null } });
  }

  revalidatePath("/guilde");
}

export async function listerGuildesDisponibles() {
  const guildes = await prisma.guild.findMany({
    include: { _count: { select: { membres: true } } },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  return guildes.map((g) => ({
    id: g.id,
    name: g.name,
    nombreMembres: g._count.membres,
  }));
}

export async function getMonEtatGuilde() {
  const userId = await utilisateurConnecte();

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      guilde: {
        include: {
          membres: { select: { id: true, username: true } },
          boss: true,
        },
      },
    },
  });

  if (!user.guilde) return null;

  const jour = jourCourant();
  let attaquesRestantes = MAX_ATTAQUES_PAR_JOUR;
  let mesDegatsCycle = 0;

  if (user.guilde.boss) {
    const contribution = await prisma.guildBossContribution.findUnique({
      where: {
        bossId_userId_cycle: {
          bossId: user.guilde.boss.id,
          userId,
          cycle: user.guilde.boss.cycle,
        },
      },
    });
    mesDegatsCycle = contribution?.degats ?? 0;
    const attaquesFaites =
      contribution?.dernierJour === jour ? contribution.attaquesAujourdhui : 0;
    attaquesRestantes = Math.max(0, MAX_ATTAQUES_PAR_JOUR - attaquesFaites);
  }

  const classementCycle = user.guilde.boss
    ? await prisma.guildBossContribution.findMany({
        where: { bossId: user.guilde.boss.id, cycle: user.guilde.boss.cycle },
        orderBy: { degats: "desc" },
        take: 10,
        include: { user: { select: { username: true } } },
      })
    : [];

  return {
    id: user.guilde.id,
    name: user.guilde.name,
    leaderId: user.guilde.leaderId,
    estLeader: user.guilde.leaderId === userId,
    membres: user.guilde.membres,
    boss: user.guilde.boss
      ? {
          cycle: user.guilde.boss.cycle,
          vie: Math.max(0, user.guilde.boss.vie),
          vieMax: user.guilde.boss.vieMax,
        }
      : null,
    attaquesRestantes,
    mesDegatsCycle,
    classementCycle: classementCycle.map((c) => ({
      username: c.user.username,
      degats: c.degats,
    })),
  };
}

/** Distribue la récompense de fin de cycle et fait repop un boss plus costaud. */
async function cloturerCycle(
  bossId: string,
  cycleTermine: number,
  nombreMembres: number,
) {
  const contributions = await prisma.guildBossContribution.findMany({
    where: { bossId, cycle: cycleTermine },
  });
  const totalDegats = contributions.reduce((s, c) => s + c.degats, 0);
  const pool = poolRecompenseCycle(nombreMembres);

  const recompensesParUser: { userId: string; or: number }[] =
    totalDegats > 0
      ? contributions.map((c) => ({
          userId: c.userId,
          or: Math.round((c.degats / totalDegats) * pool),
        }))
      : [];

  const boss = await prisma.guildBoss.findUniqueOrThrow({ where: { id: bossId } });
  const nouveauCycle = boss.cycle + 1;
  const nouveauVieMax = vieMaxBoss(nombreMembres, nouveauCycle);

  await prisma.$transaction([
    ...recompensesParUser.map((r) =>
      prisma.user.update({
        where: { id: r.userId },
        data: { currency: { increment: r.or } },
      }),
    ),
    prisma.guildBoss.update({
      where: { id: bossId },
      data: {
        cycle: nouveauCycle,
        vie: nouveauVieMax,
        vieMax: nouveauVieMax,
        cycleTermine: false,
        demarreLe: new Date(),
      },
    }),
  ]);

  return { recompensesParUser, pool };
}

export async function attaquerBossGuilde() {
  const userId = await utilisateurConnecte();

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      personnages: {
        include: {
          equipment: { include: { equipment: true } },
          spells: { include: { spell: true } },
        },
      },
    },
  });
  if (!user.guildeId) throw new Error("Tu n'es dans aucune guilde");
  if (user.personnages.length === 0) throw new Error("Il te faut au moins un personnage");

  const membreCount = await prisma.user.count({ where: { guildeId: user.guildeId } });

  let boss = await prisma.guildBoss.findUnique({ where: { guildId: user.guildeId } });
  if (!boss) {
    boss = await prisma.guildBoss.upsert({
      where: { guildId: user.guildeId },
      create: {
        guildId: user.guildeId,
        vieMax: vieMaxBoss(membreCount, 1),
        vie: vieMaxBoss(membreCount, 1),
      },
      update: {},
    });
  }

  const jour = jourCourant();
  const contribution = await prisma.guildBossContribution.upsert({
    where: { bossId_userId_cycle: { bossId: boss.id, userId, cycle: boss.cycle } },
    create: { bossId: boss.id, userId, cycle: boss.cycle },
    update: {},
  });

  const attaquesFaites =
    contribution.dernierJour === jour ? contribution.attaquesAujourdhui : 0;
  if (attaquesFaites >= MAX_ATTAQUES_PAR_JOUR) {
    throw new Error("Plus d'attaques contre le boss aujourd'hui");
  }

  const puissanceMax = Math.max(
    ...user.personnages.map((p) => puissance(statsEffectives(p))),
  );
  const degats = degatsAttaqueBoss(puissanceMax);

  const [bossMaj] = await prisma.$transaction([
    prisma.guildBoss.update({
      where: { id: boss.id },
      data: { vie: { decrement: degats } },
    }),
    prisma.guildBossContribution.update({
      where: { bossId_userId_cycle: { bossId: boss.id, userId, cycle: boss.cycle } },
      data: {
        degats: { increment: degats },
        attaquesAujourdhui: contribution.dernierJour === jour ? { increment: 1 } : 1,
        dernierJour: jour,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { currency: { increment: OR_PAR_ATTAQUE_BOSS } },
    }),
  ]);

  let recompenseCycle: Awaited<ReturnType<typeof cloturerCycle>> | null = null;

  if (bossMaj.vie <= 0) {
    // Mise à jour conditionnelle : seule la requête qui gagne la course de
    // concurrence voit affectedCount > 0 et distribue la récompense de
    // cycle. Deux membres portant le coup fatal à quelques millisecondes
    // d'écart ne doivent pas déclencher la récompense deux fois.
    const cloture = await prisma.guildBoss.updateMany({
      where: { id: boss.id, cycleTermine: false },
      data: { cycleTermine: true },
    });
    if (cloture.count > 0) {
      recompenseCycle = await cloturerCycle(boss.id, boss.cycle, membreCount);
    }
  }

  revalidatePath("/guilde");

  return {
    degats,
    vieBossApres: Math.max(0, bossMaj.vie),
    vieMaxBoss: bossMaj.vieMax,
    attaquesRestantes: MAX_ATTAQUES_PAR_JOUR - (attaquesFaites + 1),
    bossVaincu: recompenseCycle !== null,
    maRecompenseCycle:
      recompenseCycle?.recompensesParUser.find((r) => r.userId === userId)?.or ?? 0,
  };
}
