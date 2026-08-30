import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ComponentType } from "react";
import Link from "next/link";
import {
  SwordIcon,
  ArmorIcon,
  BootsIcon,
  AmuletIcon,
  ChestIcon,
} from "@/components/pixel";
import { desequiperObjet } from "../../actions/equiper";
import styles from "./page.module.css";

const PAR_PAGE = 24;

const ICONE_SLOT: Record<string, ComponentType<{ size?: number }>> = {
  ARME: SwordIcon,
  ARMURE: ArmorIcon,
  BOTTES: BootsIcon,
  AMULETTE: AmuletIcon,
};

const RARITY_COLORS: Record<number, string> = {
  1: "#9db3aa",
  2: "#7fd9c4",
  3: "#5cc8ff",
  4: "#c792ea",
  5: "#ff9d81",
  6: "#f2c94c",
};

const SLOTS = ["ARME", "ARMURE", "BOTTES", "AMULETTE"];

export default async function InventairePage({
  searchParams,
}: {
  searchParams: Promise<{ minStars?: string; slot?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { minStars, slot, page } = await searchParams;
  const minStarsNum = minStars ? Number(minStars) : 0;
  const pageActuelle = page ? Math.max(1, Number(page)) : 1;

  const tousLesEquipements = await prisma.equipment.findMany({
    where: { ownerId: session.user.id },
    orderBy: { id: "desc" },
    include: { rarity: true, equippedOn: { include: { personnage: true } } },
  });

  let filtres = tousLesEquipements.filter(
    (e) => (e.rarity?.stars ?? 0) >= minStarsNum,
  );
  if (slot) {
    filtres = filtres.filter((e) => e.slot === slot);
  }

  const totalPages = Math.max(1, Math.ceil(filtres.length / PAR_PAGE));
  const debut = (pageActuelle - 1) * PAR_PAGE;
  const equipementsPage = filtres.slice(debut, debut + PAR_PAGE);

  const COLONNES = 8;
  const cellulesVides =
    (COLONNES - (equipementsPage.length % COLONNES)) % COLONNES;

  function construireLien(params: Record<string, string | number>) {
    const q = new URLSearchParams({
      minStars: String(minStarsNum),
      ...(slot ? { slot } : {}),
      page: String(pageActuelle),
      ...Object.fromEntries(
        Object.entries(params).map(([k, v]) => [k, String(v)]),
      ),
    });
    return `/inventaire?${q.toString()}`;
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Inventaire</h1>

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
          <span className={styles.filterLabel}>Emplacement</span>
          <div className={styles.filterOptions}>
            <Link
              href={construireLien({ slot: "", page: 1 })}
              className={!slot ? styles.filterActive : styles.filterOption}
            >
              Tous
            </Link>
            {SLOTS.map((s) => (
              <Link
                key={s}
                href={construireLien({ slot: s, page: 1 })}
                className={
                  slot === s ? styles.filterActive : styles.filterOption
                }
              >
                {s}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        {equipementsPage.map((e) => {
          const couleur = RARITY_COLORS[e.rarity?.stars ?? 1];
          const Icone = ICONE_SLOT[e.slot] ?? ChestIcon;
          const estEquipe = !!e.equippedOn;

          const carte = (
            <div
              className={styles.card}
              style={{
                background: `linear-gradient(160deg, ${couleur}bb, ${couleur}55)`,
                borderColor: couleur,
              }}
            >
              <span className={styles.cardLabel}>{e.name.toUpperCase()}</span>
              <Icone size={40} />
              <span className={styles.cardBonus}>
                +{e.bonusValue} {e.bonusStat}
              </span>
              <span className={styles.cardStars}>
                {"★".repeat(e.rarity?.stars ?? 0)}
              </span>
              {estEquipe && (
                <span className={styles.equippedBadge}>
                  {e.equippedOn!.personnage.name}
                </span>
              )}
            </div>
          );

          if (!estEquipe) {
            return (
              <div key={e.id} className={styles.cardWrapper}>
                {carte}
              </div>
            );
          }

          return (
            <form
              key={e.id}
              action={async () => {
                "use server";
                await desequiperObjet(e.id);
              }}
            >
              <button type="submit" className={styles.cardButton}>
                {carte}
              </button>
            </form>
          );
        })}

        {Array.from({ length: cellulesVides }).map((_, i) => (
          <div key={`vide-${i}`} className={styles.cardEmpty} />
        ))}
      </div>

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
