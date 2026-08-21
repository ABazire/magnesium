import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import styles from "../page.module.css";

export default async function CombatResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { id } = await params;

  const fight = await prisma.fight.findUnique({ where: { id } });
  if (!fight) notFound();

  const log = fight.turns as string[];

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Résultat du combat</h1>

      <div className={styles.log}>
        {log.map((ligne, i) => {
          const estDerniereLigne = i === log.length - 1;
          return (
            <p
              key={i}
              className={estDerniereLigne ? styles.logWinner : styles.logLine}
            >
              {ligne}
            </p>
          );
        })}
      </div>
    </main>
  );
}
