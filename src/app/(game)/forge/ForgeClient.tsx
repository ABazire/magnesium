"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  SwordIcon,
  ArmorIcon,
  BootsIcon,
  AmuletIcon,
} from "@/components/pixel";
import { IconeMagie } from "@/components/pixel/IconesUI";
import { fabriquerEquipement, fabriquerSort } from "../../actions/forge";
import { renforcerEquipement } from "../../actions/renforcement";
import { RECETTES_EQUIPEMENT, RECETTE_SORT } from "@/lib/craft";
import { NOMS_MATERIAU } from "@/lib/monsterDrops";
import {
  NOMS_ENSEMBLE,
  NIVEAU_RENFORCEMENT_MAX,
  coutRenforcement,
} from "@/lib/equipmentSet";
import type { EquipmentSet } from "@prisma/client";
import { descriptionSort } from "@/lib/spell";
import type { EquipmentSlot, MaterialType } from "@prisma/client";
import type { ComponentType } from "react";
import styles from "./page.module.css";

const RARITY_COLORS: Record<number, string> = {
  1: "#9db3aa",
  2: "#7fd9c4",
  3: "#5cc8ff",
  4: "#c792ea",
  5: "#ff9d81",
  6: "#f2c94c",
};

const ICONE_SLOT: Record<EquipmentSlot, ComponentType<{ size?: number }>> = {
  ARME: SwordIcon,
  ARMURE: ArmorIcon,
  BOTTES: BootsIcon,
  AMULETTE: AmuletIcon,
};

const CARTES: { slot: EquipmentSlot; label: string }[] = [
  { slot: "ARME", label: "Arme" },
  { slot: "ARMURE", label: "Armure" },
  { slot: "BOTTES", label: "Bottes" },
  { slot: "AMULETTE", label: "Amulette" },
];

type ResultatEquipement = {
  kind: "equipment";
  name: string;
  slot: string;
  bonusStat: string;
  bonusValue: number;
  stars: number;
};

type ResultatSort = {
  kind: "spell";
  name: string;
  effect: string;
  value: number;
  targetStat: string | null;
  stars: number;
};

type Resultat = ResultatEquipement | ResultatSort;

type EquipementResume = {
  id: string;
  name: string;
  slot: EquipmentSlot;
  bonusStat: string;
  bonusValue: number;
  niveau: number;
  ensemble: EquipmentSet | null;
  stars: number;
};

export default function ForgeClient({
  currency,
  materiaux,
  equipements,
}: {
  currency: number;
  materiaux: Record<string, number>;
  equipements: EquipementResume[];
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "fabrication" | "reveal">(
    "idle",
  );
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState<string | null>(null);
  const [renforcementEnCours, setRenforcementEnCours] = useState<string | null>(null);

  function possede(materiel: MaterialType, quantite: number) {
    return (materiaux[materiel] ?? 0) >= quantite;
  }

  async function renforcer(equipement: EquipementResume) {
    setErreur(null);
    setRenforcementEnCours(equipement.id);
    try {
      await renforcerEquipement(equipement.id);
      router.refresh();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setRenforcementEnCours(null);
    }
  }

  function peutFabriquer(recette: { materiaux: { type: MaterialType; quantity: number }[]; or: number }) {
    return (
      currency >= recette.or &&
      recette.materiaux.every((m) => possede(m.type, m.quantity))
    );
  }

  async function fabriquer(cible: EquipmentSlot | "SORT") {
    setErreur(null);
    setEnCours(cible);
    setPhase("fabrication");

    try {
      const res =
        cible === "SORT" ? await fabriquerSort() : await fabriquerEquipement(cible);

      setTimeout(() => {
        setResultat(
          "spell" in res
            ? { kind: "spell", ...res.spell }
            : { kind: "equipment", ...res.equipment },
        );
        setPhase("reveal");
      }, 900);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur inconnue");
      setPhase("idle");
    } finally {
      setEnCours(null);
    }
  }

  function continuer() {
    setPhase("idle");
    setResultat(null);
    router.refresh();
  }

  const couleur = resultat ? RARITY_COLORS[resultat.stars] : "#f2c94c";
  const IconeResultat =
    resultat?.kind === "equipment"
      ? (ICONE_SLOT[resultat.slot as EquipmentSlot] ?? IconeMagie)
      : IconeMagie;

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Forge</h1>

      <p className={styles.currency}>
        Or : <span className={styles.currencyValue}>{currency}</span>
      </p>

      {Object.values(materiaux).some((q) => q > 0) && (
        <div className={styles.materiaux}>
          {Object.entries(materiaux)
            .filter(([, q]) => q > 0)
            .map(([type, q]) => (
              <span key={type} className={styles.materiauBadge}>
                {NOMS_MATERIAU[type as MaterialType]} × {q}
              </span>
            ))}
        </div>
      )}

      {erreur && <p className={styles.error}>{erreur}</p>}

      {phase === "reveal" && resultat ? (
        <div
          className={styles.resultCard}
          style={{ borderColor: couleur, boxShadow: `0 0 30px ${couleur}44` }}
        >
          <span className={styles.resultLabel} style={{ color: couleur }}>
            {resultat.kind === "spell" ? "Sort fabriqué" : "Objet fabriqué"}
          </span>

          <IconeResultat size={64} />

          <span className={styles.resultName}>{resultat.name}</span>
          <span className={styles.resultStars}>
            {"★".repeat(resultat.stars)}
          </span>
          <span className={styles.resultBonus}>
            {resultat.kind === "spell"
              ? descriptionSort(resultat)
              : `+${resultat.bonusValue} ${resultat.bonusStat}`}
          </span>

          <button onClick={continuer} className={styles.craftButton}>
            Continuer
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {CARTES.map(({ slot, label }) => {
            const recette = RECETTES_EQUIPEMENT[slot];
            const Icone = ICONE_SLOT[slot];
            return (
              <div key={slot} className={styles.carte}>
                <Icone size={40} />
                <span className={styles.carteLabel}>{label}</span>
                <div className={styles.recette}>
                  {recette.materiaux.map((m) => (
                    <span
                      key={m.type}
                      className={possede(m.type, m.quantity) ? styles.ok : styles.manque}
                    >
                      {NOMS_MATERIAU[m.type]} {materiaux[m.type] ?? 0}/{m.quantity}
                    </span>
                  ))}
                  <span className={currency >= recette.or ? styles.ok : styles.manque}>
                    Or {currency}/{recette.or}
                  </span>
                </div>
                <button
                  onClick={() => fabriquer(slot)}
                  disabled={!peutFabriquer(recette) || phase === "fabrication"}
                  className={styles.craftButton}
                >
                  {phase === "fabrication" && enCours === slot
                    ? "Fabrication..."
                    : "Fabriquer"}
                </button>
              </div>
            );
          })}

          <div className={styles.carte}>
            <IconeMagie size={40} />
            <span className={styles.carteLabel}>Sort</span>
            <div className={styles.recette}>
              {RECETTE_SORT.materiaux.map((m) => (
                <span
                  key={m.type}
                  className={possede(m.type, m.quantity) ? styles.ok : styles.manque}
                >
                  {NOMS_MATERIAU[m.type]} {materiaux[m.type] ?? 0}/{m.quantity}
                </span>
              ))}
              <span className={currency >= RECETTE_SORT.or ? styles.ok : styles.manque}>
                Or {currency}/{RECETTE_SORT.or}
              </span>
            </div>
            <button
              onClick={() => fabriquer("SORT")}
              disabled={!peutFabriquer(RECETTE_SORT) || phase === "fabrication"}
              className={styles.craftButton}
            >
              {phase === "fabrication" && enCours === "SORT"
                ? "Fabrication..."
                : "Fabriquer"}
            </button>
          </div>
        </div>
      )}

      {phase !== "reveal" && equipements.length > 0 && (
        <>
          <h2 className={styles.sousTitre}>Renforcement</h2>
          <p className={styles.sousTitreInfo}>
            Chaque niveau augmente le bonus de l&apos;objet. 2 pièces d&apos;un
            même ensemble donnent un petit bonus supplémentaire, 4 pièces (le
            maximum) le bonus fort.
          </p>
          <div className={styles.renforcementListe}>
            {equipements.map((e) => {
              const Icone = ICONE_SLOT[e.slot];
              const auMax = e.niveau >= NIVEAU_RENFORCEMENT_MAX;
              const { or, materiau } = coutRenforcement(e.slot, e.niveau);
              const peut =
                !auMax && currency >= or && possede(materiau.type, materiau.quantity);

              return (
                <div key={e.id} className={styles.renforcementLigne}>
                  <Icone size={28} />
                  <div className={styles.renforcementInfo}>
                    <span className={styles.renforcementNom}>
                      {e.name} <span className={styles.renforcementNiveau}>+{e.niveau}</span>
                    </span>
                    <span className={styles.renforcementDetail}>
                      {e.ensemble ? NOMS_ENSEMBLE[e.ensemble] : "Sans ensemble"} · +
                      {e.bonusValue + e.niveau} {e.bonusStat}
                    </span>
                  </div>
                  {auMax ? (
                    <span className={styles.renforcementMax}>Max</span>
                  ) : (
                    <button
                      onClick={() => renforcer(e)}
                      disabled={!peut || renforcementEnCours === e.id}
                      className={styles.renforcerButton}
                    >
                      {renforcementEnCours === e.id
                        ? "..."
                        : `+1 · ${or} or · ${NOMS_MATERIAU[materiau.type]} ${materiau.quantity}`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
