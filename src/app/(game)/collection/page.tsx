import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { statsEffectives } from "@/lib/personnage";
import { toggleEquipe } from "../../actions/equipe";
import {
  PersonnageIcon,
  HeartIcon,
  SwordIcon,
  BootsIcon,
  ArmorIcon,
  AmuletIcon,
} from "@/components/pixel";
import styles from "./page.module.css";

export default async function CollectionPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const personnages = await prisma.personnage.findMany({
    where: { ownerId: session.user.id },
    orderBy: { id: "desc" },
    include: { rarity: true, equipment: { include: { equipment: true } } },
  });

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Collection</h1>
      <div className={styles.grid}>
        {personnages.map((p) => {
          const stats = statsEffectives(p);
          return (
            <div key={p.id} className={styles.card}>
              <PersonnageIcon size={48} couleur="#10b981" />
              <span className={styles.cardName}>{p.name}</span>
              <span className={styles.stars}>
                {"★".repeat(p.rarity?.stars ?? 0)}
              </span>
              <div className={styles.statRow}>
                <span className={styles.statChip}>
                  <HeartIcon size={14} /> {stats.vie}
                </span>
                <span className={styles.statChip}>
                  <SwordIcon size={14} /> {stats.force}
                </span>
                <span className={styles.statChip}>
                  <BootsIcon size={14} /> {stats.vitesse}
                </span>
                <span className={styles.statChip}>
                  <ArmorIcon size={14} /> {stats.resistance}
                </span>
                <span className={styles.statChip}>
                  <AmuletIcon size={14} /> {stats.agilite}
                </span>
              </div>
              <form
                action={async () => {
                  "use server";
                  await toggleEquipe(p.id);
                }}
              >
                <button
                  type="submit"
                  className={p.inTeam ? styles.inTeamButton : styles.addButton}
                >
                  {p.inTeam ? "Dans l'équipe" : "Ajouter à l'équipe"}
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </main>
  );
}
