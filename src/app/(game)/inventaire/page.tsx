import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ComponentType } from "react";
import {
  SwordIcon,
  ArmorIcon,
  BootsIcon,
  AmuletIcon,
  ChestIcon,
} from "@/components/pixel";
import { desequiperObjet } from "../../actions/equiper";
import styles from "./page.module.css";

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

export default async function InventairePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const equipements = await prisma.equipment.findMany({
    where: { ownerId: session.user.id },
    orderBy: { id: "desc" },
    include: { rarity: true, equippedOn: { include: { personnage: true } } },
  });

  const COLONNES = 8;
  const cellulesVides = (COLONNES - (equipements.length % COLONNES)) % COLONNES;

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Inventaire</h1>
      <div className={styles.grid}>
        {equipements.map((e) => {
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
    </main>
  );
}
