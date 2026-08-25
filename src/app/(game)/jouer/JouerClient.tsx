"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { statsEffectives } from "@/lib/personnage";
import {
  AmuletIcon,
  ArmorIcon,
  BootsIcon,
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

  return (
    <main className={styles.page}>
      <h2 className={styles.sectionTitle}>Mon équipe</h2>

      <div className={styles.teamRow}>
        {equipe.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setSelectionneId(p.id);
              setSlotOuvert(null);
            }}
            className={`${styles.teamCard} ${p.id === selectionneId ? styles.teamCardActive : ""}`}
          >
            <PersonnageIcon size={40} couleur={p.color} variant={p.spriteId} />{" "}
            <span className={styles.cardName}>{p.name.toUpperCase()}</span>
            <span className={styles.stars}>
              {"★".repeat(p.rarity?.stars ?? 0)}
            </span>
          </button>
        ))}
      </div>

      <Link href="/collection" className={styles.collectionButton}>
        Collection
      </Link>

      {selectionne && (
        <div className={styles.detailPanel}>
          <div className={styles.detailLeft}>
            <PersonnageIcon
              size={120}
              couleur={selectionne.color}
              variant={selectionne.spriteId}
            />
          </div>
          <div className={styles.detailRight}>
            <span className={styles.detailName}>
              {selectionne.name.toUpperCase()}
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
                return (
                  <div key={slot} className={styles.slotWrapper}>
                    <button
                      className={styles.slot}
                      onClick={() =>
                        lien ? desequiper(lien.equipment.id) : ouvrirSlot(slot)
                      }
                    >
                      {lien ? (
                        <span className={styles.slotFilled}>
                          {lien.equipment.name}
                        </span>
                      ) : (
                        <span className={styles.slotEmpty}>+</span>
                      )}
                    </button>

                    {slotOuvert === slot && (
                      <div className={styles.picker}>
                        {chargement && (
                          <span className={styles.pickerEmpty}>
                            Chargement...
                          </span>
                        )}
                        {!chargement && disponibles.length === 0 && (
                          <span className={styles.pickerEmpty}>
                            Aucun objet disponible
                          </span>
                        )}
                        {!chargement &&
                          disponibles.map((e) => (
                            <button
                              key={e.id}
                              onClick={() => equiper(e.id)}
                              className={styles.pickerItem}
                            >
                              {"★".repeat(e.rarity.stars)} {e.name} (+
                              {e.bonusValue} {e.bonusStat})
                            </button>
                          ))}
                      </div>
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
