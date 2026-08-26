"use client";

import { ComponentType, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { statsEffectives } from "@/lib/personnage";
import {
  AmuletIcon,
  ArmorIcon,
  BootsIcon,
  ChestIcon,
  PersonnageIcon,
  SwordIcon,
} from "@/components/pixel";
import {
  equiperObjet,
  desequiperObjet,
  getEquipementsDisponibles,
} from "../../actions/equiper";
import type { Prisma } from "@prisma/client";
import styles from "./page.module.css";
import { definirFormation } from "../../actions/equipe";
import { xpRequisePourNiveauSuivant, niveauMax } from "@/lib/leveling";

type PersonnageAvecRelations = Prisma.PersonnageGetPayload<{
  include: { rarity: true; equipment: { include: { equipment: true } } };
}>;

type EquipementDisponible = {
  id: string;
  name: string;
  bonusValue: number;
  bonusStat: string;
  rarity: { stars: number };
};

const SLOTS = ["ARME", "ARMURE", "BOTTES", "AMULETTE"];

const TAILLE_EQUIPE = 3;

export default function JouerClient({
  equipe,
}: {
  equipe: PersonnageAvecRelations[];
}) {
  const router = useRouter();
  const [selectionneId, setSelectionneId] = useState<string | null>(
    equipe[0]?.id ?? null,
  );
  const [slotOuvert, setSlotOuvert] = useState<string | null>(null);
  const [disponibles, setDisponibles] = useState<EquipementDisponible[]>([]);
  const [chargement, setChargement] = useState(false);

  const selectionne = equipe.find((p) => p.id === selectionneId);
  const stats = selectionne ? statsEffectives(selectionne) : null;

  async function ouvrirSlot(slot: string) {
    if (slotOuvert === slot) {
      setSlotOuvert(null);
      return;
    }
    setSlotOuvert(slot);
    setChargement(true);
    const data = await getEquipementsDisponibles(slot);
    setDisponibles(data);
    setChargement(false);
  }

  async function equiper(equipmentId: string) {
    if (!selectionne) return;
    await equiperObjet(selectionne.id, equipmentId);
    setSlotOuvert(null);
    router.refresh();
  }

  async function desequiper(equipmentId: string) {
    await desequiperObjet(equipmentId);
    router.refresh();
  }

  const ICONE_SLOT: Record<string, ComponentType<{ size?: number }>> = {
    ARME: SwordIcon,
    ARMURE: ArmorIcon,
    BOTTES: BootsIcon,
    AMULETTE: AmuletIcon,
  };

  return (
    <main className={styles.page}>
      <h2 className={styles.sectionTitle}>Mon équipe</h2>

      <div className={styles.teamRow}>
        {Array.from({ length: TAILLE_EQUIPE }).map((_, i) => {
          const p = equipe[i];

          if (!p) {
            return (
              <Link
                key={`vide-${i}`}
                href="/collection"
                className={styles.teamSlotEmpty}
              >
                <span className={styles.emptyPlus}>+</span>
                <span className={styles.emptyLabel}>Ajouter</span>
              </Link>
            );
          }

          const maxP = niveauMax(p.rarity?.stars ?? 1);
          const auMaxP = p.level >= maxP;
          const xpRequiseP = xpRequisePourNiveauSuivant(p.level);

          return (
            <div
              key={p.id}
              onClick={() => {
                setSelectionneId(p.id);
                setSlotOuvert(null);
              }}
              className={`${styles.teamCard} ${
                p.id === selectionneId ? styles.teamCardActive : ""
              }`}
              role="button"
              tabIndex={0}
            >
              <PersonnageIcon
                size={68}
                couleur={p.color}
                variant={p.spriteId}
              />

              <span className={styles.cardName}>{p.name.toUpperCase()}</span>

              <span className={styles.stars}>
                {"★".repeat(p.rarity?.stars ?? 0)}
              </span>

              <div className={styles.levelBlock}>
                <span className={styles.cardLevel}>
                  Niveau {p.level} / {maxP}
                </span>

                {!auMaxP && xpRequiseP > 0 && (
                  <div className={styles.xpBarTrack}>
                    <div
                      className={styles.xpBarFill}
                      style={{
                        width: `${Math.min(100, (p.xp / xpRequiseP) * 100)}%`,
                      }}
                    />
                  </div>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();

                  definirFormation(
                    p.id,
                    p.formationRow === "AVANT" ? "ARRIERE" : "AVANT",
                  ).then(() => router.refresh());
                }}
                className={styles.positionButton}
              >
                {p.formationRow === "AVANT" ? "Avant" : "Arrière"}
              </button>
            </div>
          );
        })}
      </div>

      <Link href="/collection" className={styles.collectionButton}>
        Collection
      </Link>

      {equipe.length === 0 && (
        <p className={styles.emptyMessage}>
          Ton équipe est vide. Va dans ta Collection pour y ajouter des
          personnages.
        </p>
      )}

      {selectionne && (
        <div className={styles.detailPanel}>
          <div className={styles.detailLeft}>
            <PersonnageIcon
              size={180}
              couleur={selectionne.color}
              variant={selectionne.spriteId}
            />
          </div>
          <div className={styles.detailRight}>
            <span className={styles.detailName}>
              {selectionne!.name.toUpperCase()}
            </span>
            <span className={styles.stars}>
              {"★".repeat(selectionne.rarity?.stars ?? 0)}
            </span>
            <div className={styles.statContainer}>
              <p>
                <SwordIcon size={16} /> Force: {stats?.force}
              </p>
              <p>
                <BootsIcon size={16} /> Vitesse: {stats?.vitesse}
              </p>
              <p>
                <ArmorIcon size={16} /> Résistance: {stats?.resistance}
              </p>
              <p>
                <AmuletIcon size={16} /> Agilité: {stats?.agilite}
              </p>
            </div>

            <span className={styles.subLabel}>Équipement</span>
            <div className={styles.slotGrid}>
              {SLOTS.map((slot) => {
                const lien = selectionne.equipment.find((e) => e.slot === slot);
                const IconeObjet = ICONE_SLOT[slot] ?? ChestIcon;

                return (
                  <div key={slot} className={styles.slotWrapper}>
                    <button
                      className={styles.slot}
                      onClick={() =>
                        lien ? desequiper(lien.equipment.id) : ouvrirSlot(slot)
                      }
                    >
                      {lien ? (
                        <>
                          <IconeObjet size={32} />
                          <span className={styles.slotFilled}>
                            {lien.equipment.name}
                          </span>
                        </>
                      ) : (
                        <span className={styles.slotEmpty}>+</span>
                      )}
                    </button>

                    {slotOuvert === slot && (
                      <div className={styles.picker}>{/* ... */}</div>
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
