import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import TeamVsTeamViewer from "@/components/TeamVsTeamViewer";
import type { CombatEvent3v3, PersonnageCombat3v3 } from "@/lib/combatEquipe";
import styles from "./page.module.css";

export default async function TeamFightResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { id } = await params;
  const fight = await prisma.teamFight.findUnique({ where: { id } });
  if (!fight) notFound();

  const fightersA = fight.fightersA as PersonnageCombat3v3[];
  const fightersB = fight.fightersB as PersonnageCombat3v3[];
  const tousLesIds = [...fightersA, ...fightersB].map((f) => f.id);

  const [attaquant, defenseur, personnages] = await Promise.all([
    prisma.user.findUnique({ where: { id: fight.attackerUserId } }),
    prisma.user.findUnique({ where: { id: fight.defenderUserId } }),
    prisma.personnage.findMany({ where: { id: { in: tousLesIds } } }),
  ]);

  const personnageParId = new Map(personnages.map((p) => [p.id, p]));

  function versFighter(f: PersonnageCombat3v3) {
    const p = personnageParId.get(f.id);
    return {
      id: f.id,
      name: f.name,
      vieMax: f.vie,
      manaMax: f.manaMax ?? 0,
      color: p?.color,
      spriteId: p?.spriteId,
    };
  }

  const events = fight.events as CombatEvent3v3[];

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Combat d’équipe</h1>
      <TeamVsTeamViewer
        equipeA={fightersA.map(versFighter)}
        equipeB={fightersB.map(versFighter)}
        nomA={attaquant?.username ?? "?"}
        nomB={defenseur?.username ?? "?"}
        events={events}
        winnerSide={fight.winnerSide === "A" ? "A" : "B"}
      />
    </main>
  );
}
