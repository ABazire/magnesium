"use client";

import { useState } from "react";
import Link from "next/link";
import { statsEffectives } from "@/lib/personnage";
import { PersonnageIcon, HeartIcon } from "@/components/pixel";
import styles from "./page.module.css";

import type { Prisma } from "@prisma/client";

type PersonnageAvecRelations = Prisma.PersonnageGetPayload<{
  include: { rarity: true; equipment: { include: { equipment: true } } };
}>;

export default function JouerClient({
  equipe,
}: {
  equipe: PersonnageAvecRelations[];
}) {
  const [selectionneId, setSelectionneId] = useState<string | null>(
    equipe[0]?.id ?? null,
  );
  const selectionne = equipe.find((p) => p.id === selectionneId);

  return (
    <main className={styles.page}>
      <h2 className={styles.sectionTitle}>Mon équipe</h2>

      <div className={styles.teamRow}>
        {equipe.map((p) => {
          const stats = statsEffectives(p);
          const pctVie = 100; // vie max = vie actuelle pour l'instant, pas de dégâts persistés hors combat
          return (
            <button
              key={p.id}
              onClick={() => setSelectionneId(p.id)}
              className={`${styles.teamCard} ${p.id === selectionneId ? styles.teamCardActive : ""}`}
            >
              <PersonnageIcon size={40} couleur="#10b981" />
              <span className={styles.cardName}>{p.name.toUpperCase()}</span>
              <span className={styles.stars}>
                {"★".repeat(p.rarity?.stars ?? 0)}
              </span>
              <div className={styles.hpBarTrack}>
                <div
                  className={styles.hpBarFill}
                  style={{ width: `${pctVie}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      <Link href="/collection" className={styles.collectionButton}>
        Collection
      </Link>

      {selectionne && (
        <div className={styles.detailPanel}>
          <div className={styles.detailLeft}>
            <PersonnageIcon size={120} couleur="#10b981" />
          </div>
          <div className={styles.detailRight}>
            <span className={styles.detailName}>
              {selectionne.name.toUpperCase()}
            </span>
            <span className={styles.stars}>
              {"★".repeat(selectionne.rarity?.stars ?? 0)}
            </span>
            <div className={styles.hpBarTrack}>
              <div className={styles.hpBarFill} style={{ width: "100%" }} />
              <span className={styles.hpLabel}>
                PV {statsEffectives(selectionne).vie}
              </span>
            </div>

            <span className={styles.subLabel}>Équipement</span>
            <div className={styles.slotGrid}>
              {["ARME", "ARMURE", "BOTTES", "AMULETTE"].map((slot) => {
                const objet = selectionne.equipment.find(
                  (e) => e.slot === slot,
                );
                return (
                  <div key={slot} className={styles.slot}>
                    {objet ? (
                      <span className={styles.slotFilled}>
                        {objet.equipment.name}
                      </span>
                    ) : (
                      <span className={styles.slotEmpty}>+</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
