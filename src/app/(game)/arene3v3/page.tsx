import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { lancerCombat3v3 } from "../../actions/combat3v3";
import styles from "./page.module.css";

export default async function Arene3v3Page() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const moi = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
  });
  const monEquipe = await prisma.personnage.count({
    where: { ownerId: session.user.id, inTeam: true },
  });

  if (monEquipe !== 3) {
    return (
      <main className={styles.page}>
        <h1 className={styles.title}>Arène 3v3</h1>
        <p className={styles.empty}>
          Il te faut une équipe complète de 3 personnages pour accéder au 3v3.
        </p>
      </main>
    );
  }

  const autresJoueurs = await prisma.user.findMany({
    where: {
      id: { not: session.user.id },
      personnages: { some: { inTeam: true } },
    },
    include: {
      personnages: { where: { inTeam: true }, include: { rarity: true } },
    },
  });

  const adversaires = autresJoueurs
    .filter((u) => u.personnages.length === 3)
    .sort(
      (a, b) =>
        Math.abs(a.rankPoints3v3 - moi.rankPoints3v3) -
        Math.abs(b.rankPoints3v3 - moi.rankPoints3v3),
    )
    .slice(0, 3);

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Arène 3v3</h1>
      <p className={styles.rank}>
        Ton classement 3v3 : <strong>{moi.rankPoints3v3} pts</strong>
      </p>

      <ul className={styles.list}>
        {adversaires.map((adv) => (
          <li key={adv.id} className={styles.item}>
            <div className={styles.itemInfo}>
              <span className={styles.itemName}>{adv.username}</span>
              <span className={styles.itemTeam}>
                {adv.personnages
                  .map((p) => `${p.name} (${"★".repeat(p.rarity?.stars ?? 0)})`)
                  .join(" · ")}
              </span>
              <span className={styles.itemRank}>{adv.rankPoints3v3} pts</span>
            </div>
            <form action={lancerCombat3v3.bind(null, adv.id)}>
              <button type="submit" className={styles.fightButton}>
                Combattre
              </button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
