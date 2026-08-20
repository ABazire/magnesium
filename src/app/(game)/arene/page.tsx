import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { statsEffectives, puissance } from "@/lib/personnage";
import styles from "./page.module.css";

export default async function ArenePage({
  searchParams,
}: {
  searchParams: Promise<{ mine?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { mine } = await searchParams;

  const mesPersonnages = await prisma.personnage.findMany({
    where: { ownerId: session.user.id },
  });

  let adversaires: { id: string; name: string; puissance: number }[] = [];
  let maPuissance: number | null = null;

  if (mine) {
    const monPersonnage = await prisma.personnage.findUnique({
      where: { id: mine },
      include: { equipment: { include: { equipment: true } } },
    });

    if (monPersonnage) {
      maPuissance = puissance(statsEffectives(monPersonnage));

      const autresPersonnages = await prisma.personnage.findMany({
        where: { ownerId: { not: session.user.id } },
        include: { equipment: { include: { equipment: true } } },
      });

      adversaires = autresPersonnages
        .map((p) => ({
          id: p.id,
          name: p.name,
          puissance: puissance(statsEffectives(p)),
        }))
        .sort(
          (a, b) =>
            Math.abs(a.puissance - maPuissance!) -
            Math.abs(b.puissance - maPuissance!),
        )
        .slice(0, 3);
    }
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Arène</h1>

      <form method="get" className={styles.form}>
        <select
          name="mine"
          className={styles.select}
          defaultValue={mine ?? ""}
          required
        >
          <option value="">Choisis ton personnage</option>
          {mesPersonnages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button type="submit" className={styles.button}>
          Chercher
        </button>
      </form>

      {maPuissance !== null && (
        <p className={styles.puissance}>
          Puissance de ton personnage :{" "}
          <span className={styles.puissanceValue}>{maPuissance}</span>
        </p>
      )}

      {mine && adversaires.length === 0 && (
        <p className={styles.empty}>
          Aucun adversaire trouvé — il faut au moins un autre compte avec un
          personnage.
        </p>
      )}

      <ul className={styles.list}>
        {adversaires.map((adv) => (
          <li key={adv.id} className={styles.item}>
            <span>
              <span className={styles.itemName}>{adv.name}</span>
              <span className={styles.itemPuissance}>
                puissance {adv.puissance}
              </span>
            </span>
            <Link
              href={`/combat?a=${mine}&b=${adv.id}`}
              className={styles.fightLink}
            >
              Combattre
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
