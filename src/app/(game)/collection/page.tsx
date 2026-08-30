import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { statsEffectives } from "@/lib/personnage";
import { toggleEquipe } from "../../actions/equipe";
import { PersonnageIcon } from "@/components/pixel";
import Link from "next/link";
import styles from "./page.module.css";
import CollectionClient from "./CollectionClient";

const PAR_PAGE = 24;
const TRIS = [
  { value: "force", label: "Force" },
  { value: "vitesse", label: "Vitesse" },
  { value: "resistance", label: "Résistance" },
  { value: "agilite", label: "Agilité" },
];

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<{ minStars?: string; tri?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { minStars, tri, page } = await searchParams;
  const minStarsNum = minStars ? Number(minStars) : 0;
  const pageActuelle = page ? Math.max(1, Number(page)) : 1;

  const tousLesPersonnages = await prisma.personnage.findMany({
    where: { ownerId: session.user.id },
    include: { rarity: true, equipment: { include: { equipment: true } } },
  });

  let filtres = tousLesPersonnages.filter(
    (p) => (p.rarity?.stars ?? 0) >= minStarsNum,
  );

  if (tri) {
    filtres = filtres
      .map((p) => ({ p, stats: statsEffectives(p) }))
      .sort(
        (a, b) =>
          b.stats[tri as keyof ReturnType<typeof statsEffectives>] -
          a.stats[tri as keyof ReturnType<typeof statsEffectives>],
      )
      .map(({ p }) => p);
  }

  const totalPages = Math.max(1, Math.ceil(filtres.length / PAR_PAGE));
  const debut = (pageActuelle - 1) * PAR_PAGE;
  const personnagesPage = filtres.slice(debut, debut + PAR_PAGE);

  const COLONNES = 8;
  const cellulesVides =
    (COLONNES - (personnagesPage.length % COLONNES)) % COLONNES;

  function construireLien(params: Record<string, string | number>) {
    const q = new URLSearchParams({
      minStars: String(minStarsNum),
      ...(tri ? { tri } : {}),
      page: String(pageActuelle),
      ...Object.fromEntries(
        Object.entries(params).map(([k, v]) => [k, String(v)]),
      ),
    });
    return `/collection?${q.toString()}`;
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Collection</h1>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Étoiles min.</span>
          <div className={styles.filterOptions}>
            {[0, 1, 2, 3, 4, 5, 6].map((n) => (
              <Link
                key={n}
                href={construireLien({ minStars: n, page: 1 })}
                className={
                  minStarsNum === n ? styles.filterActive : styles.filterOption
                }
              >
                {n === 0 ? "Tous" : `${n}★+`}
              </Link>
            ))}
          </div>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Trier par</span>
          <div className={styles.filterOptions}>
            <Link
              href={construireLien({ tri: "", page: 1 })}
              className={!tri ? styles.filterActive : styles.filterOption}
            >
              Aucun
            </Link>
            {TRIS.map((t) => (
              <Link
                key={t.value}
                href={construireLien({ tri: t.value, page: 1 })}
                className={
                  tri === t.value ? styles.filterActive : styles.filterOption
                }
              >
                {t.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <CollectionClient
        personnages={personnagesPage}
        cellulesVides={cellulesVides}
      />

      {totalPages > 1 && (
        <div className={styles.pagination}>
          {Array.from({ length: totalPages }).map((_, i) => {
            const num = i + 1;
            return (
              <Link
                key={num}
                href={construireLien({ page: num })}
                className={
                  pageActuelle === num ? styles.pageActive : styles.pageLink
                }
              >
                {num}
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
