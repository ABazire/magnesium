"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ComponentType } from "react";
import type { Prisma } from "@prisma/client";
import { statsEffectives, puissance } from "@/lib/personnage";
import {
  PersonnageIcon,
  SwordIcon,
  BootsIcon,
  ArmorIcon,
  AmuletIcon,
  HeartIcon,
  ChestIcon,
} from "@/components/pixel";
import { toggleEquipe } from "../../actions/equipe";
import styles from "./page.module.css";

type PersonnageAvecRelations = Prisma.PersonnageGetPayload<{
  include: { rarity: true; equipment: { include: { equipment: true } } };
}>;

const SLOTS = ["ARME", "ARMURE", "BOTTES", "AMULETTE"];

const ICONE_SLOT: Record<string, ComponentType<{ size?: number }>> = {
  ARME: SwordIcon,
  ARMURE: ArmorIcon,
  BOTTES: BootsIcon,
  AMULETTE: AmuletIcon,
};

export default function CollectionClient({
  personnages,
}: {
  personnages: PersonnageAvecRelations[];
}) {
  const router = useRouter();
  const [selectionneId, setSelectionneId] = useState<string | null>(
    personnages[0]?.id ?? null,
  );
  const [enCours, setEnCours] = useState(false);

  const selectionne = personnages.find((p) => p.id === selectionneId);
  const stats = selectionne ? statsEffectives(selectionne) : null;

  const COLONNES = 8;
  const cellulesVides = (COLONNES - (personnages.length % COLONNES)) % COLONNES;

  async function basculerEquipe() {
    if (!selectionne) return;
    setEnCours(true);
    try {
      await toggleEquipe(selectionne.id);
      router.refresh();
    } finally {
      setEnCours(false);
    }
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Collection</h1>
      <div className={styles.layout}>
        <div className={styles.grid}>
          {personnages.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectionneId(p.id)}
              className={`${styles.card} ${p.id === selectionneId ? styles.cardSelected : ""}`}
              style={{
                background: `linear-gradient(160deg, ${p.color}bb, ${p.color}55)`,
                borderColor: p.color,
              }}
            >
              <span className={styles.cardLabel}>
                {p.name.toUpperCase()}{" "}
                <span className={styles.cardLevel}>NIV. {p.level}</span>
              </span>
              <PersonnageIcon size={75} couleur={p.color} variant={p.spriteId} />
              <span className={styles.cardStars}>
                {"★".repeat(p.rarity?.stars ?? 0)}
              </span>
              {p.inTeam && <span className={styles.inTeamBadge}>✓</span>}
            </button>
          ))}

          {Array.from({ length: cellulesVides }).map((_, i) => (
            <div key={`vide-${i}`} className={styles.cardEmpty} />
          ))}
        </div>

        <aside className={styles.details}>
          {selectionne && stats ? (
            <>
              <div className={styles.detailHead}>
                <PersonnageIcon
                  size={110}
                  couleur={selectionne.color}
                  variant={selectionne.spriteId}
                />
                <span className={styles.detailName}>
                  {selectionne.name.toUpperCase()}
                </span>
                <span className={styles.detailLevel}>
                  NIVEAU {selectionne.level}
                </span>
                <span className={styles.stars}>
                  {"★".repeat(selectionne.rarity?.stars ?? 0)}
                </span>
              </div>

              <div className={styles.statContainer}>
                <p>
                  <HeartIcon size={16} /> Vie: {stats.vie}
                </p>
                <p>
                  <SwordIcon size={16} /> Force: {stats.force}
                </p>
                <p>
                  <BootsIcon size={16} /> Vitesse: {stats.vitesse}
                </p>
                <p>
                  <ArmorIcon size={16} /> Résistance: {stats.resistance}
                </p>
                <p>
                  <AmuletIcon size={16} /> Agilité: {stats.agilite}
                </p>
              </div>

              <span className={styles.subLabel}>
                Puissance: {puissance(stats)}
              </span>

              <button
                type="button"
                onClick={basculerEquipe}
                disabled={enCours}
                className={styles.positionButton}
              >
                {selectionne.inTeam ? "Retirer de l'équipe" : "Ajouter à l'équipe"}
              </button>

              <span className={styles.subLabel}>Équipement</span>
              <div className={styles.slotGrid}>
                {SLOTS.map((slot) => {
                  const lien = selectionne.equipment.find(
                    (e) => e.slot === slot,
                  );
                  const IconeObjet = ICONE_SLOT[slot] ?? ChestIcon;

                  return (
                    <div key={slot} className={styles.slot}>
                      {lien ? (
                        <>
                          <IconeObjet size={28} />
                          <span className={styles.slotFilled}>
                            {lien.equipment.name}
                          </span>
                        </>
                      ) : (
                        <span className={styles.slotEmpty}>+</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <span className={styles.detailEmpty}>
              Sélectionnez un personnage
            </span>
          )}
        </aside>
      </div>
    </main>
  );
}
