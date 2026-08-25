"use client";

import { useState } from "react";
import { tirerGatcha } from "../../actions/gatcha";
import { PersonnageIcon, StarIcon } from "@/components/pixel";
import styles from "./page.module.css";

const COUT_TIRAGE = 100;

const RARITY_COLORS: Record<number, string> = {
  1: "#9db3aa",
  2: "#7fd9c4",
  3: "#5cc8ff",
  4: "#c792ea",
  5: "#ff9d81",
  6: "#f2c94c",
};

type Resultat = {
  name: string;
  stars: number;
  vie: number;
  force: number;
  vitesse: number;
  resistance: number;
  agilite: number;
};

export default function GatchaClient({
  currencyInitiale,
}: {
  currencyInitiale: number;
}) {
  const [phase, setPhase] = useState<"idle" | "tirage" | "reveal">("idle");
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const [currency, setCurrency] = useState(currencyInitiale);
  const [erreur, setErreur] = useState<string | null>(null);

  async function tirer() {
    if (currency < COUT_TIRAGE || phase !== "idle") return;
    setErreur(null);
    setPhase("tirage");

    try {
      const res = await tirerGatcha();
      setCurrency(res.newCurrency);
      // petit délai artificiel pour laisser l'animation de "tirage" se jouer
      setTimeout(() => {
        setResultat(res.personnage);
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

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Tirage</h1>

      <p className={styles.currency}>
        Monnaie : <span className={styles.currencyValue}>{currency}</span>
      </p>

      {erreur && <p className={styles.error}>{erreur}</p>}

      {phase !== "reveal" && (
        <>
          <div
            className={`${styles.orb} ${phase === "tirage" ? styles.orbActive : ""}`}
          >
            <StarIcon size={40} />
          </div>

          <button
            onClick={tirer}
            className={styles.pullButton}
            disabled={currency < COUT_TIRAGE || phase === "tirage"}
          >
            {phase === "tirage"
              ? "Tirage en cours..."
              : `Tirer (${COUT_TIRAGE} monnaie)`}
          </button>
        </>
      )}

      {phase === "reveal" && resultat && (
        <div
          className={styles.resultCard}
          style={{ borderColor: couleur, boxShadow: `0 0 30px ${couleur}44` }}
        >
          <span className={styles.resultLabel} style={{ color: couleur }}>
            Nouveau personnage obtenu
          </span>

          <PersonnageIcon size={80} couleur={couleur} />

          <span className={styles.resultName}>{resultat.name}</span>
          <span className={styles.resultStars}>
            {"★".repeat(resultat.stars)}
          </span>

          <div className={styles.resultStats}>
            <span>Vie {resultat.vie}</span>
            <span>Force {resultat.force}</span>
            <span>Vitesse {resultat.vitesse}</span>
            <span>Résistance {resultat.resistance}</span>
            <span>Agilité {resultat.agilite}</span>
          </div>

          <button onClick={continuer} className={styles.pullButton}>
            Continuer
          </button>
        </div>
      )}
    </main>
  );
}
