import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import styles from "../classement/page.module.css";

export default async function Classement3v3Page() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const top = await prisma.user.findMany({
    orderBy: { rankPoints3v3: "desc" },
    take: 50,
  });

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Classement 3v3</h1>
      <div className={styles.list}>
        {top.map((u, i) => (
          <div key={u.id} className={styles.row}>
            <span className={styles.rank}>#{i + 1}</span>
            <span className={styles.name}>{u.username}</span>
            <span className={styles.points}>{u.rankPoints3v3} pts</span>
          </div>
        ))}
      </div>
    </main>
  );
}
