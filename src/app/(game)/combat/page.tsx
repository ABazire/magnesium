import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { simulerCombat } from "@/lib/combat";
import { statsEffectives } from "@/lib/personnage";
import styles from "./page.module.css";

export default async function CombatPage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { a, b } = await searchParams;

  const mesPersonnages = await prisma.personnage.findMany({
    where: { ownerId: session.user.id },
  });

  let resultat: { log: string[]; winnerId: string } | null = null;

  if (a && b && a !== b) {
    const [perso1, perso2] = await Promise.all([
      prisma.personnage.findUnique({
        where: { id: a },
        include: { equipment: { include: { equipment: true } } },
      }),
      prisma.personnage.findUnique({
        where: { id: b },
        include: { equipment: { include: { equipment: true } } },
      }),
    ]);

    if (perso1 && perso2) {
      const combat1 = {
        id: perso1.id,
        name: perso1.name,
        ...statsEffectives(perso1),
      };
      const combat2 = {
        id: perso2.id,
        name: perso2.name,
        ...statsEffectives(perso2),
      };
      resultat = simulerCombat(combat1, combat2);
    }
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Combat</h1>

      <form method="get" className={styles.form}>
        <select
          name="a"
          className={styles.select}
          required
          defaultValue={a ?? ""}
        >
          <option value="">Choisir le personnage 1</option>
          {mesPersonnages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          name="b"
          defaultValue={b ?? ""}
          placeholder="Id de l'adversaire"
          className={styles.textInput}
          required
        />

        <button type="submit" className={styles.button}>
          Lancer le combat
        </button>
      </form>

      {resultat && (
        <div className={styles.log}>
          {resultat.log.map((ligne, i) => {
            const estDerniereLigne = i === resultat.log.length - 1;
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
      )}
    </main>
  );
}
