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
import { Box, Flame, HeartPulse, Snowflake, Shield, Sparkles } from "lucide-react";
import {
  equiperObjet,
  desequiperObjet,
  getEquipementsDisponibles,
} from "../../actions/equiper";
import {
  equiperSort,
  desequiperSort,
  getSortsDisponibles,
} from "../../actions/sorts";
import type { Prisma, SpellSlot } from "@prisma/client";
import { descriptionSort } from "@/lib/spell";
import { xpRequisePourNiveauSuivant } from "@/lib/leveling";
import Modal from "@/components/Modal";
import styles from "./page.module.css";

type PersonnageAvecRelations = Prisma.PersonnageGetPayload<{
  include: {
    rarity: true;
    equipment: { include: { equipment: true } };
    spells: { include: { spell: true } };
  };
}>;

type EquipementDisponible = {
  id: string;
  name: string;
  bonusValue: number;
  bonusStat: string;
  rarity: { stars: number };
};

type SortDisponible = {
  id: string;
  name: string;
  effect: string;
  value: number;
  targetStat: string | null;
  cooldown: number;
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

const SORT_SLOTS: { slot: SpellSlot; label: string }[] = [
  { slot: "SORT_1", label: "Sort 1" },
  { slot: "SORT_2", label: "Sort 2" },
  { slot: "SORT_3", label: "Sort 3" },
  { slot: "PASSIF", label: "Passif" },
];

const ICONE_EFFET: Record<string, ComponentType<{ size?: number }>> = {
  DEGATS: Flame,
  SOIN: HeartPulse,
  ETOURDISSEMENT: Snowflake,
  BONUS_STAT: Sparkles,
  REDUCTION_DEGATS: Shield,
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

  const [sortSlotOuvert, setSortSlotOuvert] = useState<SpellSlot | null>(null);
  const [sortsDisponibles, setSortsDisponibles] = useState<SortDisponible[]>([]);
  const [chargementSorts, setChargementSorts] = useState(false);

  const selectionne = equipe.find((p) => p.id === selectionneId);
  const stats = selectionne ? statsEffectives(selectionne) : null;

  function fermerModal() {
    setSelectionneId(null);
    setSlotOuvert(null);
    setSortSlotOuvert(null);
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

  async function ouvrirSortSlot(slot: SpellSlot) {
    if (sortSlotOuvert === slot) {
      setSortSlotOuvert(null);
      return;
    }
    setSortSlotOuvert(slot);
    setChargementSorts(true);
    const data = await getSortsDisponibles(slot);
    setSortsDisponibles(data);
    setChargementSorts(false);
  }

  async function equiperSortHandler(spellId: string) {
    if (!selectionne || !sortSlotOuvert) return;
    await equiperSort(selectionne.id, spellId, sortSlotOuvert);
    setSortSlotOuvert(null);
    router.refresh();
  }

  async function desequiperSortHandler(spellId: string) {
    await desequiperSort(spellId);
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
          <div className={styles.cardLayout}>
            <div className={styles.cardLeft}>
              <PersonnageIcon
                size={140}
                couleur={selectionne.color}
                variant={selectionne.spriteId}
              />
              <span className={styles.detailName}>
                {selectionne.name.toUpperCase()}
              </span>
              <span className={styles.stars}>
                {"★".repeat(selectionne.rarity?.stars ?? 0)}
              </span>
              <span className={styles.detailLevel}>
                Niveau {selectionne.level}
              </span>

              <div className={styles.xpTrack}>
                <div
                  className={styles.xpFill}
                  style={{
                    width: `${
                      xpRequisePourNiveauSuivant(selectionne.level) > 0
                        ? Math.min(
                            100,
                            (selectionne.xp /
                              xpRequisePourNiveauSuivant(selectionne.level)) *
                              100,
                          )
                        : 100
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className={styles.cardRight}>
              <span className={styles.sectionLabel}>Statistiques</span>
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

              <span className={styles.sectionLabel}>Équipement</span>
              <div className={styles.slotGrid}>
                {SLOTS.map((slot) => {
                  const lien = selectionne.equipment.find(
                    (e) => e.slot === slot,
                  );
                  const IconeObjet = ICONE_SLOT[slot] ?? ChestIcon;

                  return (
                    <div key={slot} className={styles.slotWrapper}>
                      <button
                        className={styles.slot}
                        onClick={() =>
                          lien
                            ? desequiper(lien.equipment.id)
                            : ouvrirSlot(slot)
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

              <span className={styles.sectionLabel}>Sorts</span>
              <div className={styles.slotGrid}>
                {SORT_SLOTS.map(({ slot, label }) => {
                  const lien = selectionne.spells.find((s) => s.slot === slot);
                  const IconeSort = lien
                    ? (ICONE_EFFET[lien.spell.effect] ?? Sparkles)
                    : null;

                  return (
                    <div key={slot} className={styles.slotWrapper}>
                      <button
                        className={styles.slot}
                        onClick={() =>
                          lien
                            ? desequiperSortHandler(lien.spell.id)
                            : ouvrirSortSlot(slot)
                        }
                      >
                        {lien && IconeSort ? (
                          <>
                            <IconeSort size={28} />
                            <span className={styles.slotFilled}>
                              {lien.spell.name}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className={styles.slotEmpty}>+</span>
                            <span className={styles.slotFilled}>{label}</span>
                          </>
                        )}
                      </button>

                      {sortSlotOuvert === slot && (
                        <div className={styles.picker}>
                          {chargementSorts && (
                            <span className={styles.pickerEmpty}>
                              Chargement...
                            </span>
                          )}
                          {!chargementSorts && sortsDisponibles.length === 0 && (
                            <span className={styles.pickerEmpty}>
                              Aucun sort disponible
                            </span>
                          )}
                          {!chargementSorts &&
                            sortsDisponibles.map((s) => (
                              <button
                                key={s.id}
                                onClick={() => equiperSortHandler(s.id)}
                                className={styles.pickerItem}
                              >
                                {"★".repeat(s.rarity.stars)} {s.name} (
                                {descriptionSort(s)})
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
        </Modal>
      )}
    </main>
  );
}
