import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { creerPersonnage } from "../../actions/personnage";
import { equiperObjet } from "../../actions/equiper";
import styles from "./page.module.css";

export default async function JouerPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const personnages = await prisma.personnage.findMany({
    where: { ownerId: session.user.id },
    orderBy: { id: "desc" },
    include: { rarity: true },
  });

  const equipments = await prisma.equipment.findMany({
    where: { ownerId: session.user.id },
    include: { equippedOn: true, rarity: true },
  });

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Magnesium</h1>

      <form action={creerPersonnage} className={styles.createForm}>
        <input
          type="text"
          name="name"
          placeholder="Nom du personnage"
          className={styles.input}
          required
        />
        <button type="submit" className={styles.button}>
          Créer
        </button>
      </form>

      <h2 className={styles.sectionTitle}>Mes personnages</h2>
      <div className={styles.grid}>
        {personnages.map((p) => (
          <div key={p.id} className={styles.card}>
            <span className={styles.cardName}>{p.name}</span>
            <span className={styles.stars}>{"★".repeat(p.rarity.stars)}</span>
            <div className={styles.statRow}>
              <span className={`${styles.statChip} ${styles.statVie}`}>
                ♥ {p.vie}
              </span>
              <span className={`${styles.statChip} ${styles.statForce}`}>
                ⚔ {p.force}
              </span>
              <span className={`${styles.statChip} ${styles.statVitesse}`}>
                ➤ {p.vitesse}
              </span>
              <span className={`${styles.statChip} ${styles.statResistance}`}>
                🛡 {p.resistance}
              </span>
              <span className={`${styles.statChip} ${styles.statAgilite}`}>
                ✦ {p.agilite}
              </span>
            </div>
          </div>
        ))}
      </div>

      <h2 className={styles.sectionTitle}>Équipements</h2>
      <div className={styles.equipList}>
        {equipments.map((e) => (
          <div key={e.id} className={styles.equipItem}>
            <div>
              <span className={styles.equipName}>
                {"★".repeat(e.rarity.stars)} {e.name}
              </span>
              <span className={styles.equipBonus}>
                +{e.bonusValue} {e.bonusStat}
              </span>
              {e.equippedOn && (
                <span className={styles.equippedBadge}>équipé</span>
              )}
            </div>

            <form
              action={async (formData) => {
                "use server";
                const personnageId = formData.get("personnageId") as string;
                await equiperObjet(personnageId, e.id);
              }}
              className={styles.equipForm}
            >
              <select name="personnageId" className={styles.select} required>
                <option value="">Sur qui ?</option>
                {personnages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button type="submit" className={styles.equipButton}>
                Équiper
              </button>
            </form>
          </div>
        ))}
      </div>
    </main>
  );
}
