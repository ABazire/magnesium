import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import styles from "./page.module.css";

export default async function ClassementPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const top = await prisma.personnage.findMany({
    orderBy: { rankPoints: "desc" },
    take: 50,
    include: { owner: { select: { username: true } }, rarity: true },
  });

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Classement</h1>
      <div className={styles.list}>
        {top.map((p, i) => (
          <div key={p.id} className={styles.row}>
            <span className={styles.rank}>#{i + 1}</span>
            <div className={styles.info}>
              <span className={styles.name}>{p.name}</span>
              <span className={styles.owner}>par {p.owner.username}</span>
            </div>
            <span className={styles.points}>{p.rankPoints} pts</span>
          </div>
        ))}
      </div>
    </main>
  );
}
