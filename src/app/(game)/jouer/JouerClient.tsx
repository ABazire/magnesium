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
  Box,
  Flame,
  HeartPulse,
  Snowflake,
  Shield,
  Sparkles,
  Droplet,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
import {
  creerEquipe,
  renommerEquipe,
  supprimerEquipe,
  definirMembreEquipe,
  definirEquipeDefense,
  getPersonnageDetail,
} from "../../actions/teams";
import type { Prisma, SpellSlot } from "@prisma/client";
import { descriptionSort } from "@/lib/spell";
import { xpRequisePourNiveauSuivant } from "@/lib/leveling";
import Modal from "@/components/Modal";
import FusionPersonnage from "@/components/FusionPersonnage";
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
  manaCost: number;
  rarity: { stars: number };
};

type PersonnageResume = {
  id: string;
  name: string;
  color: string;
  spriteId: number;
  level: number;
};

type MembreEquipe = PersonnageResume & {
  xp: number;
  rarity: { stars: number } | null;
};

type Equipe = {
  id: string;
  name: string;
  estDefense: boolean;
  membres: { position: number; personnage: MembreEquipe }[];
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
  equipes,
  tousLesPersonnages,
}: {
  equipes: Equipe[];
  tousLesPersonnages: PersonnageResume[];
}) {
  const router = useRouter();

  const [equipeIndex, setEquipeIndex] = useState(0);
  const indexActuel = Math.min(equipeIndex, Math.max(0, equipes.length - 1));
  const equipeActuelle = equipes[indexActuel];

  const [creationOuverte, setCreationOuverte] = useState(false);
  const [nouvelleEquipeNom, setNouvelleEquipeNom] = useState("");
  const [creationEnCours, setCreationEnCours] = useState(false);
  const [renommageId, setRenommageId] = useState<string | null>(null);
  const [renommageValeur, setRenommageValeur] = useState("");
  const [slotPickerOuvert, setSlotPickerOuvert] = useState<{
    teamId: string;
    position: number;
  } | null>(null);

  const [personnageDetailId, setPersonnageDetailId] = useState<string | null>(
    null,
  );
  const [personnageDetail, setPersonnageDetail] =
    useState<PersonnageAvecRelations | null>(null);
  const [chargementDetail, setChargementDetail] = useState(false);

  const [slotOuvert, setSlotOuvert] = useState<string | null>(null);
  const [disponibles, setDisponibles] = useState<EquipementDisponible[]>([]);
  const [chargement, setChargement] = useState(false);

  const [sortSlotOuvert, setSortSlotOuvert] = useState<SpellSlot | null>(null);
  const [sortsDisponibles, setSortsDisponibles] = useState<SortDisponible[]>([]);
  const [chargementSorts, setChargementSorts] = useState(false);

  const [erreur, setErreur] = useState<string | null>(null);
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);
  const [defenseEnCours, setDefenseEnCours] = useState(false);

  function messageErreur(e: unknown) {
    return e instanceof Error ? e.message : "Erreur inconnue";
  }

  async function ouvrirDetail(personnageId: string) {
    setErreur(null);
    setPersonnageDetailId(personnageId);
    setChargementDetail(true);
    try {
      const data = await getPersonnageDetail(personnageId);
      setPersonnageDetail(data);
    } catch (e) {
      setErreur(messageErreur(e));
      setPersonnageDetailId(null);
    } finally {
      setChargementDetail(false);
    }
  }

  function fermerDetail() {
    setPersonnageDetailId(null);
    setPersonnageDetail(null);
    setSlotOuvert(null);
    setSortSlotOuvert(null);
  }

  async function rafraichirDetail() {
    if (!personnageDetailId) return;
    const data = await getPersonnageDetail(personnageDetailId);
    setPersonnageDetail(data);
  }

  async function ouvrirSlot(slot: string) {
    if (slotOuvert === slot) {
      setSlotOuvert(null);
      return;
    }
    setSlotOuvert(slot);
    setChargement(true);
    setErreur(null);
    try {
      const data = await getEquipementsDisponibles(slot);
      setDisponibles(data);
    } catch (e) {
      setErreur(messageErreur(e));
      setSlotOuvert(null);
    } finally {
      setChargement(false);
    }
  }

  async function equiper(equipmentId: string) {
    if (!personnageDetail) return;
    setErreur(null);
    try {
      await equiperObjet(personnageDetail.id, equipmentId);
      setSlotOuvert(null);
      await rafraichirDetail();
      router.refresh();
    } catch (e) {
      setErreur(messageErreur(e));
    }
  }

  async function desequiper(equipmentId: string) {
    setErreur(null);
    try {
      await desequiperObjet(equipmentId);
      await rafraichirDetail();
      router.refresh();
    } catch (e) {
      setErreur(messageErreur(e));
    }
  }

  async function ouvrirSortSlot(slot: SpellSlot) {
    if (sortSlotOuvert === slot) {
      setSortSlotOuvert(null);
      return;
    }
    setSortSlotOuvert(slot);
    setChargementSorts(true);
    setErreur(null);
    try {
      const data = await getSortsDisponibles(slot);
      setSortsDisponibles(data);
    } catch (e) {
      setErreur(messageErreur(e));
      setSortSlotOuvert(null);
    } finally {
      setChargementSorts(false);
    }
  }

  async function equiperSortHandler(spellId: string) {
    if (!personnageDetail || !sortSlotOuvert) return;
    setErreur(null);
    try {
      await equiperSort(personnageDetail.id, spellId, sortSlotOuvert);
      setSortSlotOuvert(null);
      await rafraichirDetail();
      router.refresh();
    } catch (e) {
      setErreur(messageErreur(e));
    }
  }

  async function desequiperSortHandler(spellId: string) {
    setErreur(null);
    try {
      await desequiperSort(spellId);
      await rafraichirDetail();
      router.refresh();
    } catch (e) {
      setErreur(messageErreur(e));
    }
  }

  async function creerEquipeHandler() {
    if (!nouvelleEquipeNom.trim()) return;
    setCreationEnCours(true);
    setErreur(null);
    const nouvelIndex = equipes.length;
    try {
      await creerEquipe(nouvelleEquipeNom.trim());
      setNouvelleEquipeNom("");
      setCreationOuverte(false);
      setEquipeIndex(nouvelIndex);
      router.refresh();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setCreationEnCours(false);
    }
  }

  async function validerRenommage(teamId: string) {
    if (renommageValeur.trim()) {
      setErreur(null);
      try {
        await renommerEquipe(teamId, renommageValeur.trim());
        router.refresh();
      } catch (e) {
        setErreur(messageErreur(e));
      }
    }
    setRenommageId(null);
  }

  async function supprimerHandler(teamId: string) {
    if (suppressionEnCours) return;
    setSuppressionEnCours(true);
    setErreur(null);
    try {
      await supprimerEquipe(teamId);
      setEquipeIndex(0);
      router.refresh();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setSuppressionEnCours(false);
    }
  }

  async function defenseHandler(teamId: string) {
    if (defenseEnCours) return;
    setDefenseEnCours(true);
    setErreur(null);
    try {
      await definirEquipeDefense(teamId);
      router.refresh();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setDefenseEnCours(false);
    }
  }

  async function assignerMembre(personnageId: string) {
    if (!slotPickerOuvert) return;
    setErreur(null);
    try {
      await definirMembreEquipe(
        slotPickerOuvert.teamId,
        slotPickerOuvert.position,
        personnageId,
      );
      setSlotPickerOuvert(null);
      router.refresh();
    } catch (e) {
      setErreur(messageErreur(e));
    }
  }

  async function retirerMembre(teamId: string, position: number) {
    setErreur(null);
    try {
      await definirMembreEquipe(teamId, position, null);
      router.refresh();
    } catch (e) {
      setErreur(messageErreur(e));
    }
  }

  const stats = personnageDetail ? statsEffectives(personnageDetail) : null;

  return (
    <main className={styles.page}>
      {erreur && <p className={styles.erreurAction}>{erreur}</p>}

      {equipes.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Tu n’as pas encore d’équipe.</p>
          <div className={styles.creationRow}>
            <input
              placeholder="Nom de l'équipe"
              value={nouvelleEquipeNom}
              onChange={(e) => setNouvelleEquipeNom(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && creerEquipeHandler()}
              className={styles.renommageInput}
            />
            <button
              onClick={creerEquipeHandler}
              disabled={creationEnCours || !nouvelleEquipeNom.trim()}
              className={styles.collectionButton}
            >
              + Créer une équipe
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.sliderHeader}>
            <button
              onClick={() => setEquipeIndex((i) => Math.max(0, i - 1))}
              disabled={indexActuel === 0}
              className={styles.flecheButton}
              aria-label="Équipe précédente"
            >
              <ChevronLeft size={20} />
            </button>

            <div className={styles.sliderTitre}>
              {renommageId === equipeActuelle.id ? (
                <input
                  autoFocus
                  value={renommageValeur}
                  onChange={(e) => setRenommageValeur(e.target.value)}
                  onBlur={() => validerRenommage(equipeActuelle.id)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && validerRenommage(equipeActuelle.id)
                  }
                  className={styles.renommageInput}
                />
              ) : (
                <button
                  onClick={() => {
                    setRenommageId(equipeActuelle.id);
                    setRenommageValeur(equipeActuelle.name);
                  }}
                  className={styles.equipeNomTitre}
                >
                  {equipeActuelle.name}
                </button>
              )}
              <span className={styles.equipeCompteur}>
                {indexActuel + 1} / {equipes.length}
              </span>
              {equipeActuelle.estDefense && (
                <span className={styles.defenseBadge}>
                  <Shield size={11} /> Défense 3v3
                </span>
              )}
            </div>

            <button
              onClick={() =>
                setEquipeIndex((i) => Math.min(equipes.length - 1, i + 1))
              }
              disabled={indexActuel === equipes.length - 1}
              className={styles.flecheButton}
              aria-label="Équipe suivante"
            >
              <ChevronRight size={20} />
            </button>

            <button
              onClick={() => defenseHandler(equipeActuelle.id)}
              disabled={
                defenseEnCours ||
                (!equipeActuelle.estDefense &&
                  equipeActuelle.membres.length < TAILLE_EQUIPE)
              }
              className={
                equipeActuelle.estDefense
                  ? styles.defenseButtonActive
                  : styles.defenseButton
              }
              aria-label={
                equipeActuelle.estDefense
                  ? "Retirer comme équipe de défense"
                  : "Désigner comme équipe de défense"
              }
              title={
                equipeActuelle.membres.length < TAILLE_EQUIPE
                  ? "Équipe incomplète : impossible de la désigner pour le 3v3"
                  : undefined
              }
            >
              <Shield size={16} />
            </button>

            <button
              onClick={() => supprimerHandler(equipeActuelle.id)}
              disabled={suppressionEnCours}
              className={styles.supprimerButton}
              aria-label="Supprimer l'équipe"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className={styles.teamRow}>
            {Array.from({ length: TAILLE_EQUIPE }).map((_, position) => {
              const membre = equipeActuelle.membres.find(
                (m) => m.position === position,
              );

              if (!membre) {
                return (
                  <button
                    key={`vide-${position}`}
                    onClick={() =>
                      setSlotPickerOuvert({
                        teamId: equipeActuelle.id,
                        position,
                      })
                    }
                    className={styles.teamSlotEmpty}
                  >
                    <span className={styles.emptyPlus}>+</span>
                  </button>
                );
              }

              const p = membre.personnage;
              const xpRequise = xpRequisePourNiveauSuivant(p.level);

              return (
                <div key={p.id} className={styles.teamCardWrapper}>
                  <button
                    onClick={() => ouvrirDetail(p.id)}
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
                      <span className={styles.cardName}>
                        {p.name.toUpperCase()}
                      </span>
                      <span className={styles.stars}>
                        {"★".repeat(p.rarity?.stars ?? 0)}
                      </span>
                      <div className={styles.barTrack}>
                        <div
                          className={styles.hpBarFill}
                          style={{ width: "100%" }}
                        />
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
                  <button
                    onClick={() => retirerMembre(equipeActuelle.id, position)}
                    className={styles.teamCardRetirer}
                    aria-label="Retirer de l'équipe"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>

          <div className={styles.equipeActions}>
            {creationOuverte ? (
              <div className={styles.creationRow}>
                <input
                  autoFocus
                  placeholder="Nom de l'équipe"
                  value={nouvelleEquipeNom}
                  onChange={(e) => setNouvelleEquipeNom(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && creerEquipeHandler()}
                  className={styles.renommageInput}
                />
                <button
                  onClick={creerEquipeHandler}
                  disabled={creationEnCours || !nouvelleEquipeNom.trim()}
                  className={styles.collectionButton}
                >
                  Créer
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCreationOuverte(true)}
                className={styles.collectionButton}
              >
                + Nouvelle équipe
              </button>
            )}
          </div>
        </>
      )}

      <Link href="/collection" className={styles.collectionButton}>
        <Box size={32} />
        Collection
      </Link>

      {slotPickerOuvert && (
        <Modal onClose={() => setSlotPickerOuvert(null)}>
          <h2 className={styles.pickerTitle}>Choisir un personnage</h2>
          <div className={styles.pickerListVertical}>
            {tousLesPersonnages.length === 0 && (
              <span className={styles.pickerEmpty}>
                Aucun personnage dans ta collection.
              </span>
            )}
            {tousLesPersonnages.map((p) => (
              <button
                key={p.id}
                onClick={() => assignerMembre(p.id)}
                className={`${styles.pickerItem} ${styles.pickerItemAvatar}`}
              >
                <PersonnageIcon size={24} couleur={p.color} variant={p.spriteId} />
                {p.name} (niv. {p.level})
              </button>
            ))}
          </div>
        </Modal>
      )}

      {personnageDetailId && (
        <Modal onClose={fermerDetail}>
          {chargementDetail || !personnageDetail || !stats ? (
            <p className={styles.pickerEmpty}>Chargement...</p>
          ) : (
            <div className={styles.cardLayout}>
              <div className={styles.cardLeft}>
                <PersonnageIcon
                  size={140}
                  couleur={personnageDetail.color}
                  variant={personnageDetail.spriteId}
                />
                <span className={styles.detailName}>
                  {personnageDetail.name.toUpperCase()}
                </span>
                <span className={styles.stars}>
                  {"★".repeat(personnageDetail.rarity?.stars ?? 0)}
                </span>
                <span className={styles.detailLevel}>
                  Niveau {personnageDetail.level}
                </span>

                <div className={styles.xpTrack}>
                  <div
                    className={styles.xpFill}
                    style={{
                      width: `${
                        xpRequisePourNiveauSuivant(personnageDetail.level) > 0
                          ? Math.min(
                              100,
                              (personnageDetail.xp /
                                xpRequisePourNiveauSuivant(personnageDetail.level)) *
                                100,
                            )
                          : 100
                      }%`,
                    }}
                  />
                </div>

                <FusionPersonnage
                  personnageId={personnageDetail.id}
                  stars={personnageDetail.rarity?.stars ?? 1}
                  onFusion={async () => {
                    await rafraichirDetail();
                    router.refresh();
                  }}
                  onRenvoi={() => {
                    fermerDetail();
                    router.refresh();
                  }}
                />
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
                  <p>
                    <Droplet size={16} /> Mana: {stats.mana}
                  </p>
                </div>

                <span className={styles.sectionLabel}>Équipement</span>
                <div className={styles.slotGrid}>
                  {SLOTS.map((slot) => {
                    const lien = personnageDetail.equipment.find(
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
                    const lien = personnageDetail.spells.find(
                      (s) => s.slot === slot,
                    );
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
          )}
        </Modal>
      )}
    </main>
  );
}
