import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { statsEffectives } from "@/lib/personnage";
import { toggleEquipe } from "../../actions/equipe";
import { PersonnageIcon } from "@/components/pixel";
import styles from "./page.module.css";

export default async function CollectionPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const personnages = await prisma.personnage.findMany({
    where: { ownerId: session.user.id },
    orderBy: { id: "desc" },
    include: { rarity: true, equipment: { include: { equipment: true } } },
  });

  const COLONNES = 8;
  const cellulesVides = (COLONNES - (personnages.length % COLONNES)) % COLONNES;

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Collection</h1>
      <div className={styles.grid}>
        {personnages.map((p) => {
          const stats = statsEffectives(p);
          return (
            <form
              key={p.id}
              action={async () => {
                "use server";
                await toggleEquipe(p.id);
              }}
              className={styles.cardForm}
            >
              <button
                type="submit"
                className={styles.card}
                style={{
                  background: `linear-gradient(160deg, ${p.color}bb, ${p.color}55)`,
                  borderColor: p.color,
                }}
              >
                <span className={styles.cardLabel}>
                  {p.name.toUpperCase()}{" "}
                  <span className={styles.cardLevel}>NIV. {p.level}</span>
                </span>
                <PersonnageIcon
                  size={48}
                  couleur={p.color}
                  variant={p.spriteId}
                />
                <span className={styles.cardStars}>
                  {"★".repeat(p.rarity?.stars ?? 0)}
                </span>
                {p.inTeam && <span className={styles.inTeamBadge}>✓</span>}
              </button>
            </form>
          );
        })}

        {Array.from({ length: cellulesVides }).map((_, i) => (
          <div key={`vide-${i}`} className={styles.cardEmpty} />
        ))}
      </div>
    </main>
  );
}
