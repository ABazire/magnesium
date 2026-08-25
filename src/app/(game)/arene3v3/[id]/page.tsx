import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import type { CombatEvent3v3, PersonnageCombat3v3 } from "@/lib/combatEquipe";
import styles from "../page.module.css";

export default async function ResultatCombat3v3Page({
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
  const events = fight.events as CombatEvent3v3[];

  const pvFinal: Record<string, number> = {};
  for (const p of [...fightersA, ...fightersB]) pvFinal[p.id] = p.vie;
  for (const ev of events) {
    if (ev.type === "hit") pvFinal[ev.defenderId] = ev.defenderHpAfter;
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Résultat 3v3</h1>

      <div className={styles.teamsGrid}>
        <div>
          <h3 className={styles.teamLabel}>Équipe A</h3>
          {fightersA.map((p) => (
            <p
              key={p.id}
              className={pvFinal[p.id] > 0 ? styles.aliveLine : styles.deadLine}
            >
              {p.name} ({p.row}) — {pvFinal[p.id]}/{p.vie} PV
            </p>
          ))}
        </div>
        <div>
          <h3 className={styles.teamLabel}>Équipe B</h3>
          {fightersB.map((p) => (
            <p
              key={p.id}
              className={pvFinal[p.id] > 0 ? styles.aliveLine : styles.deadLine}
            >
              {p.name} ({p.row}) — {pvFinal[p.id]}/{p.vie} PV
            </p>
          ))}
        </div>
      </div>

      <p className={styles.winnerBanner}>
        {fight.winnerSide === "A" ? "Équipe A" : "Équipe B"} remporte le combat
        !
      </p>
    </main>
  );
}
