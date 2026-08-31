import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Pagination from "@/components/Pagination";
import styles from "./page.module.css";

const PAR_PAGE = 10;

type LigneClassement = {
  id: string;
  name: string;
  sub?: string;
  points: number;
};

async function getClassement1v1(page: number) {
  const [personnages, total] = await Promise.all([
    prisma.personnage.findMany({
      orderBy: { rankPoints: "desc" },
      skip: (page - 1) * PAR_PAGE,
      take: PAR_PAGE,
      include: { owner: { select: { username: true } } },
    }),
    prisma.personnage.count(),
  ]);

  const lignes: LigneClassement[] = personnages.map((p) => ({
    id: p.id,
    name: p.name,
    sub: `par ${p.owner.username}`,
    points: p.rankPoints,
  }));

  return { lignes, total };
}

async function getClassement3v3(page: number) {
  const [utilisateurs, total] = await Promise.all([
    prisma.user.findMany({
      orderBy: { rankPoints3v3: "desc" },
      skip: (page - 1) * PAR_PAGE,
      take: PAR_PAGE,
    }),
    prisma.user.count(),
  ]);

  const lignes: LigneClassement[] = utilisateurs.map((u) => ({
    id: u.id,
    name: u.username,
    points: u.rankPoints3v3,
  }));

  return { lignes, total };
}

export default async function ClassementPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { mode, page } = await searchParams;
  const mode3v3 = mode === "3v3";
  const pageActuelle = page ? Math.max(1, Number(page)) : 1;

  const { lignes, total } = mode3v3
    ? await getClassement3v3(pageActuelle)
    : await getClassement1v1(pageActuelle);

  const totalPages = Math.max(1, Math.ceil(total / PAR_PAGE));
  const offset = (pageActuelle - 1) * PAR_PAGE;

  function construireLien(params: Record<string, string | number>) {
    const qs = new URLSearchParams({
      mode: mode3v3 ? "3v3" : "1v1",
      page: String(pageActuelle),
      ...Object.fromEntries(
        Object.entries(params).map(([k, v]) => [k, String(v)]),
      ),
    });
    return `/classement?${qs.toString()}`;
  }

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

      <div className={styles.list}>
        {lignes.map((ligne, i) => (
          <div key={ligne.id} className={styles.row}>
            <span className={styles.rank}>#{offset + i + 1}</span>
            <div className={styles.info}>
              <span className={styles.name}>{ligne.name}</span>
              {ligne.sub && <span className={styles.owner}>{ligne.sub}</span>}
            </div>
            <span className={styles.points}>{ligne.points} pts</span>
          </div>
        ))}
      </div>

      <Pagination
        page={pageActuelle}
        totalPages={totalPages}
        buildHref={(p) => construireLien({ page: p })}
      />
    </main>
  );
}
