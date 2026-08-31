"use client";

import { useState } from "react";
import { ouvrirCoffre } from "../../actions/coffre";
import {
  ChestIcon,
  SwordIcon,
  ArmorIcon,
  BootsIcon,
  AmuletIcon,
} from "@/components/pixel";
import { Flame, HeartPulse, Snowflake, Shield, Sparkles } from "lucide-react";
import { descriptionSort } from "@/lib/spell";
import type { ComponentType } from "react";
import styles from "./page.module.css";

const COUT_COFFRE = 80;

const RARITY_COLORS: Record<number, string> = {
  1: "#9db3aa",
  2: "#7fd9c4",
  3: "#5cc8ff",
  4: "#c792ea",
  5: "#ff9d81",
  6: "#f2c94c",
};

const ICONE_SLOT: Record<string, ComponentType<{ size?: number }>> = {
  ARME: SwordIcon,
  ARMURE: ArmorIcon,
  BOTTES: BootsIcon,
  AMULETTE: AmuletIcon,
};

const ICONE_EFFET: Record<string, ComponentType<{ size?: number }>> = {
  DEGATS: Flame,
  SOIN: HeartPulse,
  ETOURDISSEMENT: Snowflake,
  BONUS_STAT: Sparkles,
  REDUCTION_DEGATS: Shield,
};

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

export default function CoffreClient({
  currencyInitiale,
}: {
  currencyInitiale: number;
}) {
  const [phase, setPhase] = useState<"idle" | "ouverture" | "reveal">("idle");
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const [currency, setCurrency] = useState(currencyInitiale);
  const [erreur, setErreur] = useState<string | null>(null);

  async function ouvrir() {
    if (currency < COUT_COFFRE || phase !== "idle") return;
    setErreur(null);
    setPhase("ouverture");

    try {
      const res = await ouvrirCoffre();
      setCurrency(res.newCurrency);
      setTimeout(() => {
        setResultat(
          res.kind === "spell"
            ? { kind: "spell", ...res.spell }
            : { kind: "equipment", ...res.equipment },
        );
        setPhase("reveal");
      }, 1300);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur inconnue");
      setPhase("idle");
    }
  }

  function continuer() {
    setPhase("idle");
    setResultat(null);
  }

  const couleur = resultat ? RARITY_COLORS[resultat.stars] : "#f2c94c";
  const IconeObjet =
    resultat?.kind === "spell"
      ? (ICONE_EFFET[resultat.effect] ?? Sparkles)
      : resultat?.kind === "equipment"
        ? (ICONE_SLOT[resultat.slot] ?? ChestIcon)
        : ChestIcon;

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Coffres</h1>

      <div className={styles.panel}>
        <p className={styles.currency}>
          Monnaie : <span className={styles.currencyValue}>{currency}</span>
        </p>
        {erreur && <p className={styles.error}>{erreur}</p>}

        {phase !== "reveal" && (
          <>
            <div
              className={`${styles.chestWrapper} ${phase === "ouverture" ? styles.chestActive : ""}`}
            >
              <ChestIcon size={80} />
            </div>

            <button
              onClick={ouvrir}
              className={styles.openButton}
              disabled={currency < COUT_COFFRE || phase === "ouverture"}
            >
              {phase === "ouverture"
                ? "Ouverture en cours..."
                : `Ouvrir un coffre (${COUT_COFFRE} monnaie)`}
            </button>
          </>
        )}

        {phase === "reveal" && resultat && (
          <div
            className={styles.resultCard}
            style={{ borderColor: couleur, boxShadow: `0 0 30px ${couleur}44` }}
          >
            <span className={styles.resultLabel} style={{ color: couleur }}>
              {resultat.kind === "spell" ? "Sort obtenu" : "Objet obtenu"}
            </span>

            <IconeObjet size={64} />

            <span className={styles.resultName}>{resultat.name}</span>
            <span className={styles.resultStars}>
              {"★".repeat(resultat.stars)}
            </span>
            <span className={styles.resultBonus}>
              {resultat.kind === "spell"
                ? descriptionSort(resultat)
                : `+${resultat.bonusValue} ${resultat.bonusStat}`}
            </span>

            <button onClick={continuer} className={styles.openButton}>
              Continuer
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
