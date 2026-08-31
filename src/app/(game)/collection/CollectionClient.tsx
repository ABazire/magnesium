"use client";

import { ComponentType, useState } from "react";
import { useRouter } from "next/navigation";
import { statsEffectives } from "@/lib/personnage";
import {
  AmuletIcon,
  ArmorIcon,
  BootsIcon,
  ChestIcon,
  PersonnageIcon,
  SwordIcon,
} from "@/components/pixel";
import { Flame, HeartPulse, Snowflake, Shield, Sparkles } from "lucide-react";
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
import Modal from "@/components/Modal";
import styles from "./page.module.css";
import {
  toggleEquipe,
  getEquipeActuelle,
  remplacerMembreEquipe,
} from "../../actions/equipe";

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


export default function CollectionClient({
  personnages,
  cellulesVides,
}: {
  personnages: PersonnageAvecRelations[];
  cellulesVides: number;
}) {
  const router = useRouter();
  const [selectionneId, setSelectionneId] = useState<string | null>(null);
  const [slotOuvert, setSlotOuvert] = useState<string | null>(null);
  const [disponibles, setDisponibles] = useState<EquipementDisponible[]>([]);
  const [chargement, setChargement] = useState(false);
  const [enCoursEquipe, setEnCoursEquipe] = useState(false);

  const [sortSlotOuvert, setSortSlotOuvert] = useState<SpellSlot | null>(null);
  const [sortsDisponibles, setSortsDisponibles] = useState<SortDisponible[]>([]);
  const [chargementSorts, setChargementSorts] = useState(false);

  const selectionne = personnages.find((p) => p.id === selectionneId);
  const stats = selectionne ? statsEffectives(selectionne) : null;

  const [remplacementOuvert, setRemplacementOuvert] = useState(false);
  const [equipeActuelle, setEquipeActuelle] = useState<
    {
      id: string;
      name: string;
      color: string;
      spriteId: number;
      level: number;
    }[]
  >([]);

  function fermerModal() {
    setSelectionneId(null);
    setSlotOuvert(null);
    setSortSlotOuvert(null);
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

  async function basculerEquipe() {
    if (!selectionne) return;
    setEnCoursEquipe(true);

    if (selectionne.inTeam) {
      await toggleEquipe(selectionne.id);
      router.refresh();
      setEnCoursEquipe(false);
      return;
    }

    try {
      await toggleEquipe(selectionne.id);
      router.refresh();
    } catch {
      const equipe = await getEquipeActuelle();
      setEquipeActuelle(equipe);
      setRemplacementOuvert(true);
    } finally {
      setEnCoursEquipe(false);
    }
  }

  async function confirmerRemplacement(sortantId: string) {
    if (!selectionne) return;
    setEnCoursEquipe(true);
    await remplacerMembreEquipe(sortantId, selectionne.id);
    setRemplacementOuvert(false);
    router.refresh();
    setEnCoursEquipe(false);
  }
  return (
    <>
      <div className={styles.grid}>
        {personnages.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectionneId(p.id)}
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
            <PersonnageIcon size={48} couleur={p.color} variant={p.spriteId} />
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

              {!remplacementOuvert ? (
                <button
                  onClick={basculerEquipe}
                  disabled={enCoursEquipe}
                  className={styles.teamToggleButton}
                >
                  {enCoursEquipe
                    ? "..."
                    : selectionne.inTeam
                      ? "Retirer de l'équipe"
                      : "Ajouter à l'équipe"}
                </button>
              ) : (
                <div className={styles.replaceBox}>
                  <span className={styles.replaceLabel}>
                    Équipe complète — remplacer qui ?
                  </span>
                  {equipeActuelle.map((membre) => (
                    <button
                      key={membre.id}
                      onClick={() => confirmerRemplacement(membre.id)}
                      disabled={enCoursEquipe}
                      className={styles.replaceOption}
                    >
                      <PersonnageIcon
                        size={24}
                        couleur={membre.color}
                        variant={membre.spriteId}
                      />
                      <span>
                        {membre.name} (niv. {membre.level})
                      </span>
                    </button>
                  ))}
                  <button
                    onClick={() => setRemplacementOuvert(false)}
                    className={styles.replaceCancel}
                  >
                    Annuler
                  </button>
                </div>
              )}
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
    </>
  );
}
