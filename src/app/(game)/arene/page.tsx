import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { statsEffectives, puissance } from "@/lib/personnage";
import { lancerCombat } from "../../actions/combat";
import { lancerCombat3v3 } from "../../actions/combat3v3";
import { debutDeJournee } from "@/lib/date";
import SubmitButton from "@/components/SubmitButton";
import styles from "./page.module.css";

export default async function ArenePage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; mine?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { mode, mine } = await searchParams;
  const mode3v3 = mode === "3v3";

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Arène</h1>
      <div className={styles.panel}>
        {" "}
        <div className={styles.tabs}>
          <Link
            href="/arene?mode=1v1"
            className={!mode3v3 ? styles.tabActive : styles.tab}
          >
            1v1
          </Link>
          <Link
            href="/arene?mode=3v3"
            className={mode3v3 ? styles.tabActive : styles.tab}
          >
            3v3
          </Link>
        </div>
        {mode3v3 ? (
          <Arene3v3 userId={session.user.id} />
        ) : (
          <Arene1v1 userId={session.user.id} mine={mine} />
        )}
      </div>
    </main>
  );
}

async function Arene1v1({ userId, mine }: { userId: string; mine?: string }) {
  const mesPersonnages = await prisma.personnage.findMany({
    where: { ownerId: userId },
  });

  let adversaires: {
    id: string;
    name: string;
    puissance: number;
    rankPoints: number;
    ownerUsername: string;
  }[] = [];
  let maPuissance: number | null = null;

  if (mine) {
    const monPersonnage = await prisma.personnage.findUnique({
      where: { id: mine },
      include: {
        equipment: { include: { equipment: true } },
        spells: { include: { spell: true } },
      },
    });

    if (monPersonnage) {
      maPuissance = puissance(statsEffectives(monPersonnage));

      const [autresPersonnages, combatsDuJour] = await Promise.all([
        prisma.personnage.findMany({
          where: { ownerId: { not: userId } },
          include: {
            equipment: { include: { equipment: true } },
            spells: { include: { spell: true } },
            owner: { select: { username: true } },
          },
        }),
        prisma.fight.findMany({
          where: {
            attackerPersonnageId: mine,
            playedAt: { gte: debutDeJournee() },
          },
          select: { defenderPersonnageId: true },
        }),
      ]);

      const idsDejaAffrontes = new Set(
        combatsDuJour.map((f) => f.defenderPersonnageId),
      );

      adversaires = autresPersonnages
        .filter((p) => !idsDejaAffrontes.has(p.id))
        .map((p) => ({
          id: p.id,
          name: p.name,
          puissance: puissance(statsEffectives(p)),
          rankPoints: p.rankPoints,
          ownerUsername: p.owner.username,
        }))
        .sort(
          (a, b) =>
            Math.abs(a.puissance - maPuissance!) -
            Math.abs(b.puissance - maPuissance!),
        )
        .slice(0, 6);
    }
  }

  return (
    <>
      <form method="get" className={styles.form}>
        <input type="hidden" name="mode" value="1v1" />
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
          Puissance :{" "}
          <span className={styles.puissanceValue}>{maPuissance}</span>
        </p>
      )}

      {mine && adversaires.length === 0 && (
        <p className={styles.empty}>Aucun adversaire trouvé.</p>
      )}

      <ul className={styles.list}>
        {adversaires.map((adv) => (
          <li key={adv.id} className={styles.item}>
            <span>
              <span className={styles.itemName}>{adv.name}</span>
              <span className={styles.itemOwner}>par {adv.ownerUsername}</span>
              <span className={styles.itemPuissance}>
                puissance {adv.puissance} · {adv.rankPoints} pts
              </span>
            </span>
            <form action={lancerCombat}>
              <input type="hidden" name="a" value={mine} />
              <input type="hidden" name="b" value={adv.id} />
              <SubmitButton className={styles.fightLink}>
                Combattre
              </SubmitButton>
            </form>
          </li>
        ))}
      </ul>
    </>
  );
}

async function Arene3v3({ userId }: { userId: string }) {
  const moi = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const monEquipe = await prisma.personnage.count({
    where: { ownerId: userId, inTeam: true },
  });

  if (monEquipe !== 3) {
    return (
      <p className={styles.empty}>
        Il te faut une équipe complète de 3 personnages pour accéder au 3v3.
      </p>
    );
  }

  const autresJoueurs = await prisma.user.findMany({
    where: { id: { not: userId }, personnages: { some: { inTeam: true } } },
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
    <>
      <p className={styles.puissance}>
        Ton classement 3v3 :{" "}
        <span className={styles.puissanceValue}>{moi.rankPoints3v3} pts</span>
      </p>

      <ul className={styles.list}>
        {adversaires.map((adv) => (
          <li key={adv.id} className={styles.item}>
            <span>
              <span className={styles.itemName}>{adv.username}</span>
              <span className={styles.itemOwner}>
                {adv.personnages
                  .map((p) => `${p.name} (${"★".repeat(p.rarity?.stars ?? 0)})`)
                  .join(" · ")}
              </span>
              <span className={styles.itemPuissance}>
                {adv.rankPoints3v3} pts
              </span>
            </span>
            <form action={lancerCombat3v3.bind(null, adv.id)}>
              <SubmitButton className={styles.fightLink}>
                Combattre
              </SubmitButton>
            </form>
          </li>
        ))}
      </ul>
    </>
  );
}
