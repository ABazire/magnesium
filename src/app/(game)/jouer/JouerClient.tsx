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
import { Box } from "lucide-react";
import {
  equiperObjet,
  desequiperObjet,
  getEquipementsDisponibles,
} from "../../actions/equiper";
import { definirFormation } from "../../actions/equipe";
import type { Prisma } from "@prisma/client";
import { xpRequisePourNiveauSuivant, niveauMax } from "@/lib/leveling";
import Modal from "@/components/Modal";
import styles from "./page.module.css";
import WolfSprite from "@/components/WolfSprite";

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

const ICONE_SLOT: Record<string, ComponentType<{ size?: number }>> = {
  ARME: SwordIcon,
  ARMURE: ArmorIcon,
  BOTTES: BootsIcon,
  AMULETTE: AmuletIcon,
};

export default function JouerClient({
  equipe,
}: {
  equipe: PersonnageAvecRelations[];
}) {
  const router = useRouter();
  const [selectionneId, setSelectionneId] = useState<string | null>(null);
  const [slotOuvert, setSlotOuvert] = useState<string | null>(null);
  const [disponibles, setDisponibles] = useState<EquipementDisponible[]>([]);
  const [chargement, setChargement] = useState(false);

  const selectionne = equipe.find((p) => p.id === selectionneId);
  const stats = selectionne ? statsEffectives(selectionne) : null;

  function fermerModal() {
    setSelectionneId(null);
    setSlotOuvert(null);
  }

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

  async function basculerFormation() {
    if (!selectionne) return;
    await definirFormation(
      selectionne.id,
      selectionne.formationRow === "AVANT" ? "ARRIERE" : "AVANT",
    );
    router.refresh();
  }

  return (
    <main className={styles.page}>
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
              </Link>
            );
          }

          const max = niveauMax(p.rarity?.stars ?? 1);
          const xpRequise = xpRequisePourNiveauSuivant(p.level);

          return (
            <button
              key={p.id}
              onClick={() => setSelectionneId(p.id)}
              className={styles.teamCard}
              style={{
                background: `radial-gradient(circle at 50% 30%, ${p.color}cc, ${p.color}88)`,
              }}
            >
              <div className={styles.cardTop}>
                <PersonnageIcon
                  size={180}
                  couleur={p.color}
                  variant={p.spriteId}
                />
                <div className={styles.levelBadge}>
                  <span className={styles.levelBadgeLabel}>NIV</span>
                  <span className={styles.levelBadgeValue}>{p.level}</span>
                </div>
              </div>
              <div className={styles.cardBottom}>
                <span className={styles.cardName}>{p.name.toUpperCase()}</span>
                <span className={styles.stars}>
                  {"★".repeat(p.rarity?.stars ?? 0)}
                </span>
                <div className={styles.barTrack}>
                  <div className={styles.hpBarFill} style={{ width: "100%" }} />
                </div>
                <div className={styles.barTrack}>
                  <div
                    className={styles.xpBarFill}
                    style={{
                      width: `${xpRequise > 0 ? Math.min(100, (p.xp / xpRequise) * 100) : 100}%`,
                    }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <Link href="/collection" className={styles.collectionButton}>
        <Box size={32} />
        Collection
      </Link>

      {selectionne && stats && (
        <Modal onClose={fermerModal}>
          <div className={styles.detailHead}>
            <PersonnageIcon
              size={110}
              couleur={selectionne.color}
              variant={selectionne.spriteId}
            />
            <span className={styles.detailName}>
              {selectionne.name.toUpperCase()}
            </span>
            <span className={styles.stars}>
              {"★".repeat(selectionne.rarity?.stars ?? 0)}
            </span>
          </div>

          <div className={styles.statContainer}>
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

          <button onClick={basculerFormation} className={styles.positionButton}>
            {selectionne.formationRow === "AVANT" ? "Avant" : "Arrière"}
          </button>

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
                        <IconeObjet size={28} />
                        <span className={styles.slotFilled}>
                          {lien.equipment.name}
                        </span>
                      </>
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
        </Modal>
      )}
    </main>
  );
}
