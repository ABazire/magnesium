import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

export default async function ClassementPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { mode } = await searchParams;
  const mode3v3 = mode === "3v3";

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Classement</h1>

      <div className={styles.tabs}>
        <Link
          href="/classement?mode=1v1"
          className={!mode3v3 ? styles.tabActive : styles.tab}
        >
          1v1
        </Link>
        <Link
          href="/classement?mode=3v3"
          className={mode3v3 ? styles.tabActive : styles.tab}
        >
          3v3
        </Link>
      </div>

      {mode3v3 ? <Classement3v3 /> : <Classement1v1 />}
    </main>
  );
}

async function Classement1v1() {
  const top = await prisma.personnage.findMany({
    orderBy: { rankPoints: "desc" },
    take: 50,
    include: { owner: { select: { username: true } } },
  });

  return (
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
  );
}

async function Classement3v3() {
  const top = await prisma.user.findMany({
    orderBy: { rankPoints3v3: "desc" },
    take: 50,
  });

  return (
    <div className={styles.list}>
      {top.map((u, i) => (
        <div key={u.id} className={styles.row}>
          <span className={styles.rank}>#{i + 1}</span>
          <div className={styles.info}>
            <span className={styles.name}>{u.username}</span>
          </div>
          <span className={styles.points}>{u.rankPoints3v3} pts</span>
        </div>
      ))}
    </div>
  );
}
